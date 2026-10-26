'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { request, PublicSession } from '@/lib/client';
import { bookingStatus, formatTime, sessionLabel } from '@/lib/rules';
type Detail = { name: string; phone: string; status: string; session: PublicSession; canCancel: boolean };
export default function BookingDetail({ token }: { token: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const load = () => request<Detail>(`/api/bookings/${encodeURIComponent(token)}`).then((value) => { setData(value); setError(''); });
  useEffect(() => {
    let active = true;
    const update = () => request<Detail>(`/api/bookings/${encodeURIComponent(token)}`).then((value) => { if (active) { setData(value); setError(''); } }).catch((e) => { if (active) setError(e.message); });
    update(); const timer = setInterval(update, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [token]);
  async function cancel() {
    setBusy(true); setError('');
    try { await request(`/api/bookings/${encodeURIComponent(token)}`, { method: 'DELETE' }); setConfirm(false); await load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="detail-page"><Link href="/" className="back-link">← 怡然集瑜伽工作室</Link><h1>我的预约</h1>
    {error && <p role="alert" className="notice error">{error}</p>}
    {!data ? <p className="notice">{error ? '请检查预约链接，或稍后重试。' : '正在查询预约…'}</p> : <>
      <div className="detail-summary"><span className="status">{bookingStatus[data.status]}</span><h2>{data.session.title}</h2><p>{formatTime(data.session.startsAt)} · {data.session.duration} 分钟</p></div>
      <dl className="detail-list"><div><dt>课程类型</dt><dd>{data.session.kind === 'PRIVATE' ? '一对一私教' : '小班课程'}</dd></div><div><dt>老师</dt><dd>{data.session.teacher}</dd></div><div><dt>预约人</dt><dd>{data.name} · {data.phone}</dd></div><div><dt>开课状态</dt><dd>{sessionLabel(data.session.status, data.session.kind)}</dd></div><div><dt>门店位置</dt><dd>内蒙古呼和浩特市玉泉区闻都世界城 17F1405</dd></div></dl>
      {data.session.cancelReason && <p className="notice">停课原因：{data.session.cancelReason}</p>}
      {data.status === 'ACTIVE' && data.session.status === 'OPEN' && <p className="notice">小班满 3 人开课，开课前 3 小时确认成班。请在到店前查看本页状态。</p>}
      {data.status === 'NOT_FORMED' && <p className="notice">本场未达到最低开课人数，已停课，本次预约不收费。</p>}
      {data.canCancel ? confirm ? <div className="notice"><p>确认免费取消这次预约？取消后名额将释放。</p><div className="actions"><button className="button danger" onClick={cancel} disabled={busy}>{busy ? '正在取消…' : '确认取消预约'}</button><button className="button secondary" onClick={() => setConfirm(false)} disabled={busy}>保留预约</button></div></div> : <button className="button secondary" onClick={() => setConfirm(true)}>免费取消预约</button> : data.status === 'ACTIVE' && <p className="notice">距离开课不足 3 小时，如需取消请联系门店。</p>}
      <p className="subtle">费用到店结算。请妥善保管此专属预约链接。</p>
    </>}
  </main>;
}
