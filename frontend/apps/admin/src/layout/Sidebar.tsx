import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
    {
        label: 'Dashboard',
        path: '/dashboard',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        )
    },
    {
        label: 'Kategoriler',
        path: '/categories',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
        )
    },
    {
        label: 'Ürünler',
        path: '/products',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
            </svg>
        )
    },
    {
        label: 'Siparişler',
        path: '/orders',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        )
    },
    {
        label: 'Satıcılar',
        path: '/sellers',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        )
    },
    {
        label: 'Kullanıcılar',
        path: '/users',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        )
    },
    {
        label: 'Analitik',
        path: '/analytics',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        )
    },
    {
        label: 'Kargo Firmaları',
        path: '/shipping',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
        )
    },
    {
        label: 'Canlı Destek',
        path: '/support',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        )
    },
];

const Sidebar: React.FC<{ 
    collapsed: boolean; 
    onToggle: () => void;
    isOpenOnMobile?: boolean;
    onCloseMobile?: () => void;
}> = ({ collapsed, onToggle, isOpenOnMobile = false, onCloseMobile }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/login');
    };

    return (
        <aside className={`h-screen bg-admin-navy flex flex-col transition-all duration-300 
            ${collapsed ? 'w-20' : 'w-64'} 
            flex-shrink-0 md:sticky md:top-0
            fixed md:relative inset-y-0 left-0 z-50
            transform md:transform-none md:translate-x-0
            ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            {/* Logo */}
            <div className={`flex items-center gap-3 px-5 h-16 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 bg-brand-pink rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-pink/20">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                {!collapsed && <span className="text-white font-bold  text-lg">Fuira Admin</span>}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {NAV_ITEMS.map(item => {
                    const active = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={collapsed ? item.label : undefined}
                            onClick={() => onCloseMobile?.()}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${active
                                ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/20'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                } ${collapsed ? 'justify-center' : ''}`}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            {!collapsed && <span className="text-sm font-semibold">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="p-3 border-t border-white/5 space-y-1">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all md:flex hidden"
                    title={collapsed ? 'Genişlet' : 'Daralt'}
                >
                    <svg className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    {!collapsed && <span className="text-sm font-semibold">Daralt</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
