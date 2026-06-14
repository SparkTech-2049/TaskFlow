'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTaskStore } from '@/lib/stores/task-store';
import { CATEGORIES } from '@/lib/constants';
import {
  Type, Palette, SortAsc,
  Trash2, Download, CalendarPlus, Tag, Bell, Plus,
  Zap, CircleDot, Monitor, Check, X
} from 'lucide-react';

type SettingsSection = 'appearance' | 'skin' | 'task' | 'data' | 'category' | 'notification';

const sections: { key: SettingsSection; label: string; icon: typeof Type }[] = [
  { key: 'appearance', label: '外观', icon: Type },
  { key: 'skin', label: '皮肤', icon: Palette },
  { key: 'task', label: '任务管理', icon: SortAsc },
  { key: 'data', label: '数据管理', icon: Download },
  { key: 'category', label: '分类管理', icon: Tag },
  { key: 'notification', label: '通知推送', icon: Bell },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn('relative h-6 w-11 rounded-full transition-colors', value ? 'bg-accent-blue' : 'bg-border-micro')}
    >
      <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform', value ? 'translate-x-[20px]' : 'translate-x-0')} />
    </button>
  );
}

export default function DesktopSettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  const [barkTestStatus, setBarkTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [clearStatus, setClearStatus] = useState<'idle' | 'done'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'done'>('idle');
  const [newSubCatName, setNewSubCatName] = useState('');
  const [addingToCat, setAddingToCat] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [catList, setCatList] = useState(CATEGORIES.map((c) => ({ ...c, subCategories: c.subCategories ? [...c.subCategories] : undefined })));
  const [catsLoaded, setCatsLoaded] = useState(false);

  useEffect(() => {
    if (catsLoaded) return;
    fetch('/api/categories')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (data.length > 0) {
          const topLevel = data.filter((c: Record<string, unknown>) => !c.parentId && !c.parent_id);
          const subLevel = data.filter((c: Record<string, unknown>) => c.parentId || c.parent_id);
          const mapped = topLevel.map((cat: Record<string, unknown>) => ({
            id: cat.id,
            name: cat.name,
            color: cat.color,
            icon: cat.icon,
            subCategories: subLevel
              .filter((s: Record<string, unknown>) => (s.parentId || s.parent_id) === cat.id)
              .map((s: Record<string, unknown>) => ({ id: s.id, name: s.name, color: s.color })),
          }));
          setCatList(mapped);
        }
        setCatsLoaded(true);
      })
      .catch(() => setCatsLoaded(true));
  }, [catsLoaded]);

  const {
    skin, setSkin,
    fontSize, setFontSize,
    showDone, setShowDone,
    hideEmptyCat, setHideEmptyCat,
    defaultSort, setDefaultSort,
    barkWebhook, setBarkWebhook,
  } = useSettingsStore();

  const { tasks, setTasks } = useTaskStore();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function handleClearCache() {
    localStorage.removeItem('taskflow-tasks');
    localStorage.removeItem('taskflow-settings');
    setClearStatus('done');
    showToast('缓存已清除');
    setTimeout(() => setClearStatus('idle'), 2000);
  }

  function handleExportJSON() {
    const data = JSON.stringify({ tasks, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('done');
    showToast('JSON 导出成功');
    setTimeout(() => setExportStatus('idle'), 2000);
  }

  function handleExportCSV() {
    const headers = ['id', 'title', 'cat', 'subCat', 'priorityLevel', 'deadline', 'done', 'archived', 'longterm', 'meta'];
    const rows = tasks.map((t) => headers.map((h) => JSON.stringify((t as unknown as Record<string, unknown>)[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV 导出成功');
  }

  function handleExportICS() {
    const activeTasks = tasks.filter((t) => !t.archived && t.deadline);
    if (activeTasks.length === 0) {
      showToast('没有可导出的任务');
      return;
    }
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TaskFlow//CN',
    ];
    activeTasks.forEach((t) => {
      const dateStr = t.deadline!.replace(/-/g, '');
      const timeStr = t.time ? t.time.replace(':', '') + '00' : '000000';
      lines.push(
        'BEGIN:VEVENT',
        `DTSTART:${dateStr}T${timeStr}`,
        `DTEND:${dateStr}T${timeStr}`,
        `SUMMARY:${t.title}`,
        t.meta ? `DESCRIPTION:${t.meta}` : '',
        'END:VEVENT',
      );
    });
    lines.push('END:VCALENDAR');
    const ics = lines.filter(Boolean).join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-calendar-${new Date().toISOString().slice(0, 10)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('日历文件已导出，可导入 Apple/Google 日历');
  }

  async function handleBarkTest() {
    if (!barkWebhook) return;
    setBarkTestStatus('sending');
    try {
      const res = await fetch(barkWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'TaskFlow 通知测试', body: '如果你看到这条消息，说明 BARK 推送配置成功！' }),
      });
      setBarkTestStatus(res.ok ? 'success' : 'error');
    } catch {
      setBarkTestStatus('error');
    }
    setTimeout(() => setBarkTestStatus('idle'), 3000);
  }

  function handleDeleteSubCat(catId: string, subCatId: string) {
    const hasTasks = tasks.some((t) => t.cat === catId && t.subCat === subCatId);
    if (hasTasks) {
      showToast('该子分类下仍有任务，无法删除');
      return;
    }
    setCatList((prev) => prev.map((c) =>
      c.id === catId && c.subCategories
        ? { ...c, subCategories: c.subCategories.filter((s) => s.id !== subCatId) }
        : c
    ));
    fetch(`/api/categories/${subCatId}`, { method: 'DELETE' }).catch(() => {});
    showToast('子分类已删除');
  }

  function handleAddSubCat(catId: string) {
    if (!newSubCatName.trim()) return;
    const cat = catList.find((c) => c.id === catId);
    if (cat?.subCategories) {
      const newId = newSubCatName.trim().toLowerCase().replace(/\s+/g, '-');
      if (cat.subCategories.some((s) => s.id === newId)) {
        showToast('子分类已存在');
        return;
      }
      setCatList((prev) => prev.map((c) =>
        c.id === catId
          ? { ...c, subCategories: [...(c.subCategories || []), { id: newId, name: newSubCatName.trim(), color: c.color }] }
          : c
      ));
      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId, name: newSubCatName.trim(), color: cat.color, parent_id: catId }),
      }).catch(() => {});
      setNewSubCatName('');
      setAddingToCat(null);
      showToast('子分类已添加');
    }
  }

  return (
    <div className="flex h-full">
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-bg-card px-4 py-2.5 text-sm font-medium text-accent-blue shadow-lg border border-accent-blue/20">
          <Check className="h-4 w-4" />
          {toast}
        </div>
      )}

      <div className="w-[200px] shrink-0 border-r border-border-micro p-4">
        <h2 className="mb-4 text-base font-semibold text-text-primary">设置</h2>
        <nav className="flex flex-col gap-1">
          {sections.map((s) => {
            const Icon = s.icon;
            const active = activeSection === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all',
                  active
                    ? 'border-[1.5px] border-accent-blue bg-bg-elevated font-medium text-accent-blue'
                    : 'border-[1.5px] border-transparent font-normal text-text-secondary hover:bg-bg-elevated'
                )}
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'appearance' && (
          <div className="flex flex-col gap-5">
            <h3 className="text-base font-semibold text-text-primary">外观设置</h3>
            <div className="flex items-center justify-between rounded-xl border border-border-micro bg-bg-elevated px-4 py-3">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-text-primary">字体大小</span>
                <span className="text-[11px] text-text-muted">调整界面文字大小</span>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-bg-card p-0.5">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={cn(
                      'rounded-md px-3 py-1 text-[12px] transition-all',
                      fontSize === size ? 'bg-accent-blue font-medium text-white' : 'font-normal text-text-secondary'
                    )}
                  >
                    {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border-micro bg-bg-elevated px-4 py-3">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-text-primary">显示已完成任务</span>
                <span className="text-[11px] text-text-muted">在列表中显示已完成的任务</span>
              </div>
              <Toggle value={showDone} onChange={setShowDone} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border-micro bg-bg-elevated px-4 py-3">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-text-primary">隐藏空分类</span>
                <span className="text-[11px] text-text-muted">不显示没有任务的分类</span>
              </div>
              <Toggle value={hideEmptyCat} onChange={setHideEmptyCat} />
            </div>
          </div>
        )}

        {activeSection === 'skin' && (
          <div className="flex flex-col gap-5">
            <h3 className="text-base font-semibold text-text-primary">皮肤切换</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'default' as const, label: '默认', desc: '清新蓝紫，经典风格', icon: Monitor },
                { id: 'neon' as const, label: '霓虹', desc: '深色霓虹，科技感', icon: Zap },
                { id: 'huawei' as const, label: '华为', desc: '华为红，品牌风格', icon: CircleDot },
              ].map((s) => {
                const Icon = s.icon;
                const active = skin === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSkin(s.id)}
                    className={cn(
                      'flex flex-col items-center gap-3 rounded-2xl border p-6 transition-all',
                      active ? 'border-accent-blue bg-accent-blue/5' : 'border-border-micro bg-bg-elevated hover:border-accent-blue/50'
                    )}
                  >
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', active ? 'gradient-brand text-white' : 'bg-bg-card text-text-muted')}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={cn('text-sm font-medium', active ? 'text-accent-blue' : 'text-text-primary')}>{s.label}</span>
                      <span className="text-[11px] text-text-muted">{s.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeSection === 'task' && (
          <div className="flex flex-col gap-5">
            <h3 className="text-base font-semibold text-text-primary">任务管理</h3>
            <div className="flex items-center justify-between rounded-xl border border-border-micro bg-bg-elevated px-4 py-3">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-text-primary">默认排序</span>
                <span className="text-[11px] text-text-muted">设置任务列表默认排序方式</span>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-bg-card p-0.5">
                <button
                  onClick={() => setDefaultSort('priority')}
                  className={cn(
                    'rounded-md px-3 py-1 text-[12px] transition-all',
                    defaultSort === 'priority' ? 'bg-accent-blue font-medium text-white' : 'font-normal text-text-secondary'
                  )}
                >
                  优先级
                </button>
                <button
                  onClick={() => setDefaultSort('created_at')}
                  className={cn(
                    'rounded-md px-3 py-1 text-[12px] transition-all',
                    defaultSort === 'created_at' ? 'bg-accent-blue font-medium text-white' : 'font-normal text-text-secondary'
                  )}
                >
                  创建时间
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'data' && (
          <div className="flex flex-col gap-5">
            <h3 className="text-base font-semibold text-text-primary">数据管理</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-xl border border-border-micro bg-bg-elevated px-4 py-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-text-muted" />
                  <span className="text-[13px] font-medium text-text-primary">清除缓存</span>
                </div>
                <button
                  onClick={handleClearCache}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-[12px] transition-all',
                    clearStatus === 'done' ? 'border-priority-normal text-priority-normal' : 'border-border-micro text-text-secondary hover:bg-bg-card'
                  )}
                >
                  {clearStatus === 'done' ? '已清除' : '清除'}
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border-micro bg-bg-elevated px-4 py-3">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-text-muted" />
                  <span className="text-[13px] font-medium text-text-primary">导出数据</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportJSON}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-[12px] transition-all',
                      exportStatus === 'done' ? 'border-priority-normal text-priority-normal' : 'border-border-micro text-text-secondary hover:bg-bg-card'
                    )}
                  >
                    JSON
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="rounded-lg border border-border-micro px-3 py-1.5 text-[12px] text-text-secondary hover:bg-bg-card"
                  >
                    CSV
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border-micro bg-bg-elevated px-4 py-3">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4 text-text-muted" />
                  <span className="text-[13px] font-medium text-text-primary">添加到日历</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportICS}
                    className="rounded-lg border border-border-micro px-3 py-1.5 text-[12px] text-text-secondary hover:bg-bg-card"
                  >
                    导出 .ics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'category' && (
          <div className="flex flex-col gap-5">
            <h3 className="text-base font-semibold text-text-primary">分类管理</h3>
            {catList.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-border-micro bg-bg-elevated p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-[13px] font-medium text-text-primary">{cat.name}</span>
                  </div>
                </div>
                {cat.subCategories && cat.subCategories.length > 0 && (
                  <div className="ml-5 flex flex-col gap-1">
                    {cat.subCategories.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-bg-card">
                        <span className="text-[12px] text-text-secondary">{sub.name}</span>
                        <button
                          onClick={() => handleDeleteSubCat(cat.id, sub.id)}
                          className="text-[11px] text-text-muted hover:text-priority-urgent"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {addingToCat === cat.id ? (
                  <div className="ml-5 mt-1 flex items-center gap-2">
                    <input
                      value={newSubCatName}
                      onChange={(e) => setNewSubCatName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubCat(cat.id)}
                      placeholder="子分类名称"
                      className="h-7 w-32 rounded-lg border border-border-micro bg-bg-card px-2 text-[11px] text-text-primary outline-none focus:border-accent-blue"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddSubCat(cat.id)}
                      className="text-[11px] text-accent-blue hover:underline"
                    >
                      确定
                    </button>
                    <button
                      onClick={() => { setAddingToCat(null); setNewSubCatName(''); }}
                      className="text-[11px] text-text-muted hover:text-priority-urgent"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingToCat(cat.id)}
                    className="ml-5 mt-1 flex items-center gap-1 px-2 py-1 text-[11px] text-accent-blue hover:bg-accent-blue/5 rounded-lg w-fit"
                  >
                    <Plus className="h-3 w-3" /> 添加子分类
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeSection === 'notification' && (
          <div className="flex flex-col gap-5">
            <h3 className="text-base font-semibold text-text-primary">通知推送</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary">BARK Webhook URL</label>
              <input
                value={barkWebhook}
                onChange={(e) => setBarkWebhook(e.target.value)}
                placeholder="https://api.day.app/your-key"
                className="h-10 w-full rounded-xl border border-border-micro bg-bg-elevated px-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent-blue"
              />
            </div>
            <button
              disabled={!barkWebhook || barkTestStatus === 'sending'}
              onClick={handleBarkTest}
              className={cn(
                'rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50',
                barkTestStatus === 'success' ? 'bg-priority-normal' : barkTestStatus === 'error' ? 'bg-priority-urgent' : 'gradient-brand'
              )}
            >
              {barkTestStatus === 'sending' ? '发送中...' : barkTestStatus === 'success' ? '发送成功' : barkTestStatus === 'error' ? '发送失败' : '测试推送'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
