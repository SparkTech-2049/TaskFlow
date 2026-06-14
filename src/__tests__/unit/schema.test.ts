import { describe, it, expect } from 'vitest';
import { users, tasks, categories, userSettings, accounts, bannedIps } from '@/lib/db/schema';

describe('Drizzle Schema 数据库结构 (PRD §5)', () => {
  describe('users 表 (PRD §5.1)', () => {
    it('应包含所有必需字段', () => {
      const columns = Object.keys(users);
      expect(columns).toContain('id');
      expect(columns).toContain('username');
      expect(columns).toContain('email');
      expect(columns).toContain('passwordHash');
      expect(columns).toContain('avatarUrl');
      expect(columns).toContain('skin');
      expect(columns).toContain('createdAt');
    });
  });

  describe('tasks 表 (PRD §5.1 Task 数据模型)', () => {
    it('应包含所有 PRD 定义的字段', () => {
      const columns = Object.keys(tasks);
      const requiredFields = [
        'id', 'userId', 'cat', 'subCat', 'parentId',
        'title', 'meta', 'priorityLevel', 'deadline',
        'startDate', 'endDate', 'time', 'done', 'archived',
        'longterm', 'reminder', 'monthlyRepeat', 'archivedAt',
        'createdAt', 'updatedAt',
      ];
      for (const field of requiredFields) {
        expect(columns).toContain(field);
      }
    });
  });

  describe('categories 表 (PRD §5.2)', () => {
    it('应包含分类所需字段', () => {
      const columns = Object.keys(categories);
      expect(columns).toContain('id');
      expect(columns).toContain('userId');
      expect(columns).toContain('name');
      expect(columns).toContain('color');
      expect(columns).toContain('icon');
      expect(columns).toContain('parentId');
      expect(columns).toContain('sortOrder');
    });
  });

  describe('userSettings 表 (PRD §3.7)', () => {
    it('应包含设置所需字段', () => {
      const columns = Object.keys(userSettings);
      expect(columns).toContain('userId');
      expect(columns).toContain('fontSize');
      expect(columns).toContain('showDone');
      expect(columns).toContain('hideEmptyCat');
      expect(columns).toContain('defaultSort');
      expect(columns).toContain('barkWebhook');
    });
  });

  describe('bannedIps 表', () => {
    it('应包含 IP 封禁所需字段', () => {
      const columns = Object.keys(bannedIps);
      expect(columns).toContain('id');
      expect(columns).toContain('ip');
      expect(columns).toContain('reason');
      expect(columns).toContain('createdAt');
    });
  });

  describe('accounts 表', () => {
    it('应包含 OAuth 账号关联字段', () => {
      const columns = Object.keys(accounts);
      expect(columns).toContain('userId');
      expect(columns).toContain('type');
      expect(columns).toContain('provider');
      expect(columns).toContain('providerAccountId');
    });
  });
});
