type CrossMonthType = 'overdue' | 'longterm' | 'cross_period' | 'normal';

interface TaskForCrossMonth {
  longterm: boolean;
  done: boolean;
  deadline: string | null;
  startDate: string | null;
  endDate: string | null;
}

export function getCrossMonthType(
  task: TaskForCrossMonth,
  currentMonth: Date
): CrossMonthType {
  const monthStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const monthEnd = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  if (task.longterm && !task.done) return 'longterm';
  if (
    task.deadline &&
    new Date(task.deadline) < monthStart &&
    !task.done
  )
    return 'overdue';
  if (
    task.startDate &&
    task.endDate &&
    new Date(task.startDate) <= monthEnd &&
    new Date(task.endDate) >= monthStart
  )
    return 'cross_period';
  return 'normal';
}

export function getOverdueDays(deadline: string): number {
  const now = new Date();
  const dl = new Date(deadline);
  return Math.floor(
    (now.getTime() - dl.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function getCrossPeriodProgress(
  startDate: string,
  endDate: string
): number {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}
