'use client';

import { useState, useMemo, useCallback } from 'react';
import type { CalendarDay } from '@/lib/types';

export type { CalendarDay };

interface UseCalendarReturn {
  currentYear: number;
  currentMonth: number; // 0-indexed
  calendarDays: CalendarDay[];
  selectedDate: string | null;
  monthLabel: string;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  selectDate: (dateString: string) => void;
  isToday: (date: Date) => boolean;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useCalendar(initialDate?: Date): UseCalendarReturn {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(initialDate?.getFullYear() ?? today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate?.getMonth() ?? today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDate(today));

  const monthLabel = useMemo(() => {
    return `${currentYear}年${currentMonth + 1}月`;
  }, [currentYear, currentMonth]);

  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];

    // First day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Last day of the month
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Monday = 0, Sunday = 6 (convert from JS getDay)
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;

    // Previous month overflow
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      const dow = date.getDay();
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: formatDate(date) === formatDate(today),
        isWeekend: dow === 0 || dow === 6,
        isSunday: dow === 0,
        isSaturday: dow === 6,
        dateString: formatDate(date),
      });
    }

    // Current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dow = date.getDay();
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: formatDate(date) === formatDate(today),
        isWeekend: dow === 0 || dow === 6,
        isSunday: dow === 0,
        isSaturday: dow === 6,
        dateString: formatDate(date),
      });
    }

    // Next month overflow (fill to 42 cells = 6 rows x 7 cols)
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      const dow = date.getDay();
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: formatDate(date) === formatDate(today),
        isWeekend: dow === 0 || dow === 6,
        isSunday: dow === 0,
        isSaturday: dow === 6,
        dateString: formatDate(date),
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const selectDate = useCallback((dateString: string) => {
    setSelectedDate((prev) => (prev === dateString ? null : dateString));
  }, []);

  const isTodayFn = useCallback(
    (date: Date) => {
      return formatDate(date) === formatDate(today);
    },
    []
  );

  return {
    currentYear,
    currentMonth,
    calendarDays,
    selectedDate,
    monthLabel,
    goToPrevMonth,
    goToNextMonth,
    selectDate,
    isToday: isTodayFn,
  };
}
