import 'dotenv/config';
import { mkdir } from 'node:fs/promises';
import { db } from '../lib/db';
import path from 'node:path';
async function main() {
  await mkdir('backups', { recursive: true });
  const target = path.resolve('backups', `studio-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
  // VACUUM INTO produces a consistent standalone SQLite snapshot, even with an active writer.
  try {
    await db.$executeRawUnsafe(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
    console.log(`Backup saved: ${target}`);
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Backup failed'); process.exitCode = 1; });
