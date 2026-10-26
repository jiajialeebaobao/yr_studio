import { existsSync, writeFileSync, openSync, closeSync, readFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { parse } from 'dotenv';
import path from 'node:path';
if (!existsSync('.env')) {
  writeFileSync('.env', `DATABASE_URL="file:./studio.db"\nADMIN_USERNAME="admin"\nADMIN_PASSWORD="${randomBytes(18).toString('base64url')}"\nBOOKING_SECRET="${randomBytes(48).toString('hex')}"\n`, { mode: 0o600 });
  console.log('Created .env with unique local admin credentials. Open .env to view them.');
} else console.log('Preserved existing .env');
// Prisma's SQLite migration engine expects the default file to exist on some hosts.
const values = parse(readFileSync('.env'));
const databaseUrl = process.env.DATABASE_URL ?? values.DATABASE_URL;
if (databaseUrl?.startsWith('file:')) {
  const filename = path.resolve('prisma', databaseUrl.slice(5));
  mkdirSync(path.dirname(filename), { recursive: true });
  if (!existsSync(filename)) closeSync(openSync(filename, 'a', 0o600));
}
