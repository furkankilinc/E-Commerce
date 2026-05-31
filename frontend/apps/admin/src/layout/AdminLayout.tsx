import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { adminAuthStore } from '../features/auth/admin.store';
import { apiClient } from '../shared/api/apiClient';

const AdminLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const navigate = useNavigate();

    // Force light theme on admin panel mount
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('admin_theme', 'light');
    }, []);

    // Session Check & Proactive Refresh
    useEffect(() => {
        if (!adminAuthStore.isAuthenticated()) {
            navigate('/login');
            return;
        }

        const interval = setInterval(async () => {
            try {
                const rfToken = adminAuthStore.getRefreshToken();
                if (rfToken) {
                    // Try to refresh proactively
                    const res = await apiClient.post('/api/auth/admin/refresh', { refreshToken: rfToken });
                    if (!res.ok) {
                        adminAuthStore.clearAuth();
                        navigate('/login');
                    }
                }
            } catch (err) {
                console.error('Proactive refresh failed', err);
            }
        }, 10 * 60 * 1000); // 10 minutes

        return () => clearInterval(interval);
    }, [navigate]);

    return (
        <div className="flex min-h-screen bg-admin-bg relative transition-colors duration-300">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-admin-navy flex items-center justify-between px-6 z-40 border-b border-white/5 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-pink rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <span className="font-bold text-md">Fuira Admin</span>
                </div>
                
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsMobileOpen(p => !p)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-300 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Mobile Backdrop overlay */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar 
                collapsed={collapsed} 
                onToggle={() => setCollapsed(p => !p)} 
                isOpenOnMobile={isMobileOpen}
                onCloseMobile={() => setIsMobileOpen(false)}
            />

            {/* Main Panel */}
            <main className="flex-1 overflow-auto pt-16 md:pt-0 min-h-screen">

                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
