import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from '@/lib/stores/task-store';
import type { Task } from '@/lib/types';

const mockTask: Task = {
  id: 1,
  userId: 1,
  cat: 'project',
  subCat: null,
  parentId: null,
  title: '完成项目方案设计',
  meta: null,
  priorityLevel: 'urgent_important',
  deadline: '2026-06-30',
  startDate: null,
  endDate: null,
  time: '10:00',
  done: false,
  archived: false,
  longterm: false,
  reminder: true,
  monthlyRepeat: false,
  archivedAt: null,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

describe('TaskStore (PRD §3.4 任务管理)', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      selectedMonth: '2026-06',
      selectedDate: null,
      isLoading: false,
    });
  });

  describe('T-06 新增任务', () => {
    it('应能添加任务到列表', () => {
      useTaskStore.getState().addTask(mockTask);
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].title).toBe('完成项目方案设计');
    });

    it('应能添加多个任务', () => {
      useTaskStore.getState().addTask(mockTask);
      useTaskStore.getState().addTask({ ...mockTask, id: 2, title: '修复登录Bug' });
      expect(useTaskStore.getState().tasks).toHaveLength(2);
    });
  });

  describe('T-02 完成状态', () => {
    it('应能标记任务完成', () => {
      useTaskStore.getState().addTask(mockTask);
      useTaskStore.getState().updateTask(1, { done: true });
      expect(useTaskStore.getState().tasks[0].done).toBe(true);
    });

    it('应能取消完成状态', () => {
      useTaskStore.getState().addTask({ ...mockTask, done: true });
      useTaskStore.getState().updateTask(1, { done: false });
      expect(useTaskStore.getState().tasks[0].done).toBe(false);
    });
  });

  describe('T-04 任务编辑', () => {
    it('应能更新任务标题', () => {
      useTaskStore.getState().addTask(mockTask);
      useTaskStore.getState().updateTask(1, { title: '更新后的标题' });
      expect(useTaskStore.getState().tasks[0].title).toBe('更新后的标题');
    });

    it('应能更新任务优先级', () => {
      useTaskStore.getState().addTask(mockTask);
      useTaskStore.getState().updateTask(1, { priorityLevel: 'normal' });
      expect(useTaskStore.getState().tasks[0].priorityLevel).toBe('normal');
    });

    it('应能更新任务分类', () => {
      useTaskStore.getState().addTask(mockTask);
      useTaskStore.getState().updateTask(1, { cat: 'other', subCat: 'study-upgrade' });
      expect(useTaskStore.getState().tasks[0].cat).toBe('other');
      expect(useTaskStore.getState().tasks[0].subCat).toBe('study-upgrade');
    });
  });

  describe('T-05 任务删除', () => {
    it('应能删除指定任务', () => {
      useTaskStore.getState().addTask(mockTask);
      useTaskStore.getState().addTask({ ...mockTask, id: 2 });
      useTaskStore.getState().deleteTask(1);
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].id).toBe(2);
    });
  });

  describe('AR-01 归档管理', () => {
    it('应能归档任务', () => {
      useTaskStore.getState().addTask(mockTask);
      useTaskStore.getState().updateTask(1, { archived: true, archivedAt: '2026-06-10T00:00:00Z' });
      expect(useTaskStore.getState().tasks[0].archived).toBe(true);
    });

    it('应能激活恢复归档任务', () => {
      useTaskStore.getState().addTask({ ...mockTask, archived: true, archivedAt: '2026-06-10T00:00:00Z' });
      useTaskStore.getState().updateTask(1, { archived: false, archivedAt: null });
      expect(useTaskStore.getState().tasks[0].archived).toBe(false);
    });
  });

  describe('月份/日期选择', () => {
    it('应能切换选中月份', () => {
      useTaskStore.getState().setSelectedMonth('2026-07');
      expect(useTaskStore.getState().selectedMonth).toBe('2026-07');
    });

    it('应能选中日期', () => {
      useTaskStore.getState().setSelectedDate('2026-06-15');
      expect(useTaskStore.getState().selectedDate).toBe('2026-06-15');
    });

    it('应能取消选中日期', () => {
      useTaskStore.getState().setSelectedDate('2026-06-15');
      useTaskStore.getState().setSelectedDate(null);
      expect(useTaskStore.getState().selectedDate).toBeNull();
    });
  });

  describe('setTasks 批量设置', () => {
    it('应能批量替换任务列表', () => {
      const tasks = [
        mockTask,
        { ...mockTask, id: 2, title: '任务2' },
        { ...mockTask, id: 3, title: '任务3' },
      ];
      useTaskStore.getState().setTasks(tasks);
      expect(useTaskStore.getState().tasks).toHaveLength(3);
    });
  });
});
