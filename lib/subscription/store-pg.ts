import { query } from '@/lib/db/pool';
import { initSubscriptionDb } from '@/lib/db/init-subscription';
import type { SubscriptionOrder, OrderStatus } from './store';

let dbInitialized = false;

async function ensureDb(): Promise<void> {
  if (!dbInitialized) {
    await initSubscriptionDb();
    dbInitialized = true;
  }
}

export async function createOrder(userId: string, amountCents: number): Promise<SubscriptionOrder> {
  await ensureDb();
  const orderId = `ord_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
  const createdAt = new Date().toISOString();
  await query(
    `INSERT INTO subscription_orders (order_id, user_id, amount_cents, status, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [orderId, userId, amountCents, 'pending', createdAt],
  );
  return { orderId, userId, amountCents, status: 'pending', createdAt };
}

export async function getOrder(orderId: string): Promise<SubscriptionOrder | null> {
  await ensureDb();
  const result = await query<{
    order_id: string;
    user_id: string;
    amount_cents: number;
    status: OrderStatus;
    created_at: string;
    paid_at: string | null;
  }>(
    'SELECT order_id, user_id, amount_cents, status, created_at, paid_at FROM subscription_orders WHERE order_id = $1',
    [orderId],
  );
  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return {
    orderId: r.order_id,
    userId: r.user_id,
    amountCents: r.amount_cents,
    status: r.status,
    createdAt: r.created_at,
    paidAt: r.paid_at ?? undefined,
  };
}

export async function getLatestPendingOrder(userId: string): Promise<SubscriptionOrder | null> {
  await ensureDb();
  const result = await query<{
    order_id: string;
    user_id: string;
    amount_cents: number;
    status: OrderStatus;
    created_at: string;
    paid_at: string | null;
  }>(
    `SELECT order_id, user_id, amount_cents, status, created_at, paid_at
     FROM subscription_orders
     WHERE user_id = $1 AND status = 'pending'
     ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return {
    orderId: r.order_id,
    userId: r.user_id,
    amountCents: r.amount_cents,
    status: r.status,
    createdAt: r.created_at,
    paidAt: r.paid_at ?? undefined,
  };
}

export async function markOrderPaid(orderId: string): Promise<SubscriptionOrder | null> {
  await ensureDb();
  const paidAt = new Date().toISOString();
  const result = await query<{
    order_id: string;
    user_id: string;
    amount_cents: number;
    status: OrderStatus;
    created_at: string;
    paid_at: string | null;
  }>(
    `UPDATE subscription_orders SET status = 'paid', paid_at = $2
     WHERE order_id = $1 AND status = 'pending'
     RETURNING order_id, user_id, amount_cents, status, created_at, paid_at`,
    [orderId, paidAt],
  );
  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return {
    orderId: r.order_id,
    userId: r.user_id,
    amountCents: r.amount_cents,
    status: r.status,
    createdAt: r.created_at,
    paidAt: r.paid_at ?? undefined,
  };
}
