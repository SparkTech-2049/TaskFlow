import { describe, it, expect } from 'vitest';
import { getCrossMonthType, getOverdueDays, getCrossPeriodProgress } from '@/lib/utils/cross-month';

describe('跨月任务判断逻辑 (PRD §4)', () => {
  const june2026 = new Date(2026, 5, 15);

  describe('长期常驻 (M-02)', () => {
    it('longterm=true 且 done=false 应返回 longterm', () => {
      const task = { longterm: true, done: false, deadline: null, startDate: null, endDate: null };
      expect(getCrossMonthType(task, june2026)).toBe('longterm');
    });

    it('longterm=true 但 done=true 不应返回 longterm', () => {
      const task = { longterm: true, done: true, deadline: null, startDate: null, endDate: null };
      expect(getCrossMonthType(task, june2026)).toBe('normal');
    });

    it('长期常驻任务不属于任何月份，始终在场', () => {
      const jan = new Date(2026, 0, 1);
      const dec = new Date(2026, 11, 1);
      const task = { longterm: true, done: false, deadline: null, startDate: null, endDate: null };
      expect(getCrossMonthType(task, jan)).toBe('longterm');
      expect(getCrossMonthType(task, dec)).toBe('longterm');
    });
  });

  describe('逾期结转 (M-01)', () => {
    it('deadline < 当月1日 且 done=false 应返回 overdue', () => {
      const task = { longterm: false, done: false, deadline: '2026-05-28', startDate: null, endDate: null };
      expect(getCrossMonthType(task, june2026)).toBe('overdue');
    });

    it('逾期任务永久挂载直到完成或归档', () => {
      const task = { longterm: false, done: false, deadline: '2026-01-01', startDate: null, endDate: null };
      expect(getCrossMonthType(task, june2026)).toBe('overdue');
    });

    it('deadline 在当月内不应返回 overdue', () => {
      const task = { longterm: false, done: false, deadline: '2026-06-15', startDate: null, endDate: null };
      expect(getCrossMonthType(task, june2026)).toBe('normal');
    });

    it('done=true 的逾期任务不应返回 overdue', () => {
      const task = { longterm: false, done: true, deadline: '2026-05-28', startDate: null, endDate: null };
      expect(getCrossMonthType(task, june2026)).toBe('normal');
    });
  });

  describe('跨期展示 (M-03)', () => {
    it('startDate ≤ 月末 且 endDate ≥ 月初 应返回 cross_period', () => {
      const task = { longterm: false, done: false, deadline: null, startDate: '2026-05-20', endDate: '2026-06-15' };
      expect(getCrossMonthType(task, june2026)).toBe('cross_period');
    });

    it('跨期任务在所跨月份都自然出现', () => {
      const task = { longterm: false, done: false, deadline: null, startDate: '2026-05-20', endDate: '2026-07-15' };
      const may = new Date(2026, 4, 1);
      const june = new Date(2026, 5, 1);
      const july = new Date(2026, 6, 1);
      expect(getCrossMonthType(task, may)).toBe('cross_period');
      expect(getCrossMonthType(task, june)).toBe('cross_period');
      expect(getCrossMonthType(task, july)).toBe('cross_period');
    });

    it('不在跨期范围内的月份应返回 normal', () => {
      const task = { longterm: false, done: false, deadline: null, startDate: '2026-05-20', endDate: '2026-06-15' };
      const aug = new Date(2026, 7, 1);
      expect(getCrossMonthType(task, aug)).toBe('normal');
    });
  });

  describe('优先级: longterm > overdue > cross_period', () => {
    it('longterm 应优先于 overdue', () => {
      const task = { longterm: true, done: false, deadline: '2026-05-28', startDate: null, endDate: null };
      expect(getCrossMonthType(task, june2026)).toBe('longterm');
    });
  });

  describe('getOverdueDays', () => {
    it('应正确计算逾期天数', () => {
      const now = new Date();
      const deadline = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const deadlineStr = deadline.toISOString().slice(0, 10);
      expect(getOverdueDays(deadlineStr)).toBeGreaterThanOrEqual(6);
      expect(getOverdueDays(deadlineStr)).toBeLessThanOrEqual(8);
    });
  });

  describe('getCrossPeriodProgress', () => {
    it('跨期进度应在 0-100 之间', () => {
      const start = '2026-05-20';
      const end = '2026-07-20';
      const progress = getCrossPeriodProgress(start, end);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it('已结束的跨期任务进度应为 100', () => {
      const progress = getCrossPeriodProgress('2026-01-01', '2026-02-01');
      expect(progress).toBe(100);
    });
  });
});
