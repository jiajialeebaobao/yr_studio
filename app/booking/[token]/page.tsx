import BookingDetail from '@/components/booking-detail';
export const dynamic = 'force-dynamic';
export const metadata = { title: '我的预约 | 怡然集瑜伽', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <BookingDetail token={(await params).token} />;
}
