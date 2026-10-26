import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
async function main() {
  const folder = await mkdtemp(join(tmpdir(), 'yiranji-ui-'));
  const databaseUrl = `file:${join(folder, 'qa.db')}`;
  const client = new PrismaClient({ datasourceUrl: databaseUrl });
  for (const statement of (await readFile('prisma/migrations/20261026000000_init/migration.sql', 'utf8')).split(';').filter((s) => s.trim())) await client.$executeRawUnsafe(statement);
  await client.classSession.create({ data: { title: '验收用基础哈他', teacher: '测试老师', kind: 'GROUP', startsAt: new Date(Date.now() + 24 * 3600000), capacity: 8, minimum: 3 } });
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3011'], {
    env: { ...process.env, DATABASE_URL: databaseUrl, ADMIN_USERNAME: 'qaadmin', ADMIN_PASSWORD: 'local-qa-only-password-123456', BOOKING_SECRET: 'local-qa-only-secret-thirty-two-characters-long' }, stdio: 'inherit',
  });
  const stop = () => child.kill('SIGTERM');
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  await new Promise<void>((resolve) => child.once('exit', () => resolve()));
  await client.$disconnect(); await rm(folder, { recursive: true });
}
main().catch(() => { console.error('QA server failed'); process.exitCode = 1; });
