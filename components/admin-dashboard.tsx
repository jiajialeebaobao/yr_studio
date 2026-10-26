'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, Pencil, Ban, Trash2, RefreshCw } from 'lucide-react';
import { PublicSession, request } from '@/lib/client';
import { bookingStatus, formatTime, sessionLabel } from '@/lib/rules';
type AdminSession = PublicSession & { bookings: { id: string; name: string; phone: string; note: string; status: string; createdAt: string }[] };
export default function AdminDashboard() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<AdminSession | null>(null);
  const [kind, setKind] = useState('GROUP'); const [stopId, setStopId] = useState('');
  const [deleteId, setDeleteId] = useState('');
  const form = useRef<HTMLFormElement>(null); const router = useRouter();
  const load = async () => { const rows = await request<AdminSession[]>('/api/admin/sessions'); setSessions(rows); setLoading(false); };
  useEffect(() => { load().catch((e) => { setError(e.message); setLoading(false); }); }, []);
  async function action(work: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setMessage('');
    try { await work(); await load(); setMessage(success); return true; }
    catch (e) { setError((e as Error).message); return false; }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const localTime = String(fields.get('startsAt'));
    const startsAt = new Date(`${localTime}:00+08:00`).toISOString();
    const payload = { title: fields.get('title'), teacher: fields.get('teacher'), kind,
      startsAt, duration: Number(fields.get('duration')), capacity: kind === 'PRIVATE' ? 1 : Number(fields.get('capacity')) };
    const ok = await action(() => request(editing ? `/api/admin/sessions/${editing.id}` : '/api/admin/sessions', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) }), editing ? '场次已更新' : '场次已创建');
    if (ok) { setEditing(null); setKind('GROUP'); form.current?.reset(); }
  }
  function edit(session: AdminSession) { setEditing(session); setKind(session.kind); form.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  async function logout() {
    setBusy(true); setError('');
    try { await request('/api/admin/logout', { method: 'POST' }); router.replace('/admin/login'); router.refresh(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="dashboard">
    <header className="admin-header"><div><Link href="/" className="back-link">怡然集瑜伽工作室</Link><h1>场次与预约</h1></div><div className="actions"><button className="button secondary" onClick={() => action(load, '已刷新')} disabled={busy}><RefreshCw size={16} />刷新</button><button className="button secondary" onClick={logout} disabled={busy}><LogOut size={16} />退出</button></div></header>
    {error && <p className="notice error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
    <section className="admin-editor"><h2>{editing ? '编辑场次' : '创建场次'}</h2><p className="subtle">时间均为北京时间。小班满 3 人开课，私教限 1 人。</p>
      <form key={editing?.id ?? 'new'} ref={form} className="editor-form editor-grid" onSubmit={save}>
        <label>课程名称<input name="title" required maxLength={80} defaultValue={editing?.title ?? ''} /></label>
        <label>老师<input name="teacher" required maxLength={40} defaultValue={editing?.teacher ?? ''} /></label>
        <label>类型<select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}><option value="GROUP">小班课程</option><option value="PRIVATE">一对一私教</option></select></label>
        <label>开课时间（北京时间）<input name="startsAt" type="datetime-local" required defaultValue={editing ? new Date(new Date(editing.startsAt).getTime() + 8 * 3600000).toISOString().slice(0, 16) : ''} /></label>
        <label>时长（分钟）<input name="duration" type="number" min={15} max={240} required defaultValue={editing?.duration ?? 60} /></label>
        <label>名额<input key={kind} name="capacity" type="number" min={kind === 'PRIVATE' ? 1 : 3} max={kind === 'PRIVATE' ? 1 : 30} readOnly={kind === 'PRIVATE'} defaultValue={kind === 'PRIVATE' ? 1 : editing?.capacity ?? 8} required /></label>
        <div className="actions"><button className="button" disabled={busy}><Plus size={16} />{editing ? '保存修改' : '创建场次'}</button>{editing && <button className="button secondary" type="button" onClick={() => { setEditing(null); setKind('GROUP'); }}>取消编辑</button>}</div>
      </form>
    </section>
    <section className="admin-sessions"><h2>课程场次</h2>{loading ? <p className="notice">正在加载…</p> : !sessions.length ? <p className="notice">尚无课程场次，请在上方创建。</p> : <div className="table-wrap"><table><thead><tr><th>开课时间</th><th>课程 / 老师</th><th>人数</th><th>状态</th><th>管理</th></tr></thead><tbody>
      {sessions.map((s) => <tr key={s.id}><td>{formatTime(s.startsAt)}</td><td>{s.title}<small className="subtle">{s.kind === 'PRIVATE' ? '私教' : '小班'} · {s.teacher} · {s.duration} 分钟</small></td><td>{s.bookedCount} / {s.capacity}</td><td>{sessionLabel(s.status, s.kind)}{s.cancelReason && <small className="subtle">{s.cancelReason}</small>}</td><td><div className="actions">
        <button className="icon-button" title="编辑场次" aria-label={`编辑 ${s.title}`} disabled={busy || s.bookings.length > 0 || s.status !== 'OPEN'} onClick={() => edit(s)}><Pencil size={18} /></button>
        <button className="icon-button" title="停课" aria-label={`停课 ${s.title}`} disabled={busy || ['CANCELED', 'NOT_FORMED'].includes(s.status)} onClick={() => { setStopId(s.id); setDeleteId(''); }}><Ban size={18} /></button>
        <button className="icon-button" title="删除无预约场次" aria-label={`删除 ${s.title}`} disabled={busy || s.bookings.length > 0} onClick={() => { setDeleteId(s.id); setStopId(''); }}><Trash2 size={18} /></button>
      </div></td></tr>)}
    </tbody></table></div>}
    {stopId && <form className="inline-confirm" onSubmit={async (e) => { e.preventDefault(); const reason = new FormData(e.currentTarget).get('reason'); if (await action(() => request(`/api/admin/sessions/${stopId}`, { method: 'POST', body: JSON.stringify({ reason }) }), '场次已停课，关联预约已同步更新')) setStopId(''); }}><label>停课原因<input name="reason" maxLength={200} required /></label><div className="actions"><button className="button danger" disabled={busy}>确认停课</button><button className="button secondary" type="button" onClick={() => setStopId('')}>返回</button></div></form>}
    {deleteId && <div className="inline-confirm"><p>确认删除这个没有预约记录的场次？</p><div className="actions"><button className="button danger" disabled={busy} onClick={async () => { if (await action(() => request(`/api/admin/sessions/${deleteId}`, { method: 'DELETE' }), '场次已删除')) setDeleteId(''); }}>确认删除</button><button className="button secondary" onClick={() => setDeleteId('')}>返回</button></div></div>}
    </section>
    <section className="admin-bookings"><h2>预约记录</h2>{!sessions.some((s) => s.bookings.length) ? <p className="notice">暂无预约记录。</p> : sessions.filter((s) => s.bookings.length).map((s) => <details key={s.id}><summary>{formatTime(s.startsAt)} · {s.title} · {s.bookings.length} 条记录</summary><div className="table-wrap"><table><thead><tr><th>姓名</th><th>手机</th><th>状态</th><th>备注</th></tr></thead><tbody>{s.bookings.map((b) => <tr key={b.id}><td>{b.name}</td><td>{b.phone}</td><td>{bookingStatus[b.status]}</td><td className="note-cell">{b.note || '—'}</td></tr>)}</tbody></table></div></details>)}</section>
  </main>;
}
