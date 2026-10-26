import 'dotenv/config';
import { setTimeout } from 'node:timers/promises';
import { settleDue } from '../lib/service';
import { db } from '../lib/db';
const controller = new AbortController();
process.once('SIGINT', () => controller.abort());
process.once('SIGTERM', () => controller.abort());
async function main() {
  while (!controller.signal.aborted) {
    try { const count = await settleDue(); if (count) console.log(`Processed ${count} due sessions`); }
    catch { console.error('Settlement failed; retrying on next tick'); }
    if (process.argv.includes('--once')) break;
    await setTimeout(60000, undefined, { signal: controller.signal }).catch((error) => {
      if (error.name !== 'AbortError') throw error;
    });
  }
}
main().catch(() => { console.error('Worker stopped unexpectedly'); process.exitCode = 1; }).finally(() => db.$disconnect());
