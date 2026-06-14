'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid, Briefcase, Coffee, Wallet, BookOpen,
  Calendar, List, Grid2X2, Archive, Settings, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const catItems = [
  { href: '/d', label: '全部', icon: LayoutGrid, query: '' },
  { href: '/d', label: '工作', icon: Briefcase, query: 'cat=project' },
  { href: '/d', label: '琐事', icon: Coffee, query: 'cat=other' },
  { href: '/d', label: '理财', icon: Wallet, query: 'cat=credit' },
  { href: '/d', label: '学习', icon: BookOpen, query: 'cat=study' },
];

const viewItems = [
  { href: '/d/calendar', label: '日历', icon: Calendar },
  { href: '/d/list', label: '清单', icon: List },
  { href: '/d/quadrant', label: '四象限', icon: Grid2X2 },
];

const manageItems = [
  { href: '/d/archive', label: '归档', icon: Archive },
  { href: '/d/settings', label: '设置', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCat = searchParams.get('cat') ?? '';

  function isActive(item: { href: string; query?: string }) {
    if (item.query !== undefined) {
      const catValue = item.query.replace('cat=', '') || '';
      if (catValue === '') {
        return pathname === '/d' && currentCat === '';
      }
      return pathname === item.href && currentCat === catValue;
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  }

  return (
    <aside className="flex h-full w-[180px] shrink-0 flex-col border-r border-border-micro bg-bg-surface">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
          <Zap className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-lg font-semibold text-text-primary">Task</span>
        <span className="text-lg font-semibold text-accent-indigo">Flow</span>
      </div>

      {/* Nav */}
      <nav className="mt-1 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4">
        <div className="px-2 py-1 text-[11px] font-medium text-text-muted">分类</div>
        {catItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.query ? `${item.href}?${item.query}` : item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all',
                active
                  ? 'border-[1.5px] border-accent-blue bg-bg-elevated font-medium text-accent-blue'
                  : 'border-[1.5px] border-transparent font-normal text-text-secondary hover:bg-bg-elevated'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-3 px-2 py-1 text-[11px] font-medium text-text-muted">视图</div>
        {viewItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all',
                active
                  ? 'border-[1.5px] border-accent-blue bg-bg-elevated font-medium text-accent-blue'
                  : 'border-[1.5px] border-transparent font-normal text-text-secondary hover:bg-bg-elevated'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-3 px-2 py-1 text-[11px] font-medium text-text-muted">管理</div>
        {manageItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all',
                active
                  ? 'border-[1.5px] border-accent-blue bg-bg-elevated font-medium text-accent-blue'
                  : 'border-[1.5px] border-transparent font-normal text-text-secondary hover:bg-bg-elevated'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
