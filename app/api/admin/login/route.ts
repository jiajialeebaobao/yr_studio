import { NextResponse } from 'next/server';
import { z } from 'zod';
import { api, jsonBody, sameOrigin } from '@/lib/http';
import { COOKIE, credentialsMatch, createAdminSession, rateLimit } from '@/lib/auth';
import { DomainError } from '@/lib/service';
export async function POST(request: Request) {
  let session: Awaited<ReturnType<typeof createAdminSession>> | undefined;
  const response = await api(async () => {
    sameOrigin(request);
    await rateLimit('login:global', 20, 900000);
    const { username, password } = z.object({ username: z.string().max(80), password: z.string().max(200) }).parse(await jsonBody(request));
    if (!credentialsMatch(username, password)) throw new DomainError('账号或密码不正确', 401);
    session = await createAdminSession();
    return { ok: true };
  });
  if (session) (response as NextResponse).cookies.set(COOKIE, session.token, { httpOnly: true, sameSite: 'strict', secure: new URL(request.url).protocol === 'https:', expires: session.expiresAt, path: '/' });
  return response;
}
