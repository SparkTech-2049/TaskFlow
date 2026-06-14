const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL);
async function test() {
  const task = await sql`SELECT id, cat, sub_cat, title FROM tasks WHERE title LIKE '%翼支付%'`;
  console.log('Task:', JSON.stringify(task));
  const cats = await sql`SELECT id, name, parent_id FROM categories ORDER BY parent_id, sort_order`;
  console.log('Categories:', JSON.stringify(cats));
}
test().catch(console.error);
