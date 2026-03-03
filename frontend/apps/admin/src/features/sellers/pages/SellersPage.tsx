import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../shared/api/apiClient';

interface Merchant {
    id: string;
    email: string;
    companyName: string;
    contactPerson?: string;
    phone?: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    _count: { products: number };
}

const SellersPage: React.FC = () => {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'verified' | 'unverified'>('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/api/admin/merchants';
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filter === 'active') params.append('isActive', 'true');
            if (filter === 'inactive') params.append('isActive', 'false');
            if (filter === 'verified') params.append('isVerified', 'true');
            if (filter === 'unverified') params.append('isVerified', 'false');

            const queryString = params.toString();
            if (queryString) url += '?' + queryString;

            const res = await apiClient.get(url);
            const data = await res.json();
            if (data.success) {
                setMerchants(data.merchants);
            }
        } catch (err) {
            console.error('Failed to load merchants', err);
        } finally {
            setLoading(false);
        }
    }, [search, filter]);

    useEffect(() => {
        const timer = setTimeout(() => load(), 300);
        return () => clearTimeout(timer);
    }, [load]);

    return (
        <div className="p-8 font-['Inter']">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-black text-admin-dark tracking-tight">Satıcı Yönetimi</h1>
                    </div>
                    <p className="text-slate-500 font-medium text-lg ml-1">Platformdaki tüm mağazaları denetleyin ve logları izleyin.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'all' ? 'bg-admin-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'active' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Aktif
                    </button>
                    <button
                        onClick={() => setFilter('verified')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'verified' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Onaylı
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard label="Toplam Satıcı" value={merchants.length} color="indigo" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                <StatCard label="Aktif Mağaza" value={merchants.filter(m => m.isActive).length} color="emerald" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                <StatCard label="Onay Bekleyen" value={merchants.filter(m => !m.isVerified).length} color="amber" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                <StatCard label="Toplam Ürün" value={merchants.reduce((acc, m) => acc + m._count.products, 0)} color="rose" icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
            </div>

            {/* Content Area */}
            <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                {/* Search & Bulk Actions */}
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Şirket adı, email veya yetkili ara..."
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] focus:outline-none focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-700 font-semibold"
                        />
                    </div>
                    <button className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.25rem] font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Rapor Dışa Aktar
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="text-left py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Mağaza Bilgisi</th>
                                <th className="text-left py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">İletişim</th>
                                <th className="text-left py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Ürün Sayısı</th>
                                <th className="text-left py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Durum</th>
                                <th className="text-right py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="inline-flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl">
                                            <div className="w-5 h-5 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Veriler Getiriliyor...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : merchants.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="p-10 grayscale opacity-40">
                                            <div className="text-6xl mb-4">📭</div>
                                            <p className="text-slate-500 font-bold text-lg">Kriterlere uygun satıcı bulunamadı.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                merchants.map(merchant => (
                                    <tr key={merchant.id} className="group hover:bg-slate-50/30 transition-colors">
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[1.25rem] flex items-center justify-center text-slate-500 font-black text-xl shadow-inner uppercase">
                                                    {merchant.companyName.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-extrabold text-admin-dark text-lg group-hover:text-indigo-600 transition-colors">{merchant.companyName}</div>
                                                    <div className="text-slate-400 text-sm font-medium">{merchant.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8">
                                            <div className="text-slate-700 font-bold">{merchant.contactPerson || 'Belirtilmemiş'}</div>
                                            <div className="text-slate-400 text-sm font-medium">{merchant.phone || '-'}</div>
                                        </td>
                                        <td className="py-6 px-8">
                                            <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                <span className="font-black text-slate-700">{merchant._count.products}</span>
                                                <span className="text-xs font-bold text-slate-400 uppercase">Ürün</span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8">
                                            <div className="flex flex-col gap-2">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit ${merchant.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                    {merchant.isActive ? 'AKTİF' : 'PASİF'}
                                                </span>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit ${merchant.isVerified ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                    {merchant.isVerified ? 'ONAYLI' : 'ONAY BEKLİYOR'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8 text-right">
                                            <Link
                                                to={`/sellers/${merchant.id}`}
                                                className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-100 rounded-xl text-slate-700 font-bold hover:border-indigo-500/30 hover:bg-indigo-50/30 hover:text-indigo-600 transition-all shadow-sm"
                                            >
                                                Detaylar
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination Placeholder */}
                <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Görüntülenen: {merchants.length} Satıcı
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30" disabled>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button className="px-4 py-2 bg-indigo-500 text-white border border-indigo-500 rounded-lg text-sm font-bold shadow-md shadow-indigo-500/20">1</button>
                        <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30" disabled>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: number | string; color: string; icon: string }> = ({ label, value, color, icon }) => {
    const colors: any = {
        indigo: 'bg-indigo-500 text-indigo-500 shadow-indigo-500/20',
        emerald: 'bg-emerald-500 text-emerald-500 shadow-emerald-500/20',
        amber: 'bg-amber-500 text-amber-500 shadow-amber-500/20',
        rose: 'bg-rose-500 text-rose-500 shadow-rose-500/20'
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-xl shadow-slate-100 flex items-center gap-5 transition-transform hover:scale-[1.02] cursor-default">
            <div className={`w-14 h-14 ${colors[color].split(' ')[0]} rounded-2xl flex items-center justify-center text-white shadow-lg ${colors[color].split(' ').pop()}`}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
            </div>
            <div>
                <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{label}</div>
                <div className="text-3xl font-black text-admin-dark tracking-tighter">{value}</div>
            </div>
        </div>
    );
};

export default SellersPage;
