import { describe, it, expect } from 'vitest';
import { loginSchema, createTaskSchema } from '@/lib/utils/schemas';

describe('登录表单校验', () => {
  it('合法登录数据应通过', () => {
    expect(loginSchema.safeParse({ username: 'admin_taskflow', password: 'Task@Flow2026' }).success).toBe(true);
  });

  it('用户名为空应拒绝', () => {
    expect(loginSchema.safeParse({ username: '', password: 'any' }).success).toBe(false);
  });

  it('密码为空应拒绝', () => {
    expect(loginSchema.safeParse({ username: 'admin_taskflow', password: '' }).success).toBe(false);
  });
});

describe('创建任务校验 (PRD §3.4 T-06)', () => {
  it('最小合法任务应通过', () => {
    const result = createTaskSchema.safeParse({
      title: '完成项目方案',
      cat: 'project',
      priority_level: 'urgent_important',
    });
    expect(result.success).toBe(true);
  });

  it('标题为空应拒绝', () => {
    const result = createTaskSchema.safeParse({
      title: '',
      cat: 'project',
      priority_level: 'normal',
    });
    expect(result.success).toBe(false);
  });

  it('标题超过200字符应拒绝', () => {
    const result = createTaskSchema.safeParse({
      title: 'a'.repeat(201),
      cat: 'project',
      priority_level: 'normal',
    });
    expect(result.success).toBe(false);
  });

  it('分类为空应拒绝', () => {
    const result = createTaskSchema.safeParse({
      title: '测试任务',
      cat: '',
      priority_level: 'normal',
    });
    expect(result.success).toBe(false);
  });

  it('无效优先级应拒绝', () => {
    const result = createTaskSchema.safeParse({
      title: '测试任务',
      cat: 'project',
      priority_level: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('四种合法优先级都应通过', () => {
    const levels = ['urgent_important', 'important', 'urgent', 'normal'];
    for (const level of levels) {
      const result = createTaskSchema.safeParse({
        title: '测试任务',
        cat: 'project',
        priority_level: level,
      });
      expect(result.success).toBe(true);
    }
  });

  it('完整任务数据应通过', () => {
    const result = createTaskSchema.safeParse({
      title: '新版UI重构',
      cat: 'project',
      sub_cat: 'project-setup',
      priority_level: 'urgent_important',
      deadline: '2026-06-30',
      start_date: '2026-05-20',
      end_date: '2026-06-15',
      time: '09:00',
      meta: '需要完成首页和详情页',
      longterm: false,
      reminder: true,
      monthly_repeat: false,
    });
    expect(result.success).toBe(true);
  });
});
