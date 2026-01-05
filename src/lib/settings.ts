// Settings persistence utility
// Manages language and theme preferences with localStorage

export type Language = 'en' | 'ru' | 'hy' | 'ko';
export type Theme = 'light' | 'dark';

const SETTINGS_KEY = 'aide_user_settings';

interface UserSettings {
  language: Language;
  theme: Theme;
}

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  theme: 'light',
};

export function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        language: isValidLanguage(parsed.language) ? parsed.language : DEFAULT_SETTINGS.language,
        theme: isValidTheme(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
      };
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<UserSettings>): void {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

function isValidLanguage(value: unknown): value is Language {
  return typeof value === 'string' && ['en', 'ru', 'hy', 'ko'].includes(value);
}

function isValidTheme(value: unknown): value is Theme {
  return typeof value === 'string' && ['light', 'dark'].includes(value);
}
