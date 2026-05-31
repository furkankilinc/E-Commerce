import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from './cart.store';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../../shared/components/Toast';

const CartPage: React.FC = () => {
    const { items, incrementItem, decrementItem, removeItem, total, itemCount, refreshCart } = useCart();
    const { isAuthenticated } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const handleCheckout = () => {
        if (!isAuthenticated) {
            toast.warning('Siparişinizi tamamlamak için lütfen giriş yapın.');
            navigate('/login?redirect=/checkout');
            return;
        }
        navigate('/checkout');
    };

    // Gerçek zamanlı (real-time) sepet fiyat ve stok senkronizasyonu
    useEffect(() => {
        refreshCart(); // Component yüklendiğinde anında kontrol

        // Her 5 saniyede bir sepet fiyat/stok bilgisini canlı tazele (WebSocket alternatifi polling)
        const intervalId = setInterval(() => {
            refreshCart();
        }, 5000);

        return () => clearInterval(intervalId);
    }, [refreshCart]);

    if (items.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
                <div className="w-24 h-24 bg-gray-50 rounded-md flex items-center justify-center mb-5 border border-gray-100 shadow-sm animate-bounce duration-[2000ms]">
                    <svg className="w-10 h-10 text-brand-pink/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-[1000] text-gray-900    mb-4 leading-none">SEPETİNİZ <span className="text-brand-pink">BOŞ</span></h1>
                <p className="text-gray-400 font-semibold   text-xs mb-5 ">Henüz sepetinize bir ürün eklemediniz.</p>
                <Link to="/shop" className="px-12 py-5 bg-gray-900 text-white rounded-md text-caption font-semibold   hover:bg-brand-pink  transition-all  shadow-gray-200 ">ALIŞVERİŞE BAŞLA</Link>
            </div>
        );
    }

    return (
        <div className="max-w-[1650px] mx-auto px-4 sm:px-10 lg:px-20 py-6 sm:py-10">
            <div className="mb-8">
                <span className="text-brand-pink text-10px font-semibold   mb-4 block">ALIŞVERİŞ SÜRECİ</span>
                <h1 className="text-4xl font-[1000] text-gray-900    leading-none mb-4">SEPETİM <span className="text-brand-pink">({itemCount})</span></h1>
                <p className="text-gray-400 font-semibold   text-10px ">Siparişinizi tamamlamadan önce ürünlerinizi gözden geçirin.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-16 xl:gap-20">
                {/* Cart Items List */}
                <div className="xl:col-span-2 space-y-10">
                    <div className="hidden md:grid grid-cols-6 pb-6 border-b border-gray-100">
                        <span className="col-span-3 text-10px font-semibold text-gray-300  ">ÜRÜN DETAYLARI</span>
                        <span className="text-10px font-semibold text-gray-300   text-center">ADET</span>
                        <span className="text-10px font-semibold text-gray-300   text-right">FİYAT</span>
                        <span className="text-10px font-semibold text-gray-300   text-right">TOPLAM</span>
                    </div>

                    {items.map((item) => (
                        <div key={`${item.id}-${item.variant}`} className="flex flex-col md:grid grid-cols-6 items-center gap-6 group pb-8 md:pb-0 border-b border-gray-100/50 md:border-none">
                            <div className="col-span-3 flex items-center gap-4 sm:gap-8 w-full md:w-auto">
                                <Link to={`/product/${item.id}`} className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-center p-4 relative overflow-hidden group- transition-transform duration-500 shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                                </Link>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900  truncate max-w-[200px] sm:max-w-[300px] leading-tight mb-1 sm:mb-2">{item.name}</h3>
                                    <p className="text-10px font-semibold text-gray-400 ">{item.variant || 'Standard Edition'}</p>

                                    {/* Mobile-only Price Display */}
                                    <div className="md:hidden mt-2 flex items-baseline gap-2">
                                        {item.originalPrice && (
                                            <span className="text-[10px] text-gray-400 line-through ">{item.originalPrice.toLocaleString()} ₺</span>
                                        )}
                                        <span className="text-xs font-extrabold text-brand-pink ">{item.price.toLocaleString()} ₺</span>
                                    </div>

                                    <button
                                        onClick={() => removeItem(item.id, item.variant)}
                                        className="mt-3 sm:mt-4 text-nano font-semibold text-red-400 hover:text-red-500  flex items-center gap-2 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        SİL
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-center mt-4 md:mt-0 w-full md:w-auto">
                                <div className="flex items-center bg-gray-50 p-2 rounded-md border border-gray-100 shadow-inner">
                                    <button
                                        onClick={() => decrementItem(item.id, item.variant)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12H4" strokeWidth="5" strokeLinecap="round" /></svg>
                                    </button>
                                    <span className="w-10 text-center text-xs font-semibold ">{item.quantity}</span>
                                    <button
                                        onClick={() => incrementItem(item.id, item.variant)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="5" strokeLinecap="round" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="text-right hidden md:block">
                                {item.originalPrice && (
                                    <div className="text-micro font-semibold text-brand-pink  mb-1">
                                        İNDİRİMLİ FİYAT
                                    </div>
                                )}
                                <div className="flex flex-col items-end">
                                    {item.originalPrice && (
                                        <span className="text-xs font-semibold text-gray-400 line-through opacity-60  mb-1">
                                            {item.originalPrice.toLocaleString()} ₺
                                        </span>
                                    )}
                                    <span className="text-sm font-semibold text-gray-900 ">
                                        {item.price.toLocaleString()} ₺
                                    </span>
                                </div>
                            </div>

                            <div className="text-center md:text-right mt-4 md:mt-0 flex justify-between md:flex-col items-center md:items-end w-full md:w-auto">
                                <span className="text-xs font-semibold text-gray-400 md:hidden ">TOPLAM FİYAT</span>
                                <span className="text-lg font-semibold text-gray-900  leading-none">{(item.price * item.quantity).toLocaleString()} ₺</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary Card */}
                <div className="col-span-1">
                    <div className="bg-gray-50/50 p-12 rounded-md border border-gray-100 sticky top-32">
                        <h2 className="text-2xl font-[1000] text-gray-900    mb-5 leading-none">SİPARİŞ <span className="text-brand-pink">ÖZETİ</span></h2>

                        <div className="space-y-6 pb-10 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-10px font-semibold text-gray-400  ">ARA TOPLAM</span>
                                <span className="text-sm font-semibold text-gray-900 ">{total.toLocaleString()} ₺</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-10px font-semibold text-gray-400  ">KARGO ÜCRETİ</span>
                                <span className="text-10px font-semibold text-emerald-500   ">ÜCRETSİZ</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-10px font-semibold text-gray-400  ">KDV (%20)</span>
                                <span className="text-sm font-semibold text-gray-900 ">{(total * 0.2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                            </div>
                        </div>

                        <div className="pt-10 mb-6 flex justify-between items-end">
                            <div>
                                <span className="text-10px font-[1000] text-gray-400   mb-1 block ">TOPLAM ÖDENECEK</span>
                                <span className="text-4xl font-[1000] text-gray-900 leading-none   whitespace-nowrap">{(total + (total * 0.2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleCheckout}
                                className="w-full py-3.5 bg-brand-pink text-white rounded-md text-caption font-semibold   shadow-xl shadow-brand-pink/20  hover:bg-brand-pink-hover transition-all  flex items-center justify-center gap-4 group"
                            >
                                ÖDEMEYE GEÇ
                                <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4-4 4M3 12h18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            <Link to="/shop" className="w-full py-4 bg-white text-gray-900 border border-gray-100 rounded-md text-10px font-semibold   flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all ">ALIŞVERİŞE DEVAM ET</Link>
                        </div>

                        {/* Promo Code */}
                        <div className="mt-12">
                            <label className="text-nano font-semibold text-gray-300   mb-4 block  ml-4">PROMOSYON KODU</label>
                            <div className="relative group">
                                <input type="text" placeholder="KOD GİRİNİZ" className="w-full h-14 bg-white border border-gray-100 rounded-md px-6 text-10px font-semibold focus:outline-none focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all   " />
                                <button className="absolute right-2 top-2 bottom-2 px-6 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-md text-nano font-semibold   transition-all ">UYGULA</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
