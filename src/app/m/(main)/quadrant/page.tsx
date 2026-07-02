'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import {
  ChevronLeft, ChevronRight, Circle, CheckCircle2, Infinity, Clock, GripVertical, Repeat,
} from 'lucide-react';
import { useTaskStore } from '@/lib/stores/task-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { getCrossMonthType, getCrossPeriodProgress } from '@/lib/utils/cross-month';
import { QUADRANT_COLORS, CROSS_MONTH_COLORS } from '@/lib/constants';
import { PRIORITY_COLORS } from '@/components/shared/constants';
import { useMonthNav } from '@/components/shared/use-month-nav';
import { cn } from '@/lib/utils/cn';

const QUADRANTS = [
  { key: 'urgent_important' as const, label: '重要紧急', priorityLevel: 'urgent_important' as const },
  { key: 'important' as const, label: '重要不紧急', priorityLevel: 'important' as const },
  { key: 'urgent' as const, label: '紧急不重要', priorityLevel: 'urgent' as const },
  { key: 'normal' as const, label: '不重要不紧急', priorityLevel: 'normal' as const },
] as const;

function getQuadrantIndex(priorityLevel: string): number {
  switch (priorityLevel) {
    case 'urgent_important': return 0;
    case 'important': return 1;
    case 'urgent': return 2;
    case 'normal': return 3;
    default: return 3;
  }
}

type SegmentType = 'overdue' | 'longterm' | 'cross_period' | 'normal';

const SEGMENT_STYLES: Record<SegmentType, { bg: string; border: string; label: string; labelColor: string }> = {
  overdue: { bg: CROSS_MONTH_COLORS.overdue.bg, border: CROSS_MONTH_COLORS.overdue.border, label: '逾期', labelColor: CROSS_MONTH_COLORS.overdue.text },
  longterm: { bg: CROSS_MONTH_COLORS.longterm.bg, border: CROSS_MONTH_COLORS.longterm.border, label: '长期', labelColor: CROSS_MONTH_COLORS.longterm.text },
  cross_period: { bg: CROSS_MONTH_COLORS.cross_period.bg, border: CROSS_MONTH_COLORS.cross_period.border, label: '跨期', labelColor: CROSS_MONTH_COLORS.cross_period.text },
  normal: { bg: 'transparent', border: 'transparent', label: '', labelColor: '' },
};

function DraggableTaskRow({ task }: { task: ReturnType<typeof useTaskStore.getState>['tasks'][number] }) {
  const toggleDone = useTaskStore((s) => s.updateTask);
  const priorityColor = PRIORITY_COLORS[task.priorityLevel] || PRIORITY_COLORS.normal;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `task-${task.id}` });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-1.5 rounded-lg bg-bg-elevated/80 px-1.5 py-1.5 touch-none',
        isDragging && 'opacity-30 shadow-lg'
      )}
    >
      <GripVertical size={8} className="text-text-muted shrink-0" />
      <span className="h-5 w-0.5 shrink-0 rounded-full" style={{ backgroundColor: priorityColor }} />
      <button onClick={(e) => { e.stopPropagation(); toggleDone(task.id, { done: !task.done }); }} className="shrink-0">
        {task.done ? <CheckCircle2 size={12} className="text-priority-normal" /> : <Circle size={12} className="text-text-muted" />}
      </button>
      <span className={cn('text-[10px] text-text-primary truncate flex-1', task.done && 'text-text-muted')}>
        {task.title}
        {task.monthlyRepeat && <Repeat size={8} className="inline ml-0.5 text-accent-indigo" />}
        {task.repeatSourceId && <Repeat size={8} className="inline ml-0.5 text-accent-indigo/60" />}
      </span>
      {task.time && (
        <span className="flex items-center gap-0.5 text-[8px] text-text-muted shrink-0">
          <Clock size={8} />{task.time}
        </span>
      )}
    </div>
  );
}

function DroppableQuadrant({ quadrant, children }: { quadrant: typeof QUADRANTS[number]; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant.key });
  const colors = QUADRANT_COLORS[quadrant.key];

  return (
    <div
      ref={setNodeRef}
      className={cn('rounded-2xl p-2.5 space-y-2 overflow-hidden transition-all flex flex-col min-h-0', isOver && 'ring-2 ring-offset-1')}
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        ...(isOver ? { ringColor: colors.title, boxShadow: `0 0 12px ${colors.title}30` } : {}),
      }}
    >
      {children}
    </div>
  );
}

export default function MobileQuadrantPage() {
  const { tasks, updateTask, generateMonthlyRepeats } = useTaskStore();
  const { showDone } = useSettingsStore();
  const { label, goPrev, goNext, currentMonthDate, monthKey } = useMonthNav();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    generateMonthlyRepeats(monthKey);
  }, [monthKey, generateMonthlyRepeats]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const quadrantData = useMemo(() => {
    const base = tasks.filter((t) => !t.archived);
    const active = showDone ? base : base.filter((t) => !t.done);
    const buckets: { overdue: typeof active; longterm: typeof active; cross_period: typeof active; normal: typeof active }[] = [
      { overdue: [], longterm: [], cross_period: [], normal: [] },
      { overdue: [], longterm: [], cross_period: [], normal: [] },
      { overdue: [], longterm: [], cross_period: [], normal: [] },
      { overdue: [], longterm: [], cross_period: [], normal: [] },
    ];
    active.forEach((t) => {
      const qi = getQuadrantIndex(t.priorityLevel);
      const type = getCrossMonthType(
        { longterm: t.longterm, done: t.done, deadline: t.deadline, startDate: t.startDate, endDate: t.endDate },
        currentMonthDate
      ) as SegmentType;
      buckets[qi][type].push(t);
    });
    return buckets;
  }, [tasks, monthKey]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskIdStr = String(active.id);
    const taskId = Number(taskIdStr.replace('task-', ''));
    const targetQuadrant = QUADRANTS.find((q) => q.key === over.id);
    if (!targetQuadrant || isNaN(taskId)) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.priorityLevel === targetQuadrant.priorityLevel) return;

    updateTask(taskId, { priorityLevel: targetQuadrant.priorityLevel });
  };

  const activeTask = activeId ? tasks.find((t) => `task-${t.id}` === activeId) : null;

  const renderSegment = (type: SegmentType, items: typeof tasks, qi: number) => {
    if (items.length === 0) return null;
    const style = SEGMENT_STYLES[type];
    return (
      <div className="space-y-1">
        {type !== 'normal' && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}>
            {type === 'longterm' && <Infinity size={8} style={{ color: style.labelColor }} />}
            <span className="text-[8px] font-medium" style={{ color: style.labelColor }}>
              {style.label} {items.length}
            </span>
          </div>
        )}
        {items.map((t) => (
          type === 'cross_period' && t.startDate && t.endDate ? (
            <div key={t.id}>
              <div className="mb-0.5 h-0.5 rounded-full bg-bg-elevated overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${getCrossPeriodProgress(t.startDate, t.endDate)}%`, backgroundColor: '#3B6EF6' }} />
              </div>
              <DraggableTaskRow task={t} />
            </div>
          ) : (
            <DraggableTaskRow key={t.id} task={t} />
          )
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>
      <div className="flex-1 min-h-0 flex flex-col px-3 pt-3 pb-3">
        <div className="glass-panel p-3 shrink-0">
          <div className="flex items-center justify-between">
            <button onClick={goPrev} className="h-8 w-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-secondary active:bg-bg-surface transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-text-primary">{label}</span>
            <button onClick={goNext} className="h-8 w-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-secondary active:bg-bg-surface transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 grid-rows-2 gap-2 flex-1 min-h-0 mt-3">
            {QUADRANTS.map((q, qi) => {
              const data = quadrantData[qi];
              const totalTasks = data.overdue.length + data.longterm.length + data.cross_period.length + data.normal.length;
              const colors = QUADRANT_COLORS[q.key];

              return (
                <DroppableQuadrant key={q.key} quadrant={q}>
                  <div className="flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-bold" style={{ color: colors.title }}>{q.label}</span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ backgroundColor: `${colors.title}15`, color: colors.title }}>
                      {totalTasks}
                    </span>
                  </div>
                  <div className="space-y-1.5 overflow-y-auto flex-1 min-h-0 scrollbar-none">
                    {renderSegment('overdue', data.overdue, qi)}
                    {renderSegment('longterm', data.longterm, qi)}
                    {renderSegment('cross_period', data.cross_period, qi)}
                    {renderSegment('normal', data.normal, qi)}
                    {totalTasks === 0 && <p className="text-[9px] text-text-muted text-center py-3">暂无任务</p>}
                  </div>
                </DroppableQuadrant>
              );
            })}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="flex items-center gap-1.5 rounded-lg bg-bg-card px-1.5 py-1.5 shadow-xl border border-border-micro">
                <span className="h-5 w-0.5 shrink-0 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[activeTask.priorityLevel] || PRIORITY_COLORS.normal }} />
                <span className="text-[10px] text-text-primary truncate">{activeTask.title}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
