'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Repeat,
  Bell,
  Infinity,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { useTaskStore } from '@/lib/stores/task-store';
import { createTaskSchema } from '@/lib/utils/schemas';
import { useCategories } from '@/lib/hooks/use-categories';
import { cn } from '@/lib/utils/cn';

const PRIORITY_OPTIONS = [
  { key: 'urgent_important', label: '紧急·重要', color: '#E53E3E' },
  { key: 'important', label: '重要·不紧急', color: '#FFC107' },
  { key: 'urgent', label: '紧急·不重要', color: '#ED8936' },
  { key: 'normal', label: '普通', color: '#07C160' },
] as const;

interface AddTaskSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddTaskSheet({ open, onClose }: AddTaskSheetProps) {
  const addTask = useTaskStore((s) => s.addTask);
  const { categories } = useCategories();

  const CAT_OPTIONS = categories.map((c) => ({ id: c.id, label: c.name }));
  const SUB_CAT_MAP = Object.fromEntries(
    categories.map((c) => [c.id, (c.subCategories ?? []).map((s) => ({ id: s.id, label: s.name }))])
  );

  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<string>('project');
  const [subCat, setSubCat] = useState('');
  const [deadline, setDeadline] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<string>('normal');
  const [meta, setMeta] = useState('');
  const [monthlyRepeat, setMonthlyRepeat] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [noDeadline, setNoDeadline] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subCats = SUB_CAT_MAP[cat] ?? [];

  const resetForm = () => {
    setTitle('');
    setCat('project');
    setSubCat('');
    setDeadline('');
    setTime('');
    setPriority('normal');
    setMeta('');
    setMonthlyRepeat(false);
    setReminder(false);
    setNoDeadline(false);
    setErrors({});
  };

  const handleSubmit = () => {
    const result = createTaskSchema.safeParse({
      title,
      cat,
      sub_cat: subCat || undefined,
      priority_level: priority || undefined,
      deadline: noDeadline ? undefined : deadline || undefined,
      time: time || undefined,
      meta: meta || undefined,
      monthly_repeat: monthlyRepeat || undefined,
      reminder: reminder || undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString() ?? '';
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const now = new Date().toISOString();
    addTask({
      id: Date.now(),
      parentId: null,
      cat,
      subCat: subCat || null,
      title,
      meta: meta || null,
      priorityLevel: priority || 'normal',
      deadline: noDeadline ? null : deadline || null,
      startDate: null,
      endDate: null,
      time: time || null,
      done: false,
      archived: false,
      longterm: false,
      reminder,
      monthlyRepeat,
      repeatSourceId: null,
      archivedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    resetForm();
    onClose();
  };

  const handleDelete = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-auto rounded-t-3xl glass-panel"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-border-micro" />
            </div>

            <div className="px-4 pb-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">添加任务</h2>
                <button onClick={onClose} className="h-8 w-8 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted">
                  <X size={16} />
                </button>
              </div>

              {/* 1. 任务标题 */}
              <div>
                <input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })); }}
                  placeholder="任务标题"
                  className={cn(
                    'w-full h-10 px-3 rounded-xl bg-bg-elevated text-sm text-text-primary placeholder:text-text-muted outline-none border transition-colors',
                    errors.title ? 'border-priority-urgent' : 'border-border-micro focus:border-accent-blue'
                  )}
                />
                {errors.title && <p className="text-[10px] text-priority-urgent mt-1">{errors.title}</p>}
              </div>

              {/* 2. 分类 + 子分类 */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <select
                      value={cat}
                      onChange={(e) => { setCat(e.target.value); setSubCat(''); setErrors((p) => ({ ...p, cat: '' })); }}
                      className={cn(
                        'w-full h-10 px-3 pr-8 rounded-xl bg-bg-elevated text-sm text-text-primary outline-none border appearance-none transition-colors',
                        errors.cat ? 'border-priority-urgent' : 'border-border-micro focus:border-accent-blue'
                      )}
                    >
                      <option value="">选择分类</option>
                      {CAT_OPTIONS.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                  {errors.cat && <p className="text-[10px] text-priority-urgent mt-1">{errors.cat}</p>}
                </div>
                {subCats.length > 0 && (
                  <div className="flex-1">
                    <div className="relative">
                      <select
                        value={subCat}
                        onChange={(e) => setSubCat(e.target.value)}
                        className="w-full h-10 px-3 pr-8 rounded-xl bg-bg-elevated text-sm text-text-primary outline-none border border-border-micro appearance-none focus:border-accent-blue transition-colors"
                      >
                        <option value="">子分类</option>
                        {subCats.map((sc) => (
                          <option key={sc.id} value={sc.id}>{sc.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. 日期时间 */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      disabled={noDeadline}
                      className={cn(
                        'w-full h-10 pl-8 pr-3 rounded-xl bg-bg-elevated text-sm text-text-primary outline-none border border-border-micro focus:border-accent-blue transition-colors',
                        noDeadline && 'opacity-40'
                      )}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full h-10 pl-8 pr-3 rounded-xl bg-bg-elevated text-sm text-text-primary outline-none border border-border-micro focus:border-accent-blue transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 4. 优先级 */}
              <div>
                <span className="text-[10px] text-text-muted mb-1.5 block">优先级</span>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => { setPriority(p.key); setErrors((prev) => ({ ...prev, priority_level: '' })); }}
                      className={cn(
                        'flex-1 h-9 rounded-xl text-[10px] font-medium transition-all border-2',
                        priority === p.key
                          ? 'text-white shadow-md'
                          : 'bg-bg-elevated text-text-secondary border-transparent'
                      )}
                      style={priority === p.key ? { backgroundColor: p.color, borderColor: p.color } : { borderColor: 'transparent' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {errors.priority_level && <p className="text-[10px] text-priority-urgent mt-1">{errors.priority_level}</p>}
              </div>

              {/* 5. 备注 */}
              <div>
                <textarea
                  value={meta}
                  onChange={(e) => setMeta(e.target.value)}
                  placeholder="备注"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated text-sm text-text-primary placeholder:text-text-muted outline-none border border-border-micro focus:border-accent-blue transition-colors resize-none"
                />
              </div>

              {/* 6. 按月重复 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-text-secondary">
                    <Repeat size={14} className="text-text-muted" />
                    按月重复
                  </span>
                  <button
                    onClick={() => setMonthlyRepeat(!monthlyRepeat)}
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors',
                      monthlyRepeat ? 'bg-accent-blue' : 'bg-bg-elevated'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                        monthlyRepeat ? 'translate-x-[22px]' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>
                {monthlyRepeat && (
                  <p className="text-[10px] text-text-muted pl-[22px]">每月自动创建新任务，关闭后下月不再重复</p>
                )}
              </div>

              {/* 7. 到期提醒 */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-text-secondary">
                  <Bell size={14} className="text-text-muted" />
                  到期提醒
                </span>
                <button
                  onClick={() => setReminder(!reminder)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    reminder ? 'bg-accent-blue' : 'bg-bg-elevated'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                      reminder ? 'translate-x-[22px]' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>

              {/* 8. 不设截止日 */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-text-secondary">
                  <Infinity size={14} className="text-text-muted" />
                  不设截止日
                </span>
                <button
                  onClick={() => { setNoDeadline(!noDeadline); if (!noDeadline) setDeadline(''); }}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    noDeadline ? 'bg-accent-blue' : 'bg-bg-elevated'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                      noDeadline ? 'translate-x-[22px]' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>

              {/* 9. 操作按钮 */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDelete}
                  className="h-10 px-4 rounded-xl border border-priority-urgent/30 text-priority-urgent text-xs font-medium flex items-center gap-1.5 active:bg-priority-urgent/5 transition-colors"
                >
                  <Trash2 size={14} />
                  删除
                </button>
                <button
                  onClick={onClose}
                  className="h-10 flex-1 rounded-xl border border-border-micro text-text-secondary text-xs font-medium active:bg-bg-elevated transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="h-10 flex-1 rounded-xl gradient-brand text-white text-xs font-semibold shadow-md shadow-accent-blue/20 active:scale-[0.98] transition-transform"
                >
                  提交
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

