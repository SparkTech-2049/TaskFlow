'use client';

import { cn } from '@/lib/utils/cn';
import { STAT_COLORS } from '@/lib/constants';

interface StatCardsProps {
  total: number;
  pending: number;
  done: number;
  urgent: number;
}

const items = [
  { key: 'total' as const, label: '总任务' },
  { key: 'pending' as const, label: '待完成' },
  { key: 'done' as const, label: '已完成' },
  { key: 'urgent' as const, label: '紧急重要' },
];

export function StatCards({ total, pending, done, urgent }: StatCardsProps) {
  const values = { total, pending, done, urgent };

  return (
    <div className="flex gap-3">
      {items.map((item) => (
        <div
          key={item.key}
          className="glass-panel flex min-w-[120px] flex-col items-center justify-center px-4 py-3"
        >
          <span
            className="text-[16px] font-semibold leading-tight"
            style={{ color: STAT_COLORS[item.key] }}
          >
            {values[item.key]}
          </span>
          <span className="text-[11px] text-text-secondary leading-tight">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
