import { api } from '@/lib/http';
import { publicSessions } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function GET() { return api(() => publicSessions()); }
