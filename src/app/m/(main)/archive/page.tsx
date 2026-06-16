'use client';

import { useState, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTaskStore } from '@/lib/stores/task-store';
import { cn } from '@/lib/utils/cn';
import { CAT_ORDER, CAT_NAMES, CAT_COLORS, SUB_CAT_ORDER, SUB_CAT_NAMES, PRIORITY_COLORS, getCatPath } from '@/components/shared/constants';

const CAT_TABS = ['全部', '工作', '琐事', '理财', '学习'] as const;
const CAT_TAB_MAP: Record<string, string> = {
  '全部': '',
  '工作': 'project',
  '琐事': 'other',
  '理财': 'credit',
  '学习': 'study',
};
type CatTab = (typeof CAT_TABS)[number];

export default function MobileArchivePage() {
  const tasks = useTaskStore((s) => s.tasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const [catTab, setCatTab] = useState<CatTab>('全部');

  const archivedTasks = useMemo(() => {
    return tasks.filter((t) => t.archived);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (catTab === '全部') return archivedTasks;
    const catId = CAT_TAB_MAP[catTab];
    return archivedTasks.filter((t) => t.cat === catId);
  }, [archivedTasks, catTab]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, typeof archivedTasks> = {};
    filteredTasks.forEach((t) => {
      const key = t.archivedAt ? t.archivedAt.slice(0, 7) : 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTasks]);

  const groupBySubCat = (list: typeof archivedTasks) => {
    const groups: Record<string, typeof list> = {};
    list.forEach((t) => {
      const key = t.subCat || '未分类';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  };

  const handleActivate = (id: number) => {
    updateTask(id, { archived: false });
  };

  const formatMonth = (key: string) => {
    if (key === 'unknown') return '未知时间';
    const [yr, mo] = key.split('-');
    return `${yr}年${parseInt(mo)}月`;
  };

  const catOrder = catTab === '全部' ? CAT_ORDER : [CAT_TAB_MAP[catTab]];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-none px-3 pt-3 pb-20 space-y-3">
        {/* 分类标签 */}
        <div className="flex gap-2">
          {CAT_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setCatTab(tab)}
              className={cn(
                'h-[30px] px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center',
                catTab === tab
                  ? 'bg-accent-blue text-white'
                  : 'bg-bg-elevated text-text-secondary'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 按月份分组显示 */}
        {groupedByMonth.length === 0 ? (
          <div className="glass-panel p-8 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-3xl mb-2">📦</div>
            <p className="text-sm text-text-muted">暂无归档任务</p>
          </div>
        ) : (
          groupedByMonth.map(([monthKey, monthTasks]) => {
            const groupedByCat: Record<string, typeof monthTasks> = {};
            monthTasks.forEach((t) => {
              if (!groupedByCat[t.cat]) groupedByCat[t.cat] = [];
              groupedByCat[t.cat].push(t);
            });

            return (
              <div key={monthKey} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-semibold text-text-primary">{formatMonth(monthKey)}</span>
                  <span className="text-[10px] text-text-muted">{monthTasks.length}项</span>
                </div>
                {catOrder.map((cat) => {
                  const catTasks = groupedByCat[cat];
                  if (!catTasks || catTasks.length === 0) return null;
                  const isOther = cat === 'other';

                  return (
                    <div key={cat} className="glass-panel p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CAT_COLORS[cat] }} />
                        <span className="text-sm font-semibold text-text-primary">{CAT_NAMES[cat] || cat}</span>
                        <span className="text-[10px] text-text-muted">{catTasks.length}项</span>
                      </div>
                      {isOther ? (
                        (() => {
                          const subGroups = groupBySubCat(catTasks);
                          return SUB_CAT_ORDER.filter((sc) => subGroups[sc]?.length).map((sc) => (
                            <div key={sc} className="space-y-1.5">
                              <div className="flex items-center gap-1.5 pl-2">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CAT_COLORS[cat] }} />
                                <span className="text-[10px] font-medium text-text-secondary">{SUB_CAT_NAMES[sc] || sc}</span>
                              </div>
                              <div className="space-y-1.5 pl-2">
                                {subGroups[sc].map((t) => (
                                  <ArchivedTaskRow key={t.id} task={t} onActivate={handleActivate} />
                                ))}
                              </div>
                            </div>
                          ));
                        })()
                      ) : (
                        <div className="space-y-1.5">
                          {catTasks.map((t) => (
                            <ArchivedTaskRow key={t.id} task={t} onActivate={handleActivate} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ArchivedTaskRow({
  task,
  onActivate,
}: {
  task: ReturnType<typeof useTaskStore.getState>['tasks'][number];
  onActivate: (id: number) => void;
}) {
  const priorityColor = PRIORITY_COLORS[task.priorityLevel] || PRIORITY_COLORS.normal;
  const catPath = getCatPath(task.cat, task.subCat);

  return (
    <div className="flex items-center gap-2 rounded-xl bg-bg-elevated px-2 py-2.5">
      <span
        className="h-8 w-0.5 shrink-0 rounded-full"
        style={{ backgroundColor: priorityColor }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-text-primary truncate">{task.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-text-muted truncate">{catPath}</span>
          {task.deadline && (
            <span className="text-[10px] text-text-muted">{task.deadline}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onActivate(task.id)}
        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-accent-blue/10 text-accent-blue active:bg-accent-blue/20 transition-colors"
      >
        <RotateCcw size={10} />
        激活
      </button>
    </div>
  );
}
