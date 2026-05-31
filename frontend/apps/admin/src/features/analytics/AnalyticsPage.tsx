import React, { useEffect, useState } from 'react';
import { apiClient } from '../../shared/api/apiClient';

interface AnalyticsData {
    date: string;
    revenue: number;
    orders: number;
}

const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [topMerchants, setTopMerchants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'30days' | '7days' | 'alltime'>('30days');
    const [selectedBar, setSelectedBar] = useState<number | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get('/api/admin/stats/analytics');
                const json = await apiClient.handleResponse(res);
                if (json.success) {
                    setData(json.data || []);
                    setCategories(json.categories || []);
                    setTopMerchants(json.merchants || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    // Filtered data based on active tab
    const getFilteredData = () => {
        if (activeTab === '7days') return data.slice(-7);
        return data;
    };

    const filteredData = getFilteredData();
    const totalRevenue = filteredData.reduce((acc, d) => acc + d.revenue, 0);
    const totalOrders = filteredData.reduce((acc, d) => acc + d.orders, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const maxRevenue = Math.max(...filteredData.map(d => d.revenue), 100);
    const maxOrders = Math.max(...filteredData.map(d => d.orders), 5);

    const categoryColors = ['bg-rose-500', 'bg-indigo-500', 'bg-amber-500', 'bg-emerald-500'];

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10 font-['Inter'] bg-[#f8fafc] min-h-screen">
            {/* Header section with Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-[1000] text-admin-navy  leading-none mb-3">
                        PLATFORM <span className="text-brand-pink">ANALİTİĞİ</span>
                    </h1>
                    <p className="text-xs font-semibold text-slate-400  opacity-85">
                        Platform genelindeki satış trendleri, kategori oranları ve satıcı analitiği
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {/* Time Filter Tabs */}
                    <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-1 sm:flex-initial justify-between">
                        {(['7days', '30days', 'alltime'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setSelectedBar(null);
                                }}
                                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex-1 sm:flex-initial text-center ${activeTab === tab
                                    ? 'bg-brand-pink text-white shadow-sm'
                                    : 'text-slate-500 hover:text-admin-navy dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {tab === '7days' ? '7 Gün' : tab === '30days' ? '30 Gün' : 'Tümü'}
                            </button>
                        ))}
                    </div>

                    {/* Export Action Button */}
                    <button className="flex items-center justify-center gap-2 bg-admin-navy text-white hover:bg-admin-navy/90 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        RAPOR İNDİR
                    </button>
                </div>
            </div>

            {/* Quick KPI Stats Dashboard Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Revenue Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-[5rem] -mr-4 -mt-4 transition-all group-hover:scale-110 duration-300"></div>
                    <div className="z-10">
                        <span className="text-10px font-bold text-slate-400 block mb-3 uppercase ">Toplam Hacim</span>
                        <h2 className="text-3xl font-[1000] text-admin-navy  mb-2">
                            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-9 9-4-4-6 6" />
                            </svg>
                            +14.2% artış
                        </span>
                    </div>
                </div>

                {/* Orders Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[5rem] -mr-4 -mt-4 transition-all group-hover:scale-110 duration-300"></div>
                    <div className="z-10">
                        <span className="text-10px font-bold text-slate-400 block mb-3 uppercase ">Toplam Sipariş</span>
                        <h2 className="text-3xl font-[1000] text-indigo-600  mb-2">
                            {totalOrders.toLocaleString()} Adet
                        </h2>
                        <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-9 9-4-4-6 6" />
                            </svg>
                            +8.4% artış
                        </span>
                    </div>
                </div>

                {/* AOV Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[5rem] -mr-4 -mt-4 transition-all group-hover:scale-110 duration-300"></div>
                    <div className="z-10">
                        <span className="text-10px font-bold text-slate-400 block mb-3 uppercase ">Ortalama Sepet</span>
                        <h2 className="text-3xl font-[1000] text-amber-500  mb-2">
                            ${averageOrderValue.toFixed(2)}
                        </h2>
                        <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-9 9-4-4-6 6" />
                            </svg>
                            +5.3% artış
                        </span>
                    </div>
                </div>

                {/* Conversion Rate Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[5rem] -mr-4 -mt-4 transition-all group-hover:scale-110 duration-300"></div>
                    <div className="z-10">
                        <span className="text-10px font-bold text-slate-400 block mb-3 uppercase ">Dönüşüm Oranı</span>
                        <h2 className="text-3xl font-[1000] text-emerald-600  mb-2">
                            3.42%
                        </h2>
                        <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-9 9-4-4-6 6" />
                            </svg>
                            +1.2% artış
                        </span>
                    </div>
                </div>
            </div>

            {/* Visual Analytics Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart Section */}
                <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 ">Günlük Gelir Akışı</h3>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Hacim ve Trend Analizi</span>
                        </div>
                        <span className="text-xs font-bold text-brand-pink bg-rose-50 px-3 py-1.5 rounded-lg">Maks: ${maxRevenue.toLocaleString()}</span>
                    </div>

                    <div className="flex items-end gap-1.5 h-64 border-b border-slate-100 relative px-4 pb-2">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 border-3 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-400 ">Veri bulunamadı</div>
                        ) : (
                            filteredData.map((d, i) => {
                                const isSelected = selectedBar === i;
                                return (
                                    <div
                                        key={i}
                                        onMouseEnter={() => setSelectedBar(i)}
                                        onMouseLeave={() => setSelectedBar(null)}
                                        className={`flex-1 rounded-t-lg transition-all cursor-pointer relative ${isSelected ? 'bg-brand-pink scale-y-[1.03] shadow-lg shadow-brand-pink/20' : 'bg-brand-pink/20 hover:bg-brand-pink/60'
                                            }`}
                                        style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 4)}%` }}
                                    >
                                        {/* Hover Dynamic Tooltip */}
                                        {isSelected && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900 text-white rounded-xl p-3 shadow-xl text-[10px] font-bold z-30 pointer-events-none border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
                                                <div className="text-slate-400 font-bold mb-1 uppercase whitespace-nowrap">
                                                    {new Date(d.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                </div>
                                                <div className="text-white text-xs font-[1000]  whitespace-nowrap">
                                                    Gelir: ${d.revenue.toLocaleString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase ">
                        <span>{filteredData.length > 0 ? new Date(filteredData[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : ''}</span>
                        <span>{filteredData.length > 0 ? new Date(filteredData[filteredData.length - 1].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : ''}</span>
                    </div>
                </div>

                {/* Orders Chart Section */}
                <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 ">Günlük Sipariş Dağılımı</h3>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Miktar ve Talep Analizi</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">Maks: {maxOrders} Sipariş</span>
                    </div>

                    <div className="flex items-end gap-1.5 h-64 border-b border-slate-100 relative px-4 pb-2">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-400 ">Veri bulunamadı</div>
                        ) : (
                            filteredData.map((d, i) => {
                                const isSelected = selectedBar === i + 100;
                                return (
                                    <div
                                        key={i}
                                        onMouseEnter={() => setSelectedBar(i + 100)}
                                        onMouseLeave={() => setSelectedBar(null)}
                                        className={`flex-1 rounded-t-lg transition-all cursor-pointer relative ${isSelected ? 'bg-indigo-600 scale-y-[1.03] shadow-lg shadow-indigo-600/20' : 'bg-indigo-500/20 hover:bg-indigo-500/60'
                                            }`}
                                        style={{ height: `${Math.max((d.orders / maxOrders) * 100, 4)}%` }}
                                    >
                                        {/* Hover Dynamic Tooltip */}
                                        {isSelected && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900 text-white rounded-xl p-3 shadow-xl text-[10px] font-bold z-30 pointer-events-none border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
                                                <div className="text-slate-400 font-bold mb-1 uppercase whitespace-nowrap">
                                                    {new Date(d.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                </div>
                                                <div className="text-white text-xs font-[1000]  whitespace-nowrap">
                                                    Sipariş: {d.orders} Adet
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase ">
                        <span>{filteredData.length > 0 ? new Date(filteredData[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : ''}</span>
                        <span>{filteredData.length > 0 ? new Date(filteredData[filteredData.length - 1].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : ''}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Category Breakdown & Merchant Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Category Sales Distribution */}
                <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm lg:col-span-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800  mb-1">Kategori Dağılımı</h3>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-6">Satışların Sektörel Dağılımı</span>

                        <div className="space-y-6">
                            {loading ? (
                                <div className="py-10 text-center text-xs font-semibold text-slate-400 animate-pulse">Kategoriler yükleniyor...</div>
                            ) : categories.length === 0 ? (
                                <div className="py-10 text-center text-xs font-semibold text-slate-400 ">Satış kaydı bulunamadı.</div>
                            ) : (
                                categories.map((c, i) => {
                                    const color = categoryColors[i % categoryColors.length];
                                    const catSales = totalRevenue * (c.percentage / 100);
                                    return (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-slate-700">{c.name}</span>
                                                <span className="font-semibold text-slate-400">
                                                    {c.percentage}% (${catSales.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                                                </span>
                                            </div>
                                            <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                                <div className={`h-full ${color} rounded-full`} style={{ width: `${c.percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-400 ">
                        <span>TOPLAM KATEGORİ: {categories.length}</span>
                        <span className="text-brand-pink">Tümünü İncele &rarr;</span>
                    </div>
                </div>

                {/* Top Performing Sellers */}
                <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800  mb-1">En Çok Satan Mağazalar</h3>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-6">Platformdaki En İyi Performans Gösteren Satıcılar</span>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase ">
                                    <tr>
                                        <th className="px-4 py-3">Satıcı / Mağaza</th>
                                        <th className="px-4 py-3">Ciro</th>
                                        <th className="px-4 py-3">Sipariş</th>
                                        <th className="px-4 py-3 text-center">Değerlendirme</th>
                                        <th className="px-4 py-3 text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-xs font-bold">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400 animate-pulse">Mağazalar yükleniyor...</td>
                                        </tr>
                                    ) : topMerchants.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400 ">Satış kaydı bulunamadı.</td>
                                        </tr>
                                    ) : (
                                        topMerchants.map((m, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-4 flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                                                        {(m.name || 'S').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-800 block">{m.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-semibold uppercase block mt-0.5">{m.store}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-slate-800">
                                                    ${m.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className="px-4 py-4 text-slate-500">
                                                    {m.orders} Sipariş
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-md text-[10px]">
                                                        ★ {m.rating}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className={`px-2 py-1 rounded-md text-[9px] font-semibold ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                        }`}>
                                                        {m.status === 'Active' ? 'AKTİF' : 'ENGELLE'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
