import { useState, useEffect, useCallback } from 'react';
import { 
  loadSettings, 
  saveSettings, 
  applyTheme, 
  Language, 
  Theme 
} from '@/lib/settings';

export function useSettings() {
  const [language, setLanguageState] = useState<Language>('en');
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const settings = loadSettings();
    setLanguageState(settings.language);
    setThemeState(settings.theme);
    applyTheme(settings.theme);
    setIsLoaded(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    saveSettings({ language: lang });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    saveSettings({ theme: newTheme });
    applyTheme(newTheme);
  }, []);

  return {
    language,
    theme,
    setLanguage,
    setTheme,
    isLoaded,
  };
}

export type { Language, Theme };
