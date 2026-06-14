'use client';

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTaskStore } from '@/lib/stores/task-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { CATEGORIES, CROSS_MONTH_COLORS } from '@/lib/constants';
import { MonthPicker } from '@/components/desktop/month-picker';
import { TaskItem } from '@/components/desktop/task-item';
import { AddTaskModal } from '@/components/desktop/add-task-modal';
import { getCrossMonthType, getOverdueDays, getCrossPeriodProgress } from '@/lib/utils/cross-month';
import type { Task } from '@/lib/types';

type FilterType = 'all' | 'pending' | 'done';
type ViewMode = 'month' | 'all';

export default function DesktopListPage() {
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  const { showDone, defaultSort } = useSettingsStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());



  const activeTasks = useMemo(() => {
    const base = tasks.filter((t) => !t.archived);
    return showDone ? base : base.filter((t) => !t.done);
  }, [tasks, showDone]);

  // Cross-month classification
  const currentMonthDate = useMemo(() => new Date(year, month, 1), [year, month]);

  const overdueTasks = useMemo(
    () => activeTasks.filter((t) => !t.done && getCrossMonthType({ longterm: t.longterm, done: t.done, deadline: t.deadline, startDate: t.startDate, endDate: t.endDate }, currentMonthDate) === 'overdue'),
    [activeTasks, currentMonthDate]
  );

  const longtermTasks = useMemo(
    () => activeTasks.filter((t) => !t.done && t.longterm),
    [activeTasks]
  );

  const crossPeriodTasks = useMemo(
    () => activeTasks.filter((t) => !t.done && getCrossMonthType({ longterm: t.longterm, done: t.done, deadline: t.deadline, startDate: t.startDate, endDate: t.endDate }, currentMonthDate) === 'cross_period'),
    [activeTasks, currentMonthDate]
  );

  const normalTasks = useMemo(() => {
    if (viewMode === 'all') {
      return activeTasks.filter((t) => {
        if (t.longterm && !t.done) return false;
        if (overdueTasks.includes(t)) return false;
        if (crossPeriodTasks.includes(t)) return false;
        return true;
      });
    }
    const monthStart = new Date(year, month, 1).toISOString().slice(0, 10);
    const monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    return activeTasks.filter((t) => {
      if (t.longterm && !t.done) return false;
      if (overdueTasks.includes(t)) return false;
      if (crossPeriodTasks.includes(t)) return false;
      if (t.done && t.completedAt) {
        const completedDate = t.completedAt.slice(0, 10);
        return completedDate >= monthStart && completedDate <= monthEnd;
      }
      if (!t.deadline) return true;
      if (t.deadline >= monthStart && t.deadline <= monthEnd) return true;
      return false;
    });
  }, [activeTasks, viewMode, year, month, overdueTasks, crossPeriodTasks]);

  const sortByPriority = (list: Task[]) => [...list].sort((a, b) => {
    const order: Record<string, number> = { urgent_important: 0, important: 1, urgent: 2, normal: 3 };
    const pa = order[a.priorityLevel] ?? 3;
    const pb = order[b.priorityLevel] ?? 3;
    if (defaultSort === 'priority' && pa !== pb) return pa - pb;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const applyFilter = (list: Task[]) => {
    let filtered = list;
    if (filter === 'pending') filtered = filtered.filter((t) => !t.done);
    if (filter === 'done') filtered = filtered.filter((t) => t.done);
    return sortByPriority(filtered);
  };

  const overdueSorted = useMemo(() => applyFilter(overdueTasks), [overdueTasks, defaultSort, filter]);
  const longtermSorted = useMemo(() => applyFilter(longtermTasks), [longtermTasks, defaultSort, filter]);
  const crossPeriodSorted = useMemo(() => applyFilter(crossPeriodTasks), [crossPeriodTasks, defaultSort, filter]);

  // Group normal tasks by category
  const groupedByCat = useMemo(() => {
    const groups: { catId: string; catName: string; color: string; tasks: Task[] }[] = [];
    const filtered = applyFilter(normalTasks);
    const matched = new Set<number>();
    for (const cat of CATEGORIES) {
      const catTasks = filtered.filter((t) => t.cat === cat.id);
      if (catTasks.length > 0) {
        groups.push({ catId: cat.id, catName: cat.name, color: cat.color, tasks: catTasks });
        catTasks.forEach((t) => matched.add(t.id));
      }
    }
    const unmatched = filtered.filter((t) => !matched.has(t.id));
    if (unmatched.length > 0) {
      groups.push({ catId: '_other', catName: '其他', color: '#94A3B8', tasks: unmatched });
    }
    return groups;
  }, [normalTasks, filter]);

  function handleAddTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'completedAt' | 'parentId'>) {
    addTask({ ...data, id: Date.now(), parentId: null, archivedAt: null, completedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  const filterItems: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待完成' },
    { key: 'done', label: '已完成' },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border-micro px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-lg bg-bg-elevated p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'rounded-md px-3 py-1 text-[12px] transition-all',
                viewMode === 'month'
                  ? 'bg-accent-indigo font-medium text-white'
                  : 'font-normal text-text-secondary hover:text-text-primary'
              )}
            >
              本月
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={cn(
                'rounded-md px-3 py-1 text-[12px] transition-all',
                viewMode === 'all'
                  ? 'bg-accent-indigo font-medium text-white'
                  : 'font-normal text-text-secondary hover:text-text-primary'
              )}
            >
              所有月份
            </button>
          </div>
          {viewMode === 'month' && <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />}
          <div className="flex items-center gap-1 rounded-lg bg-bg-elevated p-0.5">
            {filterItems.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-md px-3 py-1 text-[12px] transition-all',
                  filter === f.key
                    ? 'bg-accent-blue font-medium text-white'
                    : 'font-normal text-text-secondary hover:text-text-primary'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> 添加任务
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-4">
          {/* Overdue */}
          {overdueSorted.length > 0 && (
            <div
              className="rounded-2xl border p-4"
              style={{ backgroundColor: CROSS_MONTH_COLORS.overdue.bg, borderColor: CROSS_MONTH_COLORS.overdue.border }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: CROSS_MONTH_COLORS.overdue.text }}>
                    {CROSS_MONTH_COLORS.overdue.label}
                  </span>
                  <span className="text-[12px] text-text-muted">{overdueSorted.length}项</span>
                </div>
                <button
                  onClick={() => overdueSorted.forEach((t) => updateTask(t.id, { archived: true, archivedAt: new Date().toISOString() }))}
                  className="rounded-lg border border-[#E53E3E30] px-3 py-1 text-[11px] font-medium text-priority-urgent hover:bg-[#E53E3E10]"
                >
                  全部归档
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {overdueSorted.map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <TaskItem task={task} onToggleDone={(id) => updateTask(id, { done: !tasks.find(t => t.id === id)?.done })} onDelete={(id) => deleteTask(id)} onArchive={(id) => updateTask(id, { archived: true, archivedAt: new Date().toISOString() })} onEdit={(id) => setEditingTask(tasks.find(t => t.id === id) ?? null)} />
                    {task.deadline && (
                      <span className="shrink-0 text-[10px] text-priority-urgent">
                        逾期{getOverdueDays(task.deadline)}天
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Longterm */}
          {longtermSorted.length > 0 && (
            <div
              className="rounded-2xl border p-4"
              style={{ backgroundColor: CROSS_MONTH_COLORS.longterm.bg, borderColor: CROSS_MONTH_COLORS.longterm.border }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: CROSS_MONTH_COLORS.longterm.text }}>
                  {CROSS_MONTH_COLORS.longterm.label}
                </span>
                <span className="text-[12px] text-text-muted">{longtermSorted.length}项</span>
                <span className="text-[11px] text-text-muted">无截止日期，始终显示</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {longtermSorted.map((task) => (
                  <TaskItem key={task.id} task={task} onToggleDone={(id) => updateTask(id, { done: !tasks.find(t => t.id === id)?.done })} onDelete={(id) => deleteTask(id)} onArchive={(id) => updateTask(id, { archived: true, archivedAt: new Date().toISOString() })} onEdit={(id) => setEditingTask(tasks.find(t => t.id === id) ?? null)} />
                ))}
              </div>
            </div>
          )}

          {/* Cross period */}
          {crossPeriodSorted.length > 0 && (
            <div
              className="rounded-2xl border p-4"
              style={{ backgroundColor: CROSS_MONTH_COLORS.cross_period.bg, borderColor: CROSS_MONTH_COLORS.cross_period.border }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: CROSS_MONTH_COLORS.cross_period.text }}>
                  {CROSS_MONTH_COLORS.cross_period.label}
                </span>
                <span className="text-[12px] text-text-muted">{crossPeriodSorted.length}项</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {crossPeriodSorted.map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <TaskItem task={task} onToggleDone={(id) => updateTask(id, { done: !tasks.find(t => t.id === id)?.done })} onDelete={(id) => deleteTask(id)} onArchive={(id) => updateTask(id, { archived: true, archivedAt: new Date().toISOString() })} onEdit={(id) => setEditingTask(tasks.find(t => t.id === id) ?? null)} />
                    {task.startDate && task.endDate && (
                      <span className="shrink-0 text-[10px] text-accent-blue">
                        {task.startDate.slice(5).replace('-', '/')}→{task.endDate.slice(5).replace('-', '/')} {getCrossPeriodProgress(task.startDate, task.endDate)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Normal tasks by category */}
          {groupedByCat.map((group) => (
            <div key={group.catId} className="glass-panel p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                <span className="text-sm font-medium text-text-primary">{group.catName}</span>
                <span className="text-[12px] text-text-muted">{group.tasks.length}项</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {group.tasks.map((task) => (
                  <TaskItem key={task.id} task={task} onToggleDone={(id) => updateTask(id, { done: !tasks.find(t => t.id === id)?.done })} onDelete={(id) => deleteTask(id)} onArchive={(id) => updateTask(id, { archived: true, archivedAt: new Date().toISOString() })} onEdit={(id) => setEditingTask(tasks.find(t => t.id === id) ?? null)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddTaskModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddTask} />
      <AddTaskModal open={!!editingTask} onClose={() => setEditingTask(null)} onAdd={handleAddTask} editTask={editingTask} onEdit={(id, updates) => { updateTask(id, updates); setEditingTask(null); }} />
    </div>
  );
}
