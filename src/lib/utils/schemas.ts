import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, '请输入任务标题').max(200),
  cat: z.string().min(1, '请选择分类'),
  sub_cat: z.string().optional(),
  priority_level: z.enum(['urgent_important', 'important', 'urgent', 'normal']),
  deadline: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  time: z.string().optional(),
  meta: z.string().optional(),
  longterm: z.boolean().optional(),
  reminder: z.boolean().optional(),
  monthly_repeat: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
