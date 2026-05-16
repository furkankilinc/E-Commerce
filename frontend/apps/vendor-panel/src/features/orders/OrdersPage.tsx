import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, Order } from './orders.api';
import { toast } from 'react-toastify';

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });
    const [activeStatus, setActiveStatus] = useState<string>('ALL');
    const navigate = useNavigate();

    const fetchOrders = async (page: number, status?: string) => {
        setIsLoading(true);
        try {
            const statusParam = status === 'ALL' ? undefined : status;
            const data = await ordersApi.getOrders(page, 10, statusParam);
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
        fetchOrders(1, activeStatus);
    }, [activeStatus]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchOrders(newPage, activeStatus);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'text-amber-500 bg-amber-50';
            case 'PROCESSING': return 'text-indigo-500 bg-indigo-50';
            case 'SHIPPED': return 'text-blue-500 bg-blue-50';
            case 'DELIVERED': return 'text-emerald-500 bg-emerald-50';
            case 'CANCELLED': return 'text-rose-500 bg-rose-50';
            default: return 'text-slate-500 bg-slate-50';
        }
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-[40px] font-[1000] text-slate-900 tracking-tighter mb-2 italic leading-none">Sipariş <span className="text-brand-pink">Yönetimi</span></h1>
                <p className="text-slate-400 font-bold text-lg italic opacity-70">Gelen siparişleri takip et, durumlarını güncelle ve müşteri memnuniyetini artır.</p>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-[3rem] shadow-sm border border-slate-50">
                {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setActiveStatus(status)}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic ${activeStatus === status ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                        {status === 'ALL' ? 'TÜMÜ' : status}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 italic">
                                <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sipariş No</th>
                                <th className="px-6 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Müşteri</th>
                                <th className="px-6 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Tutar</th>
                                <th className="px-6 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Tarih</th>
                                <th className="px-6 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Durum</th>
                                <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Detay(lar)</th>
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
                                            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center border-4 border-dashed border-slate-100 group-hover:scale-110 transition-transform">
                                                <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                            </div>
                                            <span className="text-3xl font-black uppercase tracking-[0.4em] italic leading-none">SİPARİŞ BULUNAMADI</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-slate-50/30 transition-all cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                                        <td className="px-12 py-10">
                                            <span className="text-lg font-black text-slate-900 block group-hover:text-brand-pink transition-colors italic tracking-tighter">#{order.orderNumber || order.id.slice(-6).toUpperCase()}</span>
                                        </td>
                                        <td className="px-6 py-10">
                                            <div>
                                                <span className="text-sm font-black text-slate-900 block leading-tight mb-1">{order.user.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-10 text-center">
                                            <span className="text-xl font-black text-slate-900 italic tracking-tighter">{order.totalAmount.toLocaleString()} ₺</span>
                                        </td>
                                        <td className="px-6 py-10 text-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                                        </td>
                                        <td className="px-6 py-10 text-center">
                                            <div className={`inline-flex px-5 py-2.5 rounded-2xl text-[9px] font-black italic items-center gap-2 uppercase tracking-widest ${getStatusColor(order.status)} shadow-sm`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                                {order.status}
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
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Sayfa {pagination.page} / {pagination.totalPages}</span>
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
