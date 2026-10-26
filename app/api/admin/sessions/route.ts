import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { api, jsonBody, sameOrigin } from '@/lib/http';
import { saveSession, settleDue } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function GET() {
  return api(async () => {
    await requireAdmin(); await settleDue();
    return db.classSession.findMany({ orderBy: { startsAt: 'desc' }, take: 200,
      include: { bookings: { select: { id: true, name: true, phone: true, note: true, status: true, createdAt: true }, orderBy: { createdAt: 'asc' } } } });
  });
}
export async function POST(request: Request) {
  return api(async () => { sameOrigin(request); await requireAdmin(); return saveSession(await jsonBody(request)); });
}
