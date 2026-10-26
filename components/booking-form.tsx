'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Copy, Check } from 'lucide-react';
import { PublicSession, request } from '@/lib/client';
import { canBook, formatTime } from '@/lib/rules';
export default function BookingForm() {
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const submission = useRef<{ fingerprint: string; key: string } | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => request<PublicSession[]>('/api/sessions').then((data) => { if (active) { setSessions(data); setLoading(false); } }).catch((e) => { if (active) { setError(e.message); setLoading(false); } });
    load(); const timer = setInterval(load, 30000);
    const choose = (e: Event) => setSelected((e as CustomEvent<string>).detail);
    window.addEventListener('choose-session', choose); window.addEventListener('booking-updated', load);
    return () => { active = false; clearInterval(timer); window.removeEventListener('choose-session', choose); window.removeEventListener('booking-updated', load); };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const data = { sessionId: selected, name: String(form.get('name') ?? ''), phone: String(form.get('phone') ?? ''), note: String(form.get('note') ?? '') };
    const fingerprint = JSON.stringify(data);
    if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const result = await request<{ token: string }>('/api/bookings', { method: 'POST', body: JSON.stringify({ ...data, idempotencyKey: submission.current.key }) });
      setLink(`${location.origin}/booking/${result.token}`);
      window.dispatchEvent(new Event('booking-updated'));
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  const available = sessions.filter((s) => ['OPEN', 'CONFIRMED'].includes(s.status) && canBook(new Date(s.startsAt)) && s.bookedCount < s.capacity);
  async function retryLastSubmission() {
    if (!submission.current || busy) return;
    setBusy(true); setError('');
    try {
      const result = await request<{ token: string }>('/api/bookings', { method: 'POST', body: JSON.stringify({ ...JSON.parse(submission.current.fingerprint), idempotencyKey: submission.current.key }) });
      setLink(`${location.origin}/booking/${result.token}`);
      window.dispatchEvent(new Event('booking-updated'));
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  if (link) return <div className="booking-form" role="status"><h3>预约已保存</h3><p>小班会在开课前 3 小时确认是否成班。请保留专属链接，随时查看状态或取消预约。</p><Link className="button" href={link}>查看我的预约</Link>
    <label>专属预约链接<input readOnly value={link} onFocus={(e) => e.currentTarget.select()} /></label>
    <button className="button secondary" type="button" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setError('请选中上方链接手动复制'); } }}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? '已复制' : '复制链接'}</button>
    <p className="form-hint">此链接可查看和取消本次预约，请妥善保管。</p>{error && <p role="alert">{error}</p>}</div>;
  return <form className="booking-form" onSubmit={submit}>
    <label>预约场次<select name="sessionId" value={selected} onChange={(e) => setSelected(e.target.value)} required><option value="">{loading ? '正在加载…' : '请选择日期与课程'}</option>{available.map((s) => <option key={s.id} value={s.id}>{formatTime(s.startsAt)} · {s.title} · {s.teacher} · 余 {s.capacity - s.bookedCount} 位</option>)}</select></label>
    {!loading && !available.length && <p className="form-hint">暂无可预约场次，请稍后查看。</p>}
    <label>姓名<input name="name" autoComplete="name" required maxLength={40} placeholder="你的称呼" /></label>
    <label>手机<input type="tel" name="phone" autoComplete="tel" pattern="1[3-9][0-9]{9}" required maxLength={11} placeholder="11 位手机号" /></label>
    <label>备注<textarea name="note" maxLength={500} placeholder="例如：初学、肩颈紧张" /></label>
    <p className="form-hint">提前 4 小时预约；提前 3 小时可免费取消。小班满 3 人开课，私教预约即确认。费用到店结算。</p>
    {error && <div><p className="notice error" role="alert">{error}</p>{submission.current && <button type="button" className="button secondary" disabled={busy} onClick={retryLastSubmission}>重试上次预约</button>}</div>}
    <button className="button" type="submit" disabled={busy || loading || !available.length}>{busy ? '正在提交…' : '确认预约'}</button>
  </form>;
}
