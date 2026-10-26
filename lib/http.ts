import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DomainError } from './service';
export async function api(work: () => Promise<unknown>) {
  try { return NextResponse.json(await work() ?? { ok: true }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) {
    const status = error instanceof DomainError ? error.status : error instanceof ZodError || error instanceof SyntaxError ? 400 : 503;
    const message = error instanceof DomainError ? error.message : error instanceof ZodError ? error.issues[0]?.message : status === 400 ? '请求格式不正确' : '服务暂时不可用，请稍后重试';
    if (status === 503) console.error('Request failed:', (error as { code?: string }).code ?? 'service error');
    return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = new URL(process.env.APP_ORIGIN || request.url);
  // Next may normalize request.url to localhost while Host remains 127.0.0.1.
  if (!process.env.APP_ORIGIN && request.headers.get('host')) expected.host = request.headers.get('host')!;
  if (!origin || origin !== expected.origin) throw new DomainError('请求来源无效', 403);
  if (Number(request.headers.get('content-length') ?? 0) > 8192) throw new DomainError('提交内容过长', 413);
}
export async function jsonBody(request: Request) {
  if (!request.body) throw new DomainError('请求内容为空');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new DomainError('提交内容过长', 413); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
