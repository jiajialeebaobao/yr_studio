import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { PrismaClient } from '@prisma/client';
let folder: string; let base: string; let client: PrismaClient;
let server: ReturnType<typeof spawn>;
const password = 'isolated-qa-password-123456789';
let cookie = '';
const send = (path: string, method = 'GET', data?: unknown, auth = false, origin?: string) => fetch(base + path, {
  method, headers: { 'Content-Type': 'application/json', Origin: origin ?? base, ...(auth ? { Cookie: cookie } : {}) },
  body: data === undefined ? undefined : JSON.stringify(data), redirect: 'manual',
});
before(async () => {
  folder = await mkdtemp(join(tmpdir(), 'yiranji-api-'));
  const databaseUrl = `file:${join(folder, 'qa.db')}`;
  client = new PrismaClient({ datasourceUrl: databaseUrl });
  for (const sql of (await readFile('prisma/migrations/20261026000000_init/migration.sql', 'utf8')).split(';').filter((s) => s.trim())) await client.$executeRawUnsafe(sql);
  const probe = createServer(); await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
  const port = (probe.address() as { port: number }).port; await new Promise<void>((resolve) => probe.close(() => resolve()));
  base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    env: { ...process.env, DATABASE_URL: databaseUrl, ADMIN_USERNAME: 'qa-admin', ADMIN_PASSWORD: password, BOOKING_SECRET: 'isolated-qa-secret-at-least-thirty-two-characters' }, stdio: 'pipe',
  });
  for (let count = 0; count < 100; count++) {
    try { if ((await fetch(base + '/api/sessions')).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('QA server did not start');
});
after(async () => {
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise<void>((resolve) => server.once('exit', () => resolve())); }
  await client?.$disconnect(); if (folder) await rm(folder, { recursive: true });
});
test('HTTP auth, CSRF, admin, booking, cancellation, invalid requests and empty initial data', async () => {
  assert.deepEqual(await (await send('/api/sessions')).json(), []);
  assert.equal((await send('/api/admin/sessions')).status, 401);
  assert.equal((await send('/admin')).status, 307);
  assert.equal((await send('/api/admin/login', 'POST', { username: 'qa-admin', password }, false, 'https://other.example')).status, 403);
  assert.equal((await send('/api/admin/login', 'POST', { username: 'qa-admin', password: 'wrong' })).status, 401);
  const login = await send('/api/admin/login', 'POST', { username: 'qa-admin', password });
  assert.equal(login.status, 200); const setCookie = login.headers.get('set-cookie')!;
  assert.match(setCookie, /HttpOnly/i); assert.match(setCookie, /SameSite=strict/i); cookie = setCookie.split(';')[0];
  const slot = { title: 'QA 小班', teacher: 'QA 老师', kind: 'GROUP', capacity: 8, duration: 60, startsAt: new Date(Date.now() + 24 * 3600000).toISOString() };
  assert.equal((await send('/api/admin/sessions', 'POST', slot)).status, 401);
  const created = await send('/api/admin/sessions', 'POST', slot, true); assert.equal(created.status, 200); const session = await created.json();
  assert.equal((await send(`/api/admin/sessions/${session.id}`, 'PATCH', { ...slot, teacher: 'QA 新老师' }, true)).status, 200);
  const payload = { sessionId: session.id, name: '测试预约人', phone: '13800000001', note: '隔离测试', idempotencyKey: randomUUID() };
  assert.equal((await send('/api/bookings', 'POST', { ...payload, phone: 'bad' })).status, 400);
  const bookingResponse = await send('/api/bookings', 'POST', payload); assert.equal(bookingResponse.status, 200); const booking = await bookingResponse.json();
  assert.deepEqual(await (await send('/api/bookings', 'POST', payload)).json(), booking);
  assert.equal((await send('/api/bookings', 'POST', { ...payload, idempotencyKey: randomUUID() })).status, 409);
  const detail = await (await send(`/api/bookings/${booking.token}`)).json(); assert.equal(detail.phone, '138****0001'); assert.equal(detail.canCancel, true);
  const publicRows = await (await send('/api/sessions')).text(); assert.equal(publicRows.includes('测试预约人'), false); assert.equal(publicRows.includes('13800000001'), false);
  assert.equal((await send(`/api/admin/sessions/${session.id}`, 'PATCH', slot, true)).status, 409);
  assert.equal((await send(`/api/admin/sessions/${session.id}`, 'DELETE', undefined, true)).status, 409);
  assert.equal((await send(`/api/bookings/${booking.token}`, 'DELETE')).status, 200);
  assert.equal((await send(`/api/bookings/${booking.token}`, 'DELETE')).status, 200);
  assert.equal((await (await send(`/api/bookings/${booking.token}`)).json()).status, 'CANCELED');
  const second = await (await send('/api/bookings', 'POST', { ...payload, idempotencyKey: randomUUID() })).json();
  assert.equal((await send(`/api/admin/sessions/${session.id}`, 'POST', { reason: 'QA 停课' }, true)).status, 200);
  assert.equal((await (await send(`/api/bookings/${second.token}`)).json()).status, 'SESSION_CANCELED');
  assert.equal((await send('/api/bookings/not-a-token')).status, 404);
  assert.equal((await send('/api/bookings', 'POST', { text: 'x'.repeat(9000) })).status, 413);
  const privateSlot = await (await send('/api/admin/sessions', 'POST', { ...slot, kind: 'PRIVATE', capacity: 1 }, true)).json();
  assert.equal((await send(`/api/admin/sessions/${privateSlot.id}`, 'DELETE', undefined, true)).status, 200);
  assert.equal((await send('/api/admin/logout', 'POST', undefined, true)).status, 200);
  assert.equal((await send('/api/admin/sessions', 'GET', undefined, true)).status, 401);
  for (let attempt = 0; attempt < 21; attempt++) await send('/api/admin/login', 'POST', { username: 'qa-admin', password: 'wrong' });
  assert.equal((await send('/api/admin/login', 'POST', { username: 'qa-admin', password })).status, 429);
  await client.rateLimit.deleteMany();
  for (let attempt = 0; attempt < 11; attempt++) await send('/api/bookings', 'POST', payload);
  assert.equal((await send('/api/bookings', 'POST', payload)).status, 429);
});
