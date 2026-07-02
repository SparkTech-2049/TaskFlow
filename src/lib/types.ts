export interface Task {
  id: number;
  cat: string;
  subCat: string | null;
  parentId: number | null;
  title: string;
  meta: string | null;
  priorityLevel: string;
  deadline: string | null;
  startDate: string | null;
  endDate: string | null;
  time: string | null;
  done: boolean;
  archived: boolean;
  longterm: boolean;
  reminder: boolean;
  monthlyRepeat: boolean;
  repeatSourceId: number | null;
  archivedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  color: string;
  parentId: string;
  taskCount?: number;
}

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isSunday: boolean;
  isSaturday: boolean;
  dateString: string;
}
