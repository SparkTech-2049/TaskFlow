import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendar } from '@/lib/hooks/use-calendar';

describe('useCalendar 日历逻辑 (PRD §3.1 日历视图)', () => {
  describe('C-01 月历展示', () => {
    it('应生成42个日历格子(6行×7列)', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 5, 1)));
      expect(result.current.calendarDays).toHaveLength(42);
    });

    it('应以周一开头', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 5, 1)));
      const firstDay = result.current.calendarDays[0];
      expect(firstDay.date.getDay()).toBe(1);
    });
  });

  describe('C-02 月份切换', () => {
    it('应能切换到上一月', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 5, 1)));
      act(() => { result.current.goToPrevMonth(); });
      expect(result.current.monthLabel).toBe('2026年5月');
    });

    it('应能切换到下一月', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 5, 1)));
      act(() => { result.current.goToNextMonth(); });
      expect(result.current.monthLabel).toBe('2026年7月');
    });

    it('1月切换上一月应为上年12月', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 0, 1)));
      act(() => { result.current.goToPrevMonth(); });
      expect(result.current.monthLabel).toBe('2025年12月');
    });

    it('12月切换下一月应为下年1月', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 11, 1)));
      act(() => { result.current.goToNextMonth(); });
      expect(result.current.monthLabel).toBe('2027年1月');
    });
  });

  describe('C-03 今日高亮', () => {
    it('今日应标记 isToday=true', () => {
      const { result } = renderHook(() => useCalendar());
      const todayCell = result.current.calendarDays.find((d) => d.isToday);
      expect(todayCell).toBeDefined();
      expect(todayCell!.isCurrentMonth).toBe(true);
    });
  });

  describe('C-06 非当月日期淡化', () => {
    it('非当月日期应标记 isCurrentMonth=false', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 5, 1)));
      const nonCurrent = result.current.calendarDays.filter((d) => !d.isCurrentMonth);
      expect(nonCurrent.length).toBeGreaterThan(0);
    });

    it('当月日期应标记 isCurrentMonth=true', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 5, 1)));
      const current = result.current.calendarDays.filter((d) => d.isCurrentMonth);
      expect(current.length).toBe(30);
    });
  });

  describe('C-05 周末区分', () => {
    it('周日应标记 isSunday=true, isWeekend=true', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 5, 1)));
      const sundays = result.current.calendarDays.filter((d) => d.isSunday);
      expect(sundays.length).toBeGreaterThan(0);
      sundays.forEach((s) => expect(s.isWeekend).toBe(true));
    });

    it('周六应标记 isSaturday=true, isWeekend=true', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 5, 1)));
      const saturdays = result.current.calendarDays.filter((d) => d.isSaturday);
      expect(saturdays.length).toBeGreaterThan(0);
      saturdays.forEach((s) => expect(s.isWeekend).toBe(true));
    });
  });

  describe('日期选择', () => {
    it('应能选中日期', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 5, 1)));
      act(() => { result.current.selectDate('2026-06-15'); });
      expect(result.current.selectedDate).toBe('2026-06-15');
    });

    it('再次点击同一日期应取消选中', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 5, 1)));
      act(() => { result.current.selectDate('2026-06-15'); });
      act(() => { result.current.selectDate('2026-06-15'); });
      expect(result.current.selectedDate).toBeNull();
    });
  });

  describe('月份标签', () => {
    it('应显示 "2026年6月" 格式', () => {
      const { result } = renderHook(() => useCalendar(new Date(2026, 5, 1)));
      expect(result.current.monthLabel).toBe('2026年6月');
    });
  });
});
