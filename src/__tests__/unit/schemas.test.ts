import { describe, it, expect } from 'vitest';
import { passwordSchema, registerSchema, loginSchema, createTaskSchema } from '@/lib/utils/schemas';

describe('密码强度校验 (PRD §8.3)', () => {
  it('8位以上大小写字母+数字+特殊符号应通过', () => {
    expect(passwordSchema.safeParse('Abc123!@').success).toBe(true);
    expect(passwordSchema.safeParse('Test@1234').success).toBe(true);
    expect(passwordSchema.safeParse('P@ssw0rd!').success).toBe(true);
  });

  it('少于8位应拒绝', () => {
    expect(passwordSchema.safeParse('Ab1!').success).toBe(false);
    expect(passwordSchema.safeParse('A1!b2@c').success).toBe(false);
  });

  it('缺少小写字母应拒绝', () => {
    expect(passwordSchema.safeParse('ABC123!@').success).toBe(false);
  });

  it('缺少大写字母应拒绝', () => {
    expect(passwordSchema.safeParse('abc123!@').success).toBe(false);
  });

  it('缺少数字应拒绝', () => {
    expect(passwordSchema.safeParse('Abcdef!@').success).toBe(false);
  });

  it('缺少特殊符号应拒绝', () => {
    expect(passwordSchema.safeParse('Abc12345').success).toBe(false);
  });

  it('纯数字应拒绝', () => {
    expect(passwordSchema.safeParse('12345678').success).toBe(false);
  });

  it('纯字母应拒绝', () => {
    expect(passwordSchema.safeParse('Abcdefgh').success).toBe(false);
  });
});

describe('注册表单校验 (PRD §3.8 ML-01~04)', () => {
  it('合法注册数据应通过', () => {
    const result = registerSchema.safeParse({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
    });
    expect(result.success).toBe(true);
  });

  it('用户名少于2位应拒绝', () => {
    const result = registerSchema.safeParse({
      username: 'a',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
    });
    expect(result.success).toBe(false);
  });

  it('两次密码不一致应拒绝', () => {
    const result = registerSchema.safeParse({
      username: 'testuser',
      password: 'Test@1234',
      confirmPassword: 'Test@5678',
    });
    expect(result.success).toBe(false);
  });

  it('邮箱可选', () => {
    const result = registerSchema.safeParse({
      username: 'testuser',
      email: '',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
    });
    expect(result.success).toBe(true);
  });
});

describe('登录表单校验', () => {
  it('合法登录数据应通过', () => {
    expect(loginSchema.safeParse({ username: 'admin', password: 'any' }).success).toBe(true);
  });

  it('用户名为空应拒绝', () => {
    expect(loginSchema.safeParse({ username: '', password: 'any' }).success).toBe(false);
  });

  it('密码为空应拒绝', () => {
    expect(loginSchema.safeParse({ username: 'admin', password: '' }).success).toBe(false);
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
