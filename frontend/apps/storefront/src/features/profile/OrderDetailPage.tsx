import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiClient } from '../../shared/api/apiClient';
import { useAuth } from '../auth/useAuth';

const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);

    const fetchOrder = async () => {
        try {
            const res = await apiClient(`/api/orders/${id}`);
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
            } else {
                toast.error(data.message || 'Sipariş bulunamadı.');
                navigate('/profile/orders');
            }
        } catch (err) {
            toast.error('Sipariş yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (id) fetchOrder();
    }, [id, isAuthenticated]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-20 animate-pulse">
                <div className="max-w-[1200px] mx-auto space-y-12">
                    <div className="h-20 bg-gray-50 rounded-2xl w-1/3"></div>
                    <div className="h-64 bg-gray-50 rounded-[2rem] w-full"></div>
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-50 rounded-2xl w-full"></div>)}
                    </div>
                </div>
            </div>
        );
    }

    if (!order) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'text-amber-500 bg-amber-50';
            case 'PROCESSING': return 'text-indigo-500 bg-indigo-50';
            case 'SHIPPED': return 'text-blue-500 bg-blue-50';
            case 'DELIVERED': return 'text-emerald-500 bg-emerald-50';
            case 'CANCELLED': return 'text-rose-500 bg-rose-50';
            default: return 'text-gray-500 bg-gray-50';
        }
    };

    const getStatusText = (status: string) => {
        switch(status) {
            case 'PENDING': return 'BEKLİYOR';
            case 'PROCESSING': return 'HAZIRLANIYOR';
            case 'SHIPPED': return 'KARGODA';
            case 'DELIVERED': return 'TESLİM EDİLDİ';
            case 'CANCELLED': return 'İPTAL EDİLDİ';
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-20">
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <Link to="/profile/orders" className="text-[10px] font-black text-brand-pink uppercase tracking-widest mb-4 inline-flex items-center gap-2 hover:gap-4 transition-all italic">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                            SİPARİŞLERİME DÖN
                        </Link>
                        <h1 className="text-[50px] font-[1000] text-gray-900 tracking-tighter uppercase italic leading-none mb-4">
                            SİPARİŞ <span className="text-brand-pink">DETAYI</span>
                        </h1>
                        <p className="text-sm font-bold text-gray-400 italic">#{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest ${getStatusColor(order.status)} italic shadow-sm`}>
                        {getStatusText(order.status)}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm overflow-hidden">
                            <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.2em] mb-10 italic flex items-center gap-4">
                                <div className="w-2 h-2 bg-brand-pink rounded-full"></div>
                                ÜRÜNLER ({order.items.length})
                            </h3>
                            <div className="divide-y divide-gray-50">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="py-8 first:pt-0 last:pb-0">
                                        <div className="flex items-center justify-between gap-8">
                                            <div className="flex items-center gap-8">
                                                <div className="w-24 h-24 bg-gray-50 rounded-[1.5rem] overflow-hidden flex items-center justify-center p-3 group transition-all hover:bg-brand-pink/5">
                                                    {item.product.images?.[0] ? (
                                                        <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 text-lg uppercase italic tracking-tight mb-1">{item.product.name}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                                                        {item.quantity} ADET • {item.price.toLocaleString()} ₺
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {order.status === 'DELIVERED' && (
                                                    <button 
                                                        onClick={() => setReviewingItemId(reviewingItemId === item.id ? null : item.id)}
                                                        className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic shadow-sm ${reviewingItemId === item.id ? 'bg-brand-pink text-white' : 'bg-gray-100 text-gray-500 hover:bg-brand-pink hover:text-white'}`}
                                                    >
                                                        {reviewingItemId === item.id ? 'KAPAT' : 'YORUM YAP'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Review Form Component */}
                                        {reviewingItemId === item.id && (
                                            <ReviewForm 
                                                item={item} 
                                                onSuccess={() => {
                                                    setReviewingItemId(null);
                                                    fetchOrder();
                                                }} 
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary & Info */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                        {/* Address */}
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-100 duration-500">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 italic flex items-center gap-3">
                                <div className="w-2 h-2 bg-brand-pink rounded-full animate-pulse"></div>
                                TESLİMAT ADRESİ
                            </h3>
                            <div className="space-y-4">
                                <p className="text-xl font-black italic uppercase text-gray-900 leading-none">{order.shippingAddress.fullName}</p>
                                <div className="h-[2px] w-8 bg-brand-pink/20 rounded-full mb-6"></div>
                                <p className="text-sm font-bold text-gray-500 leading-relaxed italic opacity-80">
                                    {order.shippingAddress.address}<br />
                                    {order.shippingAddress.city}<br />
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-3">
                                        <svg className="w-3.5 h-3.5 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth="3" /></svg>
                                        <span className="text-gray-900">{order.shippingAddress.phone}</span>
                                    </div>
                                </p>
                            </div>
                        </div>

                        {/* Payment & Total */}
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10 italic">ÖDEME ÖZETİ</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                                    <span className="text-gray-400">ARA TOPLAM</span>
                                    <span className="text-gray-900">{order.totalAmount.toLocaleString()} ₺</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic border-b border-gray-50 pb-6">
                                    <span className="text-gray-400">KARGO</span>
                                    <span className="text-emerald-500 tracking-tighter">BEDAVA</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-black italic uppercase">TOPLAM</span>
                                    <span className="text-[32px] font-[1000] tracking-tighter italic text-brand-pink">{order.totalAmount.toLocaleString()} ₺</span>
                                </div>
                                <div className="pt-6 border-t border-gray-50">
                                    <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-2xl">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">ÖDEME YÖNTEMİ</p>
                                            <p className="text-[10px] font-black text-gray-900 uppercase italic">{order.paymentMethod === 'CREDIT_CARD' ? 'KREDİ KARTI' : 'HAVALE/EFT'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ReviewFormProps {
    item: any;
    onSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ item, onSuccess }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const formData = new FormData();
            Array.from(files).forEach(file => formData.append('images', file));

            // Use the standard fetch since apiClient might not handle FormData with multipart default
            const res = await fetch('http://localhost:5173/api/upload/bulk', {
                method: 'POST',
                // Note: Don't set Content-Type header when using FormData, browser does it with boundary
                body: formData
            });

            const data = await res.json();
            if (data.urls) {
                setImages([...images, ...data.urls]);
                toast.success(`${data.urls.length} görsel yüklendi.`);
            } else {
                toast.error(data.message || 'Görsel yüklenemedi.');
            }
        } catch (err) {
            toast.error('Görsel yüklenirken hata oluştu.');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title || !comment) {
            toast.warn('Lütfen başlık ve yorum alanlarını doldurun.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiClient('/api/reviews', {
                method: 'POST',
                body: JSON.stringify({
                    productId: item.productId,
                    rating,
                    title,
                    comment,
                    images
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Yorumunuz başarıyla yayınlandı!');
                onSuccess();
            } else {
                toast.error(data.message || 'Hata oluştu.');
            }
        } catch (err) {
            toast.error('Giriş yapmanız veya ürünü satın almış olmanız gerekiyor.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-8 pt-8 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-gray-50/50 rounded-[2rem] p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left: Rating & Info */}
                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4 italic">ÜRÜNÜ PUANLA</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${rating >= star ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/20' : 'bg-white text-gray-200 border border-gray-100'}`}
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4 italic text-left">GÖRSEL EKLE</label>
                            <div className="flex flex-wrap gap-4">
                                {images.map((url, idx) => (
                                    <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 group">
                                        <img src={url} alt="Review" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                                {images.length < 5 && (
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand-pink hover:text-brand-pink transition-all bg-white"
                                    >
                                        {uploading ? (
                                            <div className="w-6 h-6 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                                <span className="text-[8px] font-black uppercase tracking-tighter italic text-center leading-none px-2">GÖRSEL YÜKLE</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                multiple 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleFileUpload} 
                            />
                        </div>
                    </div>

                    {/* Right: Text Inputs */}
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4 italic text-left">YORUM BAŞLIĞI</label>
                            <input 
                                type="text" 
                                placeholder="Harika bir seçim oldu!"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-8 py-4 bg-white border border-gray-100 rounded-2xl text-[13px] font-bold outline-none focus:border-brand-pink transition-all italic"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4 italic text-left">DENEYİMLERİN</label>
                            <textarea 
                                placeholder="Ürünün kalitesi, duruşu ve kargosu hakkında neler düşünüyorsun?"
                                rows={5}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full px-8 py-4 bg-white border border-gray-100 rounded-2xl text-[13px] font-bold outline-none focus:border-brand-pink transition-all italic resize-none"
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button 
                                onClick={handleSubmit}
                                disabled={submitting || uploading}
                                className="px-12 py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-[1000] uppercase tracking-widest hover:bg-brand-pink transition-all italic shadow-xl flex items-center gap-3 disabled:opacity-50"
                            >
                                {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                YORUMU YAYINLA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;
