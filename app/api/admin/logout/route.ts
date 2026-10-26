import { cookies } from 'next/headers';
import { COOKIE } from '@/lib/auth';
import { db } from '@/lib/db';
import { digest } from '@/lib/service';
import { api, sameOrigin } from '@/lib/http';
export async function POST(request: Request) {
  const response = await api(async () => {
    sameOrigin(request);
    const token = (await cookies()).get(COOKIE)?.value;
    if (token) await db.adminSession.deleteMany({ where: { id: digest(token) } });
    return { ok: true };
  });
  response.cookies.delete(COOKIE);
  return response;
}
