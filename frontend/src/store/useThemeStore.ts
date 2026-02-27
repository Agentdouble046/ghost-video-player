import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeStore {
  themeColor: string;
  customBackground: string | null;
  backgroundType: 'color' | 'image' | 'gif';
  setThemeColor: (color: string) => void;
  setCustomBackground: (background: string | null, type: 'color' | 'image' | 'gif') => void;
  resetToDefault: () => void;
}

const DEFAULT_THEME_COLOR = '#2196F3'; // Blue

export const useThemeStore = create<ThemeStore>()(  
  persist(
    (set) => ({
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
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
