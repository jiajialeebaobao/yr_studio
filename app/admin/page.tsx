import { redirect } from 'next/navigation';
import { authenticated } from '@/lib/auth';
import AdminDashboard from '@/components/admin-dashboard';
export const dynamic = 'force-dynamic';
export const metadata = { title: '门店管理 | 怡然集瑜伽', robots: { index: false, follow: false } };
export default async function Page() {
  if (!(await authenticated())) redirect('/admin/login');
  return <AdminDashboard />;
}
