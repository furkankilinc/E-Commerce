import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastThemeConfig {
    title: string;
    statusBarColor: string;
    textColor: string;
    iconBgColor: string;
    iconColor: string;
    iconSvg: React.ReactNode;
}

// SINGLE-POINT THEME CONFIGURATION FOR ALL ALERTS
export const TOAST_THEMES: Record<ToastType, ToastThemeConfig> = {
    success: {
        title: 'BAŞARILI',
        statusBarColor: 'bg-brand-pink',
        textColor: 'text-brand-pink',
        iconBgColor: 'bg-brand-pink/15',
        iconColor: 'text-brand-pink',
        iconSvg: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        )
    },
    error: {
        title: 'HATA',
        statusBarColor: 'bg-red-500',
        textColor: 'text-red-500',
        iconBgColor: 'bg-red-500/15',
        iconColor: 'text-red-500',
        iconSvg: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        )
    },
    warning: {
        title: 'UYARI',
        statusBarColor: 'bg-amber-500',
        textColor: 'text-amber-500',
        iconBgColor: 'bg-amber-500/15',
        iconColor: 'text-amber-500',
        iconSvg: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        )
    },
    info: {
        title: 'BİLGİ',
        statusBarColor: 'bg-gray-900',
        textColor: 'text-gray-900',
        iconBgColor: 'bg-gray-900/10',
        iconColor: 'text-gray-900',
        iconSvg: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    }
};

interface ToastContextType {
    show: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const remove = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const show = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        setTimeout(() => {
            remove(id);
        }, duration);
    }, [remove]);

    const success = useCallback((message: string, duration?: number) => show(message, 'success', duration), [show]);
    const error = useCallback((message: string, duration?: number) => show(message, 'error', duration), [show]);
    const info = useCallback((message: string, duration?: number) => show(message, 'info', duration), [show]);
    const warning = useCallback((message: string, duration?: number) => show(message, 'warning', duration), [show]);

    return (
        <ToastContext.Provider value={{ show, success, error, info, warning }}>
            {children}
            {/* Toast Container Stack */}
            <div className="fixed top-6 right-6 left-6 sm:left-auto z-[99999] flex flex-col gap-3 max-w-sm w-full mx-auto sm:mx-0">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        onClick={() => remove(t.id)}
                        className="bg-white/90 backdrop-blur-md border border-gray-100/50 p-4 rounded-[1.25rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4 cursor-pointer  active:scale-[0.98] transition-all duration-300 animate-toast overflow-hidden relative group"
                    >
                        {/* Status bar */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1 ${TOAST_THEMES[t.type].statusBarColor}`} />

                        <div className="flex items-center gap-3.5 pl-1.5 flex-1 min-w-0">
                            <div className={`w-9 h-9 rounded-xl ${TOAST_THEMES[t.type].iconBgColor} flex items-center justify-center ${TOAST_THEMES[t.type].iconColor} shrink-0 shadow-xs`}>
                                {TOAST_THEMES[t.type].iconSvg}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className={`text-10px font-[1000] tracking-wider italic leading-none mb-1 ${TOAST_THEMES[t.type].textColor}`}>
                                    {TOAST_THEMES[t.type].title}
                                </span>
                                <p className="text-11px font-bold text-gray-700 italic leading-snug line-clamp-2">{t.message}</p>
                            </div>
                        </div>

                        <button
                            aria-label="Kapat"
                            onClick={(e) => { e.stopPropagation(); remove(t.id); }}
                            className="p-1 rounded-md text-gray-300 hover:text-gray-900 hover:bg-gray-50 transition-colors shrink-0"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
