'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, List, Grid2X2, Archive, Settings, Zap } from 'lucide-react';
import { useSettingsStore, applySkin, applyFontSize } from '@/lib/stores/settings-store';
import { useTaskStore } from '@/lib/stores/task-store';
import { ReminderScheduler } from '@/components/reminder-scheduler';

const navItems = [
  { key: 'calendar', label: '日历', path: '/m/calendar', Icon: Calendar },
  { key: 'list', label: '清单', path: '/m/list', Icon: List },
  { key: 'quadrant', label: '四象限', path: '/m/quadrant', Icon: Grid2X2 },
  { key: 'archive', label: '归档', path: '/m/archive', Icon: Archive },
  { key: 'settings', label: '设置', path: '/m/settings', Icon: Settings },
];

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { skin, fontSize } = useSettingsStore();
  const { fetchFromServer, _hydrated } = useTaskStore();

  useEffect(() => {
    applySkin(skin);
    applyFontSize(fontSize);
  }, [skin, fontSize]);

  useEffect(() => {
    if (_hydrated) {
      fetchFromServer();
    }
  }, [_hydrated, fetchFromServer]);

  return (
    <div className="flex h-screen flex-col" data-skin={skin}>
      <ReminderScheduler />
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border-micro bg-bg-surface px-3">
        <div className="h-7 w-7 rounded-md gradient-brand flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-text-primary">Task</span>
        <span className="text-sm font-semibold text-accent-indigo">Flow</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {navItems.map(({ key, path, Icon }) => {
            const isActive = pathname.startsWith(path) || (pathname === '/m' && key === 'calendar');
            return (
              <button
                key={key}
                onClick={() => router.push(path)}
                title={key}
                className={`h-7 w-7 rounded-md border flex items-center justify-center transition-colors ${
                  isActive
                    ? 'border-accent-blue text-accent-blue bg-bg-elevated border-[1.5px]'
                    : 'border-border-micro text-text-muted bg-bg-surface border'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
