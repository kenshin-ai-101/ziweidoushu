import { NextRequest, NextResponse } from 'next/server';
import { establishSession } from '@/lib/auth/auth-handlers';
import { upgradeUserToLifetime } from '@/lib/auth/membership';
import { isDevAuthMode, readSession } from '@/lib/auth/session';
import { PRO_SALE_PRICE_CENTS } from '@/lib/subscription/plans';
import { createOrder, markOrderPaid } from '@/lib/subscription/store-pg';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await readSession(req);
  if (!session) {
    return NextResponse.json({ error: '请先登录后再开通专业版', code: 'NEED_LOGIN' }, { status: 401 });
  }

  const order = await createOrder(session.userId, PRO_SALE_PRICE_CENTS);

  if (isDevAuthMode()) {
    await markOrderPaid(order.orderId);
    await upgradeUserToLifetime(session.userId);
    return establishSession(session.userId, {
      orderId: order.orderId,
      status: 'paid',
      mockPayment: true,
      message: '开发模式：已模拟支付成功并开通专业版',
    });
  }

  return NextResponse.json({
    orderId: order.orderId,
    amountCents: order.amountCents,
    status: order.status,
    message: '订单已创建。本地环境未接入微信支付，请使用「查询订单」或联系开发者完成开通。',
  });
}
