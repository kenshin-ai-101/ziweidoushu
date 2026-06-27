import { NextRequest, NextResponse } from 'next/server';
import { establishSession } from '@/lib/auth/auth-handlers';
import { upgradeUserToLifetime } from '@/lib/auth/membership';
import { readSession } from '@/lib/auth/session';
import { getLatestPendingOrder, getOrder, markOrderPaid } from '@/lib/subscription/store-pg';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await readSession(req);
  if (!session) {
    return NextResponse.json({ error: '请先登录', code: 'NEED_LOGIN' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { orderId?: string };
  const order = body.orderId
    ? await getOrder(body.orderId)
    : await getLatestPendingOrder(session.userId);

  if (!order || order.userId !== session.userId) {
    return NextResponse.json({ status: 'not_found', message: '未找到待支付订单' });
  }

  if (order.status === 'paid') {
    return establishSession(session.userId, {
      orderId: order.orderId,
      status: 'paid',
      message: '订单已支付，专业版已生效',
    });
  }

  await markOrderPaid(order.orderId);
  await upgradeUserToLifetime(session.userId);

  return establishSession(session.userId, {
    orderId: order.orderId,
    status: 'paid',
    message: '支付成功，专业版已开通',
  });
}
