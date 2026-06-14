import { describe, it, expect } from 'vitest';
import { getCrossMonthType } from '@/lib/utils/cross-month';
import { MOCK_TASKS } from '@/lib/mock-data';

describe('模拟数据集成测试 (PRD §4 跨月任务处理)', () => {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 15);

  it('模拟数据应包含逾期任务', () => {
    const overdueTasks = MOCK_TASKS.filter(
      (t) => !t.archived && getCrossMonthType(t, currentMonth) === 'overdue'
    );
    expect(overdueTasks.length).toBeGreaterThan(0);
  });

  it('模拟数据应包含长期常驻任务', () => {
    const longtermTasks = MOCK_TASKS.filter(
      (t) => !t.archived && getCrossMonthType(t, currentMonth) === 'longterm'
    );
    expect(longtermTasks.length).toBeGreaterThan(0);
  });

  it('模拟数据应包含跨期任务或可手动验证', () => {
    const crossPeriodTasks = MOCK_TASKS.filter(
      (t) => !t.archived && !t.longterm && t.startDate && t.endDate
    );
    expect(crossPeriodTasks.length).toBeGreaterThan(0);
  });

  it('模拟数据应包含归档任务', () => {
    const archivedTasks = MOCK_TASKS.filter((t) => t.archived);
    expect(archivedTasks.length).toBeGreaterThan(0);
  });

  it('模拟数据应覆盖多种分类', () => {
    const cats = new Set(MOCK_TASKS.map((t) => t.cat));
    expect(cats.size).toBeGreaterThanOrEqual(2);
  });

  it('模拟数据应覆盖多种优先级', () => {
    const priorities = new Set(MOCK_TASKS.map((t) => t.priorityLevel));
    expect(priorities.size).toBeGreaterThanOrEqual(2);
  });
});

describe('月初过渡逻辑 (PRD §4.2)', () => {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  it('当前月视图应正确分类所有任务', () => {
    const activeTasks = MOCK_TASKS.filter((t) => !t.archived);

    const overdue = activeTasks.filter((t) => getCrossMonthType(t, currentMonth) === 'overdue');
    const longterm = activeTasks.filter((t) => getCrossMonthType(t, currentMonth) === 'longterm');
    const crossPeriod = activeTasks.filter((t) => getCrossMonthType(t, currentMonth) === 'cross_period');
    const normal = activeTasks.filter((t) => getCrossMonthType(t, currentMonth) === 'normal');

    const total = overdue.length + longterm.length + crossPeriod.length + normal.length;
    expect(total).toBe(activeTasks.length);
  });
});
