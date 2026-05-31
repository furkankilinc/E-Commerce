import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, Order } from './orders.api';
import { toast } from 'react-toastify';

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });
    const [activeStatus, setActiveStatus] = useState<string>('ALL');
    const navigate = useNavigate();

    const fetchOrders = async (page: number, status: string = activeStatus, searchQuery: string = debouncedSearch, sortVal: string = sortBy) => {
        setIsLoading(true);
        try {
            const statusParam = status === 'ALL' ? undefined : status;
            const data = await ordersApi.getOrders(page, 10, statusParam, searchQuery || undefined, sortVal);
            if (data.success) {
                setOrders(data.orders);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Fetch orders failed:', err);
            toast.error('Siparişler yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        fetchOrders(1, activeStatus, debouncedSearch, sortBy);
    }, [activeStatus, debouncedSearch, sortBy]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchOrders(newPage, activeStatus, debouncedSearch, sortBy);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }; const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'text-amber-500 bg-amber-50';
            case 'PROCESSING': return 'text-indigo-500 bg-indigo-50';
            case 'SHIPPED': return 'text-blue-500 bg-blue-50';
            case 'DELIVERED': return 'text-emerald-500 bg-emerald-50';
            case 'CANCELLED': return 'text-rose-500 bg-rose-50';
            default: return 'text-slate-500 bg-slate-50';
        }
    };

    const translateStatus = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Bekliyor';
            case 'PROCESSING': return 'Hazırlanıyor';
            case 'SHIPPED': return 'Kargoda';
            case 'DELIVERED': return 'Teslim Edildi';
            case 'CANCELLED': return 'İptal Edildi';
            default: return status;
        }
    };

    return (
        <div className="space-y-6 md:space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-4xl font-[1000] text-slate-900  mb-2  leading-none">Sipariş <span className="text-brand-pink">Yönetimi</span></h1>
                <p className="text-sm md:text-lg text-slate-400 font-bold  opacity-70">Gelen siparişleri takip et, durumlarını güncelle ve müşteri memnuniyetini artır.</p>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-row w-full sm:w-fit gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-50 overflow-x-auto whitespace-nowrap scrollbar-none">
                {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setActiveStatus(status)}
                        className={`px-4 sm:px-6 py-2 rounded-2xl text-[10px] font-semibold  transition-all cursor-pointer  ${activeStatus === status ? 'bg-slate-900 text-white scale-105' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                        {status === 'ALL' ? 'TÜMÜ' : translateStatus(status).toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Search and Sort Bar */}
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xs border border-slate-100 flex flex-col md:flex-row items-stretch md:items-center gap-4 lg:gap-6">
                {/* Search */}
                <div className="flex-grow relative group">
                    <input
                        type="text"
                        placeholder="Sipariş numarası veya ID ile ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-12 sm:h-14 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all "
                    />
                    <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-pink transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                {/* Sort Dropdown */}
                <div className="relative w-full md:w-56">
                    <select
                        aria-label="Sıralama Ölçütü"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full h-12 sm:h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl text-10px font-semibold  text-slate-600 focus:outline-none focus:border-brand-pink focus:bg-white transition-all cursor-pointer appearance-none uppercase "
                    >
                        <option className="cursor-pointer font-bold" value="newest">EN YENİ SİPARİŞLER</option>
                        <option className="cursor-pointer font-bold" value="oldest">EN ESKİ SİPARİŞLER</option>
                        <option className="cursor-pointer font-bold" value="amount-desc">TUTAR: YÜKSEKTEN DÜŞÜĞE</option>
                        <option className="cursor-pointer font-bold" value="amount-asc">TUTAR: DÜŞÜKTEN YÜKSEĞE</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 ">
                                <th className="px-12 py-10 text-10px font-semibold   text-slate-400">Sipariş No</th>
                                <th className="px-6 py-10 text-10px font-semibold   text-slate-400">Müşteri</th>
                                <th className="px-6 py-10 text-10px font-semibold   text-slate-400 text-center">Tutar</th>
                                <th className="px-6 py-10 text-10px font-semibold   text-slate-400 text-center">Tarih</th>
                                <th className="px-6 py-10 text-10px font-semibold   text-slate-400 text-center">Durum</th>
                                <th className="px-12 py-10 text-10px font-semibold   text-slate-400 text-right">Detay(lar)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-12 py-10"><div className="h-10 bg-slate-50 rounded-xl w-32"></div></td>
                                        <td className="px-6 py-10"><div className="h-10 bg-slate-50 rounded-xl w-40"></div></td>
                                        <td className="px-6 py-10 text-center"><div className="h-10 bg-slate-50 rounded-xl w-20 mx-auto"></div></td>
                                        <td className="px-6 py-10 text-center"><div className="h-10 bg-slate-50 rounded-xl w-20 mx-auto"></div></td>
                                        <td className="px-6 py-10 text-center"><div className="h-10 bg-slate-50 rounded-xl w-24 mx-auto"></div></td>
                                        <td className="px-12 py-10 text-right"><div className="h-10 bg-slate-50 rounded-xl w-16 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-40 text-center">
                                        <div className="flex flex-col items-center gap-8 opacity-20 group">
                                            <div className="w-32 h-32 bg-slate-50 rounded-xl flex items-center justify-center border-4 border-dashed border-slate-100 group- transition-transform">
                                                <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                            </div>
                                            <span className="text-3xl font-semibold    leading-none">SİPARİŞ BULUNAMADI</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order?.id} className="group hover:bg-slate-50/30 transition-all cursor-pointer" onClick={() => navigate(`/orders/${order?.id}`)}>
                                        <td className="px-12 py-10">
                                            <span className="text-lg font-semibold text-slate-900 block group-hover:text-brand-pink transition-colors  ">#{order?.orderNumber || order?.id.slice(-6)}</span>
                                        </td>
                                        <td className="px-6 py-10">
                                            <div>
                                                <span className="text-sm font-semibold text-slate-900 block leading-tight mb-1">{order?.user?.name}</span>
                                                <span className="text-10px font-bold text-slate-400  ">{order?.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-10 text-center">
                                            <span className="text-xl font-semibold text-slate-900  ">{order?.totalAmount.toLocaleString()} ₺</span>
                                        </td>
                                        <td className="px-6 py-10 text-center">
                                            <span className="text-10px font-semibold text-slate-400  ">{new Date(order?.createdAt).toLocaleDateString('tr-TR')}</span>
                                        </td>
                                        <td className="px-6 py-10 text-center">
                                            <div className={`inline-flex px-5 py-2.5 rounded-2xl text-xs font-semibold  items-center gap-2   ${getStatusColor(order?.status)} shadow-sm`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                                {translateStatus(order?.status)}
                                            </div>
                                        </td>
                                        <td className="px-12 py-10 text-right">
                                            <button
                                                className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-pink group-hover:border-brand-pink shadow-sm transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 py-10">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 disabled:opacity-20 transition-all shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <span className="text-xs font-semibold   text-slate-400 ">Sayfa {pagination.page} / {pagination.totalPages}</span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 disabled:opacity-20 transition-all shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
