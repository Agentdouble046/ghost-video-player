import { create } from 'zustand';

interface ThemeStore {
  themeColor: string;
  customBackground: string | null;
  backgroundType: 'color' | 'image' | 'gif';
  setThemeColor: (color: string) => void;
  setCustomBackground: (background: string | null, type: 'color' | 'image' | 'gif') => void;
  resetToDefault: () => void;
}

const DEFAULT_THEME_COLOR = '#2196F3'; // Blue

export const useThemeStore = create<ThemeStore>((set) => ({
  themeColor: DEFAULT_THEME_COLOR,
  customBackground: null,
  backgroundType: 'color',
  
  setThemeColor: (color) => set({ themeColor: color }),
  
  setCustomBackground: (background, type) => set({ 
    customBackground: background, 
    backgroundType: type 
  }),
  
  resetToDefault: () => set({ 
    themeColor: DEFAULT_THEME_COLOR, 
    customBackground: null,
    backgroundType: 'color'
  }),
}));
