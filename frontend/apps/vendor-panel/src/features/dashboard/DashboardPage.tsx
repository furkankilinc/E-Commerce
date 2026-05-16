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
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic animate-pulse">VERİLER YÜKLENİYOR...</span>
                </div>
            </div>
        );
    }

    const stats = [
        {
            label: 'Toplam Gelir', 
            value: `${data?.stats.totalRevenue.toLocaleString() || 0} ₺`, 
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12V6m0 12v2m4-12H8" /></svg>
            ), 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50'
        },
        {
            label: 'Aktif Siparişler', 
            value: data?.stats.activeOrders.toString() || '0', 
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            ), 
            color: 'text-brand-pink', 
            bg: 'bg-rose-50'
        },
        {
            label: 'Toplam Stok', 
            value: data?.stats.totalStock.toLocaleString() || '0', 
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" /></svg>
            ), 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-50'
        },
        {
            label: 'Mağaza Puanı', 
            value: data?.stats.averageRating.toString() || '0.0', 
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            ), 
            color: 'text-amber-500', 
            bg: 'bg-amber-50'
        },
    ];

    const maxChartValue = Math.max(...(data?.chartData.map(d => d.amount) || [500]), 500);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <h1 className="text-[44px] font-black text-slate-900 tracking-[-0.04em] leading-none mb-3 italic">
                    PERFORMANS <span className="text-brand-pink">MERKEZİ</span>
                </h1>
                <p className="text-slate-400 font-bold text-lg italic opacity-80">Mağazanızın nabzını buradan tutun.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 flex flex-col gap-6 group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 cursor-pointer overflow-hidden relative">
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform relative z-10`}>
                            {stat.icon}
                        </div>
                        <div className="relative z-10">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">{stat.label}</span>
                            <span className="text-4xl font-black text-slate-900 leading-none tracking-tight italic">{stat.value}</span>
                        </div>
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${stat.bg} opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sales Chart Section */}
                <div className="lg:col-span-8 bg-white rounded-[4rem] p-12 shadow-sm border border-slate-50 min-h-[580px] flex flex-col relative overflow-hidden group">
                     {/* Background Grid Pattern */}
                     <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                    
                    <div className="flex items-center justify-between mb-12 relative z-10">
                        <div>
                           <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">SATIŞ ANALİZİ</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Son 7 Günlük Finansal Durum</p>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1">
                             <button className="px-6 py-2 bg-white rounded-xl text-[10px] font-black uppercase text-slate-900 shadow-sm italic">HAFTALIK</button>
                             <button className="px-6 py-2 rounded-xl text-[10px] font-black uppercase text-slate-400 italic opacity-50 cursor-not-allowed">AYLIK</button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end relative z-10">
                        <div className="h-[300px] flex items-end justify-between relative px-2">
                             {/* Chart Bars */}
                             {data?.chartData.map((d, i) => {
                                 const height = Math.max(8, (d.amount / maxChartValue) * 100);
                                 return (
                                     <div key={i} className="flex flex-col items-center gap-6 group/bar flex-1">
                                         <div className="relative w-full flex justify-center">
                                              <div className="absolute -top-12 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all transform translate-y-2 group-hover/bar:translate-y-0 whitespace-nowrap shadow-xl z-20">
                                                  {d.amount.toLocaleString()} ₺
                                              </div>
                                              <div 
                                                  className="w-4 rounded-full bg-slate-50 group-hover/bar:bg-brand-pink/20 transition-all duration-700 relative overflow-hidden flex flex-col justify-end shadow-inner"
                                                  style={{ height: '260px' }}
                                              >
                                                  <div 
                                                      className="w-full bg-brand-pink rounded-full transition-all duration-1000 origin-bottom shadow-lg"
                                                      style={{ height: `${height}%` }}
                                                  ></div>
                                              </div>
                                         </div>
                                         <span className="text-[11px] font-black text-slate-300 group-hover/bar:text-slate-900 transition-colors uppercase italic tracking-tighter">{d.day}</span>
                                     </div>
                                 );
                             })}
                        </div>
                    </div>
                </div>

                {/* Right Side: Critical Stock & Actions */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    {/* Critical Stock Alerts - White background now */}
                    <div className="bg-white rounded-[4rem] p-10 shadow-sm border border-slate-50 flex-1 flex flex-col group min-h-[350px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Kritik Stok</h3>
                            <Link to="/stocks" className="text-[9px] font-black text-brand-pink uppercase tracking-widest hover:underline italic">TÜMÜNÜ GÖR</Link>
                        </div>

                        <div className="space-y-8 flex-1">
                            {data?.lowStock.length === 0 ? (
                                <div className="h-full flex items-center justify-center py-10 opacity-50">
                                    <p className="text-slate-400 font-black italic text-sm text-center">ENVERTER GÜVENDE 🚀</p>
                                </div>
                            ) : (
                                data?.lowStock.map((item, i) => (
                                    <div key={i} className="group/item">
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-xs font-black text-slate-800 truncate max-w-[150px] uppercase italic tracking-tight">{item.name}</span>
                                            <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase italic">{item.stock} KALDI</span>
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
                            <Link key={i} to={btn.path} className={`aspect-square rounded-[3rem] ${btn.color} ${btn.hover} flex flex-col items-center justify-center gap-4 transition-all duration-500 shadow-sm border border-transparent hover:shadow-xl group`}>
                                <span className="text-3xl group-hover:scale-125 transition-transform duration-500">{btn.icon}</span>
                                <span className="text-[9px] font-black tracking-[0.2em]">{btn.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
