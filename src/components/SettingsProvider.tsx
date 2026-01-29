import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    loadSettings,
    saveSettings,
    applyTheme,
    Language,
    Theme
} from '@/lib/settings';
import { translations, TranslationKey } from '@/lib/translations';

type SettingsContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    t: (key: TranslationKey) => string;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('en');
    const [theme, setThemeState] = useState<Theme>('light');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const settings = loadSettings();
        setLanguageState(settings.language);
        setThemeState(settings.theme);
        applyTheme(settings.theme);
        setIsLoaded(true);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        saveSettings({ language: lang });
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        saveSettings({ theme: newTheme });
        applyTheme(newTheme);
    };

    const t = (key: TranslationKey) => {
        return translations[language]?.[key] || translations['en'][key] || key;
    };

    if (!isLoaded) {
        return null; // Or a loading spinner
    }

    return (
        <SettingsContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettingsContext = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
};
