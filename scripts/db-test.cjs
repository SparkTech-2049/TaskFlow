const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL);

async function test() {
  const users = await sql`SELECT id, username FROM users`;
  console.log('Users:', JSON.stringify(users));

  const cats = await sql`SELECT id, name, parent_id FROM categories ORDER BY sort_order`;
  console.log('Categories:', JSON.stringify(cats));

  const taskCount = await sql`SELECT count(*)::int as cnt FROM tasks`;
  console.log('Task count:', taskCount[0].cnt);

  const sampleTasks = await sql`SELECT id, cat, sub_cat, title, priority_level, deadline, done, archived FROM tasks LIMIT 5`;
  console.log('Sample tasks:', JSON.stringify(sampleTasks, null, 2));

  const settings = await sql`SELECT * FROM user_settings`;
  console.log('Settings:', JSON.stringify(settings));
}

test().catch(e => console.error(e));
