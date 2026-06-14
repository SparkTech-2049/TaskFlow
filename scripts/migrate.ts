import { neon } from '@neondatabase/serverless';

const POSTGRES_URL = process.env.POSTGRES_URL!;
const sql = neon(POSTGRES_URL);

async function migrate() {
  console.log('Running migration...');

  await sql`CREATE TABLE IF NOT EXISTS banned_ips (id SERIAL PRIMARY KEY, ip VARCHAR(45) NOT NULL UNIQUE, reason VARCHAR(200) DEFAULT '密码错误', created_at TIMESTAMP DEFAULT NOW() NOT NULL)`;
  console.log('✅ banned_ips table created');

  await sql`DROP TABLE IF EXISTS sessions`;
  console.log('✅ sessions table dropped');

  await sql`DROP TABLE IF EXISTS verification_tokens`;
  console.log('✅ verification_tokens table dropped');

  try {
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS github_id`;
    console.log('✅ github_id column dropped');
  } catch {
    console.log('⏭ github_id already gone');
  }

  console.log('🎉 Migration complete!');
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
