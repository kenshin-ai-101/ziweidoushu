import { NextRequest } from 'next/server';
import { getMeResponse } from '@/lib/auth/auth-handlers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return getMeResponse(req);
}
