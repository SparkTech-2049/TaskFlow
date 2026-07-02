'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Bell, Repeat, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PRIORITIES } from '@/lib/constants';
import { useCategories } from '@/lib/hooks/use-categories';
import type { Task } from '@/lib/types';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'completedAt' | 'parentId'>) => void;
  editTask?: Task | null;
  onEdit?: (id: number, updates: Partial<Task>) => void;
}

export function AddTaskModal({ open, onClose, onAdd, editTask, onEdit }: AddTaskModalProps) {
  const isEditing = !!editTask;
  const { categories: CATEGORIES } = useCategories();
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('project');
  const [subCat, setSubCat] = useState<string | null>(null);
  const [deadline, setDeadline] = useState('');
  const [time, setTime] = useState('');
  const [priorityLevel, setPriorityLevel] = useState<string>('normal');
  const [meta, setMeta] = useState('');
  const [longterm, setLongterm] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [monthlyRepeat, setMonthlyRepeat] = useState(false);
  const [noDeadline, setNoDeadline] = useState(false);

  const populateFromTask = (task: Task) => {
    setTitle(task.title);
    setCat(task.cat);
    setSubCat(task.subCat);
    setDeadline(task.deadline ?? '');
    setTime(task.time ?? '');
    setPriorityLevel(task.priorityLevel);
    setMeta(task.meta ?? '');
    setLongterm(task.longterm);
    setReminder(task.reminder);
    setMonthlyRepeat(task.monthlyRepeat);
    setNoDeadline(false);
  };

  const resetForm = () => {
    setTitle('');
    setCat('project');
    setSubCat(null);
    setDeadline('');
    setTime('');
    setPriorityLevel('normal');
    setMeta('');
    setLongterm(false);
    setReminder(false);
    setMonthlyRepeat(false);
    setNoDeadline(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedCat = CATEGORIES.find((c) => c.id === cat);

  function handleSubmit() {
    if (!title.trim()) return;
    if (isEditing && editTask && onEdit) {
      onEdit(editTask.id, {
        title: title.trim(),
        cat,
        subCat,
        meta: meta || null,
        priorityLevel,
        deadline: noDeadline || longterm ? null : (deadline || null),
        time: time || null,
        longterm,
        reminder,
        monthlyRepeat,
        repeatSourceId: null,
      });
    } else {
      onAdd({
        title: title.trim(),
        cat,
        subCat,
        meta: meta || null,
        priorityLevel,
        deadline: noDeadline || longterm ? null : (deadline || null),
        startDate: null,
        endDate: null,
        time: time || null,
        done: false,
        archived: false,
        longterm,
        reminder,
        monthlyRepeat,
        repeatSourceId: null,
      });
    }
    resetForm();
    onClose();
  }

  useEffect(() => {
    if (open && editTask) {
      populateFromTask(editTask);
    }
  }, [open, editTask]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={handleClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="flex w-[460px] flex-col overflow-y-auto rounded-2xl border border-border-micro bg-bg-card p-5 shadow-2xl">
              {/* Header */}
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">{isEditing ? '编辑任务' : '添加任务'}</h2>
                <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-elevated">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {/* 1. 任务标题 */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-text-muted">任务标题 *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入任务标题"
                    className="h-8 w-full rounded-lg border border-border-micro bg-bg-elevated px-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent-blue"
                  />
                </div>

                {/* 2. 分类+子分类 */}
                <div className="flex gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-[11px] font-medium text-text-muted">分类 *</label>
                    <select
                      value={cat}
                      onChange={(e) => { setCat(e.target.value); setSubCat(null); }}
                      className="h-8 w-full rounded-lg border border-border-micro bg-bg-elevated px-2.5 text-sm text-text-primary outline-none focus:border-accent-blue"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedCat?.subCategories && selectedCat.subCategories.length > 0 && (
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-[11px] font-medium text-text-muted">子分类</label>
                      <select
                        value={subCat ?? ''}
                        onChange={(e) => setSubCat(e.target.value || null)}
                        className="h-8 w-full rounded-lg border border-border-micro bg-bg-elevated px-2.5 text-sm text-text-primary outline-none focus:border-accent-blue"
                      >
                        <option value="">无</option>
                        {selectedCat.subCategories.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. 日期时间 */}
                <div className="flex gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="flex items-center gap-1 text-[11px] font-medium text-text-muted">
                      <Calendar className="h-3 w-3" /> 日期
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      disabled={noDeadline || longterm}
                      className="h-8 w-full rounded-lg border border-border-micro bg-bg-elevated px-2.5 text-sm text-text-primary outline-none focus:border-accent-blue disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="flex items-center gap-1 text-[11px] font-medium text-text-muted">
                      <Clock className="h-3 w-3" /> 时间
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="h-8 w-full rounded-lg border border-border-micro bg-bg-elevated px-2.5 text-sm text-text-primary outline-none focus:border-accent-blue"
                    />
                  </div>
                </div>

                {/* 4. 优先级 */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-text-muted">优先级 *</label>
                  <div className="flex gap-1.5">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPriorityLevel(p.id)}
                        className={cn(
                          'flex-1 rounded-lg border px-1.5 py-1.5 text-[10px] font-medium transition-all',
                          priorityLevel === p.id
                            ? 'border-transparent text-white shadow-sm'
                            : 'border-border-micro bg-bg-elevated text-text-secondary'
                        )}
                        style={priorityLevel === p.id ? { backgroundColor: p.color } : undefined}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. 备注 */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-text-muted">备注</label>
                  <textarea
                    value={meta}
                    onChange={(e) => setMeta(e.target.value)}
                    placeholder="添加备注..."
                    rows={2}
                    className="w-full rounded-lg border border-border-micro bg-bg-elevated px-2.5 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent-blue resize-none"
                  />
                </div>

                {/* 6. 按月重复 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between rounded-lg border border-border-micro bg-bg-elevated px-2.5 py-2">
                    <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                      <Repeat className="h-3.5 w-3.5" />
                      按月重复
                    </div>
                    <button
                      onClick={() => setMonthlyRepeat(!monthlyRepeat)}
                      className={cn(
                        'h-4.5 w-8 rounded-full transition-colors',
                        monthlyRepeat ? 'bg-accent-blue' : 'bg-border-micro'
                      )}
                    >
                      <div className={cn(
                        'h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
                        monthlyRepeat ? 'translate-x-[16px]' : 'translate-x-[2px]'
                      )} />
                    </button>
                  </div>
                  {monthlyRepeat && (
                    <p className="text-[10px] text-text-muted pl-1">每月自动创建新任务，关闭后下月不再重复</p>
                  )}
                </div>

                {/* 7. 到期提醒 */}
                <div className="flex items-center justify-between rounded-lg border border-border-micro bg-bg-elevated px-2.5 py-2">
                  <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                    <Bell className="h-3.5 w-3.5" />
                    到期提醒
                  </div>
                  <button
                    onClick={() => setReminder(!reminder)}
                    className={cn(
                      'h-4.5 w-8 rounded-full transition-colors',
                      reminder ? 'bg-accent-blue' : 'bg-border-micro'
                    )}
                  >
                    <div className={cn(
                      'h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
                      reminder ? 'translate-x-[16px]' : 'translate-x-[2px]'
                    )} />
                  </button>
                </div>

                {/* 8. 不设截止日 / 长期常驻 */}
                <div className="flex items-center justify-between rounded-lg border border-border-micro bg-bg-elevated px-2.5 py-2">
                  <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                    <Infinity className="h-3.5 w-3.5" />
                    长期常驻（不设截止日）
                  </div>
                  <button
                    onClick={() => { setLongterm(!longterm); if (!longterm) setNoDeadline(true); }}
                    className={cn(
                      'h-4.5 w-8 rounded-full transition-colors',
                      longterm ? 'bg-accent-blue' : 'bg-border-micro'
                    )}
                  >
                    <div className={cn(
                      'h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
                      longterm ? 'translate-x-[16px]' : 'translate-x-[2px]'
                    )} />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={handleClose}
                  className="rounded-lg border border-border-micro px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-elevated"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="rounded-lg gradient-brand px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
                >
                  {isEditing ? '保存' : '提交'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
