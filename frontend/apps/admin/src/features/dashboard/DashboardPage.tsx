import React, { useEffect, useState } from 'react';
import { apiClient } from '../../shared/api/apiClient';
import DashboardMap from './components/DashboardMap';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtext: string;
}

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState({
        totalMerchants: 0,
        totalProducts: 0,
        onlineUsers: 0,
        totalUsers: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [statsRes, mapRes] = await Promise.all([
                    apiClient.get('/api/admin/stats/dashboard'),
                    apiClient.get('/api/admin/stats/map')
                ]);

                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data.stats);
                }
                if (mapRes.ok) {
                    const data = await mapRes.json();
                    setMapData(data.data.merchants.concat(data.data.users));
                }
            } catch (e) {
                console.error('Dashboard data load failed', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();

        // Refresh online users every minute
        const poll = setInterval(async () => {
            const statsRes = await apiClient.get('/api/admin/stats/dashboard');
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
            }
        }, 60000);

        return () => clearInterval(poll);
    }, []);

    const cards: StatCard[] = [
        {
            label: 'Toplam Kategori',
            value: stats.totalCategories,
            change: 'Aktif kategoriler',
            positive: true,
            color: 'from-brand-pink/10 to-brand-pink/5 border-brand-pink/20',
            icon: (
                <svg className="w-6 h-6 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
        },
        {
            label: 'Toplam Ürün',
            value: stats.totalProducts,
            change: 'Yayındaki ürünler',
            positive: true,
            color: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
            icon: (
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
                </svg>
            ),
        },
        {
            label: 'Toplam Satıcı',
            value: stats.totalSellers,
            change: 'Onaylı satıcılar',
            positive: true,
            color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
            icon: (
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
        },
        {
            label: 'Toplam Kullanıcı',
            value: stats.totalUsers,
            change: 'Kayıtlı müşteriler',
            positive: true,
            color: 'from-violet-500/10 to-violet-500/5 border-violet-500/20',
            icon: (
                <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-admin-dark tracking-tight">Dashboard</h1>
                <p className="text-slate-500 mt-1 font-medium">Platforma genel bakış.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                {cards.map(card => (
                    <div key={card.label} className={`bg-gradient-to-br ${card.color} border rounded-2xl p-6`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                {card.icon}
                            </div>
                        </div>
                        <div className="text-3xl font-extrabold text-admin-dark mb-1">{card.value}</div>
                        <div className="text-sm font-bold text-slate-500">{card.label}</div>
                        <div className="text-xs text-slate-400 mt-1">{card.change}</div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h2 className="text-lg font-extrabold text-admin-dark mb-6">Hızlı İşlemler</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Kategori Ekle', path: '/categories', color: 'bg-brand-pink' },
                        { label: 'Ürün Yönet', path: '/products', color: 'bg-blue-500' },
                        { label: 'Satıcılar', path: '/sellers', color: 'bg-emerald-500' },
                        { label: 'Analitik', path: '/analytics', color: 'bg-violet-500' },
                    ].map(action => (
                        <a
                            key={action.label}
                            href={action.path}
                            className={`${action.color} text-white rounded-xl px-4 py-3 text-sm font-bold text-center hover:opacity-90 transition-opacity`}
                        >
                            {action.label}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
