import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../shared/api/apiClient';

interface DashboardData {
    stats: {
        totalRevenue: number;
        activeOrders: number;
        totalStock: number;
        averageRating: number;
    };
    chartData: { date: string, day: string, amount: number }[];
    lowStock: { name: string, stock: number, pct: number }[];
}

const DashboardPage: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get('/api/merchant/stats');
                if (res.ok) {
                    const stats = await res.json();
                    setData(stats);
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-10px font-semibold text-slate-400    animate-pulse">VERİLER YÜKLENİYOR...</span>
                </div>
            </div>
        );
    }

    const stats = [
        {
            label: 'Toplam Gelir',
            value: `${data?.stats?.totalRevenue?.toLocaleString() || 0} ₺`,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12V6m0 12v2m4-12H8" /></svg>
            ),
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            label: 'Aktif Siparişler',
            value: data?.stats?.activeOrders?.toString() || '0',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            ),
            color: 'text-brand-pink',
            bg: 'bg-rose-50'
        },
        {
            label: 'Toplam Stok',
            value: data?.stats?.totalStock?.toLocaleString() || '0',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" /></svg>
            ),
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            label: 'Mağaza Puanı',
            value: data?.stats?.averageRating?.toString() || '0.0',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            ),
            color: 'text-amber-500',
            bg: 'bg-amber-50'
        },
    ];

    const maxChartValue = Math.max(...(data?.chartData?.map(d => d.amount) || [500]), 500);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl lg:text-heading font-semibold text-slate-900 leading-none mb-3 ">
                    PERFORMANS <span className="text-brand-pink">MERKEZİ</span>
                </h1>
                <p className="text-slate-400 font-semibold text-sm sm:text-lg  opacity-80">Mağazanızın nabzını buradan tutun.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats?.map((stat, i) => (
                    <div key={i} className="bg-white p-6 sm:p-10 rounded-xl shadow-sm border border-slate-50 flex flex-col gap-4 sm:gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 cursor-pointer overflow-hidden relative">
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group- transition-transform relative z-10`}>
                            {stat.icon}
                        </div>
                        <div className="relative z-10">
                            <span className="text-10px font-semibold text-slate-400   block mb-2">{stat.label}</span>
                            <span className="text-2xl sm:text-4xl font-semibold text-slate-900 leading-none  ">{stat.value}</span>
                        </div>
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${stat?.bg} opacity-20 rounded-full blur-2xl  transition-transform duration-700`}></div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sales Chart Section */}
                <div className="lg:col-span-8 bg-white rounded-xl p-6 sm:p-10 lg:p-12 shadow-sm border border-slate-50 min-h-[480px] sm:min-h-[580px] flex flex-col relative overflow-hidden group">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900   ">SATIŞ ANALİZİ</h3>
                            <p className="text-10px font-semibold text-slate-400   mt-1">Son 7 Günlük Finansal Durum</p>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1 self-start sm:self-auto">
                            <button className="px-4 sm:px-6 py-2 bg-white rounded-xl text-[9px] sm:text-10px font-semibold  text-slate-900 shadow-sm ">HAFTALIK</button>
                            <button className="px-4 sm:px-6 py-2 rounded-xl text-[9px] sm:text-10px font-semibold  text-slate-400  opacity-50 cursor-not-allowed">AYLIK</button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end relative z-10">
                        <div className="h-[220px] sm:h-[300px] flex items-end justify-between relative px-2 gap-1 sm:gap-2">
                            {/* Chart Bars */}
                            {data?.chartData?.map((d, i) => {
                                const height = Math.max(8, (d.amount / maxChartValue) * 100);
                                return (
                                    <div key={i} className="flex flex-col items-center gap-4 sm:gap-6 group/bar flex-1">
                                        <div className="relative w-full flex justify-center">
                                            <div className="absolute -top-12 bg-slate-900 text-white text-10px font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all transform translate-y-2 group-hover/bar:translate-y-0 whitespace-nowrap  z-20">
                                                {d.amount?.toLocaleString() || 0} ₺
                                            </div>
                                            <div
                                                className="w-3 sm:w-4 rounded-full bg-slate-50 group-hover/bar:bg-brand-pink/20 transition-all duration-700 relative overflow-hidden flex flex-col justify-end shadow-inner"
                                                style={{ height: '180px' }}
                                            >
                                                <div
                                                    className="w-full bg-brand-pink rounded-full transition-all duration-1000 origin-bottom shadow-lg"
                                                    style={{ height: `${height}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="text-[9px] sm:text-caption font-semibold text-slate-300 group-hover/bar:text-slate-900 transition-colors   ">{d.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Side: Critical Stock & Actions */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    {/* Critical Stock Alerts - White background now */}
                    <div className="bg-white rounded-xl p-6 sm:p-10 shadow-sm border border-slate-50 flex-1 flex flex-col group min-h-[300px] sm:min-h-[350px]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-slate-900   ">Kritik Stok</h3>
                            <Link to="/stocks" className="text-nano font-semibold text-brand-pink   hover:underline ">TÜMÜNÜ GÖR</Link>
                        </div>

                        <div className="space-y-6 sm:space-y-8 flex-1">
                            {!data?.lowStock || data.lowStock.length === 0 ? (
                                <div className="h-full flex items-center justify-center py-10 opacity-50">
                                    <p className="text-slate-400 font-semibold  text-sm text-center">ENVANTER GÜVENDE 🚀</p>
                                </div>
                            ) : (
                                data?.lowStock?.map((item, i) => (
                                    <div key={i} className="group/item">
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-[150px]   ">{item.name}</span>
                                            <span className="text-10px font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full  ">{item.stock} KALDI</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                            <div
                                                className="h-full bg-brand-pink rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,101,157,0.3)]"
                                                style={{ width: `${item.pct}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Simple Action Grid - Adjusted for alignment */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'SİPARİŞLER', icon: '🛒', path: '/orders', color: 'bg-emerald-50 text-emerald-600', hover: 'hover:bg-emerald-500 hover:text-white' },
                            { label: 'STOK', icon: '📦', path: '/stocks', color: 'bg-indigo-50 text-indigo-600', hover: 'hover:bg-indigo-500 hover:text-white' },
                            { label: 'AYARLAR', icon: '⚙️', path: '/settings', color: 'bg-slate-50 text-slate-600', hover: 'hover:bg-slate-900 hover:text-white' },
                            { label: 'YORUMLAR', icon: '⭐', path: '/reviews', color: 'bg-amber-50 text-amber-600', hover: 'hover:bg-amber-500 hover:text-white' },
                        ].map((btn, i) => (
                            <Link key={i} to={btn.path} className={`aspect-square rounded-xl ${btn.color} ${btn.hover} flex flex-col items-center justify-center gap-4 transition-all duration-500 shadow-sm border border-transparent hover: group`}>
                                <span className="text-3xl transition-transform duration-500">{btn.icon}</span>
                                <span className="text-nano font-semibold ">{btn.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
