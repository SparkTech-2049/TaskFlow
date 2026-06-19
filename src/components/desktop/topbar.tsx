'use client';

import { useSettingsStore } from '@/lib/stores/settings-store';
import { Palette, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const SKIN_ORDER = ['default', 'neon', 'huawei', 'forest', 'sunset'] as const;
const SKIN_LABELS: Record<string, string> = {
  default: '默认',
  neon: '霓虹',
  huawei: '华为',
  forest: '森林',
  sunset: '日落',
};

export function TopBar() {
  const { skin, setSkin } = useSettingsStore();

  const cycleSkin = () => {
    const idx = SKIN_ORDER.indexOf(skin as typeof SKIN_ORDER[number]);
    const next = SKIN_ORDER[(idx + 1) % SKIN_ORDER.length];
    setSkin(next);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-end border-b border-border-micro bg-bg-surface px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={cycleSkin}
          title={`当前：${SKIN_LABELS[skin] || skin}，点击切换`}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 transition-colors text-xs font-medium',
            skin !== 'default'
              ? 'border-accent-blue text-accent-blue bg-accent-blue/5'
              : 'border-border-micro text-text-muted bg-bg-surface hover:text-text-secondary'
          )}
        >
          <Palette className="h-3.5 w-3.5" />
          {SKIN_LABELS[skin] || '默认'}
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-brand text-xs font-bold text-white">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
