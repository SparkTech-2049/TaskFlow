'use client';

import { useState, useMemo } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTaskStore } from '@/lib/stores/task-store';
import { getPriorityColor, getCategoryInfo } from '@/components/shared/constants';
import { MonthPicker } from '@/components/desktop/month-picker';
import type { Task } from '@/lib/types';

type CatFilter = '' | 'project' | 'other' | 'credit' | 'study';

export default function DesktopArchivePage() {
  const { tasks, updateTask, deleteTask } = useTaskStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [catFilter, setCatFilter] = useState<CatFilter>('');



  const archivedTasks = useMemo(() => tasks.filter((t) => t.archived), [tasks]);

  const filteredArchived = useMemo(() => {
    let result = archivedTasks;
    if (catFilter) result = result.filter((t) => t.cat === catFilter);
    return result;
  }, [archivedTasks, catFilter]);

  // Group by archived month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const task of filteredArchived) {
      const key = task.archivedAt ? task.archivedAt.slice(0, 7) : 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredArchived]);

  const catFilters: { key: CatFilter; label: string }[] = [
    { key: '', label: '全部' },
    { key: 'project', label: '工作' },
    { key: 'other', label: '琐事' },
    { key: 'credit', label: '理财' },
    { key: 'study', label: '学习' },
  ];

  function formatMonth(key: string): string {
    if (key === 'unknown') return '未知时间';
    const [y, m] = key.split('-');
    return `${y}年${parseInt(m)}月`;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border-micro px-6 py-3">
        <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        <div className="flex items-center gap-1">
          {catFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setCatFilter(f.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[12px] transition-all',
                catFilter === f.key
                  ? 'bg-accent-blue font-medium text-white'
                  : 'bg-bg-elevated font-normal text-text-secondary hover:text-text-primary'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {groupedByMonth.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-text-muted">暂无归档任务</div>
        ) : (
          <div className="flex flex-col gap-6">
            {groupedByMonth.map(([monthKey, monthTasks]) => (
              <div key={monthKey}>
                <h3 className="mb-3 text-sm font-semibold text-text-primary">{formatMonth(monthKey)}</h3>
                <div className="flex flex-col gap-2">
                  {monthTasks.map((task) => {
                    const catInfo = getCategoryInfo(task.cat);
                    const priorityColor = getPriorityColor(task.priorityLevel);
                    return (
                      <div
                        key={task.id}
                        className="glass-panel flex items-center gap-3 px-4 py-3"
                      >
                        <div className="w-[2px] h-5 shrink-0 rounded-full" style={{ backgroundColor: priorityColor }} />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[13px] text-text-muted">{task.title}</span>
                          <div className="flex items-center gap-2 text-[11px] text-text-muted">
                            <span className="rounded px-1 py-0.5 text-white/80" style={{ backgroundColor: catInfo?.color ?? '#94A3B8' }}>{catInfo?.name ?? task.cat}</span>
                            {task.deadline && <span>截止 {task.deadline}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateTask(task.id, { archived: false, archivedAt: null })}
                            className="flex h-7 items-center gap-1 rounded-lg border border-border-micro px-2 text-[11px] text-accent-blue hover:bg-accent-blue/10"
                          >
                            <RotateCcw className="h-3 w-3" /> 激活
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="flex h-7 items-center gap-1 rounded-lg border border-[#E53E3E30] px-2 text-[11px] text-priority-urgent hover:bg-priority-urgent/10"
                          >
                            <Trash2 className="h-3 w-3" /> 删除
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
