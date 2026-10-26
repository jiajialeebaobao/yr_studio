'use client';
import { useEffect, useState } from 'react';
import { PublicSession, request } from '@/lib/client';
import { canBook, formatTime, sessionLabel } from '@/lib/rules';
export default function Schedule() {
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => request<PublicSession[]>('/api/sessions').then((data) => { if (active) { setSessions(data); setError(''); setLoaded(true); } }).catch((e) => { if (active) { setError(e.message); setLoaded(true); } });
    load(); const timer = setInterval(load, 30000);
    window.addEventListener('booking-updated', load);
    return () => { active = false; clearInterval(timer); window.removeEventListener('booking-updated', load); };
  }, []);
  return <section id="schedule" className="schedule"><div className="section-inner">
    <div className="section-head"><div><span className="eyebrow">Schedule</span><h2>近期课程</h2></div>
      <p className="section-lede">课程需提前 4 小时预约，小班满 3 人开课。开课前 3 小时及以上可免费取消，之后请联系门店。</p></div>
    {error ? <p className="notice error" role="alert">{error}</p> : !loaded ? <p className="notice">正在加载课表…</p> : !sessions.length ? <p className="notice">近期场次即将发布，欢迎稍后查看。</p> : <div className="schedule-list">
      {sessions.map((session) => <div className="schedule-row live-schedule" key={session.id}>
        <strong>{formatTime(session.startsAt)}</strong><div>{session.title}<small className="subtle">{session.kind === 'PRIVATE' ? '一对一私教' : '小班'} · {session.duration} 分钟 · {session.teacher}</small></div>
        <div><span className="status">{sessionLabel(session.status, session.kind)}</span><small className="subtle">{['OPEN', 'CONFIRMED'].includes(session.status) ? `余 ${session.capacity - session.bookedCount} 位` : session.cancelReason}</small></div>
        {canBook(new Date(session.startsAt)) && ['OPEN', 'CONFIRMED'].includes(session.status) && session.bookedCount < session.capacity ? <a className="button secondary" href="#booking" onClick={() => window.dispatchEvent(new CustomEvent('choose-session', { detail: session.id }))}>预约</a> : <span className="subtle">预约已截止或不可约</span>}
      </div>)}
    </div>}
  </div></section>;
}
