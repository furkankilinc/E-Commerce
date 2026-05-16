import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi, Order } from './orders.api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrder = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const data = await ordersApi.getOrder(id);
            if (data.success) {
                setOrder(data.order);
            }
        } catch (err) {
            console.error('Fetch order detail failed:', err);
            toast.error('Sipariş detayları yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const handleStatusUpdate = async () => {
        if (!order) return;

        const { value: status } = await Swal.fire({
            title: 'Sipariş Durumunu Güncelle',
            input: 'select',
            inputOptions: {
                'PENDING': 'BEKLEMEDE',
                'PROCESSING': 'HAZIRLANIYOR',
                'SHIPPED': 'KARGODA',
                'DELIVERED': 'TESLİM EDİLDİ',
                'CANCELLED': 'İPTAL EDİLDİ'
            },
            inputValue: order.status,
            showCancelButton: true,
            confirmButtonColor: '#ff3366',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Güncelle',
            cancelButtonText: 'Vazgeç',
            background: '#ffffff',
            customClass: {
                title: 'font-black italic uppercase tracking-tighter',
                popup: 'rounded-[3rem]',
                confirmButton: 'rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-[10px]',
                cancelButton: 'rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-[10px]'
            }
        });

        if (status) {
            try {
                const data = await ordersApi.updateStatus(order.id, status);
                if (data.success) {
                    toast.success('Sipariş durumu güncellendi.');
                    fetchOrder();
                }
            } catch (err) {
                console.error('Update status failed:', err);
                toast.error('Guncelleme başarısız.');
            }
        }
    };
    const handlePrintInvoice = () => {
        if (!order) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>Fatura - #${order.orderNumber || order.id.slice(-6).toUpperCase()}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; }
                    .header h1 { margin: 0; font-size: 28px; color: #1e293b; font-style: italic; font-weight: 900; }
                    .invoice-details { text-align: right; }
                    .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
                    .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; width: 45%; }
                    .info-box h3 { margin-top: 0; font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th { border-bottom: 2px solid #e2e8f0; padding: 12px 8px; text-align: left; font-size: 14px; text-transform: uppercase; color: #64748b; }
                    td { border-bottom: 1px solid #f1f5f9; padding: 16px 8px; }
                    .text-right { text-align: right; }
                    .total-section { float: right; width: 300px; }
                    .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: bold; }
                    .total-row.grand-total { font-size: 24px; font-weight: 900; color: #f43f5e; border-top: 2px solid #e2e8f0; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>TİCARİ FATURA</h1>
                        <p style="margin: 5px 0; color: #64748b; font-weight: bold;">E-Ticaret Platformu Sipariş Belgesi</p>
                    </div>
                    <div class="invoice-details">
                        <strong style="font-size: 18px;">FATURA #${order.orderNumber || order.id.slice(-6).toUpperCase()}</strong>
                        <p style="margin: 5px 0;">Tarih: ${new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                </div>

                <div class="info-section">
                    <div class="info-box">
                        <h3>Müşteri Bilgileri</h3>
                        <strong style="font-size: 18px;">${order.user.name}</strong><br><br>
                        ${order.user.email}<br>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Ürün Adı</th>
                            <th>Varyasyon</th>
                            <th class="text-right">Birim Fiyat</th>
                            <th class="text-right">Adet</th>
                            <th class="text-right">Toplam Fiyat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td><strong style="color: #0f172a;">${item.product.name}</strong></td>
                                <td>${item.variantName ? `${item.variantName}: ${item.variantValue}` : '-'}</td>
                                <td class="text-right">${item.price.toLocaleString()} ₺</td>
                                <td class="text-right">${item.quantity}</td>
                                <td class="text-right"><strong style="color: #0f172a;">${(item.price * item.quantity).toLocaleString()} ₺</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-row">
                        <span>Ara Toplam:</span>
                        <span>${order.totalAmount.toLocaleString()} ₺</span>
                    </div>
                    <div class="total-row">
                        <span>Kargo Ücreti:</span>
                        <span>Ücretsiz</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>GENEL TOPLAM:</span>
                        <span>${order.totalAmount.toLocaleString()} ₺</span>
                    </div>
                </div>

                <script>
                    window.onload = function() { 
                        setTimeout(() => {
                            window.print(); 
                            window.close(); 
                        }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-10 opacity-20">
            <div className="w-20 h-20 border-8 border-slate-100 border-t-brand-pink rounded-full animate-spin"></div>
            <span className="text-2xl font-black uppercase tracking-[0.5em] italic">YÜKLENİYOR...</span>
        </div>
    );

    if (!order) return (
        <div className="text-center py-40">
            <h2 className="text-4xl font-black text-slate-300 italic">SİPARİŞ BULUNAMADI</h2>
            <button onClick={() => navigate('/orders')} className="mt-10 text-brand-pink font-bold hover:underline italic">Siparişlere Geri Dön</button>
        </div>
    );

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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <button onClick={() => navigate('/orders')} className="flex items-center gap-3 text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-6 hover:text-brand-pink transition-all italic group">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-pink/10 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        LİSTEYE GERİ DÖN
                    </button>
                    <h1 className="text-[44px] font-[1000] text-slate-900 tracking-[-0.05em] italic mb-2 uppercase leading-none">SİPARİŞ <span className="text-brand-pink">#{order.orderNumber || order.id.slice(-6).toUpperCase()}</span></h1>
                    <p className="text-slate-400 font-bold text-lg opacity-70 italic">Sipariş detayları, ürün listesi ve teslimat bilgileri.</p>
                </div>
                <button
                    onClick={handleStatusUpdate}
                    className="px-12 py-6 bg-brand-pink text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-pink/20 hover:bg-brand-pink-hover hover:scale-105 transition-all active:scale-95 flex items-center gap-4 italic"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    DURUMU GÜNCELLE
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Order Details Column */}
                <div className="xl:col-span-2 space-y-10">
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
                                        <span className="text-xl font-black text-slate-900 block leading-tight mb-2 group-hover:text-brand-pink transition-colors italic">{item.product.name}</span>
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
                        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-50 flex flex-col">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-8">Müşteri Bilgileri</h3>
                            <div className="space-y-6 flex-1 flex flex-col justify-center">
                                <div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">İSİM SOYİSİM</span>
                                    <span className="text-lg font-black text-slate-900 italic tracking-tight">{order.user.name}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">E-POSTA ADRESİ</span>
                                    <span className="text-lg font-black text-slate-900 italic tracking-tight">{order.user.email}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-50 flex flex-col">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-8">Sipariş Durumu</h3>
                            <div className="space-y-6 flex-1 flex flex-col justify-center">
                                <div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">GÜNCEL DURUM</span>
                                    <div className={`inline-flex px-6 py-3 rounded-2xl text-[10px] font-black italic items-center gap-3 uppercase tracking-widest ${getStatusColor(order.status)} shadow-md`}>
                                        <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                                        {order.status}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">OLUŞTURULMA TARİHİ</span>
                                    <span className="text-lg font-black text-slate-900 italic tracking-tight">{new Date(order.createdAt).toLocaleString('tr-TR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
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
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-8">Hızlı Aksiyonlar</h3>
                        <div className="space-y-4">
                            <button onClick={handlePrintInvoice} className="w-full py-5 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all italic border border-transparent hover:border-slate-200 group">
                                <svg className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                FATURA YAZDIR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;
