import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PRO_SALE_PRICE_CENTS } from './plans';

export type OrderStatus = 'pending' | 'paid' | 'failed';

export interface SubscriptionOrder {
  orderId: string;
  userId: string;
  amountCents: number;
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
}

interface OrderStoreData {
  orders: Record<string, SubscriptionOrder>;
}

const STORE_PATH = path.join(process.cwd(), '.data', 'subscription-orders.json');

let cache: OrderStoreData | null = null;

function emptyStore(): OrderStoreData {
  return { orders: {} };
}

async function loadStore(): Promise<OrderStoreData> {
  if (cache) return cache;
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    cache = JSON.parse(raw) as OrderStoreData;
    return cache;
  } catch {
    cache = emptyStore();
    return cache;
  }
}

async function persistStore(data: OrderStoreData): Promise<void> {
  cache = data;
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function createOrder(userId: string): Promise<SubscriptionOrder> {
  const store = await loadStore();
  const order: SubscriptionOrder = {
    orderId: `ord_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`,
    userId,
    amountCents: PRO_SALE_PRICE_CENTS,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  store.orders[order.orderId] = order;
  await persistStore(store);
  return order;
}

export async function getOrder(orderId: string): Promise<SubscriptionOrder | null> {
  const store = await loadStore();
  return store.orders[orderId] ?? null;
}

export async function getLatestPendingOrder(userId: string): Promise<SubscriptionOrder | null> {
  const store = await loadStore();
  const pending = Object.values(store.orders)
    .filter(order => order.userId === userId && order.status === 'pending')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return pending[0] ?? null;
}

export async function markOrderPaid(orderId: string): Promise<SubscriptionOrder | null> {
  const store = await loadStore();
  const order = store.orders[orderId];
  if (!order) return null;
  if (order.status === 'paid') return order;
  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  await persistStore(store);
  return order;
}
