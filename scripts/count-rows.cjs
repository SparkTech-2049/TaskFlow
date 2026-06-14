const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

(async () => {
  const tables = ['users', 'tasks', 'categories', 'user_settings', 'accounts', 'sessions', 'verification_tokens'];
  for (const t of tables) {
    const r = await sql.unsafe(`SELECT count(*) as cnt FROM "${t}"`);
    console.log(t + ': ' + r[0].cnt + ' rows');
  }
})();
