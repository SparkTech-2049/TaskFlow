'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Flag, CheckCircle2, Repeat } from 'lucide-react';
import { useCalendar } from '@/lib/hooks/use-calendar';
import { useTaskStore } from '@/lib/stores/task-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { AddTaskSheet } from '@/components/mobile/add-task-sheet';
import { cn } from '@/lib/utils/cn';
import { CAT_NAMES, CAT_BG_CLASSES, CAT_TEXT_CLASSES, SUB_CAT_NAMES, PRIORITY_DOT_CLASSES, WEEKDAYS } from '@/components/shared/constants';

export default function MobileCalendarPage() {
  const {
    calendarDays,
    selectedDate,
    monthLabel,
    goToPrevMonth,
    goToNextMonth,
    selectDate,
  } = useCalendar();

  const { tasks, updateTask, deleteTask, generateMonthlyRepeats } = useTaskStore();
  const { showDone } = useSettingsStore();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    generateMonthlyRepeats(month);
  }, [generateMonthlyRepeats]);

  const activeTasks = useMemo(() => {
    const base = tasks.filter((t) => !t.archived);
    return showDone ? base : base.filter((t) => !t.done);
  }, [tasks, showDone]);

  const taskDateMap = useMemo(() => {
    const map: Record<string, { priority: string }[]> = {};
    activeTasks.forEach((t) => {
      const dates: string[] = [];
      if (t.deadline) dates.push(t.deadline);
      if (t.done && t.completedAt) dates.push(t.completedAt.slice(0, 10));
      dates.forEach((d) => {
        if (!map[d]) map[d] = [];
        map[d].push({ priority: t.priorityLevel });
      });
    });
    return map;
  }, [activeTasks]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return activeTasks.filter((t) => {
      if (t.longterm && !t.done) return true;
      if (t.done && t.completedAt && t.completedAt.slice(0, 10) === selectedDate) return true;
      if (t.deadline === selectedDate) return true;
      if (t.startDate && t.endDate && t.startDate <= selectedDate && t.endDate >= selectedDate) return true;
      return false;
    });
  }, [activeTasks, selectedDate]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof selectedDateTasks> = {};
    selectedDateTasks.forEach((t) => {
      const key = t.subCat ?? t.cat;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [selectedDateTasks]);

  const weekDays = useMemo(() => {
    if (!selectedDate) return calendarDays;
    const dayOfWeek = new Date(selectedDate).getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(selectedDate);
    monday.setDate(monday.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      return {
        date: d,
        day: d.getDate(),
        dateString: ds,
        isCurrentMonth: d.getMonth() === new Date(selectedDate).getMonth(),
        isToday: ds === today,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isSunday: d.getDay() === 0,
        isSaturday: d.getDay() === 6,
      };
    });
  }, [calendarDays, selectedDate]);

  const displayDays = viewMode === 'week' ? weekDays : calendarDays;

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-3 pt-3 pb-20 space-y-3">
        {/* View Mode Toggle + Month Nav */}
        <div className="glass-panel p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
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
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  'h-7 px-3 rounded-lg text-[10px] font-medium transition-colors',
                  viewMode === 'month' ? 'bg-accent-blue text-white' : 'bg-bg-elevated text-text-secondary'
                )}
              >
                月
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  'h-7 px-3 rounded-lg text-[10px] font-medium transition-colors',
                  viewMode === 'week' ? 'bg-accent-blue text-white' : 'bg-bg-elevated text-text-secondary'
                )}
              >
                周
              </button>
            </div>
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
          <div className={cn('grid grid-cols-7', viewMode === 'month' ? 'gap-y-0.5' : 'gap-y-1')}>
            {displayDays.map((day) => {
              const dayTasks = taskDateMap[day.dateString] || [];
              const isSelected = selectedDate === day.dateString;
              const taskCount = dayTasks.length;

              return (
                <button
                  key={day.dateString}
                  onClick={() => selectDate(day.dateString)}
                  className={cn(
                    'relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all',
                    !day.isCurrentMonth && viewMode === 'month' && 'opacity-30',
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
                  {day.isCurrentMonth && day.isToday && (
                    <span className="mt-0.5 h-1 w-3 rounded-full gradient-brand" />
                  )}
                  {day.isCurrentMonth && !day.isToday && taskCount > 0 && (
                    <div className="mt-0.5 flex gap-0.5 justify-center">
                      {dayTasks.slice(0, 3).map((t, i) => (
                        <span
                          key={i}
                          className={cn(
                            'h-1 w-1 rounded-full',
                            PRIORITY_DOT_CLASSES[t.priority] || 'bg-priority-normal'
                          )}
                        />
                      ))}
                    </div>
                  )}
                  {viewMode === 'week' && taskCount > 0 && (
                    <span className="text-[8px] text-text-muted leading-none mt-0.5">
                      {taskCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="flex justify-center mt-2">
            <button
              onClick={() => selectDate(todayStr)}
              className="text-[10px] text-accent-blue font-medium px-3 py-1 rounded-lg bg-accent-blue/5 active:bg-accent-blue/10 transition-colors"
            >
              回到今天
            </button>
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
                {selectedDateTasks.length} 项任务
              </span>
            </div>

            {selectedDateTasks.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <p className="text-xs text-text-muted">暂无任务</p>
                <button
                  onClick={() => setAddSheetOpen(true)}
                  className="text-[10px] text-accent-blue font-medium px-3 py-1.5 rounded-lg bg-accent-blue/5 active:bg-accent-blue/10 transition-colors"
                >
                  添加任务
                </button>
              </div>
            ) : (
              Object.entries(groupedTasks).map(([cat, catTasks]) => (
                <div key={cat}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={cn('h-2 w-2 rounded-full', CAT_BG_CLASSES[catTasks[0]?.cat] || 'bg-accent-blue')} />
                    <span className={cn('text-[10px] font-medium', CAT_TEXT_CLASSES[catTasks[0]?.cat] || 'text-accent-blue')}>
                      {CAT_NAMES[catTasks[0]?.cat] || cat}
                      {catTasks[0]?.subCat && catTasks[0]?.cat === 'other' && ` > ${SUB_CAT_NAMES[catTasks[0].subCat] || catTasks[0].subCat}`}
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
                        <button
                          onClick={() => updateTask(task.id, { done: !task.done })}
                          className={cn(
                            'flex shrink-0 h-4 w-4 items-center justify-center rounded border transition-colors',
                            task.done ? 'border-priority-normal bg-priority-normal' : 'border-text-muted bg-transparent'
                          )}
                        >
                          {task.done && <CheckCircle2 size={10} className="text-white" />}
                        </button>
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            PRIORITY_DOT_CLASSES[task.priorityLevel] || 'bg-priority-normal'
                          )}
                        />
                        <span
                          className={cn(
                            'flex-1 text-xs text-text-primary truncate',
                            task.done && 'text-text-muted'
                          )}
                        >
                          {task.title}
                          {task.monthlyRepeat && <Repeat size={10} className="inline ml-1 text-accent-indigo" />}
                          {task.repeatSourceId && <Repeat size={10} className="inline ml-1 text-accent-indigo/60" />}
                        </span>
                        {task.time && (
                          <span className="flex items-center gap-0.5 text-[10px] text-text-muted shrink-0">
                            <Clock size={10} />
                            {task.time}
                          </span>
                        )}
                        {!task.done && (
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-text-muted hover:text-priority-urgent shrink-0"
                          >
                            <Flag size={12} />
                          </button>
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

      <AddTaskSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} />
    </div>
  );
}
