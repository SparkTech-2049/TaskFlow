'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { PRIORITIES, CATEGORIES } from '@/lib/constants';
import type { Task } from '@/lib/types';
import { Check, Pencil, Archive, Trash2, Bell } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  compact?: boolean;
  showActions?: boolean;
  onToggleDone?: (id: number) => void;
  onDelete?: (id: number) => void;
  onArchive?: (id: number) => void;
  onEdit?: (id: number) => void;
}

function getPriorityColor(priorityLevel: string): string {
  return PRIORITIES.find((p) => p.id === priorityLevel)?.color ?? '#94A3B8';
}

function getCategoryInfo(cat: string) {
  return CATEGORIES.find((c) => c.id === cat);
}

function getSubCategoryName(cat: string, subCat: string | null): string | null {
  if (!subCat) return null;
  const category = CATEGORIES.find((c) => c.id === cat);
  return category?.subCategories?.find((s) => s.id === subCat)?.name ?? null;
}

export function TaskItem({
  task,
  compact = false,
  showActions = true,
  onToggleDone,
  onDelete,
  onArchive,
  onEdit,
}: TaskItemProps) {
  const [hovered, setHovered] = useState(false);
  const priorityColor = getPriorityColor(task.priorityLevel);
  const catInfo = getCategoryInfo(task.cat);
  const subCatName = getSubCategoryName(task.cat, task.subCat);

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-elevated',
        compact && 'px-1.5 py-1'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 优先级竖条 */}
      <div
        className={cn('w-[2px] shrink-0 rounded-full', compact ? 'h-4' : 'h-5')}
        style={{ backgroundColor: priorityColor }}
      />

      {/* Checkbox */}
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

      {/* Content */}
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

      {/* Reminder badge */}
      {task.reminder && (
        <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full gradient-brand">
          <Bell className="h-2.5 w-2.5 text-white" />
        </div>
      )}

      {/* Action buttons */}
      {showActions && hovered && (
        <div className="flex shrink-0 items-center gap-0.5">
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
  );
}
