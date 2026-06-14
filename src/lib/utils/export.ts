import type { Task } from '@/lib/types';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJSON(tasks: Task[]) {
  const data = JSON.stringify({ tasks, exportedAt: new Date().toISOString() }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  downloadBlob(blob, `taskflow-export-${new Date().toISOString().slice(0, 10)}.json`);
}

export function exportCSV(tasks: Task[]) {
  const headers = ['id', 'title', 'cat', 'subCat', 'priorityLevel', 'deadline', 'done', 'archived', 'longterm', 'meta'];
  const rows = tasks.map((t) => headers.map((h) => JSON.stringify((t as unknown as Record<string, unknown>)[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `taskflow-export-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportICS(tasks: Task[]) {
  const activeTasks = tasks.filter((t) => !t.archived && t.deadline);
  if (activeTasks.length === 0) return false;
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
  downloadBlob(blob, `taskflow-calendar-${new Date().toISOString().slice(0, 10)}.ics`);
  return true;
}
