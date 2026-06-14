'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Flag, CheckCircle2, AlertTriangle, ListTodo } from 'lucide-react';
import { useCalendar } from '@/lib/hooks/use-calendar';
import { useTaskStore } from '@/lib/stores/task-store';
import { AddTaskSheet } from '@/components/mobile/add-task-sheet';
import { cn } from '@/lib/utils/cn';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const CAT_NAMES: Record<string, string> = {
  project: '工作',
  other: '琐事',
  credit: '理财',
  study: '学习',
};

const CAT_COLORS: Record<string, string> = {
  project: 'bg-cat-project',
  other: 'bg-cat-other',
  credit: 'bg-cat-credit',
  study: 'bg-cat-study',
};

const CAT_TEXT_COLORS: Record<string, string> = {
  project: 'text-cat-project',
  other: 'text-cat-other',
  credit: 'text-cat-credit',
  study: 'text-cat-study',
};

const PRIORITY_DOT_COLORS: Record<string, string> = {
  urgent_important: 'bg-priority-urgent',
  important: 'bg-priority-important',
  urgent: 'bg-accent-blue',
  normal: 'bg-priority-normal',
};

export default function MobileHomePage() {
  const {
    calendarDays,
    selectedDate,
    monthLabel,
    goToPrevMonth,
    goToNextMonth,
    selectDate,
  } = useCalendar();

  const { tasks } = useTaskStore();
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const active = tasks.filter((t) => !t.archived);
    return {
      total: active.length,
      pending: active.filter((t) => !t.done).length,
      done: active.filter((t) => t.done).length,
      urgent: active.filter((t) => t.priorityLevel === 'urgent_important' && !t.done).length,
    };
  }, [tasks]);

  // Task dots per date
  const taskDateMap = useMemo(() => {
    const map: Record<string, { priority: string }[]> = {};
    tasks
      .filter((t) => !t.archived && t.deadline)
      .forEach((t) => {
        if (!map[t.deadline!]) map[t.deadline!] = [];
        map[t.deadline!].push({ priority: t.priorityLevel });
      });
    return map;
  }, [tasks]);

  // Tasks for selected date
  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => !t.archived && t.deadline === selectedDate);
  }, [tasks, selectedDate]);

  // Group tasks by category
  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof selectedTasks> = {};
    selectedTasks.forEach((t) => {
      if (!groups[t.cat]) groups[t.cat] = [];
      groups[t.cat].push(t);
    });
    return groups;
  }, [selectedTasks]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-3 pt-3 pb-20 space-y-3">
        {/* Stats Bar */}
        <div className="glass-panel p-3">
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-bg-elevated p-2.5 text-center">
              <div className="text-lg font-bold text-accent-blue">{stats.total}</div>
              <div className="text-[10px] text-text-secondary">总任务</div>
            </div>
            <div className="flex-1 rounded-xl bg-bg-elevated p-2.5 text-center">
              <div className="text-lg font-bold text-accent-indigo">{stats.pending}</div>
              <div className="text-[10px] text-text-secondary">待完成</div>
            </div>
            <div className="flex-1 rounded-xl bg-bg-elevated p-2.5 text-center">
              <div className="text-lg font-bold text-priority-normal">{stats.done}</div>
              <div className="text-[10px] text-text-secondary">已完成</div>
            </div>
            <div className="flex-1 rounded-xl bg-bg-elevated p-2.5 text-center">
              <div className="text-lg font-bold text-priority-urgent">{stats.urgent}</div>
              <div className="text-[10px] text-text-secondary">紧急</div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="glass-panel p-3">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goToPrevMonth}
              className="h-8 w-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-secondary active:bg-bg-surface transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-text-primary">{monthLabel}</span>
            <button
              onClick={goToNextMonth}
              className="h-8 w-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-secondary active:bg-bg-surface transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((wd, i) => (
              <div
                key={wd}
                className={cn(
                  'text-center text-[10px] font-medium py-1',
                  i >= 5 ? 'text-priority-urgent/70' : 'text-text-muted'
                )}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {calendarDays.map((day) => {
              const dayTasks = taskDateMap[day.dateString] || [];
              const isSelected = selectedDate === day.dateString;

              return (
                <button
                  key={day.dateString}
                  onClick={() => selectDate(day.dateString)}
                  className={cn(
                    'relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all',
                    !day.isCurrentMonth && 'opacity-30',
                    day.isCurrentMonth && day.isToday && !isSelected && 'bg-accent-blue/10',
                    day.isCurrentMonth && !day.isToday && !isSelected && 'hover:bg-bg-elevated',
                    isSelected && 'ring-2 ring-accent-blue bg-accent-blue/15',
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-medium leading-none',
                      day.isToday && 'font-bold',
                      day.isCurrentMonth && day.isToday && 'text-accent-blue',
                      day.isCurrentMonth && !day.isToday && day.isSunday && 'text-priority-urgent/80',
                      day.isCurrentMonth && !day.isToday && day.isSaturday && 'text-priority-urgent/60',
                      day.isCurrentMonth && !day.isToday && !day.isWeekend && 'text-text-primary',
                      isSelected && !day.isToday && 'text-accent-blue',
                    )}
                  >
                    {day.day}
                  </span>
                  {/* Today gradient dot */}
                  {day.isCurrentMonth && day.isToday && (
                    <span className="mt-0.5 h-1 w-3 rounded-full gradient-brand" />
                  )}
                  {/* Task dots */}
                  {day.isCurrentMonth && !day.isToday && dayTasks.length > 0 && (
                    <div className="mt-0.5 flex gap-0.5 justify-center">
                      {dayTasks.slice(0, 3).map((t, i) => (
                        <span
                          key={i}
                          className={cn(
                            'h-1 w-1 rounded-full',
                            PRIORITY_DOT_COLORS[t.priority] || 'bg-priority-normal'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task Panel for Selected Date */}
        {selectedDate && (
          <div className="glass-panel p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                {selectedDate.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1年$2月$3日')}
              </h3>
              <span className="text-[10px] text-text-muted">
                {selectedTasks.length} 项任务
              </span>
            </div>

            {selectedTasks.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">暂无任务</p>
            ) : (
              Object.entries(groupedTasks).map(([cat, catTasks]) => (
                <div key={cat}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={cn('h-2 w-2 rounded-full', CAT_COLORS[cat] || 'bg-accent-blue')} />
                    <span className={cn('text-[10px] font-medium', CAT_TEXT_COLORS[cat] || 'text-accent-blue')}>
                      {CAT_NAMES[cat] || cat}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {catTasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center gap-2 rounded-xl px-3 py-2 bg-bg-elevated',
                          task.done && 'opacity-50'
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            PRIORITY_DOT_COLORS[task.priorityLevel] || 'bg-priority-normal'
                          )}
                        />
                        <span
                          className={cn(
                            'flex-1 text-xs text-text-primary truncate',
                            task.done && 'text-text-muted'
                          )}
                        >
                          {task.title}
                        </span>
                        {task.time && (
                          <span className="flex items-center gap-0.5 text-[10px] text-text-muted shrink-0">
                            <Clock size={10} />
                            {task.time}
                          </span>
                        )}
                        {task.done ? (
                          <CheckCircle2 size={12} className="text-priority-normal shrink-0" />
                        ) : (
                          <Flag size={12} className="text-text-muted shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Task FAB */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-[390px] mx-auto pointer-events-auto">
          <button
            onClick={() => setAddSheetOpen(true)}
            className="w-full gradient-brand text-white text-sm font-semibold py-3 rounded-2xl shadow-lg shadow-accent-blue/20 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
          >
            <Plus size={16} />
            添加任务
          </button>
        </div>
      </div>

      {/* Add Task Sheet */}
      <AddTaskSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} />
    </div>
  );
}
