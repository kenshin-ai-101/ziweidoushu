import { query } from './pool';

export async function initDb(): Promise<void> {
  // Create users table
  await query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      user_id VARCHAR(32) PRIMARY KEY,
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(32) UNIQUE,
      password_hash VARCHAR(255),
      membership_tier VARCHAR(16) NOT NULL DEFAULT 'free',
      membership_expires_at VARCHAR(32),
      created_at VARCHAR(32) NOT NULL,
      updated_at VARCHAR(32) NOT NULL,
      UNIQUE(email),
      UNIQUE(phone)
    )
  `);

  // Create verification codes table
  await query(`
    CREATE TABLE IF NOT EXISTS auth_codes (
      key VARCHAR(128) PRIMARY KEY,
      code VARCHAR(16) NOT NULL,
      purpose VARCHAR(16) NOT NULL,
      expires_at BIGINT NOT NULL,
      created_at VARCHAR(32) NOT NULL
    )
  `);

  // Create sessions table
  await query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      session_id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(32) NOT NULL,
      expires_at BIGINT NOT NULL,
      created_at VARCHAR(32) NOT NULL
    )
  `);

  // Create indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_auth_users_phone ON auth_users(phone)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id)`);

  // Add missing columns to existing tables (ignore errors if already exist)
  await query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS membership_tier VARCHAR(16) NOT NULL DEFAULT 'free'`).catch(() => {});
  await query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS membership_expires_at VARCHAR(32)`).catch(() => {});

  // Fix column types if they're wrong (BIGINT -> VARCHAR)
  await query(`ALTER TABLE auth_users ALTER COLUMN created_at TYPE VARCHAR(32)`).catch(() => {});
  await query(`ALTER TABLE auth_users ALTER COLUMN updated_at TYPE VARCHAR(32)`).catch(() => {});
  await query(`ALTER TABLE auth_codes ALTER COLUMN created_at TYPE VARCHAR(32)`).catch(() => {});
  await query(`ALTER TABLE auth_sessions ALTER COLUMN created_at TYPE VARCHAR(32)`).catch(() => {});
}
