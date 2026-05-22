import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../../shared/components/Toast';
import { apiClient } from '../../shared/api/apiClient';
import Pagination from '../../shared/components/Pagination';

export const ProfileOrders: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const toast = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = async (targetPage: number = page) => {
        setLoading(true);
        try {
            const res = await apiClient(`/api/orders/my-orders?page=${targetPage}&limit=5`);
            const data = await res.json();
            if (data?.success) {
                setOrders(data?.orders);
                setTotalPages(data?.pagination?.totalPages || 1);
            } else {
                toast.error(data?.message || 'Siparişler getirilemedi.');
            }
        } catch (err) {
            toast.error('Bağlantı hatası.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders(page);
        }
    }, [isAuthenticated, page]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = async (orderId: string) => {
        if (!window.confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) return;
        try {
            const res = await apiClient(`/api/orders/${orderId}/cancel`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data?.success) {
                toast.success(data?.message);
                fetchOrders();
            } else {
                toast.error(data?.message || 'İptal işlemi başarısız oldu.');
            }
        } catch (err) {
            toast.error('İptal işlemi başarısız oldu.');
        }
    };

    const handleReturn = async (orderId: string) => {
        if (!window.confirm('Bu siparişi iade etmek istediğinize emin misiniz?')) return;
        try {
            const res = await apiClient(`/api/orders/${orderId}/return`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data?.success) {
                toast.success(data?.message);
                fetchOrders();
            } else {
                toast.error(data?.message || 'İade işlemi başarısız oldu.');
            }
        } catch (err) {
            toast.error('İade işlemi başarısız oldu.');
        }
    };

    const getStatusColor = (status: string, paymentStatus: string) => {
        if (paymentStatus === 'RETURN_REQUESTED') return 'text-amber-500 bg-amber-50';
        switch (status) {
            case 'PENDING': return 'text-amber-500 bg-amber-50';
            case 'PROCESSING': return 'text-indigo-500 bg-indigo-50';
            case 'SHIPPED': return 'text-blue-500 bg-blue-50';
            case 'DELIVERED': return 'text-emerald-500 bg-emerald-50';
            case 'CANCELLED': return 'text-rose-500 bg-rose-50';
            case 'REFUNDED': return 'text-slate-500 bg-slate-50';
            default: return 'text-slate-500 bg-slate-50';
        }
    };

    const getStatusText = (status: string, paymentStatus: string) => {
        if (paymentStatus === 'RETURN_REQUESTED') return 'İADE TALEBİ';
        switch (status) {
            case 'PENDING': return 'BEKLİYOR';
            case 'PROCESSING': return 'HAZIRLANIYOR';
            case 'SHIPPED': return 'KARGODA';
            case 'DELIVERED': return 'TESLİM EDİLDİ';
            case 'CANCELLED': return 'İPTAL EDİLDİ';
            case 'REFUNDED': return 'İADE EDİLDİ';
            default: return status;
        }
    };

    return (
        <div className="space-y-16 animate-in fade-in duration-500">
            <div className="pb-12 border-b border-gray-100/50 text-left flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-[1000] text-gray-900   italic leading-none mb-4">SİPARİŞ <span className="text-brand-pink">GEÇMİŞİM</span></h2>
                    <p className="text-sm font-bold text-gray-400 italic">Geçmiş siparişlerini ve durumlarını kontrol et.</p>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-40 bg-gray-50 rounded-md w-full"></div>
                    ))}
                </div>
            ) : orders?.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-8 opacity-20">
                    <div className="w-32 h-32 border-4 border-dashed border-gray-900 rounded-md flex items-center justify-center">
                        <svg className="text-gray-900 w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </div>
                    <h3 className="text-2xl font-semibold italic  ">HİÇ SİPARİŞİN YOK</h3>
                </div>
            ) : (
                <div className="space-y-8">
                    {orders?.map((order) => {
                        const isCancelable = order.status === 'PENDING' || order.status === 'PROCESSING';
                        const isReturnable = order.status === 'DELIVERED' && order.paymentStatus !== 'RETURN_REQUESTED';

                        return (
                            <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-brand-pink/30 hover: transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-50 rounded-[1.5rem] flex items-center justify-center group-hover:bg-brand-pink/5 transition-colors shrink-0">
                                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 group-hover:text-brand-pink transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                    </div>
                                    <div>
                                        <span className="text-lg sm:text-xl font-semibold text-gray-900  italic  mb-1 block">#{order.orderNumber}</span>
                                        <span className="text-10px font-semibold text-gray-400   block mb-4 italic">{new Date(order.createdAt).toLocaleDateString()} • {order.items.length} ÜRÜN</span>
                                        <div className={`inline-flex px-4 py-1.5 rounded-full text-nano font-semibold   ${getStatusColor(order.status, order.paymentStatus)} items-center gap-2 italic`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                            {getStatusText(order.status, order.paymentStatus)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t border-gray-50 md:border-none">
                                    <span className="text-xl sm:text-2xl font-[1000] text-gray-900 italic ">{order.totalAmount.toLocaleString()} ₺</span>
                                    <div className="flex items-center gap-2">
                                        {isCancelable && (
                                            <button
                                                onClick={() => handleCancel(order.id)}
                                                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-nano font-semibold   transition-all italic shadow-sm"
                                            >
                                                İPTAL ET
                                            </button>
                                        )}
                                        {isReturnable && (
                                            <button
                                                onClick={() => handleReturn(order.id)}
                                                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl text-nano font-semibold   transition-all italic shadow-sm"
                                            >
                                                İADE ET
                                            </button>
                                        )}
                                        <Link
                                            to={`/profile/orders/${order.id}`}
                                            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white hover:bg-brand-pink rounded-xl text-nano font-semibold   transition-all italic shadow-sm flex items-center justify-center border-none outline-none"
                                        >
                                            DETAYLAR
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default ProfileOrders;