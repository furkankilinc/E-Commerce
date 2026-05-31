import React, { createContext, useContext, useState } from 'react';
import tr from '../locales/tr.json';
import en from '../locales/en.json';

const translations: Record<string, any> = { tr, en };

export type Locale = 'tr' | 'en';

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((prev, curr) => {
        return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<Locale>(() => {
        const saved = localStorage.getItem('locale') as Locale;
        if (saved === 'tr' || saved === 'en') return saved;
        // Detect default browser/system language
        const browserLang = navigator.language.split('-')[0];
        return browserLang === 'tr' ? 'tr' : 'en';
    });

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem('locale', newLocale);
    };

    const t = (key: string, params?: Record<string, string | number>): string => {
        let text = getNestedValue(translations[locale], key) || getNestedValue(translations['tr'], key) || key;
        if (params && typeof text === 'string') {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
            });
        }
        return text;
    };

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
};
