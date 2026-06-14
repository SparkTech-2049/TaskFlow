import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  date,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  skin: varchar('skin', { length: 20 }).default('default'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  cat: varchar('cat', { length: 30 }).notNull(),
  subCat: varchar('sub_cat', { length: 30 }),
  parentId: integer('parent_id'),
  title: varchar('title', { length: 200 }).notNull(),
  meta: text('meta'),
  priorityLevel: varchar('priority_level', { length: 20 }).notNull(),
  deadline: date('deadline'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  time: varchar('time', { length: 5 }),
  done: boolean('done').default(false).notNull(),
  archived: boolean('archived').default(false).notNull(),
  longterm: boolean('longterm').default(false).notNull(),
  reminder: boolean('reminder').default(false).notNull(),
  monthlyRepeat: boolean('monthly_repeat').default(false).notNull(),
  archivedAt: timestamp('archived_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: varchar('id', { length: 30 }).primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  parentId: varchar('parent_id', { length: 30 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userSettings = pgTable('user_settings', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id),
  fontSize: varchar('font_size', { length: 10 }).default('medium'),
  showDone: boolean('show_done').default(true),
  hideEmptyCat: boolean('hide_empty_cat').default(false),
  defaultSort: varchar('default_sort', { length: 20 }).default('priority'),
  barkWebhook: varchar('bark_webhook', { length: 500 }),
});

export const bannedIps = pgTable('banned_ips', {
  id: serial('id').primaryKey(),
  ip: varchar('ip', { length: 45 }).notNull().unique(),
  reason: varchar('reason', { length: 200 }).default('密码错误'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});
