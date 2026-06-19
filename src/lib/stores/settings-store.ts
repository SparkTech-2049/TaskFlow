import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SkinType = 'default' | 'neon' | 'huawei' | 'forest';

interface SettingsStore {
  skin: SkinType;
  fontSize: 'small' | 'medium' | 'large';
  showDone: boolean;
  hideEmptyCat: boolean;
  defaultSort: 'priority' | 'created_at';
  barkWebhook: string;
  setSkin: (skin: SkinType) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setShowDone: (show: boolean) => void;
  setHideEmptyCat: (hide: boolean) => void;
  setDefaultSort: (sort: 'priority' | 'created_at') => void;
  setBarkWebhook: (url: string) => void;
}

function applySkin(skin: SkinType) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-skin', skin);
  }
}

function applyFontSize(fontSize: 'small' | 'medium' | 'large') {
  if (typeof document !== 'undefined') {
    const map = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.fontSize = map[fontSize];
  }
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      skin: 'default',
      fontSize: 'medium',
      showDone: true,
      hideEmptyCat: false,
      defaultSort: 'priority',
      barkWebhook: '',
      setSkin: (skin) => set({ skin }),
      setFontSize: (fontSize) => set({ fontSize }),
      setShowDone: (showDone) => set({ showDone }),
      setHideEmptyCat: (hideEmptyCat) => set({ hideEmptyCat }),
      setDefaultSort: (defaultSort) => set({ defaultSort }),
      setBarkWebhook: (barkWebhook) => set({ barkWebhook }),
    }),
    {
      name: 'taskflow-settings',
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            applySkin(state.skin);
            applyFontSize(state.fontSize);
          }
        };
      },
    }
  )
);

export { applySkin, applyFontSize };
