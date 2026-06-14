'use client';

import { Suspense, useEffect } from 'react';
import { Sidebar } from '@/components/desktop/sidebar';
import { TopBar } from '@/components/desktop/topbar';
import { ReminderScheduler } from '@/components/reminder-scheduler';
import { useSettingsStore, applySkin, applyFontSize } from '@/lib/stores/settings-store';
import { useTaskStore } from '@/lib/stores/task-store';

function DataInitializer() {
  const { fetchFromServer, _hydrated } = useTaskStore();

  useEffect(() => {
    console.log('[DataInitializer] _hydrated:', _hydrated);
    if (!_hydrated) return;
    fetchFromServer();
  }, [_hydrated, fetchFromServer]);

  return null;
}

export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { skin, fontSize } = useSettingsStore();

  useEffect(() => {
    applySkin(skin);
    applyFontSize(fontSize);
  }, [skin, fontSize]);

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
