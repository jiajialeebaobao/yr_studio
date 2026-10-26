import { createHash, createHmac } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { db } from './db';
import { canBook, canCancel, HOUR } from './rules';

export class DomainError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const bookingInput = z.object({
  sessionId: z.string().min(1), name: z.string().trim().min(1).max(40),
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/, '请输入有效的中国大陆手机号'),
  note: z.string().trim().max(500).default(''),
  idempotencyKey: z.string().uuid(),
});
export const sessionInput = z.object({
  title: z.string().trim().min(1).max(80), teacher: z.string().trim().min(1).max(40),
  kind: z.enum(['GROUP', 'PRIVATE']), startsAt: z.iso.datetime({ offset: true }),
  duration: z.number().int().min(15).max(240), capacity: z.number().int().min(1).max(30),
}).superRefine((value, ctx) => {
  if (value.kind === 'GROUP' && value.capacity < 3) ctx.addIssue({ code: 'custom', message: '小班名额至少为 3 人' });
  if (value.kind === 'PRIVATE' && value.capacity !== 1) ctx.addIssue({ code: 'custom', message: '私教名额必须为 1 人' });
});

// SQLite serializes writes. Retry whole transactions after a lock conflict.
export async function transaction<T>(client: PrismaClient, work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await client.$transaction(work, { maxWait: 10000, timeout: 15000 }); }
    catch (error) {
      const code = (error as { code?: string }).code;
      if (attempt >= 4 || !['P1008', 'P2028', 'P2034', 'P2002'].includes(code ?? '')) throw error;
      await new Promise((resolve) => setTimeout(resolve, 40 * (attempt + 1)));
    }
  }
}

export async function settleDue(now = new Date(), client = db) {
  return transaction(client, async (tx) => {
    const due = await tx.classSession.findMany({ where: { kind: 'GROUP', status: 'OPEN', startsAt: { lt: new Date(now.getTime() + 3 * HOUR) } } });
    for (const session of due) {
      const count = await tx.booking.count({ where: { sessionId: session.id, status: 'ACTIVE' } });
      const formed = count >= session.minimum;
      await tx.classSession.update({ where: { id: session.id }, data: { status: formed ? 'CONFIRMED' : 'NOT_FORMED', bookedCount: formed ? count : 0 } });
      if (!formed) await tx.booking.updateMany({ where: { sessionId: session.id, status: 'ACTIVE' }, data: { status: 'NOT_FORMED' } });
    }
    return due.length;
  });
}

export async function createBooking(raw: unknown, now = new Date(), client = db) {
  const input = bookingInput.parse(raw);
  const secret = process.env.BOOKING_SECRET;
  if (!secret || secret.length < 32) throw new DomainError('预约服务尚未配置，请联系门店', 503);
  const token = createHmac('sha256', secret).update(input.idempotencyKey).digest('base64url');
  const fingerprint = digest(JSON.stringify(input));
  await settleDue(now, client);
  return transaction(client, async (tx) => {
    const existing = await tx.booking.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new DomainError('该提交编号已用于其他预约，请重新提交', 409);
      return { token, id: existing.id };
    }
    const session = await tx.classSession.findUnique({ where: { id: input.sessionId } });
    if (!session) throw new DomainError('场次不存在', 404);
    if (!['OPEN', 'CONFIRMED'].includes(session.status)) throw new DomainError('该场次已停止预约', 409);
    if (!canBook(session.startsAt, now)) throw new DomainError('需至少提前 4 小时预约', 409);
    const duplicate = await tx.booking.findFirst({ where: { sessionId: session.id, phone: input.phone, status: 'ACTIVE' } });
    if (duplicate) throw new DomainError('该手机号已预约此场次，请使用原预约链接查询', 409);
    const reserved = await tx.classSession.updateMany({ where: { id: session.id, bookedCount: { lt: session.capacity }, status: session.status }, data: { bookedCount: { increment: 1 }, ...(session.kind === 'PRIVATE' ? { status: 'CONFIRMED' } : {}) } });
    if (!reserved.count) throw new DomainError('名额已满，请选择其他场次', 409);
    const booking = await tx.booking.create({ data: { sessionId: input.sessionId, name: input.name, phone: input.phone, note: input.note, idempotencyKey: input.idempotencyKey, fingerprint, tokenHash: digest(token) } });
    return { token, id: booking.id };
  });
}

export async function getBooking(token: string, now = new Date(), client = db) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new DomainError('预约链接无效', 404);
  await settleDue(now, client);
  const booking = await client.booking.findUnique({ where: { tokenHash: digest(token) }, include: { session: true } });
  if (!booking) throw new DomainError('预约链接无效', 404);
  return booking;
}

export async function cancelBooking(token: string, now = new Date(), client = db) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new DomainError('预约链接无效', 404);
  await settleDue(now, client);
  return transaction(client, async (tx) => {
    const booking = await tx.booking.findUnique({ where: { tokenHash: digest(token) }, include: { session: true } });
    if (!booking) throw new DomainError('预约链接无效', 404);
    if (booking.status !== 'ACTIVE') return;
    if (!canCancel(booking.session.startsAt, now)) throw new DomainError('距离开课不足 3 小时，请联系门店取消', 409);
    const changed = await tx.booking.updateMany({ where: { id: booking.id, status: 'ACTIVE' }, data: { status: 'CANCELED', canceledAt: now } });
    if (changed.count) await tx.classSession.update({ where: { id: booking.sessionId }, data: { bookedCount: { decrement: 1 }, ...(booking.session.kind === 'PRIVATE' ? { status: 'OPEN' } : {}) } });
  });
}

export async function publicSessions(now = new Date(), client = db) {
  await settleDue(now, client);
  return client.classSession.findMany({ where: { startsAt: { gte: now } }, orderBy: { startsAt: 'asc' }, take: 100,
    select: { id: true, title: true, teacher: true, kind: true, startsAt: true, duration: true, capacity: true, bookedCount: true, status: true, cancelReason: true } });
}

export async function saveSession(raw: unknown, id?: string, now = new Date(), client = db) {
  const input = sessionInput.parse(raw);
  if (!canBook(new Date(input.startsAt), now)) throw new DomainError('新场次需至少提前 4 小时创建');
  const data = { ...input, startsAt: new Date(input.startsAt), minimum: input.kind === 'PRIVATE' ? 1 : 3 };
  return transaction(client, async (tx) => {
    if (!id) return tx.classSession.create({ data });
    const session = await tx.classSession.findUnique({ where: { id }, include: { _count: { select: { bookings: true } } } });
    if (!session) throw new DomainError('场次不存在', 404);
    if (session.status !== 'OPEN') throw new DomainError('仅未确认场次可编辑', 409);
    if (session._count.bookings) throw new DomainError('已有预约记录的场次不可修改，请先停课再创建新场次', 409);
    return tx.classSession.update({ where: { id }, data });
  });
}

export async function stopSession(id: string, reason: string, client = db) {
  if (!reason.trim() || reason.length > 200) throw new DomainError('请填写 1–200 字停课原因');
  return transaction(client, async (tx) => {
    const session = await tx.classSession.findUnique({ where: { id } });
    if (!session) throw new DomainError('场次不存在', 404);
    if (['CANCELED', 'NOT_FORMED'].includes(session.status)) return;
    await tx.classSession.update({ where: { id }, data: { status: 'CANCELED', cancelReason: reason.trim(), bookedCount: 0 } });
    await tx.booking.updateMany({ where: { sessionId: id, status: 'ACTIVE' }, data: { status: 'SESSION_CANCELED' } });
  });
}

export async function deleteSession(id: string, client = db) {
  return transaction(client, async (tx) => {
    const session = await tx.classSession.findUnique({ where: { id }, include: { _count: { select: { bookings: true } } } });
    if (!session) throw new DomainError('场次不存在', 404);
    if (session._count.bookings) throw new DomainError('已有预约记录的场次不可删除', 409);
    await tx.classSession.delete({ where: { id } });
  });
}
