import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '@/lib/stores/settings-store';

describe('SettingsStore (PRD §3.7 设置面板)', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      skin: 'default',
      fontSize: 'medium',
      showDone: true,
      hideEmptyCat: false,
      defaultSort: 'priority',
      barkWebhook: '',
    });
  });

  describe('S-01 外观设置', () => {
    it('应能切换字体大小', () => {
      useSettingsStore.getState().setFontSize('small');
      expect(useSettingsStore.getState().fontSize).toBe('small');
      useSettingsStore.getState().setFontSize('large');
      expect(useSettingsStore.getState().fontSize).toBe('large');
    });

    it('应能切换显示已完成', () => {
      useSettingsStore.getState().setShowDone(false);
      expect(useSettingsStore.getState().showDone).toBe(false);
    });

    it('应能切换隐藏空分类', () => {
      useSettingsStore.getState().setHideEmptyCat(true);
      expect(useSettingsStore.getState().hideEmptyCat).toBe(true);
    });
  });

  describe('S-02 皮肤切换', () => {
    it('默认皮肤应为 default', () => {
      expect(useSettingsStore.getState().skin).toBe('default');
    });

    it('应能切换到霓虹皮肤', () => {
      useSettingsStore.getState().setSkin('neon');
      expect(useSettingsStore.getState().skin).toBe('neon');
    });

    it('应能切换到华为皮肤', () => {
      useSettingsStore.getState().setSkin('huawei');
      expect(useSettingsStore.getState().skin).toBe('huawei');
    });

    it('切换皮肤应设置 data-skin 属性', () => {
      const spy = vi.spyOn(document.documentElement, 'setAttribute');
      useSettingsStore.getState().setSkin('neon');
      expect(spy).toHaveBeenCalledWith('data-skin', 'neon');
      spy.mockRestore();
    });
  });

  describe('S-03 任务管理', () => {
    it('默认排序应为优先级', () => {
      expect(useSettingsStore.getState().defaultSort).toBe('priority');
    });

    it('应能切换到创建时间排序', () => {
      useSettingsStore.getState().setDefaultSort('created_at');
      expect(useSettingsStore.getState().defaultSort).toBe('created_at');
    });
  });

  describe('S-05 通知推送', () => {
    it('应能设置 BARK Webhook URL', () => {
      useSettingsStore.getState().setBarkWebhook('https://api.day.app/xxx');
      expect(useSettingsStore.getState().barkWebhook).toBe('https://api.day.app/xxx');
    });
  });
});
