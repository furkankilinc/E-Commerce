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

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, subtext }) => (
    <div className={`bg-gradient-to-br ${color} border rounded-[2.5rem] p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 duration-300`}>
        <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md animate-float">
                {icon}
            </div>
        </div>
        <div className="text-4xl font-black text-admin-dark mb-2 tracking-tight">{value}</div>
        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{label}</div>
        <div className="text-xs text-slate-400 mt-2 font-medium">{subtext}</div>
    </div>
);

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState({
        totalMerchants: 0,
        totalProducts: 0,
        onlineUsers: 0,
        totalUsers: 0,
        lowStock: [] as any[]
    });
    const [mapData, setMapData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

    return (
        <div className="p-10 font-['Inter'] relative">
            {/* Global Loader Indicator */}
            {isLoading && (
                <div className="fixed top-0 left-0 right-0 h-1 bg-indigo-500/20 z-[9999]">
                    <div className="h-full bg-indigo-500 animate-progress origin-left"></div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-admin-navy rounded-2xl flex items-center justify-center shadow-xl shadow-admin-navy/20">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-black text-admin-dark tracking-tight">Kontrol Paneli</h1>
                    </div>
                    <p className="text-slate-500 font-medium text-lg ml-1">Platformdaki tüm aktiviteleri canlı olarak izleyin.</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <StatCard
                    label="Toplam Satıcı"
                    value={stats.totalMerchants}
                    subtext="Aktif mağaza sayısı"
                    color="from-indigo-500/10 to-indigo-500/5 border-indigo-500/10"
                    icon={<svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                />
                <StatCard
                    label="Toplam Ürün"
                    value={stats.totalProducts}
                    subtext="Sitedeki yayında ürünler"
                    color="from-blue-500/10 to-blue-500/5 border-blue-500/10"
                    icon={<svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" /></svg>}
                />
                <StatCard
                    label="Çevrimiçi"
                    value={stats.onlineUsers}
                    subtext="Son 15 dk aktif kullanıcı"
                    color="from-emerald-500/10 to-emerald-500/5 border-emerald-500/10"
                    icon={<svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                />
                <StatCard
                    label="Toplam Hesap"
                    value={stats.totalUsers}
                    subtext="Kayıtlı kullanıcı profili"
                    color="from-rose-500/10 to-rose-500/5 border-rose-500/10"
                    icon={<svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Critical Stock Alerts */}
                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-sm transition-all hover:shadow-xl duration-500">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black text-admin-navy uppercase tracking-tight italic flex items-center gap-3">
                            <span className="w-2 h-2 bg-brand-pink rounded-full animate-pulse"></span>
                            Kritik Stok Uyarıları
                        </h3>
                        <a href="/products" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-pink transition-colors italic">TÜM ÜRÜNLER</a>
                    </div>
                    <div className="space-y-6">
                        {!stats.lowStock || stats.lowStock.length === 0 ? (
                            <div className="py-20 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Her şey yolunda görünüyor</p>
                            </div>
                        ) : (
                            [...stats.lowStock]
                                .sort((a, b) => a.stock - b.stock)
                                .map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-admin-navy group-hover:text-brand-pink transition-colors italic uppercase leading-tight">{item.name}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic mt-1">{item.merchant?.companyName}</span>
                                        </div>
                                        <span className="px-4 py-2 bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest italic">{item.stock} KALDI</span>
                                    </div>
                                ))
                        )}
                    </div>
                </div>

                {/* Sales Activity Preview */}
                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-sm overflow-hidden flex flex-col group">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black text-admin-navy uppercase tracking-tight italic flex items-center gap-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            Son 30 Günlük Aktivite
                        </h3>
                        <a href="/analytics" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors italic">DETAYLI ANALİZ</a>
                    </div>
                    <div className="flex-1 min-h-[300px] flex items-end justify-between px-4 pb-4">
                        {/* Simplistic bar chart preview with brand-pink */}
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-4 flex-1">
                                <div className="w-2.5 bg-slate-100 rounded-full h-[200px] relative overflow-hidden flex items-end">
                                    <div 
                                        className="w-full bg-brand-pink transition-all duration-1000 rounded-full" 
                                        style={{ height: `${Math.random() * 80 + 20}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Map Section */}
            <div className="bg-white rounded-[3.5rem] p-4 shadow-sm border border-slate-50 mb-12">
                <div className="p-8 pb-4">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2 uppercase italic">Platform Aktivite Haritası</h2>
                    <p className="text-slate-400 font-medium text-sm text-left">Satıcıların ve aktif kullanıcıların konumlarını anlık olarak takip edin.</p>
                </div>
                <DashboardMap points={mapData} />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-[3rem] border border-slate-50 p-12 shadow-sm relative overflow-hidden group">
                <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-brand-pink/5 rounded-full blur-[100px] pointer-events-none"></div>
                <h2 className="text-xl font-extrabold text-admin-dark mb-10 flex items-center gap-3 italic uppercase relative z-10">
                    <span className="w-8 h-1 bg-brand-pink rounded-full"></span>
                    Hızlı İşlemler
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 relative z-10">
                    {[
                        { label: 'Kategori Ekle', path: '/categories', color: 'bg-indigo-600 shadow-indigo-200' },
                        { label: 'Ürün Yönet', path: '/products', color: 'bg-blue-600 shadow-blue-200' },
                        { label: 'Satıcı Listesi', path: '/sellers', color: 'bg-emerald-600 shadow-emerald-200' },
                        { label: 'Sistem Logları', path: '/analytics', color: 'bg-rose-600 shadow-rose-200' },
                    ].map(action => (
                        <a
                            key={action.label}
                            href={action.path}
                            className={`${action.color} text-white rounded-2xl px-6 py-6 text-[10px] font-black uppercase tracking-widest text-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-500 italic`}
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
