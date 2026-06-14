import { CATEGORIES, PRIORITIES } from '@/lib/constants';

export const CAT_NAMES: Record<string, string> = {
  project: '工作',
  other: '琐事',
  credit: '理财',
  study: '学习',
};

export const CAT_COLORS: Record<string, string> = {
  project: '#2B8CED',
  other: '#8B6FC0',
  credit: '#E5534D',
  study: '#7C4DFF',
};

export const CAT_BG_CLASSES: Record<string, string> = {
  project: 'bg-cat-project',
  other: 'bg-cat-other',
  credit: 'bg-cat-credit',
  study: 'bg-cat-study',
};

export const CAT_TEXT_CLASSES: Record<string, string> = {
  project: 'text-cat-project',
  other: 'text-cat-other',
  credit: 'text-cat-credit',
  study: 'text-cat-study',
};

export const CAT_ORDER = ['project', 'other', 'credit', 'study'] as const;

export const SUB_CAT_ORDER = ['project-setup', 'study-improve', 'long-term', 'register-download', 'quick-task'] as const;

export const SUB_CAT_NAMES: Record<string, string> = {
  'project-setup': '项目搭建',
  'study-improve': '学习提升',
  'long-term': '长期维护',
  'register-download': '注册下载',
  'quick-task': '随手办',
};

export const PRIORITY_COLORS: Record<string, string> = {
  urgent_important: '#E53E3E',
  important: '#FFC107',
  urgent: '#ED8936',
  normal: '#07C160',
};

export const PRIORITY_DOT_CLASSES: Record<string, string> = {
  urgent_important: 'bg-priority-urgent',
  important: 'bg-priority-important',
  urgent: 'bg-accent-blue',
  normal: 'bg-priority-normal',
};

export const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export function getPriorityColor(priorityLevel: string): string {
  return PRIORITIES.find((p) => p.id === priorityLevel)?.color ?? '#94A3B8';
}

export function getCategoryInfo(cat: string) {
  return CATEGORIES.find((c) => c.id === cat);
}

export function getSubCategoryName(cat: string, subCat: string | null): string | null {
  if (!subCat) return null;
  const category = CATEGORIES.find((c) => c.id === cat);
  return category?.subCategories?.find((s) => s.id === subCat)?.name ?? null;
}

export function getCatPath(cat: string, subCat: string | null): string {
  const catName = CAT_NAMES[cat] || cat;
  if (!subCat) return catName;
  const subName = SUB_CAT_NAMES[subCat] || subCat;
  return `${catName} > ${subName}`;
}
