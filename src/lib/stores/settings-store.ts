import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SkinType = 'default' | 'neon' | 'huawei' | 'forest';

export interface BarkChannel {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
}

interface SettingsStore {
  skin: SkinType;
  fontSize: 'small' | 'medium' | 'large';
  showDone: boolean;
  hideEmptyCat: boolean;
  defaultSort: 'priority' | 'created_at';
  barkChannels: BarkChannel[];
  setSkin: (skin: SkinType) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setShowDone: (show: boolean) => void;
  setHideEmptyCat: (hide: boolean) => void;
  setDefaultSort: (sort: 'priority' | 'created_at') => void;
  setBarkChannels: (channels: BarkChannel[]) => void;
  addBarkChannel: (channel: BarkChannel) => void;
  updateBarkChannel: (id: number, updates: Partial<BarkChannel>) => void;
  removeBarkChannel: (id: number) => void;
  fetchBarkChannels: () => Promise<void>;
  getEnabledBarkUrls: () => string[];
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
    (set, get) => ({
      skin: 'default',
      fontSize: 'medium',
      showDone: true,
      hideEmptyCat: false,
      defaultSort: 'priority',
      barkChannels: [],
      setSkin: (skin) => set({ skin }),
      setFontSize: (fontSize) => set({ fontSize }),
      setShowDone: (showDone) => set({ showDone }),
      setHideEmptyCat: (hideEmptyCat) => set({ hideEmptyCat }),
      setDefaultSort: (defaultSort) => set({ defaultSort }),
      setBarkChannels: (barkChannels) => set({ barkChannels }),
      addBarkChannel: (channel) => set((s) => ({ barkChannels: [...s.barkChannels, channel] })),
      updateBarkChannel: (id, updates) => set((s) => ({
        barkChannels: s.barkChannels.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),
      removeBarkChannel: (id) => set((s) => ({
        barkChannels: s.barkChannels.filter((c) => c.id !== id),
      })),
      fetchBarkChannels: async () => {
        try {
          const res = await fetch('/api/bark-channels');
          if (res.ok) {
            const channels = await res.json();
            set({ barkChannels: channels });
          }
        } catch {}
      },
      getEnabledBarkUrls: () => {
        return get().barkChannels.filter((c) => c.enabled).map((c) => c.url);
      },
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
