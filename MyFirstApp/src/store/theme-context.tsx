import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { Colors, type ThemeType, type ThemeMode } from '../constants/theme';
import { getItem, setItem } from '../services/storage';

const THEME_STORAGE_KEY = 'dp_theme_mode';

interface ThemeContextValue {
  theme: ThemeType;
  themeMode: ThemeMode;
  isDark: boolean;
  colors: typeof Colors.dark;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    async function loadSavedTheme() {
      try {
        const saved = await getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved as ThemeMode);
        }
      } catch {
        // fallback
      }
    }
    loadSavedTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await setItem(THEME_STORAGE_KEY, mode);
  };

  const toggleTheme = async () => {
    const nextMode: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    await setThemeMode(nextMode);
  };

  const theme: ThemeType = useMemo(() => {
    if (themeMode === 'system') {
      return deviceColorScheme === 'light' ? 'light' : 'dark';
    }
    return themeMode;
  }, [themeMode, deviceColorScheme]);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDark: theme === 'dark',
      colors: Colors[theme],
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
