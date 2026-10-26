import { api, sameOrigin } from '@/lib/http';
import { cancelBooking, getBooking } from '@/lib/service';
import { canCancel } from '@/lib/rules';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ token: string }> };
export async function GET(_: Request, context: Context) {
  return api(async () => {
    const booking = await getBooking((await context.params).token);
    return { name: booking.name, phone: `${booking.phone.slice(0, 3)}****${booking.phone.slice(-4)}`, status: booking.status, session: booking.session,
      canCancel: booking.status === 'ACTIVE' && canCancel(booking.session.startsAt) };
  });
}
export async function DELETE(request: Request, context: Context) {
  return api(async () => { sameOrigin(request); await cancelBooking((await context.params).token); return { ok: true }; });
}
