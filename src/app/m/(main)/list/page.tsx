'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle2,
  Infinity,
  Archive,
  Clock,
  Repeat,
} from 'lucide-react';
import { useTaskStore } from '@/lib/stores/task-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { getCrossMonthType, getCrossPeriodProgress } from '@/lib/utils/cross-month';
import { cn } from '@/lib/utils/cn';
import { CAT_ORDER, CAT_NAMES, CAT_COLORS, SUB_CAT_ORDER, SUB_CAT_NAMES, PRIORITY_COLORS, getCatPath } from '@/components/shared/constants';
import { useMonthNav } from '@/components/shared/use-month-nav';
import { useCategories } from '@/lib/hooks/use-categories';

/* ── 常量 ── */
const FILTERS = ['全部', '待完成', '已完成'] as const;
type Filter = (typeof FILTERS)[number];

/* ── 任务行 ── */
function TaskRow({ task, categories }: { task: ReturnType<typeof useTaskStore.getState>['tasks'][number]; categories: ReturnType<typeof useCategories>['categories'] }) {
  const toggleDone = useTaskStore((s) => s.updateTask);
  const priorityColor = PRIORITY_COLORS[task.priorityLevel] || PRIORITY_COLORS.normal;
  const catPath = getCatPath(task.cat, task.subCat, categories);

  return (
    <div className="flex items-center gap-2 rounded-xl bg-bg-elevated px-2 py-2.5">
      {/* 优先级竖条 */}
      <span
        className="h-8 w-0.5 shrink-0 rounded-full"
        style={{ backgroundColor: priorityColor }}
      />
      {/* 勾选框 */}
      <button
        onClick={() => toggleDone(task.id, { done: !task.done })}
        className="shrink-0"
      >
        {task.done ? (
          <CheckCircle2 size={16} className="text-priority-normal" />
        ) : (
          <Circle size={16} className="text-text-muted" />
        )}
      </button>
      {/* 标题 + 时间 + 分类路径 */}
      <div className="flex-1 min-w-0">
        <div className={cn('text-xs text-text-primary truncate', task.done && 'text-text-muted')}>
          {task.title}
          {task.monthlyRepeat && <Repeat size={10} className="inline ml-1 text-accent-indigo" />}
          {task.repeatSourceId && <Repeat size={10} className="inline ml-1 text-accent-indigo/60" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {task.time && (
            <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
              <Clock size={9} />{task.time}
            </span>
          )}
          <span className="text-[10px] text-text-muted truncate">{catPath}</span>
        </div>
      </div>
      {task.done && (
        <button
          onClick={() => toggleDone(task.id, { archived: true, archivedAt: new Date().toISOString() })}
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-bg-card hover:text-text-secondary"
        >
          <Archive size={12} />
        </button>
      )}
    </div>
  );
}

/* ── 主页面 ── */
export default function MobileListPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const generateMonthlyRepeats = useTaskStore((s) => s.generateMonthlyRepeats);
  const { showDone, defaultSort } = useSettingsStore();
  const { categories } = useCategories();
  const { label, goPrev, goNext, currentMonthDate, monthKey } = useMonthNav();
  const [filter, setFilter] = useState<Filter>('全部');

  useEffect(() => {
    generateMonthlyRepeats(monthKey);
  }, [monthKey, generateMonthlyRepeats]);

  /* 分类 + 跨月 */
  const { overdue, longterm, crossPeriod, normalByCat } = useMemo(() => {
    const active = tasks.filter((t) => !t.archived);
    const overdueList: typeof active = [];
    const longtermList: typeof active = [];
    const crossPeriodList: typeof active = [];
    const normalList: typeof active = [];

    active.forEach((t) => {
      const type = getCrossMonthType(
        {
          longterm: t.longterm,
          done: t.done,
          deadline: t.deadline,
          startDate: t.startDate,
          endDate: t.endDate,
        },
        currentMonthDate
      );
      if (type === 'overdue') overdueList.push(t);
      else if (type === 'longterm') longtermList.push(t);
      else if (type === 'cross_period') crossPeriodList.push(t);
      else normalList.push(t);
    });

    // 按一级分类分组
    const byCat: Record<string, typeof normalList> = {};
    normalList.forEach((t) => {
      if (!byCat[t.cat]) byCat[t.cat] = [];
      byCat[t.cat].push(t);
    });

    return { overdue: overdueList, longterm: longtermList, crossPeriod: crossPeriodList, normalByCat: byCat };
  }, [tasks, monthKey]);

  /* 筛选 */
  const applyFilter = (list: typeof tasks) => {
    let filtered = list;
    if (filter === '待完成') filtered = filtered.filter((t) => !t.done);
    if (filter === '已完成') filtered = filtered.filter((t) => t.done);
    if (!showDone && filter === '全部') filtered = filtered.filter((t) => !t.done);
    // 排序
    const sorted = [...filtered].sort((a, b) => {
      const order: Record<string, number> = { urgent_important: 0, important: 1, urgent: 2, normal: 3 };
      const pa = order[a.priorityLevel] ?? 3;
      const pb = order[b.priorityLevel] ?? 3;
      if (defaultSort === 'priority' && pa !== pb) return pa - pb;
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted;
  };

  /* 琐事二级分组 */
  const groupBySubCat = (list: typeof tasks) => {
    const groups: Record<string, typeof list> = {};
    list.forEach((t) => {
      const key = t.subCat || '未分类';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  };

  const archiveAllOverdue = () => {
    overdue.forEach((t) => updateTask(t.id, { archived: true, archivedAt: new Date().toISOString() }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-none px-3 pt-3 pb-20 space-y-3">
        {/* 月份选择器 */}
        <div className="glass-panel p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              className="h-8 w-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-secondary active:bg-bg-surface transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-text-primary">{label}</span>
            <button
              onClick={goNext}
              className="h-8 w-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-secondary active:bg-bg-surface transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* 筛选标签 */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'h-[30px] px-3 rounded-lg text-xs font-medium transition-colors',
                filter === f
                  ? 'bg-accent-blue text-white'
                  : 'bg-bg-elevated text-text-secondary'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* 逾期结转区 */}
        {overdue.length > 0 && (
          <div
            className="rounded-2xl p-3 space-y-2"
            style={{ backgroundColor: '#E53E3E06', border: '1px solid #E53E3E20' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: '#E53E3E' }}>
                {currentMonthDate.getMonth() + 1}月逾期结转 · {overdue.length}项
              </span>
              <button
                onClick={archiveAllOverdue}
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg"
                style={{ backgroundColor: '#E53E3E15', color: '#E53E3E' }}
              >
                <Archive size={11} />全部归档
              </button>
            </div>
            <div className="space-y-1.5">
              {applyFilter(overdue).map((t) => (
                <TaskRow key={t.id} task={t} categories={categories} />
              ))}
            </div>
          </div>
        )}

        {/* 长期常驻区 */}
        {longterm.length > 0 && (
          <div
            className="rounded-2xl p-3 space-y-2"
            style={{ backgroundColor: '#8B6CFF06', border: '1px solid #8B6CFF20' }}
          >
            <div className="flex items-center gap-1.5">
              <Infinity size={14} style={{ color: '#8B6CFF' }} />
              <span className="text-xs font-medium" style={{ color: '#8B6CFF' }}>
                长期常驻 · {longterm.length}项
              </span>
            </div>
            <div className="space-y-1.5">
              {applyFilter(longterm).map((t) => (
                <TaskRow key={t.id} task={t} categories={categories} />
              ))}
            </div>
          </div>
        )}

        {/* 跨期进行中区 */}
        {crossPeriod.length > 0 && (
          <div
            className="rounded-2xl p-3 space-y-2"
            style={{ backgroundColor: '#3B6EF606', border: '1px solid #3B6EF620' }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium" style={{ color: '#3B6EF6' }}>
                跨期进行中 · {crossPeriod.length}项
              </span>
            </div>
            <div className="space-y-1.5">
              {applyFilter(crossPeriod).map((t) => {
                const progress =
                  t.startDate && t.endDate
                    ? getCrossPeriodProgress(t.startDate, t.endDate)
                    : 0;
                return (
                  <div key={t.id}>
                    {progress > 0 && (
                      <div className="mb-1 h-1 rounded-full bg-bg-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${progress}%`, backgroundColor: '#3B6EF6' }}
                        />
                      </div>
                    )}
                    <TaskRow task={t} categories={categories} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 分类卡片 */}
        {(() => {
          const matchedCats = new Set<string>();
          const elements: React.ReactNode[] = [];
          for (const cat of CAT_ORDER) {
            const catTasks = normalByCat[cat];
            if (!catTasks || catTasks.length === 0) continue;
            matchedCats.add(cat);
            const filtered = applyFilter(catTasks);
            if (filtered.length === 0 && filter !== '全部') continue;

            const isOther = cat === 'other';

            elements.push(
              <div key={cat} className="glass-panel p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CAT_COLORS[cat] || '#94A3B8' }}
                  />
                  <span className="text-sm font-semibold text-text-primary">{CAT_NAMES[cat] || cat}</span>
                  <span className="text-[10px] text-text-muted">{catTasks.length}项</span>
                </div>

                {isOther ? (
                  (() => {
                    const subGroups = groupBySubCat(filtered);
                    const allSubKeys = Object.keys(subGroups);
                    const orderedSubKeys = SUB_CAT_ORDER.filter((sc) => subGroups[sc]?.length);
                    const extraSubKeys = allSubKeys.filter((k) => !SUB_CAT_ORDER.includes(k as typeof SUB_CAT_ORDER[number]));
                    const finalSubKeys = [...orderedSubKeys, ...extraSubKeys];
                    return finalSubKeys.map((sc) => (
                      <div key={sc} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 pl-2">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: CAT_COLORS[cat] || '#94A3B8' }}
                          />
                          <span className="text-[10px] font-medium text-text-secondary">{SUB_CAT_NAMES[sc] || sc}</span>
                        </div>
                        <div className="space-y-1.5 pl-2">
                          {subGroups[sc].map((t) => (
                            <TaskRow key={t.id} task={t} categories={categories} />
                          ))}
                        </div>
                      </div>
                    ));
                  })()
                ) : (
                  <div className="space-y-1.5">
                    {filtered.map((t) => (
                      <TaskRow key={t.id} task={t} categories={categories} />
                    ))}
                  </div>
                )}
              </div>
            );
          }
          for (const [cat, catTasks] of Object.entries(normalByCat)) {
            if (matchedCats.has(cat) || !catTasks || catTasks.length === 0) continue;
            const filtered = applyFilter(catTasks);
            if (filtered.length === 0 && filter !== '全部') continue;
            elements.push(
              <div key={cat} className="glass-panel p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#94A3B8' }} />
                  <span className="text-sm font-semibold text-text-primary">{CAT_NAMES[cat] || cat}</span>
                  <span className="text-[10px] text-text-muted">{catTasks.length}项</span>
                </div>
                <div className="space-y-1.5">
                  {filtered.map((t) => (
                    <TaskRow key={t.id} task={t} categories={categories} />
                  ))}
                </div>
              </div>
            );
          }
          return elements;
        })()}
      </div>
    </div>
  );
}
