import pg from 'pg';

const { Pool } = pg;

// Supabase pooler uses custom CA - bypass TLS verification
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const globalForPool = globalThis as unknown as {
  pgPool: pg.Pool | undefined;
};

export const pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false,
    } as pg.PoolConfig['ssl'],
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPool.pgPool = pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}
