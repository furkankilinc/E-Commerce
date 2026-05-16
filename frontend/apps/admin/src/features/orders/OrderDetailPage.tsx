import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/api/apiClient';
import { toast } from 'react-toastify';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    variantName?: string;
    variantValue?: string;
    product: {
        name: string;
        images: { url: string; isMain: boolean }[];
    };
}

interface Order {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
    merchant: {
        companyName: string;
        email: string;
    };
    items: OrderItem[];
}

const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            setIsLoading(true);
            try {
                const res = await apiClient.get(`/api/admin/orders/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data);
                } else {
                    toast.error('Sipariş bulunamadı.');
                    navigate('/orders');
                }
            } catch (err) {
                toast.error('Sipariş yüklenemedi.');
                navigate('/orders');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchOrder();
    }, [id, navigate]);

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'bg-amber-100 text-amber-600';
            case 'PROCESSING': return 'bg-blue-100 text-blue-600';
            case 'SHIPPED': return 'bg-indigo-100 text-indigo-600';
            case 'DELIVERED': return 'bg-emerald-100 text-emerald-600';
            case 'CANCELLED': return 'bg-rose-100 text-rose-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    if (isLoading) {
        return (
            <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">SİPARİŞ DETAYLARI YÜKLENİYOR...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="space-y-10 p-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <button onClick={() => navigate('/orders')} className="flex items-center gap-3 text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-6 hover:text-brand-pink transition-all italic group">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-pink/10 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        LİSTEYE GERİ DÖN
                    </button>
                    <h1 className="text-[44px] font-[1000] text-slate-900 tracking-[-0.05em] italic mb-2 uppercase leading-none">SİPARİŞ <span className="text-brand-pink">#{order.orderNumber || order.id.slice(-6).toUpperCase()}</span></h1>
                    <p className="text-slate-400 font-bold text-lg opacity-70 italic">Admin paneli üzerinden siparişin tüm detaylarını görüntüleyin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-10">
                    {/* Items */}
                    <div className="bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden p-10">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-10">Sipariş İçeriği</h3>
                        <div className="space-y-8">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-8 group">
                                    <div className="w-24 h-24 rounded-[2rem] bg-slate-50 border border-slate-100 flex-shrink-0 p-3 overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-500">
                                        <img
                                            src={item.product.images?.find(img => img.isMain)?.url || 'https://via.placeholder.com/100'}
                                            alt={item.product.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-xl font-black text-slate-900 block leading-tight mb-2 group-hover:text-brand-pink transition-colors italic uppercase">{item.product.name}</span>
                                        <div className="flex flex-wrap gap-4 items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg italic">ADET: {item.quantity}</span>
                                            {item.variantName && (
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg italic">{item.variantName}: {item.variantValue}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-slate-900 block italic tracking-tighter mb-1">{(item.price * item.quantity).toLocaleString()} ₺</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BİRİM: {item.price.toLocaleString()} ₺</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
                        {/* Merchant Details */}
                        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-50 flex flex-col">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-8">Satıcı Bilgileri</h3>
                            <div className="space-y-6 flex-1 flex flex-col justify-center">
                                <div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">ŞİRKET ADI</span>
                                    <span className="text-lg font-black text-slate-900 italic tracking-tight">{order.merchant.companyName}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">SATICI E-POSTA</span>
                                    <span className="text-lg font-black text-slate-900 italic tracking-tight">{order.merchant.email}</span>
                                </div>
                            </div>
                        </div>
                        {/* Customer Details */}
                        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-50 flex flex-col">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-8">Müşteri Bilgileri</h3>
                            <div className="space-y-6 flex-1 flex flex-col justify-center">
                                <div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">İSİM SOYİSİM</span>
                                    <span className="text-lg font-black text-slate-900 italic tracking-tight">{order.user.name}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">MÜŞTERİ E-POSTA</span>
                                    <span className="text-lg font-black text-slate-900 italic tracking-tight">{order.user.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="space-y-10">
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50 relative overflow-hidden group">
                        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-brand-pink/5 rounded-full blur-3xl pointer-events-none"></div>
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-10 block italic relative z-10">Sipariş Özeti</span>
                        <div className="space-y-6 relative z-10">
                            <div className="flex justify-between items-center text-slate-400 font-black italic uppercase tracking-widest text-[10px]">
                                <span>ARA TOPLAM</span>
                                <span className="text-sm">{order.totalAmount.toLocaleString()} ₺</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 font-black italic uppercase tracking-widest text-[10px]">
                                <span>KARGO</span>
                                <span className="text-indigo-500">ÜCRETSİZ</span>
                            </div>
                            <div className="pt-8 border-t border-slate-50 flex justify-between items-end">
                                <span className="text-[11px] font-black uppercase italic tracking-widest text-brand-pink mb-2">TOPLAM ÖDENEN</span>
                                <span className="text-[44px] font-black italic tracking-tighter text-slate-900 leading-none">{order.totalAmount.toLocaleString()} ₺</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3.5rem] p-10 shadow-sm border border-slate-50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-8">Durum</h3>
                        <div className={`px-8 py-4 rounded-2xl text-[12px] font-black italic text-center uppercase tracking-[0.2em] ${getStatusColor(order.status)}`}>
                            {order.status}
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-6 text-center italic uppercase">OLUŞTURULMA TARİHİ: {new Date(order.createdAt).toLocaleString('tr-TR')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;
