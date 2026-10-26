import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';
import { digest, DomainError, transaction } from './service';
export const COOKIE = 'yiranji_admin';
const safeEqual = (a: string, b: string) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
export function credentialsMatch(username: string, password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && expected.length >= 16 && expected !== 'replace-with-a-long-random-password' &&
    safeEqual(username, process.env.ADMIN_USERNAME ?? 'admin') && safeEqual(password, expected);
}
export async function createAdminSession() {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 8 * 3_600_000);
  await db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.adminSession.create({ data: { id: digest(token), expiresAt } });
  return { token, expiresAt };
}
export async function authenticated() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const session = await db.adminSession.findUnique({ where: { id: digest(token) } });
  return !!session && session.expiresAt > new Date();
}
export async function requireAdmin() {
  if (!(await authenticated())) throw new DomainError('请先登录门店后台', 401);
}
export async function rateLimit(key: string, limit: number, windowMs: number) {
  await transaction(db, async (tx) => {
    const now = new Date();
    const hashed = digest(key);
    const item = await tx.rateLimit.findUnique({ where: { key: hashed } });
    if (!item || item.expiresAt <= now) {
      await tx.rateLimit.upsert({ where: { key: hashed }, create: { key: hashed, count: 1, expiresAt: new Date(+now + windowMs) }, update: { count: 1, expiresAt: new Date(+now + windowMs) } });
    } else {
      if (item.count >= limit) throw new DomainError('操作过于频繁，请稍后再试', 429);
      await tx.rateLimit.update({ where: { key: hashed }, data: { count: { increment: 1 } } });
    }
  });
}
