import { redirect } from 'next/navigation';
import { authenticated } from '@/lib/auth';
import AdminLogin from '@/components/admin-login';
export const dynamic = 'force-dynamic';
export const metadata = { title: '门店登录 | 怡然集瑜伽', robots: { index: false, follow: false } };
export default async function Page() {
  if (await authenticated()) redirect('/admin');
  return <AdminLogin />;
}
