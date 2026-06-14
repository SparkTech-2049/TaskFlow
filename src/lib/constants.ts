// 分类定义
export const CATEGORIES = [
  { id: 'project', name: '工作', color: '#2B8CED', icon: 'Briefcase' },
  { id: 'other', name: '琐事', color: '#8B6FC0', icon: 'Coffee', subCategories: [
    { id: 'project-setup', name: '项目搭建', color: '#8B6FC0' },
    { id: 'study-improve', name: '学习提升', color: '#8B6FC0' },
    { id: 'long-term', name: '长期维护', color: '#8B6FC0' },
    { id: 'register-download', name: '注册下载', color: '#8B6FC0' },
    { id: 'quick-task', name: '随手办', color: '#8B6FC0' },
  ]},
  { id: 'credit', name: '理财', color: '#E5534D', icon: 'Wallet' },
  { id: 'study', name: '学习', color: '#7C4DFF', icon: 'BookOpen' },
];

// 优先级定义
export const PRIORITIES = [
  { id: 'urgent_important', name: '紧急且重要', color: '#E53E3E' },
  { id: 'important', name: '重要不紧急', color: '#FFC107' },
  { id: 'urgent', name: '紧急不重要', color: '#ED8936' },
  { id: 'normal', name: '普通', color: '#07C160' },
];

// 四象限颜色
export const QUADRANT_COLORS: Record<string, { bg: string; border: string; title: string; name: string }> = {
  urgent_important: { bg: '#E53E3E06', border: '#E53E3E20', title: '#E53E3E', name: '紧急且重要' },
  important: { bg: '#FFC10706', border: '#FFC10720', title: '#FFC107', name: '重要不紧急' },
  urgent: { bg: '#ED893606', border: '#ED893620', title: '#ED8936', name: '紧急不重要' },
  normal: { bg: '#07C16006', border: '#07C16020', title: '#07C160', name: '不紧急不重要' },
};

// 跨月类型颜色
export const CROSS_MONTH_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  overdue: { bg: '#E53E3E06', border: '#E53E3E20', text: '#E53E3E', label: '逾期结转' },
  longterm: { bg: '#8B6CFF06', border: '#8B6CFF20', text: '#8B6CFF', label: '长期常驻' },
  cross_period: { bg: '#3B6EF606', border: '#3B6EF620', text: '#3B6EF6', label: '跨期进行中' },
};

// 统计卡片颜色
export const STAT_COLORS: Record<string, string> = {
  total: '#3B6EF6',
  pending: '#5B5EF0',
  done: '#2DB87A',
  urgent: '#E53E3E',
};

export type PriorityId = 'urgent_important' | 'important' | 'urgent' | 'normal';
export type CategoryId = 'project' | 'other' | 'credit' | 'study';
export type CrossMonthType = 'overdue' | 'longterm' | 'cross_period' | 'normal';
export type SkinType = 'default' | 'neon' | 'huawei';
