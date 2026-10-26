export type PublicSession = { id: string; title: string; teacher: string; kind: string; startsAt: string; duration: number; capacity: number; bookedCount: number; status: string; cancelReason: string | null };
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { signal: AbortSignal.timeout(20000), ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, cache: 'no-store' }); }
  catch { throw new Error('网络连接失败或超时，请稍后重试'); }
  const result = await response.json().catch(() => ({ error: '服务响应异常，请稍后重试' }));
  if (!response.ok) throw new Error(result.error ?? '请求失败，请重试');
  return result;
}
