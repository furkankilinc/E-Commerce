import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/api/apiClient';
import { toast } from 'react-toastify';
import Pagination from '../../shared/components/Pagination';

const OrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [filter]);

    useEffect(() => {
        fetchOrders();
    }, [filter, page]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const url = filter === 'ALL'
                ? `/api/admin/orders?page=${page}&limit=10`
                : `/api/admin/orders?status=${filter}&page=${page}&limit=10`;
            const res = await apiClient.get(url);
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
                setTotalPages(data.pages);
            }
        } catch (err) {
            toast.error('Siparişler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, status: string) => {
        try {
            const res = await apiClient.patch(`/api/admin/orders/${orderId}/status`, { status });
            const data = await res.json();
            if (data.success) {
                toast.success('Sipariş durumu güncellendi.');
                fetchOrders();
            }
        } catch (err) {
            toast.error('Güncelleme başarısız oldu.');
        }
    };

    const statusColors: any = {
        PENDING: 'bg-amber-100 text-amber-600',
        PROCESSING: 'bg-blue-100 text-blue-600',
        SHIPPED: 'bg-indigo-100 text-indigo-600',
        DELIVERED: 'bg-emerald-100 text-emerald-600',
        CANCELLED: 'bg-rose-100 text-rose-600',
    };

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-[1000] text-admin-navy    leading-none mb-4">SİPARİŞ <span className="text-brand-pink">YÖNETİMİ</span></h1>
                    <p className="text-10px font-semibold text-slate-400    opacity-70">Platform genelindeki tüm siparişleri takip et</p>
                </div>

                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto max-w-full">
                    {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-2xl text-[9px] sm:text-10px font-semibold transition-all  whitespace-nowrap ${filter === f ? 'bg-admin-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {f === 'ALL' ? 'TÜMÜ' : f === 'PENDING' ? 'BEKLEYEN' : f === 'PROCESSING' ? 'HAZIRLANAN' : f === 'SHIPPED' ? 'KARGODA' : 'TESLİM EDİLDİ'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50">
                                <th className="px-10 py-8 text-10px font-semibold text-slate-400   ">Sipariş No</th>
                                <th className="px-10 py-8 text-10px font-semibold text-slate-400   ">Müşteri</th>
                                <th className="px-10 py-8 text-10px font-semibold text-slate-400   ">Tutar</th>
                                <th className="px-10 py-8 text-10px font-semibold text-slate-400    text-right">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-20 text-center">
                                        <div className="w-10 h-10 border-4 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <span className="text-10px font-semibold text-slate-300   ">Yükleniyor...</span>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-20 text-center">
                                        <span className="text-10px font-semibold text-slate-300   ">Sipariş bulunamadı.</span>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-slate-900 ">#{order.orderNumber}</span>
                                                <span className="text-nano font-bold text-slate-400   ">{new Date(order.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-slate-900 ">{order.user?.name || 'Anonim'}</span>
                                                <span className="text-nano font-bold text-slate-400  ">{order.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-xs font-semibold text-slate-900 ">${order.totalAmount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-nano font-semibold    ${statusColors[order.status]}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
};

export default OrdersPage;
