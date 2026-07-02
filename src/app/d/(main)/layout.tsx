'use client';

import { Suspense, useEffect } from 'react';
import { Sidebar } from '@/components/desktop/sidebar';
import { TopBar } from '@/components/desktop/topbar';
import { ReminderScheduler } from '@/components/reminder-scheduler';
import { useSettingsStore, applySkin, applyFontSize } from '@/lib/stores/settings-store';
import { useTaskStore } from '@/lib/stores/task-store';

function DataInitializer() {
  const { fetchFromServer, generateMonthlyRepeats, cleanupDuplicateRepeats, _hydrated } = useTaskStore();

  useEffect(() => {
    console.log('[DataInitializer] _hydrated:', _hydrated);
    if (!_hydrated) return;
    fetchFromServer().then(() => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      generateMonthlyRepeats(currentMonth);
      cleanupDuplicateRepeats();
    });
  }, [_hydrated, fetchFromServer, generateMonthlyRepeats, cleanupDuplicateRepeats]);

  return null;
}

export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { skin, fontSize, fetchBarkChannels } = useSettingsStore();

  useEffect(() => {
    applySkin(skin);
    applyFontSize(fontSize);
  }, [skin, fontSize]);

  useEffect(() => {
    fetchBarkChannels();
  }, [fetchBarkChannels]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-canvas" data-skin={skin}>
      <DataInitializer />
      <ReminderScheduler />
      <Suspense fallback={<aside className="w-[180px] shrink-0 border-r border-border-micro bg-bg-surface" />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
