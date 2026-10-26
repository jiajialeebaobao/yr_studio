'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { request } from '@/lib/client';
export default function AdminLogin() {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const router = useRouter();
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try { await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) }); router.replace('/admin'); router.refresh(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="login-page"><Link className="back-link" href="/">← 返回工作室</Link><h1>门店登录</h1><form className="editor-form" onSubmit={login}>
    <label>账号<input name="username" required autoComplete="username" maxLength={80} /></label>
    <label>密码<input name="password" type="password" required autoComplete="current-password" maxLength={200} /></label>
    {error && <p role="alert" className="notice error">{error}</p>}
    <button className="button" disabled={busy}>{busy ? '正在登录…' : '登录后台'}</button>
  </form></main>;
}
