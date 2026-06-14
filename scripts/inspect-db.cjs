const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

(async () => {
  const r = await sql`SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`;
  const tables = {};
  r.forEach(c => {
    if (!tables[c.table_name]) tables[c.table_name] = [];
    tables[c.table_name].push(c);
  });
  Object.entries(tables).forEach(([t, cols]) => {
    console.log('\n📊 ' + t);
    console.log('-'.repeat(60));
    cols.forEach(c => console.log('  ' + c.column_name.padEnd(20) + c.data_type.padEnd(20) + (c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL')));
  });
})();
