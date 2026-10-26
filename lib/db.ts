import { PrismaClient } from '@prisma/client';
const globalDb = globalThis as unknown as { studioDb?: PrismaClient };
export const db = globalDb.studioDb ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalDb.studioDb = db;
