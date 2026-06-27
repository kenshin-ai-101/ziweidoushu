import { query } from './pool';

export async function initSubscriptionDb(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS subscription_orders (
      order_id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(32) NOT NULL,
      amount_cents INTEGER NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'pending',
      created_at VARCHAR(32) NOT NULL,
      paid_at VARCHAR(32)
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_subscription_orders_user_id ON subscription_orders(user_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_subscription_orders_status ON subscription_orders(status)`);
}
