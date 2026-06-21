'use client';

import { useEffect, useRef } from 'react';
import { useTaskStore } from '@/lib/stores/task-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { CAT_NAMES } from '@/components/shared/constants';

const NOTIFIED_KEY = 'taskflow-notified-reminders';
const EARLY_MS = 3_000;
const LATE_MS = 5_000;

function getNotifiedSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(NOTIFIED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveNotifiedSet(set: Set<string>) {
  sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
}

async function sendBark(webhook: string, title: string, body: string, group?: string) {
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, ...(group ? { group } : {}) }),
    });
  } catch {}
}

function getLocalToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTaskReminderTime(t: { deadline: string | null; time: string | null }): number | null {
  if (t.deadline && t.time) {
    const d = new Date(`${t.deadline}T${t.time}`);
    return isNaN(d.getTime()) ? null : d.getTime();
  }
  if (t.deadline) {
    const d = new Date(`${t.deadline}T23:59:59`);
    return isNaN(d.getTime()) ? null : d.getTime();
  }
  return null;
}

function getDailyReminderTime(t: { deadline: string | null; time: string | null }): number | null {
  if (t.deadline || !t.time) return null;
  const today = getLocalToday();
  const d = new Date(`${today}T${t.time}`);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export function ReminderScheduler() {
  const tasks = useTaskStore((s) => s.tasks);
  const barkChannels = useSettingsStore((s) => s.barkChannels);
  const notifiedRef = useRef<Set<string>>(getNotifiedSet());
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const enabledUrls = barkChannels.filter((c) => c.enabled).map((c) => c.url);
    if (enabledUrls.length === 0) return;

    const now = Date.now();
    const notified = notifiedRef.current;

    const pending: { id: number; key: string; title: string; remindAt: number; cat: string; isDaily: boolean }[] = [];

    for (const t of tasks) {
      if (!t.reminder || t.done || t.archived) continue;

      const remindAt = getTaskReminderTime(t);
      if (remindAt !== null) {
        const key = `${t.id}-${t.deadline}-${t.time ?? ''}`;
        if (!notified.has(key)) {
          const diff = remindAt - now;
          if (diff > -LATE_MS && diff < 24 * 3600_000) {
            pending.push({ id: t.id, key, title: t.title, remindAt, cat: t.cat, isDaily: false });
          }
        }
      }

      const dailyAt = getDailyReminderTime(t);
      if (dailyAt !== null) {
        const today = getLocalToday();
        const key = `${t.id}-daily-${today}-${t.time}`;
        if (!notified.has(key)) {
          const diff = dailyAt - now;
          if (diff > -LATE_MS && diff < 24 * 3600_000) {
            pending.push({ id: t.id, key, title: t.title, remindAt: dailyAt, cat: t.cat, isDaily: true });
          }
        }
      }
    }

    for (const p of pending) {
      const delay = Math.max(0, p.remindAt - EARLY_MS - now);
      const timer = window.setTimeout(() => {
        if (notifiedRef.current.has(p.key)) return;
        notifiedRef.current.add(p.key);
        saveNotifiedSet(notifiedRef.current);
        const groupName = CAT_NAMES[p.cat] || p.cat;
        const body = p.isDaily ? `「${p.title}」提醒时间到了！` : `「${p.title}」已到期！`;
        for (const url of enabledUrls) {
          sendBark(url, 'TaskFlow 提醒', body, groupName);
        }
      }, delay);
      timersRef.current.push(timer);
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [tasks, barkChannels]);

  return null;
}
