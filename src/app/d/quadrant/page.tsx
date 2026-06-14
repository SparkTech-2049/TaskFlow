'use client';

import { useState, useMemo } from 'react';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTaskStore } from '@/lib/stores/task-store';
import { QUADRANT_COLORS, CROSS_MONTH_COLORS, PRIORITIES } from '@/lib/constants';
import { MonthPicker } from '@/components/desktop/month-picker';
import { TaskItem } from '@/components/desktop/task-item';
import { getCrossMonthType, getOverdueDays, getCrossPeriodProgress } from '@/lib/utils/cross-month';
import type { Task } from '@/lib/types';

type QuadrantKey = 'urgent_important' | 'important' | 'urgent' | 'normal';

const quadrantOrder: QuadrantKey[] = ['urgent_important', 'important', 'urgent', 'normal'];

const legendItems = [
  { key: 'overdue', label: '逾期', color: CROSS_MONTH_COLORS.overdue.text },
  { key: 'longterm', label: '长期', color: CROSS_MONTH_COLORS.longterm.text },
  { key: 'cross_period', label: '跨期', color: CROSS_MONTH_COLORS.cross_period.text },
];

function DraggableTask({ task, onToggleDone }: { task: Task; onToggleDone: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `task-${task.id}` });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={cn('flex items-center gap-1 cursor-grab active:cursor-grabbing', isDragging && 'opacity-30')}>
      <GripVertical className="h-3 w-3 shrink-0 text-text-muted" />
      <TaskItem task={task} showActions={false} onToggleDone={onToggleDone} />
    </div>
  );
}

function DroppableQuadrant({ quadrantKey, children }: { quadrantKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrantKey });
  const colors = QUADRANT_COLORS[quadrantKey];
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-h-0 overflow-hidden rounded-2xl border p-3 transition-all',
        isOver && 'ring-2 ring-offset-1'
      )}
      style={{
        backgroundColor: colors.bg,
        borderColor: isOver ? colors.title : colors.border,
        ...(isOver ? { ringColor: colors.title, boxShadow: `0 0 16px ${colors.title}30` } : {}),
      }}
    >
      {children}
    </div>
  );
}

export default function DesktopQuadrantPage() {
  const { tasks, setTasks, updateTask, deleteTask } = useTaskStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );



  const activeTasks = useMemo(() => tasks.filter((t) => !t.archived && !t.done), [tasks]);
  const currentMonthDate = useMemo(() => new Date(year, month, 1), [year, month]);

  const quadrants = useMemo(() => {
    const result: Record<QuadrantKey, { overdue: Task[]; longterm: Task[]; crossPeriod: Task[]; normal: Task[] }> = {
      urgent_important: { overdue: [], longterm: [], crossPeriod: [], normal: [] },
      important: { overdue: [], longterm: [], crossPeriod: [], normal: [] },
      urgent: { overdue: [], longterm: [], crossPeriod: [], normal: [] },
      normal: { overdue: [], longterm: [], crossPeriod: [], normal: [] },
    };

    for (const task of activeTasks) {
      const qKey = (task.priorityLevel && result[task.priorityLevel as QuadrantKey])
        ? task.priorityLevel as QuadrantKey
        : 'normal';

      const cmType = getCrossMonthType(
        { longterm: task.longterm, done: task.done, deadline: task.deadline, start_date: task.startDate, end_date: task.endDate },
        currentMonthDate
      );

      if (cmType === 'overdue') result[qKey].overdue.push(task);
      else if (cmType === 'longterm') result[qKey].longterm.push(task);
      else if (cmType === 'cross_period') result[qKey].crossPeriod.push(task);
      else result[qKey].normal.push(task);
    }

    return result;
  }, [activeTasks, currentMonthDate]);

  function renderSegment(tasks: Task[], type: 'overdue' | 'longterm' | 'crossPeriod', color: typeof CROSS_MONTH_COLORS.overdue) {
    if (tasks.length === 0) return null;
    return (
      <div className="mb-1 rounded-lg px-2 py-1" style={{ backgroundColor: color.bg, borderLeft: `2px solid ${color.text}` }}>
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-1">
            <DraggableTask task={task} onToggleDone={(id) => updateTask(id, { done: true })} />
            {type === 'overdue' && task.deadline && (
              <span className="shrink-0 text-[9px]" style={{ color: color.text }}>逾期{getOverdueDays(task.deadline)}天</span>
            )}
            {type === 'crossPeriod' && task.startDate && task.endDate && (
              <span className="shrink-0 text-[9px]" style={{ color: color.text }}>
                {task.startDate.slice(5).replace('-', '/')}→{task.endDate.slice(5).replace('-', '/')}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskIdStr = String(active.id);
    const taskId = Number(taskIdStr.replace('task-', ''));
    const targetQuadrant = over.id as QuadrantKey;
    if (!quadrantOrder.includes(targetQuadrant) || isNaN(taskId)) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.priorityLevel === targetQuadrant) return;

    updateTask(taskId, { priorityLevel: targetQuadrant });
  };

  const activeTask = activeId ? tasks.find((t) => `task-${t.id}` === activeId) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-micro px-6 py-3">
        <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        <div className="flex items-center gap-4">
          {legendItems.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-text-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-4">
            {quadrantOrder.map((qKey) => {
              const q = quadrants[qKey];
              const colors = QUADRANT_COLORS[qKey];
              const total = q.overdue.length + q.longterm.length + q.crossPeriod.length + q.normal.length;
              return (
                <DroppableQuadrant key={qKey} quadrantKey={qKey}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.title }} />
                      <span className="text-sm font-medium" style={{ color: colors.title }}>{colors.name}</span>
                    </div>
                    <span className="text-[12px] font-medium" style={{ color: colors.title }}>{total}项</span>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {renderSegment(q.overdue, 'overdue', CROSS_MONTH_COLORS.overdue)}
                    {renderSegment(q.longterm, 'longterm', CROSS_MONTH_COLORS.longterm)}
                    {renderSegment(q.crossPeriod, 'crossPeriod', CROSS_MONTH_COLORS.cross_period)}
                    {q.normal.map((task) => (
                      <DraggableTask key={task.id} task={task} onToggleDone={(id) => updateTask(id, { done: true })} />
                    ))}
                    {total === 0 && (
                      <div className="flex h-16 items-center justify-center text-[12px] text-text-muted">暂无任务</div>
                    )}
                  </div>
                </DroppableQuadrant>
              );
            })}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="flex items-center gap-2 rounded-lg bg-bg-card px-3 py-2 shadow-xl border border-border-micro">
                <div className="h-5 w-1 shrink-0 rounded-full" style={{ backgroundColor: PRIORITIES.find((p) => p.id === activeTask.priorityLevel)?.color ?? '#94A3B8' }} />
                <span className="text-sm text-text-primary">{activeTask.title}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
