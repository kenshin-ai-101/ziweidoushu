import { logoutResponse } from '@/lib/auth/auth-handlers';

export const runtime = 'nodejs';

export async function POST() {
  return logoutResponse();
}
