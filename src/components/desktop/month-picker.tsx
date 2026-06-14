'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
  year: number;
  month: number; // 0-indexed
  onChange: (year: number, month: number) => void;
}

export function MonthPicker({ year, month, onChange }: MonthPickerProps) {
  function prev() {
    if (month === 0) onChange(year - 1, 11);
    else onChange(year, month - 1);
  }

  function next() {
    if (month === 11) onChange(year + 1, 0);
    else onChange(year, month + 1);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-elevated hover:text-text-secondary"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[100px] text-center text-sm font-medium text-text-primary">
        {year}年{month + 1}月
      </span>
      <button
        onClick={next}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-elevated hover:text-text-secondary"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
