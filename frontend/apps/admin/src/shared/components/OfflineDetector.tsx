import React, { useState, useEffect } from 'react';

const OfflineDetector: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-xl p-12 max-w-md w-full mx-4 shadow-xl border border-gray-100 text-center transform scale-110">
                <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 relative">
                    <div className="absolute inset-0 bg-red-500/10 rounded-[1.5rem] animate-ping"></div>
                    <svg className="w-12 h-12 text-red-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="4" className="animate-[wifi_1.5s_infinite_0ms]" />
                        <path d="M8.5 16.5a5 5 0 0 1 7 0" className="animate-[wifi_1.5s_infinite_200ms]" />
                        <path d="M5 13a10 10 0 0 1 14 0" className="animate-[wifi_1.5s_infinite_400ms]" />
                        <path d="M2 8.82a15 15 0 0 1 20 0" className="animate-[wifi_1.5s_infinite_600ms]" />
                    </svg>
                </div>

                <style>{`
                    @keyframes wifi {
                        0%, 100% { opacity: 0.15; }
                        50% { opacity: 1; }
                    }
                `}</style>


                <h2 className="text-3xl font-semibold text-gray-900 mb-4   ">Bağlantı Kesildi</h2>
                <p className="text-gray-500 font-bold mb-5 leading-relaxed ">
                    İnternet bağlantınız şu an aktif değil. Bağlantı geri geldiğinde uygulama otomatik olarak yenilenecektir.
                </p>

                <div className="flex items-center justify-center gap-3 py-4 px-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-caption font-semibold text-gray-400   ">Bağlantı Bekleniyor...</span>
                </div>
            </div>
        </div>
    );
};

export default OfflineDetector;
