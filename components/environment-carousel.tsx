'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
const photos = [
  ['studio-interior-01.jpg', '宽敞练习区', '预留足够间距，适合小班体式调整与流动练习。'],
  ['studio-interior-02.jpg', '镜面与辅具区', '清晰观察身体线条，辅具随手可取，练习更安心。'],
  ['studio-interior-03.jpg', '日光练习室', '柔和日光与干净的木地板，陪你安静地舒展身体。'],
];
export default function EnvironmentCarousel() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const activeIndex = useRef(0);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reduced, setReduced] = useState(false);
  const go = useCallback((next: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: ((next + photos.length) % photos.length) * el.clientWidth, behavior: reduced ? 'instant' : 'smooth' });
  }, [reduced]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { setReduced(media.matches); if (media.matches) setPaused(true); };
    change(); media.addEventListener('change', change);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && !document.hidden));
    const onVisibility = () => setVisible(!document.hidden && !!root.current && root.current.getBoundingClientRect().bottom > 0 && root.current.getBoundingClientRect().top < innerHeight);
    observer.observe(root.current!); document.addEventListener('visibilitychange', onVisibility);
    return () => { observer.disconnect(); media.removeEventListener('change', change); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  useEffect(() => {
    if (paused || interacting || !visible) return;
    const timer = setInterval(() => go(index + 1), 5000);
    return () => clearInterval(timer);
  }, [paused, interacting, visible, index, go]);
  useEffect(() => { activeIndex.current = index; }, [index]);
  useEffect(() => {
    const el = track.current!;
    let width = el.clientWidth;
    const resize = new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        el.scrollTo({ left: activeIndex.current * width, behavior: 'instant' });
      }
    });
    resize.observe(el); return () => resize.disconnect();
  }, []);
  return <div ref={root} className="section-inner space-gallery" role="region" aria-roledescription="轮播" aria-label="店内环境实拍"
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(root.current?.contains(document.activeElement) ?? false)}
    onFocus={() => setInteracting(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false); }}>
    <div className="space-track" ref={track} tabIndex={0} aria-label="环境照片，可左右滑动"
      onScroll={() => { const el = track.current!; setIndex(Math.max(0, Math.min(2, Math.round(el.scrollLeft / el.clientWidth)))); }}
      onKeyDown={(e) => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); go(index + (e.key === 'ArrowRight' ? 1 : -1)); } }}>
      {photos.map(([file, title, description], i) => <figure key={file} className="space-card" role="group" aria-label={`${i + 1} / 3：${title}`}>
        {/* Real studio photos keep their existing warm treatment. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/assets/${file}`} alt={title} loading="lazy" width={1400} height={1049} />
        <figcaption className="space-caption"><strong>{title}</strong><span>{description}</span></figcaption>
      </figure>)}
    </div>
    <div className="space-controls">
      <button type="button" aria-label="上一张" title="上一张" onClick={() => go(index - 1)}><ChevronLeft size={20} /></button>
      <div className="space-dots">{photos.map((photo, i) => <button key={photo[0]} type="button" aria-label={`第 ${i + 1} 张：${photo[1]}`} aria-current={index === i} onClick={() => go(i)} />)}</div>
      <button type="button" aria-label="下一张" title="下一张" onClick={() => go(index + 1)}><ChevronRight size={20} /></button>
      <button type="button" aria-label={paused ? '播放轮播' : '暂停轮播'} title={paused ? '播放轮播' : '暂停轮播'} onClick={() => setPaused(!paused)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
    </div>
  </div>;
}
