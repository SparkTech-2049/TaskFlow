'use client';

import { useState } from 'react';
import {
  Type, Eye, EyeOff, FolderOpen, Trash2, Download, CalendarPlus,
  Plus, X, Bell, Palette, ArrowLeftRight, Check, Send, Edit3, LogOut, TreePine, Monitor, Zap, Power,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTaskStore } from '@/lib/stores/task-store';
import { useCategories } from '@/lib/hooks/use-categories';
import { exportJSON, exportCSV, exportICS } from '@/lib/utils/export';
import { cn } from '@/lib/utils/cn';

const FONT_SIZES = [
  { key: 'small' as const, label: '小' },
  { key: 'medium' as const, label: '中' },
  { key: 'large' as const, label: '大' },
];

const SORT_OPTIONS = [
  { key: 'priority' as const, label: '优先级' },
  { key: 'created_at' as const, label: '创建时间' },
];

export default function MobileSettingsPage() {
  const {
    skin, fontSize, showDone, hideEmptyCat, defaultSort, barkChannels,
    setSkin, setFontSize, setShowDone, setHideEmptyCat, setDefaultSort,
    addBarkChannel, updateBarkChannel, removeBarkChannel,
  } = useSettingsStore();

  const tasks = useTaskStore((s) => s.tasks);

  const { categories, invalidateCache } = useCategories();

  const [newSubCat, setNewSubCat] = useState('');
  const [subCatParentId, setSubCatParentId] = useState<string>('');
  const [customCats, setCustomCats] = useState<string[]>([]);
  const [newCat, setNewCat] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [newBarkName, setNewBarkName] = useState('');
  const [newBarkUrl, setNewBarkUrl] = useState('');

  const allCats = [...categories.map((c) => c.name), ...customCats];

  const hasTasksInSubCat = (subCatId: string) => {
    return tasks.some((t) => t.subCat === subCatId && !t.archived);
  };

  const hasTasksInCat = (catId: string) => {
    return tasks.some((t) => t.cat === catId && !t.archived);
  };

  const handleAddSubCat = async () => {
    const trimmed = newSubCat.trim();
    if (!trimmed || !subCatParentId) return;
    const existing = categories.find((c) => c.id === subCatParentId);
    if (existing?.subCategories?.some((s) => s.name === trimmed)) return;

    try {
      const id = `${subCatParentId}-${trimmed.toLowerCase().replace(/\s+/g, '-')}`;
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: trimmed,
          color: existing?.color ?? '#8B6FC0',
          parent_id: subCatParentId,
        }),
      });
      invalidateCache();
      setNewSubCat('');
    } catch {}
  };

  const handleRemoveSubCat = async (subCatId: string, subCatName: string) => {
    if (hasTasksInSubCat(subCatId)) {
      alert(`分类"${subCatName}"下仍有任务，无法删除。请先移动或删除相关任务。`);
      return;
    }
    try {
      await fetch(`/api/categories/${subCatId}`, { method: 'DELETE' });
      invalidateCache();
    } catch {}
  };

  const handleAddCat = () => {
    const trimmed = newCat.trim();
    if (trimmed && !allCats.includes(trimmed)) {
      setCustomCats((prev) => [...prev, trimmed]);
      setNewCat('');
    }
  };

  const handleRemoveCat = (catId: string) => {
    if (hasTasksInCat(catId)) {
      const catName = categories.find((c) => c.id === catId)?.name ?? catId;
      alert(`分类"${catName}"下仍有任务，无法删除。请先移动或删除相关任务。`);
      return;
    }
    fetch(`/api/categories/${catId}`, { method: 'DELETE' }).then(() => invalidateCache()).catch(() => {});
  };

  const handleStartEditCat = (cat: string) => {
    setEditingCat(cat);
    setEditCatName(cat);
  };

  const handleSaveEditCat = (oldName: string) => {
    const trimmed = editCatName.trim();
    if (trimmed && trimmed !== oldName) {
      setCustomCats((prev) => prev.map((c) => (c === oldName ? trimmed : c)));
    }
    setEditingCat(null);
  };

  const handleExportJSON = () => {
    exportJSON(tasks);
  };

  const handleExportCSV = () => {
    exportCSV(tasks);
  };

  const handleExportICS = () => {
    const result = exportICS(tasks);
    if (!result) {
      alert('没有可导出的任务');
    }
  };

  const handleClearCache = () => {
    if (confirm('确定要清除缓存吗？此操作不可恢复。')) {
      localStorage.removeItem('taskflow-tasks');
      localStorage.removeItem('taskflow-settings');
      window.location.reload();
    }
  };

  const handleAddBark = async () => {
    if (!newBarkName.trim() || !newBarkUrl.trim()) return;
    try {
      const res = await fetch('/api/bark-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBarkName.trim(), url: newBarkUrl.trim() }),
      });
      if (res.ok) {
        const channel = await res.json();
        addBarkChannel(channel);
        setNewBarkName('');
        setNewBarkUrl('');
      }
    } catch {}
  };

  const handleDeleteBark = async (id: number) => {
    try {
      const res = await fetch(`/api/bark-channels?id=${id}`, { method: 'DELETE' });
      if (res.ok) removeBarkChannel(id);
    } catch {}
  };

  const handleToggleBark = async (id: number, enabled: boolean) => {
    try {
      const res = await fetch('/api/bark-channels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !enabled }),
      });
      if (res.ok) updateBarkChannel(id, { enabled: !enabled });
    } catch {}
  };

  const handleTestBarkUrl = async (url: string) => {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'TaskFlow 测试推送', body: '推送配置成功！' }),
      });
    } catch {}
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-3 pt-3 pb-20 space-y-3">
        {/* 外观 */}
        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Palette size={14} className="text-accent-blue" />
            <span className="text-sm font-semibold text-text-primary">外观</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">字体大小</span>
            <div className="flex gap-1">
              {FONT_SIZES.map((fs) => (
                <button key={fs.key} onClick={() => setFontSize(fs.key)}
                  className={cn('h-7 px-3 rounded-lg text-xs font-medium transition-colors',
                    fontSize === fs.key ? 'bg-accent-blue text-white' : 'bg-bg-elevated text-text-secondary'
                  )}>
                  {fs.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">显示已完成</span>
            <button onClick={() => setShowDone(!showDone)}
              className={cn('relative h-6 w-11 rounded-full transition-colors', showDone ? 'bg-accent-blue' : 'bg-bg-elevated')}>
              <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                showDone ? 'translate-x-[20px]' : 'translate-x-0')} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">隐藏空分类</span>
            <button onClick={() => setHideEmptyCat(!hideEmptyCat)}
              className={cn('relative h-6 w-11 rounded-full transition-colors', hideEmptyCat ? 'bg-accent-blue' : 'bg-bg-elevated')}>
              <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                hideEmptyCat ? 'translate-x-[20px]' : 'translate-x-0')} />
            </button>
          </div>
        </div>

        {/* 皮肤切换 */}
        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={14} className="text-accent-indigo" />
            <span className="text-sm font-semibold text-text-primary">皮肤切换</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'default' as const, label: '默认', icon: Monitor },
                { id: 'neon' as const, label: '霓虹', icon: Zap },
                { id: 'huawei' as const, label: '华为', icon: Palette },
                { id: 'forest' as const, label: '森林', icon: TreePine },
              ] as const).map((s) => {
                const Icon = s.icon;
                return (
                  <button key={s.id} onClick={() => setSkin(s.id)}
                    className={cn('flex flex-col items-center gap-1 h-14 rounded-xl text-xs font-medium transition-colors',
                      skin === s.id ? 'gradient-brand text-white shadow-md shadow-accent-blue/20' : 'bg-bg-elevated text-text-secondary border border-border-micro')}>
                    <Icon size={16} />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
        </div>

        {/* 任务管理 */}
        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Type size={14} className="text-priority-normal" />
            <span className="text-sm font-semibold text-text-primary">任务管理</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">默认排序</span>
            <div className="flex gap-1">
              {SORT_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => setDefaultSort(opt.key)}
                  className={cn('h-7 px-3 rounded-lg text-xs font-medium transition-colors',
                    defaultSort === opt.key ? 'bg-accent-blue text-white' : 'bg-bg-elevated text-text-secondary'
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Download size={14} className="text-cta-orange" />
            <span className="text-sm font-semibold text-text-primary">数据管理</span>
          </div>
          <div className="space-y-2">
            <button onClick={handleClearCache}
              className="flex items-center justify-between w-full h-9 rounded-xl bg-bg-elevated px-3 text-xs text-text-secondary active:bg-bg-surface transition-colors">
              <span className="flex items-center gap-2"><Trash2 size={13} className="text-priority-urgent" />清除缓存</span>
            </button>
            <button onClick={handleExportJSON}
              className="flex items-center justify-between w-full h-9 rounded-xl bg-bg-elevated px-3 text-xs text-text-secondary active:bg-bg-surface transition-colors">
              <span className="flex items-center gap-2"><Download size={13} className="text-accent-blue" />导出数据 (JSON)</span>
            </button>
            <button onClick={handleExportCSV}
              className="flex items-center justify-between w-full h-9 rounded-xl bg-bg-elevated px-3 text-xs text-text-secondary active:bg-bg-surface transition-colors">
              <span className="flex items-center gap-2"><Download size={13} className="text-accent-indigo" />导出数据 (CSV)</span>
            </button>
            <button onClick={handleExportICS}
              className="flex items-center justify-between w-full h-9 rounded-xl bg-bg-elevated px-3 text-xs text-text-secondary active:bg-bg-surface transition-colors">
              <span className="flex items-center gap-2"><CalendarPlus size={13} className="text-priority-normal" />导出日历 (.ics)</span>
            </button>
          </div>
        </div>

        {/* 分类管理 - 完整 CRUD */}
        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center gap-2">
            <FolderOpen size={14} className="text-cat-other" />
            <span className="text-sm font-semibold text-text-primary">分类管理</span>
          </div>

          {/* 一级分类 - 支持增删改 */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-text-muted">一级分类</span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <span key={cat.id}
                  className="h-7 px-2.5 rounded-lg bg-bg-elevated text-xs text-text-secondary flex items-center gap-1">
                  {editingCat === cat.id ? (
                    <input value={editCatName} onChange={(e) => setEditCatName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEditCat(cat.id)}
                      onBlur={() => handleSaveEditCat(cat.id)}
                      className="w-12 bg-transparent outline-none text-text-primary text-xs" autoFocus />
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                      <button onClick={() => handleStartEditCat(cat.id)} className="text-text-muted hover:text-accent-blue">
                        <Edit3 size={10} />
                      </button>
                      <button onClick={() => handleRemoveCat(cat.id)} className="text-text-muted hover:text-priority-urgent">
                        <X size={10} />
                      </button>
                    </>
                  )}
                </span>
              ))}
              {customCats.map((cat) => (
                <span key={cat}
                  className="h-7 px-2.5 rounded-lg bg-bg-elevated text-xs text-text-secondary flex items-center gap-1">
                  {editingCat === cat ? (
                    <input value={editCatName} onChange={(e) => setEditCatName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEditCat(cat)}
                      onBlur={() => handleSaveEditCat(cat)}
                      className="w-12 bg-transparent outline-none text-text-primary text-xs" autoFocus />
                  ) : (
                    <>
                      {cat}
                      <button onClick={() => handleStartEditCat(cat)} className="text-text-muted hover:text-accent-blue">
                        <Edit3 size={10} />
                      </button>
                      <button onClick={() => handleRemoveCat(cat)} className="text-text-muted hover:text-priority-urgent">
                        <X size={10} />
                      </button>
                    </>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCat()}
                placeholder="添加一级分类"
                className="flex-1 h-7 px-2 rounded-lg bg-bg-elevated text-xs text-text-primary placeholder:text-text-muted outline-none border border-border-micro focus:border-accent-blue transition-colors" />
              <button onClick={handleAddCat}
                className="h-7 w-7 rounded-lg bg-accent-blue/10 text-accent-blue flex items-center justify-center active:bg-accent-blue/20 transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* 二级分类 - 按一级分类分组，添加时选择归属 */}
          <div className="space-y-2">
            <span className="text-[10px] text-text-muted">二级分类</span>
            {categories.map((cat) => {
              const subs = cat.subCategories ?? [];
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[10px] font-medium text-text-secondary">{cat.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-3.5">
                    {subs.map((sc) => (
                      <span key={sc.id}
                        className="h-6 px-2 rounded-md bg-bg-elevated text-[10px] text-text-secondary flex items-center gap-1">
                        {sc.name}
                        <button onClick={() => handleRemoveSubCat(sc.id, sc.name)}
                          className="text-text-muted hover:text-priority-urgent">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="flex gap-1.5">
              <select value={subCatParentId} onChange={(e) => setSubCatParentId(e.target.value)}
                className="h-7 px-2 rounded-lg bg-bg-elevated text-xs text-text-secondary outline-none border border-border-micro focus:border-accent-blue transition-colors appearance-none min-w-[72px]">
                <option value="" disabled>归属</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input value={newSubCat} onChange={(e) => setNewSubCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubCat()}
                placeholder="添加二级分类"
                className="flex-1 h-7 px-2 rounded-lg bg-bg-elevated text-xs text-text-primary placeholder:text-text-muted outline-none border border-border-micro focus:border-accent-blue transition-colors" />
              <button onClick={handleAddSubCat}
                className="h-7 w-7 rounded-lg bg-accent-blue/10 text-accent-blue flex items-center justify-center active:bg-accent-blue/20 transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 通知推送 */}
        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-cta-orange" />
            <span className="text-sm font-semibold text-text-primary">通知推送</span>
          </div>
          {barkChannels.map((ch) => (
            <div key={ch.id} className="flex items-center gap-2 rounded-xl bg-bg-elevated px-3 py-2">
              <button onClick={() => handleToggleBark(ch.id, ch.enabled)}>
                <Power size={14} className={ch.enabled ? 'text-priority-normal' : 'text-text-muted'} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text-primary">{ch.name}</div>
                <div className="truncate text-[10px] text-text-muted">{ch.url}</div>
              </div>
              <button onClick={() => handleTestBarkUrl(ch.url)} className="shrink-0">
                <Send size={12} className="text-accent-blue" />
              </button>
              <button onClick={() => handleDeleteBark(ch.id)} className="shrink-0">
                <Trash2 size={12} className="text-text-muted" />
              </button>
            </div>
          ))}
          <div className="space-y-1.5">
            <input value={newBarkName} onChange={(e) => setNewBarkName(e.target.value)}
              placeholder="名称（如：我的手机）"
              className="w-full h-8 px-3 rounded-xl bg-bg-elevated text-xs text-text-primary placeholder:text-text-muted outline-none border border-border-micro focus:border-accent-blue transition-colors" />
            <input value={newBarkUrl} onChange={(e) => setNewBarkUrl(e.target.value)}
              placeholder="Bark URL"
              className="w-full h-8 px-3 rounded-xl bg-bg-elevated text-xs text-text-primary placeholder:text-text-muted outline-none border border-border-micro focus:border-accent-blue transition-colors" />
            <button onClick={handleAddBark} disabled={!newBarkName.trim() || !newBarkUrl.trim()}
              className="w-full h-8 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors bg-accent-blue/10 text-accent-blue active:bg-accent-blue/20 disabled:opacity-50">
              <Plus size={12} />
              添加渠道
            </button>
          </div>
        </div>

        {/* 退出登录 */}
        <div className="glass-panel p-3">
          <button
            onClick={() => signOut({ callbackUrl: '/m/login' })}
            className="w-full h-10 rounded-xl border border-priority-urgent/20 bg-priority-urgent/5 text-sm font-medium text-priority-urgent flex items-center justify-center gap-2 active:bg-priority-urgent/10 transition-colors"
          >
            <LogOut size={15} />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
