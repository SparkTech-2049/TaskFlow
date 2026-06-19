// 分类定义
export const CATEGORIES = [
  { id: 'project', name: '工作', color: '#007AFF', icon: 'Briefcase' },
  { id: 'other', name: '琐事', color: '#AF52DE', icon: 'CircleDot', subCategories: [
    { id: 'project-setup', name: '项目搭建', color: '#AF52DE' },
    { id: 'study-improve', name: '学习提升', color: '#AF52DE' },
    { id: 'long-term', name: '长期维护', color: '#AF52DE' },
    { id: 'register-download', name: '注册下载', color: '#AF52DE' },
    { id: 'quick-task', name: '随手办', color: '#AF52DE' },
  ]},
  { id: 'credit', name: '理财', color: '#FF2D55', icon: 'Banknote' },
  { id: 'study', name: '学习', color: '#5856D6', icon: 'GraduationCap' },
];

// 优先级定义
export const PRIORITIES = [
  { id: 'urgent_important', name: '紧急且重要', color: '#FF3B30' },
  { id: 'important', name: '重要不紧急', color: '#FF9500' },
  { id: 'urgent', name: '紧急不重要', color: '#FF9500' },
  { id: 'normal', name: '普通', color: '#34C759' },
];

export const QUADRANT_COLORS: Record<string, { bg: string; border: string; title: string; name: string }> = {
  urgent_important: { bg: '#FF3B3006', border: '#FF3B3020', title: '#FF3B30', name: '紧急且重要' },
  important: { bg: '#FF950006', border: '#FF950020', title: '#FF9500', name: '重要不紧急' },
  urgent: { bg: '#FF950006', border: '#FF950020', title: '#FF9500', name: '紧急不重要' },
  normal: { bg: '#34C75906', border: '#34C75920', title: '#34C759', name: '不紧急不重要' },
};

export const CROSS_MONTH_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  overdue: { bg: '#FF3B3006', border: '#FF3B3020', text: '#FF3B30', label: '逾期结转' },
  longterm: { bg: '#5856D606', border: '#5856D620', text: '#5856D6', label: '长期常驻' },
  cross_period: { bg: '#007AFF06', border: '#007AFF20', text: '#007AFF', label: '跨期进行中' },
};

export const STAT_COLORS: Record<string, string> = {
  total: '#007AFF',
  pending: '#5856D6',
  done: '#34C759',
  urgent: '#FF3B30',
};

export type PriorityId = 'urgent_important' | 'important' | 'urgent' | 'normal';
export type CategoryId = 'project' | 'other' | 'credit' | 'study';
export type CrossMonthType = 'overdue' | 'longterm' | 'cross_period' | 'normal';
export type SkinType = 'default' | 'neon' | 'huawei' | 'forest';
