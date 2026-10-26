'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="detail-page"><h1>暂时无法加载</h1><p className="notice error">服务暂时不可用，请稍后重试。</p><button className="button" onClick={reset}>重试</button></main>;
}
