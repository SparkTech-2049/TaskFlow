import { describe, it, expect } from 'vitest';
import { CATEGORIES, PRIORITIES, QUADRANT_COLORS, CROSS_MONTH_COLORS } from '@/lib/constants';

describe('分类体系 (PRD §5.3 + PRD-Mobile §4)', () => {
  describe('一级分类', () => {
    it('应包含工作/琐事/理财三个分类', () => {
      const catIds = CATEGORIES.map((c) => c.id);
      expect(catIds).toContain('project');
      expect(catIds).toContain('other');
      expect(catIds).toContain('credit');
    });

    it('工作分类颜色应为 #2B8CED', () => {
      const project = CATEGORIES.find((c) => c.id === 'project');
      expect(project?.color).toBe('#2B8CED');
    });

    it('琐事分类颜色应为 #8B6FC0', () => {
      const other = CATEGORIES.find((c) => c.id === 'other');
      expect(other?.color).toBe('#8B6FC0');
    });

    it('理财分类颜色应为 #E5534D', () => {
      const credit = CATEGORIES.find((c) => c.id === 'credit');
      expect(credit?.color).toBe('#E5534D');
    });
  });

  describe('二级分类（仅琐事）', () => {
    const otherCat = CATEGORIES.find((c) => c.id === 'other');

    it('应包含5个二级分类', () => {
      expect(otherCat?.subCategories).toHaveLength(5);
    });

    it('应包含项目搭建/学习提升/长期维护/注册下载/随手办', () => {
      const names = otherCat!.subCategories!.map((s) => s.name);
      expect(names).toContain('项目搭建');
      expect(names).toContain('学习提升');
      expect(names).toContain('长期维护');
      expect(names).toContain('注册下载');
      expect(names).toContain('随手办');
    });

    it('所有二级分类应嵌套在琐事分类下', () => {
      expect(otherCat?.subCategories).toBeDefined();
      expect(otherCat!.subCategories!.length).toBe(5);
    });
  });
});

describe('优先级体系 (PRD §6.1)', () => {
  it('应包含4个优先级', () => {
    expect(PRIORITIES).toHaveLength(4);
  });

  it('紧急且重要应为红色 #E53E3E', () => {
    const urgent = PRIORITIES.find((p) => p.id === 'urgent_important');
    expect(urgent?.color).toBe('#E53E3E');
  });

  it('重要不紧急应为黄色 #FFC107', () => {
    const important = PRIORITIES.find((p) => p.id === 'important');
    expect(important?.color).toBe('#FFC107');
  });

  it('紧急不重要应为橙色 #ED8936', () => {
    const urgent = PRIORITIES.find((p) => p.id === 'urgent');
    expect(urgent?.color).toBe('#ED8936');
  });

  it('普通应为微信绿 #07C160', () => {
    const normal = PRIORITIES.find((p) => p.id === 'normal');
    expect(normal?.color).toBe('#07C160');
  });
});

describe('四象限颜色 (PRD §6.2)', () => {
  it('重要紧急底色应为 #E53E3E06', () => {
    expect(QUADRANT_COLORS.urgent_important.bg).toBe('#E53E3E06');
  });

  it('重要紧急边框应为 #E53E3E20', () => {
    expect(QUADRANT_COLORS.urgent_important.border).toBe('#E53E3E20');
  });

  it('不重要不紧急标题色应为微信绿 #07C160', () => {
    expect(QUADRANT_COLORS.normal.title).toBe('#07C160');
  });

  it('不重要不紧急底色应为 #07C16006', () => {
    expect(QUADRANT_COLORS.normal.bg).toBe('#07C16006');
  });
});

describe('跨月类型颜色 (PRD §6.3)', () => {
  it('逾期结转底色应为 #E53E3E06', () => {
    expect(CROSS_MONTH_COLORS.overdue.bg).toBe('#E53E3E06');
  });

  it('长期常驻底色应为 #8B6CFF06', () => {
    expect(CROSS_MONTH_COLORS.longterm.bg).toBe('#8B6CFF06');
  });

  it('跨期展示底色应为 #3B6EF606', () => {
    expect(CROSS_MONTH_COLORS.cross_period.bg).toBe('#3B6EF606');
  });
});
