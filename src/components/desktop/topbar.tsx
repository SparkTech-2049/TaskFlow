'use client';

import { useSettingsStore } from '@/lib/stores/settings-store';
import { Zap, CircleDot, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function TopBar() {
  const { skin, setSkin } = useSettingsStore();

  return (
    <header className="flex h-14 shrink-0 items-center justify-end border-b border-border-micro bg-bg-surface px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSkin(skin === 'neon' ? 'default' : 'neon')}
          title="霓虹皮肤"
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
            skin === 'neon'
              ? 'border-[1.5px] border-accent-indigo text-accent-indigo bg-bg-elevated'
              : 'border border-border-micro text-text-muted bg-bg-surface hover:text-text-secondary'
          )}
        >
          <Zap className="h-4 w-4" />
        </button>
        <button
          onClick={() => setSkin(skin === 'huawei' ? 'default' : 'huawei')}
          title="华为皮肤"
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
            skin === 'huawei'
              ? 'border-[1.5px] border-priority-urgent text-priority-urgent bg-bg-elevated'
              : 'border border-border-micro text-text-muted bg-bg-surface hover:text-text-secondary'
          )}
        >
          <CircleDot className="h-4 w-4" />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-brand text-xs font-bold text-white">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
