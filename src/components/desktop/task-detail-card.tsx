'use client';

import { Calendar, Clock, Bell, Repeat, Infinity, Tag } from 'lucide-react';
import { getPriorityColor, getCategoryInfo, getSubCategoryName } from '@/components/shared/constants';
import { PRIORITIES } from '@/lib/constants';
import type { CategoryItem } from '@/lib/hooks/use-categories';
import type { Task } from '@/lib/types';

interface TaskDetailCardProps {
  task: Task;
  categories?: CategoryItem[];
}

export function TaskDetailCard({ task, categories }: TaskDetailCardProps) {
  const priorityColor = getPriorityColor(task.priorityLevel);
  const catInfo = getCategoryInfo(task.cat);
  const subCatName = getSubCategoryName(task.cat, task.subCat, categories);
  const priorityLabel = PRIORITIES.find((p) => p.id === task.priorityLevel)?.name ?? task.priorityLevel;

  return (
    <div className="w-64 rounded-xl border border-border-micro bg-bg-card p-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: priorityColor }} />
        <span className="text-[12px] font-semibold leading-tight text-text-primary">{task.title}</span>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Tag className="h-3 w-3 shrink-0 text-text-muted" />
          <div className="flex items-center gap-1">
            <span className="rounded px-1 py-0.5 text-[9px] text-white/90" style={{ backgroundColor: catInfo?.color ?? '#94A3B8' }}>
              {catInfo?.name ?? task.cat}
            </span>
            {subCatName && (
              <span className="rounded px-1 py-0.5 text-[9px] text-white/70" style={{ backgroundColor: catInfo?.color ?? '#94A3B8', opacity: 0.75 }}>
                {subCatName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 shrink-0 text-text-muted" />
          <span className="text-[11px] text-text-secondary">
            {task.deadline ?? (task.longterm ? '长期常驻' : '未设定')}
          </span>
          {task.time && (
            <>
              <Clock className="ml-1 h-3 w-3 shrink-0 text-text-muted" />
              <span className="text-[11px] text-text-secondary">{task.time}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 shrink-0 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priorityColor }} />
          </div>
          <span className="text-[11px] text-text-secondary">{priorityLabel}</span>
        </div>

        {task.meta && (
          <div className="mt-0.5 rounded-md bg-bg-elevated px-2 py-1">
            <span className="line-clamp-3 text-[10px] leading-relaxed text-text-muted">{task.meta}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {task.reminder && (
            <div className="flex items-center gap-1">
              <Bell className="h-3 w-3 text-accent-blue" />
              <span className="text-[10px] text-accent-blue">提醒</span>
            </div>
          )}
          {task.monthlyRepeat && (
            <div className="flex items-center gap-1">
              <Repeat className="h-3 w-3 text-accent-indigo" />
              <span className="text-[10px] text-accent-indigo">按月</span>
            </div>
          )}
          {task.longterm && (
            <div className="flex items-center gap-1">
              <Infinity className="h-3 w-3 text-purple-500" />
              <span className="text-[10px] text-purple-500">长期</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
