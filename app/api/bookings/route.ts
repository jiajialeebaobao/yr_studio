import { api, jsonBody, sameOrigin } from '@/lib/http';
import { bookingInput, createBooking } from '@/lib/service';
import { rateLimit } from '@/lib/auth';
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await rateLimit('booking:global', 100, 600000);
    const input = bookingInput.parse(await jsonBody(request));
    await rateLimit(`booking:phone:${input.phone}`, 10, 600000);
    return createBooking(input);
  });
}
