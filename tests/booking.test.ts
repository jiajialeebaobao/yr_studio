import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { createBooking, cancelBooking, settleDue, saveSession, getBooking, stopSession, deleteSession, publicSessions } from '../lib/service';
import { canBook, canCancel, HOUR } from '../lib/rules';
let client: PrismaClient;
let folder: string;
let url: string;
const now = new Date('2030-01-01T00:00:00Z');
const start = new Date(+now + 8 * HOUR);
process.env.BOOKING_SECRET = 'test-only-secret-with-at-least-thirty-two-characters';
before(async () => {
  folder = await mkdtemp(join(tmpdir(), 'yiranji-test-'));
  url = `file:${join(folder, 'test.db')}`;
  client = new PrismaClient({ datasourceUrl: url });
  const sql = await readFile('prisma/migrations/20261026000000_init/migration.sql', 'utf8');
  for (const statement of sql.split(';').filter((s) => s.trim())) await client.$executeRawUnsafe(statement);
});
beforeEach(async () => { await client.booking.deleteMany(); await client.classSession.deleteMany(); });
after(async () => { await client.$disconnect(); await rm(folder, { recursive: true }); });
const slot = (kind = 'GROUP', capacity = kind === 'PRIVATE' ? 1 : 8) => saveSession({ title: '测试课程', teacher: '测试老师', kind, capacity, duration: 60, startsAt: start.toISOString() }, undefined, now, client);
const book = (sessionId: string, phone = '13800000001', at = now, idempotencyKey = randomUUID()) => createBooking({ sessionId, name: '测试学员', phone, note: '', idempotencyKey }, at, client);

test('4h booking and 3h cancellation inclusive boundaries', () => {
  assert.equal(canBook(start, new Date(+start - 4 * HOUR)), true);
  assert.equal(canBook(start, new Date(+start - 4 * HOUR + 1)), false);
  assert.equal(canCancel(start, new Date(+start - 3 * HOUR)), true);
  assert.equal(canCancel(start, new Date(+start - 3 * HOUR + 1)), false);
});
test('booking service enforces cutoff, full slot and duplicate phone', async () => {
  const s = await slot('PRIVATE');
  await assert.rejects(book(s.id, '13800000001', new Date(+start - 4 * HOUR + 1)), /4 小时/);
  await book(s.id, '13800000001', new Date(+start - 4 * HOUR));
  await assert.rejects(book(s.id), /已预约/);
  await assert.rejects(book(s.id, '13800000002'), /名额已满/);
});
test('idempotency reproduces same token, rejects changed payload, stores only digest', async () => {
  const s = await slot(); const key = randomUUID();
  const first = await book(s.id, '13800000001', now, key);
  assert.deepEqual(await book(s.id, '13800000001', now, key), first);
  await assert.rejects(book(s.id, '13800000002', now, key), /提交编号/);
  const stored = await client.booking.findUniqueOrThrow({ where: { id: first.id } });
  assert.notEqual(stored.tokenHash, first.token);
  assert.equal((await client.classSession.findUniqueOrThrow({ where: { id: s.id } })).bookedCount, 1);
});
test('two people => not formed, three => confirmed after cancellation cutoff', async () => {
  const a = await slot(); const b = await slot();
  await book(a.id); await book(a.id, '13800000002');
  for (const phone of ['13800000001', '13800000002', '13800000003']) await book(b.id, phone);
  await settleDue(new Date(+start - 3 * HOUR), client);
  assert.equal((await client.classSession.findUniqueOrThrow({ where: { id: a.id } })).status, 'OPEN');
  await settleDue(new Date(+start - 3 * HOUR + 1), client);
  assert.equal((await client.classSession.findUniqueOrThrow({ where: { id: a.id } })).status, 'NOT_FORMED');
  assert.equal((await client.classSession.findUniqueOrThrow({ where: { id: b.id } })).status, 'CONFIRMED');
  assert.equal(await client.booking.count({ where: { sessionId: a.id, status: 'NOT_FORMED' } }), 2);
});
test('cancel at exact 3h, repeat safely, subsequent settlement accounts for cancellation', async () => {
  const s = await slot(); const a = await book(s.id);
  await book(s.id, '13800000002'); await book(s.id, '13800000003');
  await cancelBooking(a.token, new Date(+start - 3 * HOUR), client);
  await cancelBooking(a.token, new Date(+start - 3 * HOUR), client);
  assert.equal((await client.classSession.findUniqueOrThrow({ where: { id: s.id } })).bookedCount, 2);
  await settleDue(new Date(+start - 3 * HOUR + 1), client);
  assert.equal((await getBooking(a.token, new Date(+start - 2 * HOUR), client)).status, 'CANCELED');
  assert.equal((await client.classSession.findUniqueOrThrow({ where: { id: s.id } })).status, 'NOT_FORMED');
});
test('private booking immediately confirms; late cancellation prohibited', async () => {
  const s = await slot('PRIVATE'); const b = await book(s.id);
  assert.equal((await getBooking(b.token, now, client)).session.status, 'CONFIRMED');
  await assert.rejects(cancelBooking(b.token, new Date(+start - 3 * HOUR + 1), client), /联系门店/);
  await cancelBooking(b.token, new Date(+start - 3 * HOUR), client);
  assert.equal((await getBooking(b.token, now, client)).session.status, 'OPEN');
});
test('concurrent requests for last seat cannot oversubscribe', async () => {
  const s = await slot('PRIVATE');
  const results = await Promise.allSettled([book(s.id, '13800000001'), book(s.id, '13800000002')]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(await client.booking.count({ where: { sessionId: s.id } }), 1);
  assert.equal((await client.classSession.findUniqueOrThrow({ where: { id: s.id } })).bookedCount, 1);
});
test('concurrent duplicate phone and idempotent submissions are safe', async () => {
  const s = await slot(); const key = randomUUID();
  const same = await Promise.all([book(s.id, '13800000001', now, key), book(s.id, '13800000001', now, key)]);
  assert.equal(same[0].token, same[1].token);
  const duplicates = await Promise.allSettled([book(s.id, '13800000002'), book(s.id, '13800000002')]);
  assert.equal(duplicates.filter((r) => r.status === 'fulfilled').length, 1);
});
test('admin cannot change or delete booked slots; stopping updates every active booking', async () => {
  const s = await slot(); const b = await book(s.id);
  await assert.rejects(saveSession({ title: '更改', teacher: '老师', kind: 'GROUP', startsAt: start.toISOString(), duration: 60, capacity: 9 }, s.id, now, client), /不可修改/);
  await assert.rejects(deleteSession(s.id, client), /不可删除/);
  await stopSession(s.id, '老师临时调休', client); await stopSession(s.id, '重复停课', client);
  const detail = await getBooking(b.token, now, client);
  assert.equal(detail.status, 'SESSION_CANCELED'); assert.equal(detail.session.bookedCount, 0);
  assert.equal(detail.session.cancelReason, '老师临时调休');
});
test('invalid token and input fail; public schedule excludes customer data', async () => {
  await assert.rejects(getBooking('invalid', now, client), /链接无效/);
  await assert.rejects(getBooking('a'.repeat(43), now, client), /链接无效/);
  const s = await slot(); await book(s.id);
  const rows = await publicSessions(now, client);
  assert.equal('bookings' in rows[0], false); assert.equal(JSON.stringify(rows).includes('13800000001'), false);
  await assert.rejects(createBooking({ sessionId: s.id, name: '', phone: 'bad', idempotencyKey: randomUUID() }, now, client));
});
test('records survive reconnect; delayed settlement catches up after restart', async () => {
  const s = await slot(); const booking = await book(s.id);
  const reconnected = new PrismaClient({ datasourceUrl: url });
  try {
    assert.equal((await getBooking(booking.token, now, reconnected)).name, '测试学员');
    await settleDue(new Date(+start + HOUR), reconnected);
    assert.equal((await getBooking(booking.token, new Date(+start + HOUR), reconnected)).status, 'NOT_FORMED');
  } finally { await reconnected.$disconnect(); }
});
test('database failures reject without returning a successful booking', async () => {
  const broken = new PrismaClient({ datasourceUrl: 'file:/nonexistent-directory-that-does-not-exist/test.db' });
  try { await assert.rejects(publicSessions(now, broken)); }
  finally { await broken.$disconnect(); }
});
