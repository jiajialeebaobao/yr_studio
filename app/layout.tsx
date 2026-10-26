import type { Metadata } from 'next';
import './globals.css';
import './ui.css';
export const metadata: Metadata = { title: '怡然集瑜伽工作室', description: '呼和浩特玉泉区闻都世界城 17F1405，小班瑜伽与一对一私教预约。', referrer: 'no-referrer' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
