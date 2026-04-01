import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from './cart.store';

const CartPage: React.FC = () => {
    const { items, incrementItem, decrementItem, removeItem, total, itemCount } = useCart();
    const navigate = useNavigate();

    if (items.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
                <div className="w-24 h-24 bg-gray-50 rounded-md flex items-center justify-center mb-10 border border-gray-100 shadow-sm animate-bounce duration-[2000ms]">
                    <svg className="w-10 h-10 text-brand-pink/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-[1000] text-gray-900 uppercase italic tracking-tighter mb-4 leading-none">SEPETİNİZ <span className="text-brand-pink">BOŞ</span></h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-10 italic">Henüz sepetinize bir ürün eklemediniz.</p>
                <Link to="/shop" className="px-12 py-5 bg-gray-900 text-white rounded-md text-[11px] font-black uppercase tracking-[0.3em] hover:bg-brand-pink hover:scale-105 transition-all shadow-xl shadow-gray-200 italic">ALIŞVERİŞE BAŞLA</Link>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20 py-20 pb-40">
            <div className="mb-20">
                <span className="text-brand-pink text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">ALIŞVERİŞ SÜRECİ</span>
                <h1 className="text-[40px] font-[1000] text-gray-900 uppercase italic tracking-tighter leading-none mb-4">SEPETİM <span className="text-brand-pink">({itemCount})</span></h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] italic">Siparişinizi tamamlamadan önce ürünlerinizi gözden geçirin.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-20">
                {/* Cart Items List */}
                <div className="xl:col-span-2 space-y-10">
                    <div className="hidden md:grid grid-cols-6 pb-6 border-b border-gray-100">
                        <span className="col-span-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">ÜRÜN DETAYLARI</span>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">ADET</span>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-right">FİYAT</span>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-right">TOPLAM</span>
                    </div>

                    {items.map((item) => (
                        <div key={`${item.id}-${item.variant}`} className="md:grid grid-cols-6 items-center gap-6 group">
                            <div className="col-span-3 flex items-center gap-8">
                                <Link to={`/product/${item.id}`} className="w-32 h-32 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-center p-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                                </Link>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase italic truncate max-w-[200px] leading-tight mb-2">{item.name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">{item.variant || 'Standard Edition'}</p>
                                    <button
                                        onClick={() => removeItem(item.id, item.variant)}
                                        className="mt-4 text-[9px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest italic flex items-center gap-2 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        SİL
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-center mt-6 md:mt-0">
                                <div className="flex items-center bg-gray-50 p-2 rounded-md border border-gray-100 shadow-inner">
                                    <button
                                        onClick={() => decrementItem(item.id, item.variant)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12H4" strokeWidth="5" strokeLinecap="round" /></svg>
                                    </button>
                                    <span className="w-10 text-center text-xs font-black italic">{item.quantity}</span>
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
                                    <div className="text-[8px] font-black text-brand-pink italic uppercase tracking-widest mb-1">
                                        İNDİRİMLİ FİYAT
                                    </div>
                                )}
                                <div className="flex flex-col items-end">
                                    {item.originalPrice && (
                                        <span className="text-xs font-bold text-gray-400 line-through opacity-60 italic mb-1">
                                            {item.originalPrice.toLocaleString()} ₺
                                        </span>
                                    )}
                                    <span className="text-sm font-black text-gray-900 italic">
                                        {item.price.toLocaleString()} ₺
                                    </span>
                                </div>
                            </div>

                            <div className="text-right mt-4 md:mt-0 flex flex-col md:block">
                                <span className="text-xs font-black text-gray-400 md:hidden mb-1 uppercase tracking-widest">TOPLAM</span>
                                <span className="text-lg font-black text-gray-900 italic leading-none">{(item.price * item.quantity).toLocaleString()} ₺</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary Card */}
                <div className="col-span-1">
                    <div className="bg-gray-50/50 p-12 rounded-md border border-gray-100 sticky top-32">
                        <h2 className="text-2xl font-[1000] text-gray-900 uppercase italic tracking-tighter mb-10 leading-none">SİPARİŞ <span className="text-brand-pink">ÖZETİ</span></h2>

                        <div className="space-y-6 pb-10 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ARA TOPLAM</span>
                                <span className="text-sm font-black text-gray-900 italic">{total.toLocaleString()} ₺</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KARGO ÜCRETİ</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">ÜCRETSİZ</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KDV (%20)</span>
                                <span className="text-sm font-black text-gray-900 italic">{(total * 0.2).toLocaleString()} ₺</span>
                            </div>
                        </div>

                        <div className="pt-10 mb-12 flex justify-between items-end">
                            <div>
                                <span className="text-[10px] font-[1000] text-gray-400 uppercase tracking-widest mb-1 block italic">TOPLAM ÖDENECEK</span>
                                <span className="text-4xl font-[1000] text-gray-900 leading-none tracking-tighter italic whitespace-nowrap">{(total * 1.2).toLocaleString()} ₺</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => navigate('/checkout')}
                                className="w-full py-6 bg-brand-pink text-white rounded-md text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-pink/20 hover:scale-105 hover:bg-brand-pink-hover transition-all italic flex items-center justify-center gap-4 group"
                            >
                                ÖDEMEYE GEÇ
                                <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4-4 4M3 12h18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            <Link to="/shop" className="w-full py-6 bg-white text-gray-900 border border-gray-100 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all italic">ALIŞVERİŞE DEVAM ET</Link>
                        </div>

                        {/* Promo Code */}
                        <div className="mt-12">
                            <label className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4 block italic ml-4">PROMOSYON KODU</label>
                            <div className="relative group">
                                <input type="text" placeholder="KOD GİRİNİZ" className="w-full h-14 bg-white border border-gray-100 rounded-md px-6 text-[10px] font-black focus:outline-none focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all italic uppercase tracking-widest" />
                                <button className="absolute right-2 top-2 bottom-2 px-6 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-md text-[9px] font-black uppercase tracking-widest transition-all italic">UYGULA</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
