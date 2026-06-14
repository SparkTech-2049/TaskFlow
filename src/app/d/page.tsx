'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useCalendar } from '@/lib/hooks/use-calendar';
import { useTaskStore } from '@/lib/stores/task-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { getPriorityColor, getCategoryInfo, getSubCategoryName, WEEKDAYS } from '@/components/shared/constants';
import { StatCards } from '@/components/desktop/stat-cards';
import { TaskItem } from '@/components/desktop/task-item';
import { AddTaskModal } from '@/components/desktop/add-task-modal';
import type { Task } from '@/lib/types';

function HomeContent() {
  const searchParams = useSearchParams();
  const catFilter = searchParams.get('cat') ?? '';
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  const { showDone } = useSettingsStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const {
    currentYear,
    currentMonth,
    calendarDays,
    selectedDate,
    monthLabel,
    goToPrevMonth,
    goToNextMonth,
    selectDate,
  } = useCalendar();



  const activeTasks = useMemo(() => {
    const base = tasks.filter((t) => !t.archived);
    return showDone ? base : base.filter((t) => !t.done);
  }, [tasks, showDone]);
  const filteredTasks = useMemo(
    () => (catFilter ? activeTasks.filter((t) => t.cat === catFilter) : activeTasks),
    [activeTasks, catFilter]
  );

  const stats = useMemo(() => ({
    total: filteredTasks.length,
    pending: filteredTasks.filter((t) => !t.done).length,
    done: filteredTasks.filter((t) => t.done).length,
    urgent: filteredTasks.filter((t) => t.priorityLevel === 'urgent_important' && !t.done).length,
  }), [filteredTasks]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return filteredTasks.filter((t) => {
      if (t.longterm && !t.done) return true;
      if (t.done && t.completedAt && t.completedAt.slice(0, 10) === selectedDate) return true;
      if (t.deadline === selectedDate) return true;
      if (t.startDate && t.endDate && t.startDate <= selectedDate && t.endDate >= selectedDate) return true;
      return false;
    });
  }, [selectedDate, filteredTasks]);

  const groupedTasks = useMemo(() => {
    const catOrder = ['project', 'other', 'credit', 'study'];
    const groups: { catId: string; catName: string; catColor: string; subGroups: { key: string; label: string; tasks: Task[] }[] }[] = [];
    const byCat: Record<string, Task[]> = {};
    for (const task of selectedDateTasks) {
      if (!byCat[task.cat]) byCat[task.cat] = [];
      byCat[task.cat].push(task);
    }
    const allCats = [...catOrder.filter((c) => byCat[c]), ...Object.keys(byCat).filter((c) => !catOrder.includes(c))];
    for (const catId of allCats) {
      const catTasks = byCat[catId];
      if (!catTasks?.length) continue;
      const catInfo = getCategoryInfo(catId);
      const catName = catInfo?.name ?? catId;
      const catColor = catInfo?.color ?? '#94A3B8';
      const subByCat: Record<string, Task[]> = {};
      const noSubCat: Task[] = [];
      for (const t of catTasks) {
        if (t.subCat) {
          if (!subByCat[t.subCat]) subByCat[t.subCat] = [];
          subByCat[t.subCat].push(t);
        } else {
          noSubCat.push(t);
        }
      }
      const subGroups: { key: string; label: string; tasks: Task[] }[] = [];
      if (noSubCat.length > 0) {
        subGroups.push({ key: catId, label: catName, tasks: noSubCat });
      }
      for (const [sc, tasks] of Object.entries(subByCat)) {
        const subCatName = getSubCategoryName(catId, sc) ?? sc;
        subGroups.push({ key: sc, label: `${catName} > ${subCatName}`, tasks });
      }
      groups.push({ catId, catName, catColor, subGroups });
    }
    return groups;
  }, [selectedDateTasks]);

  const taskDateMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const t of filteredTasks) {
      if (t.done) continue;
      if (t.deadline) {
        if (!map[t.deadline]) map[t.deadline] = [];
        map[t.deadline].push(getPriorityColor(t.priorityLevel));
      }
    }
    return map;
  }, [filteredTasks]);

  const weekDays = WEEKDAYS;

  function handleAddTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'completedAt' | 'parentId'>) {
    addTask({ ...data, id: Date.now(), parentId: null, archivedAt: null, completedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-1 min-h-0 flex-col gap-4 p-6">
        <StatCards total={stats.total} pending={stats.pending} done={stats.done} urgent={stats.urgent} />

        <div className="glass-panel flex min-h-0 flex-1 flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={goToPrevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-elevated">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-base font-semibold text-text-primary">{monthLabel}</h2>
              <button onClick={goToNextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-elevated">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => selectDate(new Date().toISOString().slice(0, 10))}
              className="rounded-lg border border-border-micro px-3 py-1 text-xs text-text-secondary hover:bg-bg-elevated"
            >
              今天
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {weekDays.map((d) => (
              <div key={d} className="flex items-center justify-center py-1 text-[11px] font-medium text-text-muted">{d}</div>
            ))}
          </div>

          <div className="grid flex-1 grid-cols-7 grid-rows-6 gap-0.5">
            {calendarDays.map((day) => {
              const dots = taskDateMap[day.dateString] ?? [];
              const isSelected = selectedDate === day.dateString;
              return (
                <button
                  key={day.dateString}
                  onClick={() => selectDate(day.dateString)}
                  className={cn(
                    'relative flex flex-col items-center justify-center rounded-lg text-sm transition-all',
                    !day.isCurrentMonth && 'text-text-muted opacity-50',
                    day.isCurrentMonth && day.isWeekend && 'text-priority-urgent',
                    day.isToday && 'font-bold',
                    isSelected
                      ? 'bg-accent-blue text-white'
                      : day.isToday
                        ? 'bg-accent-blue/10 text-accent-blue font-bold'
                        : 'hover:bg-bg-elevated text-text-primary'
                  )}
                >
                  <span className={cn(day.isToday && !isSelected && 'text-accent-blue font-bold')}>
                    {day.day}
                  </span>
                  {dots.length > 0 && !isSelected && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {dots.slice(0, 3).map((c, i) => (
                        <div key={i} className="h-1 w-1 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex w-[360px] shrink-0 flex-col border-l border-border-micro">
        <div className="flex items-center justify-between border-b border-border-micro px-4 py-3">
          <h3 className="text-sm font-medium text-text-primary">
            {selectedDate ? `${selectedDate.slice(5).replace('-', '/')} 任务` : '选择日期查看任务'}
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {selectedDate ? (
            groupedTasks.length > 0 ? (
              <div className="flex flex-col gap-3">
                {groupedTasks.map((group) => (
                  <div key={group.catId}>
                    <div className="mb-1 flex items-center gap-2 px-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.catColor }} />
                      <span className="text-[12px] font-semibold text-text-primary">{group.catName}</span>
                      <span className="text-[11px] text-text-muted">{group.subGroups.reduce((s, g) => s + g.tasks.length, 0)}项</span>
                    </div>
                    {group.subGroups.map((sg) => (
                      <div key={sg.key} className="mb-1">
                        {sg.label !== group.catName && (
                          <div className="mb-0.5 flex items-center gap-1.5 pl-5">
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: group.catColor, opacity: 0.6 }} />
                            <span className="text-[11px] font-medium text-text-secondary">{sg.label}</span>
                          </div>
                        )}
                        <div className={sg.label !== group.catName ? 'pl-5' : ''}>
                          {sg.tasks.map((task) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              onToggleDone={(id) => updateTask(id, { done: !tasks.find(t => t.id === id)?.done })}
                              onDelete={(id) => deleteTask(id)}
                              onArchive={(id) => updateTask(id, { archived: true, archivedAt: new Date().toISOString() })}
                              onEdit={(id) => setEditingTask(tasks.find(t => t.id === id) ?? null)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-text-muted">当日暂无任务</div>
            )
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-text-muted">点击日历日期查看任务</div>
          )}
        </div>
      </div>

      <AddTaskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTask}
      />

      <AddTaskModal
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onAdd={handleAddTask}
        editTask={editingTask}
        onEdit={(id, updates) => { updateTask(id, updates); setEditingTask(null); }}
      />
    </div>
  );
}

export default function DesktopHomePage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-text-muted">加载中...</div>}>
      <HomeContent />
    </Suspense>
  );
}
