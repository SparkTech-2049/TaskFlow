'use client';

import { useState, useRef } from 'react';
import { memo } from 'react';
import { cn } from '@/lib/utils/cn';
import { getPriorityColor, getCategoryInfo, getSubCategoryName } from '@/components/shared/constants';
import { TaskDetailCard } from '@/components/desktop/task-detail-card';
import type { CategoryItem } from '@/lib/hooks/use-categories';
import type { Task } from '@/lib/types';
import { Check, Pencil, Archive, Trash2, Bell } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  compact?: boolean;
  showActions?: boolean;
  showDetailCard?: boolean;
  categories?: CategoryItem[];
  onToggleDone?: (id: number) => void;
  onDelete?: (id: number) => void;
  onArchive?: (id: number) => void;
  onEdit?: (id: number) => void;
}

export const TaskItem = memo(function TaskItem({
  task,
  compact = false,
  showActions = true,
  showDetailCard = false,
  categories,
  onToggleDone,
  onDelete,
  onArchive,
  onEdit,
}: TaskItemProps) {
  const priorityColor = getPriorityColor(task.priorityLevel);
  const catInfo = getCategoryInfo(task.cat);
  const subCatName = getSubCategoryName(task.cat, task.subCat, categories);
  const [showDetail, setShowDetail] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (!showDetailCard) return;
    hoverTimeoutRef.current = setTimeout(() => setShowDetail(true), 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowDetail(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          'group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-elevated',
          compact && 'px-1.5 py-1'
        )}
      >
        <div
          className={cn('w-[2px] shrink-0 rounded-full', compact ? 'h-4' : 'h-5')}
          style={{ backgroundColor: priorityColor }}
        />

        <button
          onClick={() => onToggleDone?.(task.id)}
          className={cn(
            'flex shrink-0 items-center justify-center rounded border transition-colors',
            compact ? 'h-3 w-3' : 'h-3.5 w-3.5',
            task.done
              ? 'border-priority-normal bg-priority-normal'
              : 'border-text-muted bg-transparent'
          )}
        >
          {task.done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'truncate',
                compact ? 'text-[10px]' : 'text-[12px] font-medium',
                task.done && 'text-text-muted'
              )}
            >
              {task.title}
            </span>
            {subCatName && !compact && (
              <span
                className="shrink-0 rounded px-1 py-0.5 text-[9px] text-white/80"
                style={{ backgroundColor: catInfo?.color ?? '#94A3B8' }}
              >
                {subCatName}
              </span>
            )}
          </div>
          {task.time && (
            <span className={cn('text-text-muted', compact ? 'text-[9px]' : 'text-[10px]')}>
              {task.time}
            </span>
          )}
        </div>

        {task.reminder && (
          <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full gradient-brand">
            <Bell className="h-2.5 w-2.5 text-white" />
          </div>
        )}

        {showActions && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit?.(task.id)}
              className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-bg-card hover:text-text-secondary"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={() => onArchive?.(task.id)}
              className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-bg-card hover:text-text-secondary"
            >
              <Archive className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete?.(task.id)}
              className="flex h-6 w-6 items-center justify-center rounded text-priority-urgent hover:bg-priority-urgent/10"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {showDetailCard && showDetail && (
        <div className="absolute left-0 top-full z-50 mt-1 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150">
          <TaskDetailCard task={task} categories={categories} />
        </div>
      )}
    </div>
  );
});
