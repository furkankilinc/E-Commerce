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
        <div className="p-10 space-y-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-[1000] text-admin-navy tracking-tighter italic  leading-none mb-4">SİPARİŞ <span className="text-brand-pink">YÖNETİMİ</span></h1>
                    <p className="text-10px font-semibold text-slate-400  tracking-widest italic opacity-70">Platform genelindeki tüm siparişleri takip et</p>
                </div>

                <div className="flex bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
                    {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-3 rounded-2xl text-10px font-semibold  tracking-widest transition-all italic ${filter === f ? 'bg-admin-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {f === 'ALL' ? 'TÜMÜ' : f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-50 bg-slate-50/50">
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400  tracking-widest italic">Sipariş No</th>
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400  tracking-widest italic">Müşteri</th>
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400  tracking-widest italic">Tutar</th>
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400  tracking-widest italic text-right">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-10 py-20 text-center">
                                    <div className="w-10 h-10 border-4 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <span className="text-10px font-semibold text-slate-300  tracking-widest italic">Yükleniyor...</span>
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-10 py-20 text-center">
                                    <span className="text-10px font-semibold text-slate-300  tracking-widest italic">Sipariş bulunamadı.</span>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-slate-900 italic">#{order.orderNumber}</span>
                                            <span className="text-9px font-bold text-slate-400  tracking-widest italic">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-slate-900 italic">{order.user?.name || 'Anonim'}</span>
                                            <span className="text-9px font-bold text-slate-400 tracking-widest italic">{order.user?.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="text-xs font-semibold text-slate-900 italic">${order.totalAmount.toLocaleString()}</span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <span className={`px-4 py-1.5 rounded-full text-9px font-semibold  tracking-widest italic ${statusColors[order.status]}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
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
