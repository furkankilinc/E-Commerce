import React, { useEffect, useState } from 'react';
import { apiClient } from '../../shared/api/apiClient';

const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get('/api/admin/stats/analytics');
                const json = await apiClient.handleResponse(res);
                if (json.success) setData(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const maxRevenue = Math.max(...data.map(d => d.revenue), 100);

    return (
        <div className="p-10 space-y-12 font-['Inter']">
            <div>
                <h1 className="text-4xl font-[1000] text-admin-navy tracking-tighter italic  leading-none mb-4">PLATFORM <span className="text-brand-pink">ANALİTİĞİ</span></h1>
                <p className="text-10px font-semibold text-slate-400  tracking-widest italic opacity-70">Son 30 günlük performans verileri</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Revenue Chart Placeholder (Simple CSS Bars) */}
                <div className="bg-white rounded-xl p-10 border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-800  tracking-widest italic mb-5">Günlük Gelir Trendi</h3>
                    <div className="flex items-end gap-1 h-64 border-b border-l border-slate-50 relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center text-10px font-semibold text-slate-300  italic">Veriler Yükleniyor...</div>
                        ) : data.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-10px font-semibold text-slate-300  italic">Veri Bulunamadı</div>
                        ) : (
                            data.map((d, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-brand-pink/20 hover:bg-brand-pink transition-all group relative rounded-t-sm"
                                    style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                                >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-admin-navy text-white text-8px font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        ${d.revenue.toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex justify-between mt-4 text-8px font-semibold text-slate-400  tracking-tighter">
                        <span>30 GÜN ÖNCE</span>
                        <span>BUGÜN</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-10 border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-800  tracking-widest italic mb-5">Günlük Sipariş Dağılımı</h3>
                    <div className="flex items-end gap-1 h-64 border-b border-l border-slate-50 relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center text-10px font-semibold text-slate-300  italic">Veriler Yükleniyor...</div>
                        ) : (
                            data.map((d, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-indigo-500/20 hover:bg-indigo-500 transition-all group relative rounded-t-sm"
                                    style={{ height: `${(d.orders / Math.max(...data.map(x => x.orders), 5)) * 100}%` }}
                                >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-admin-navy text-white text-8px font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {d.orders} SİPARİŞ
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex justify-between mt-4 text-8px font-semibold text-slate-400  tracking-tighter">
                        <span>30 GÜN ÖNCE</span>
                        <span>BUGÜN</span>
                    </div>
                </div>
            </div>

            <div className="bg-admin-navy rounded-xl p-12 text-white shadow-xl shadow-admin-navy/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div>
                        <div className="text-10px font-semibold text-white/30  tracking-[0.2em] mb-4">Toplam Aylık Hacim</div>
                        <div className="text-5xl font-[1000] italic tracking-tighter">${data.reduce((acc, d) => acc + d.revenue, 0).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-10px font-semibold text-white/30  tracking-[0.2em] mb-4">Toplam Sipariş</div>
                        <div className="text-5xl font-[1000] italic tracking-tighter">{data.reduce((acc, d) => acc + d.orders, 0)}</div>
                    </div>
                    <div>
                        <div className="text-10px font-semibold text-white/30  tracking-[0.2em] mb-4">Ortalama Sepet</div>
                        <div className="text-5xl font-[1000] italic tracking-tighter">
                            ${(data.reduce((acc, d) => acc + d.revenue, 0) / Math.max(data.reduce((acc, d) => acc + d.orders, 0), 1)).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
