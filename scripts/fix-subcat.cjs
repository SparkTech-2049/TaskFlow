const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL);
async function fix() {
  await sql`UPDATE tasks SET sub_cat = 'swipe-card' WHERE id = 100`;
  const r = await sql`SELECT id, cat, sub_cat, title FROM tasks WHERE id = 100`;
  console.log('Fixed:', JSON.stringify(r));
}
fix().catch(console.error);
