import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const POSTGRES_URL = process.env.POSTGRES_URL!;
if (!POSTGRES_URL) {
  console.error('POSTGRES_URL not set');
  process.exit(1);
}

const sql = neon(POSTGRES_URL);

async function seed() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  const existingUsers = await sql`SELECT id FROM users WHERE username = 'admin'`;
  let userId: number;

  if (existingUsers.length === 0) {
    const [user] = await sql`
      INSERT INTO users (username, email, password_hash, skin)
      VALUES ('admin', 'admin@taskflow.dev', ${passwordHash}, 'default')
      RETURNING id
    `;
    userId = user.id;
    console.log(`✅ Created user: admin (id=${userId})`);
  } else {
    userId = existingUsers[0].id;
    await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
    console.log(`✅ User admin exists (id=${userId}), password updated`);
  }

  const existingCats = await sql`SELECT id FROM categories WHERE user_id = ${userId}`;
  if (existingCats.length === 0) {
    await sql`
      INSERT INTO categories (id, user_id, name, color, icon, parent_id, sort_order) VALUES
      ('project', ${userId}, '工作', '#2B8CED', 'Briefcase', NULL, 0),
      ('other', ${userId}, '琐事', '#8B6FC0', 'Coffee', NULL, 1),
      ('credit', ${userId}, '理财', '#E5534D', 'Wallet', NULL, 2),
      ('study', ${userId}, '学习', '#7C4DFF', 'BookOpen', NULL, 3),
      ('project-setup', ${userId}, '项目搭建', '#8B6FC0', NULL, 'other', 0),
      ('study-improve', ${userId}, '学习提升', '#8B6FC0', NULL, 'other', 1),
      ('long-term', ${userId}, '长期维护', '#8B6FC0', NULL, 'other', 2),
      ('register-download', ${userId}, '注册下载', '#8B6FC0', NULL, 'other', 3),
      ('quick-task', ${userId}, '随手办', '#8B6FC0', NULL, 'other', 4)
    `;
    console.log('✅ Created categories');
  } else {
    console.log(`⏭ Categories already exist (${existingCats.length})`);
  }

  const existingTasks = await sql`SELECT count(*)::int as cnt FROM tasks WHERE user_id = ${userId}`;
  if (existingTasks[0].cnt > 0) {
    console.log(`⏭ Tasks already exist (${existingTasks[0].cnt}), skipping`);
  } else {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = (day: number) => new Date(y, m, day).toISOString().slice(0, 10);
    const pm = (day: number) => new Date(y, m - 1, day).toISOString().slice(0, 10);
    const pm2 = (day: number) => new Date(y, m - 2, day).toISOString().slice(0, 10);

    await sql`
      INSERT INTO tasks (user_id, cat, sub_cat, title, meta, priority_level, deadline, start_date, end_date, time, done, archived, longterm, reminder, monthly_repeat, archived_at, created_at, updated_at) VALUES
      (${userId}, 'project', NULL, '完成项目方案设计', NULL, 'urgent_important', ${d(5)}, NULL, NULL, '10:00', false, false, false, true, false, NULL, ${d(1)}, ${d(1)}),
      (${userId}, 'project', NULL, '团队周会讨论', NULL, 'important', ${d(8)}, NULL, NULL, '14:00', false, false, false, false, true, NULL, ${d(1)}, ${d(1)}),
      (${userId}, 'project', NULL, '代码审查', NULL, 'urgent', ${d(10)}, NULL, NULL, '10:00', false, false, false, false, false, NULL, ${d(2)}, ${d(2)}),
      (${userId}, 'project', NULL, '客户需求评审', '准备PPT', 'urgent_important', ${d(12)}, NULL, NULL, '15:00', false, false, false, true, false, NULL, ${d(3)}, ${d(3)}),
      (${userId}, 'project', NULL, '修复登录Bug', NULL, 'urgent', ${d(7)}, NULL, NULL, NULL, true, false, false, false, false, NULL, ${d(1)}, ${d(5)}),
      (${userId}, 'other', 'quick-task', '取快递', NULL, 'normal', ${d(6)}, NULL, NULL, NULL, false, false, false, false, false, NULL, ${d(4)}, ${d(4)}),
      (${userId}, 'other', 'study-improve', '学习英语打卡', NULL, 'normal', NULL, NULL, NULL, '07:00', false, false, true, true, true, NULL, ${d(1)}, ${d(1)}),
      (${userId}, 'other', 'long-term', '整理书架', NULL, 'normal', ${d(15)}, NULL, NULL, NULL, false, false, false, false, false, NULL, ${d(5)}, ${d(5)}),
      (${userId}, 'credit', NULL, '理财记账-周期复盘', NULL, 'important', NULL, NULL, NULL, NULL, false, false, true, false, true, NULL, ${d(1)}, ${d(1)}),
      (${userId}, 'credit', NULL, '信用卡还款', '招行', 'urgent_important', ${d(20)}, NULL, NULL, NULL, false, false, false, true, true, NULL, ${d(1)}, ${d(1)}),
      (${userId}, 'study', NULL, '阅读《原则》', NULL, 'important', ${d(25)}, NULL, NULL, NULL, false, false, false, false, false, NULL, ${d(1)}, ${d(1)}),
      (${userId}, 'study', NULL, 'TypeScript高级培训', NULL, 'normal', ${d(18)}, NULL, NULL, '19:00', false, false, false, true, false, NULL, ${d(2)}, ${d(2)}),
      (${userId}, 'project', NULL, '完成Q2 OKR', NULL, 'urgent_important', ${pm(28)}, NULL, NULL, NULL, false, false, false, false, false, NULL, ${pm(1)}, ${pm(1)}),
      (${userId}, 'other', 'project-setup', '项目环境搭建', NULL, 'important', ${pm(30)}, NULL, NULL, NULL, false, false, false, false, false, NULL, ${pm(15)}, ${pm(15)}),
      (${userId}, 'project', NULL, '新版UI重构', NULL, 'urgent_important', NULL, ${new Date(y, m, -5).toISOString().slice(0, 10)}, ${d(15)}, NULL, false, false, false, false, false, NULL, ${new Date(y, m, -5).toISOString().slice(0, 10)}, ${new Date(y, m, -5).toISOString().slice(0, 10)}),
      (${userId}, 'project', NULL, '用户调研报告', NULL, 'important', NULL, ${new Date(y, m, -3).toISOString().slice(0, 10)}, ${d(10)}, NULL, false, false, false, false, false, NULL, ${new Date(y, m, -3).toISOString().slice(0, 10)}, ${new Date(y, m, -3).toISOString().slice(0, 10)}),
      (${userId}, 'project', NULL, '迭代项目A-性能优化', NULL, 'important', NULL, NULL, NULL, NULL, false, false, true, false, false, NULL, ${d(1)}, ${d(1)}),
      (${userId}, 'project', NULL, '迭代项目B-用户反馈', NULL, 'normal', NULL, NULL, NULL, NULL, false, false, true, false, false, NULL, ${d(1)}, ${d(1)}),
      (${userId}, 'project', NULL, '完成Q1复盘', NULL, 'important', ${pm2(28)}, NULL, NULL, NULL, true, true, false, false, false, ${pm(1)}, ${pm2(1)}, ${pm(1)}),
      (${userId}, 'other', NULL, '搬家整理', NULL, 'normal', ${pm(15)}, NULL, NULL, NULL, true, true, false, false, false, ${pm(16)}, ${pm(1)}, ${pm(16)}),
      (${userId}, 'credit', NULL, '3月信用卡还款', NULL, 'urgent_important', ${pm2(20)}, NULL, NULL, NULL, true, true, false, false, false, ${pm2(21)}, ${pm2(1)}, ${pm2(21)})
    `;
    console.log('✅ Created 21 tasks');
  }

  const existingSettings = await sql`SELECT user_id FROM user_settings WHERE user_id = ${userId}`;
  if (existingSettings.length === 0) {
    await sql`
      INSERT INTO user_settings (user_id, font_size, show_done, hide_empty_cat, default_sort)
      VALUES (${userId}, 'medium', true, false, 'priority')
    `;
    console.log('✅ Created user settings');
  }

  console.log('🎉 Seed complete!');
  console.log('   Login: admin / admin123');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
