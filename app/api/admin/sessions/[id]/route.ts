import { requireAdmin } from '@/lib/auth';
import { api, jsonBody, sameOrigin } from '@/lib/http';
import { deleteSession, saveSession, stopSession } from '@/lib/service';
import { z } from 'zod';
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return api(async () => { sameOrigin(request); await requireAdmin(); return saveSession(await jsonBody(request), (await context.params).id); });
}
export async function DELETE(request: Request, context: Context) {
  return api(async () => { sameOrigin(request); await requireAdmin(); await deleteSession((await context.params).id); return { ok: true }; });
}
export async function POST(request: Request, context: Context) {
  return api(async () => {
    sameOrigin(request); await requireAdmin();
    const { reason } = z.object({ reason: z.string() }).parse(await jsonBody(request));
    await stopSession((await context.params).id, reason); return { ok: true };
  });
}
