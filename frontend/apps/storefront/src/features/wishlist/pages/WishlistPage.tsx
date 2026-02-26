import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../store/wishlist.store';
import { useCart } from '../../cart/cart.store';
import { toast } from 'react-toastify';

const WishlistPage: React.FC = () => {
    const { items, removeItem, clearWishlist } = useWishlist();
    const { addItem } = useCart();

    const handleAddToCart = (item: any) => {
        addItem(item);
        toast.success(`${item.name} sepete eklendi!`, { autoClose: 2000 });
    };

    const handleRemove = (id: string, name: string) => {
        removeItem(id);
        toast.info(`${name} favorilerden çıkarıldı.`, { autoClose: 1500 });
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20 py-20">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-20">
                    <div>
                        <p className="text-[10px] font-black text-brand-pink tracking-[0.4em] uppercase italic mb-3">
                            Listem
                        </p>
                        <h1 className="text-5xl sm:text-7xl font-[1000] text-gray-900 leading-none tracking-tighter italic uppercase">
                            FAVORİ<span className="text-brand-pink">LERİM</span>
                        </h1>
                    </div>
                    {items.length > 0 && (
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest italic">{items.length} ürün</span>
                            <button
                                onClick={() => {
                                    clearWishlist();
                                    toast.info('Tüm favoriler temizlendi.', { autoClose: 1500 });
                                }}
                                className="px-6 py-3 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all italic"
                            >
                                Tümünü Sil
                            </button>
                        </div>
                    )}
                </div>

                {items.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[4rem] bg-gray-50/30">
                        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-xl mb-10 border border-gray-50">
                            <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter italic">Henüz favori yok</h2>
                        <p className="text-gray-500 text-sm font-bold mb-12 italic tracking-wide">Beğendiğin ürünleri favorilere ekle, daha sonra bul.</p>
                        <Link
                            to="/shop"
                            className="px-12 py-5 bg-brand-pink text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-brand-pink/20 hover:scale-105 transition-all italic"
                        >
                            Keşfetmeye Başla
                        </Link>
                    </div>
                ) : (
                    /* Wishlist Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-8 gap-y-12">
                        {items.map(item => (
                            <div key={item.id} className="group relative flex flex-col bg-white rounded-[3.5rem] p-6 border-2 border-transparent hover:border-gray-50 hover:shadow-2xl hover:shadow-gray-200/50 transition-all">

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemove(item.id, item.name)}
                                    aria-label="Favorilerden Çıkar"
                                    className="absolute top-6 right-6 z-10 w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-brand-pink shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                </button>

                                {/* Product Image */}
                                <Link to={`/product/${item.id}`}>
                                    <div className="aspect-square rounded-[3rem] overflow-hidden mb-8 bg-[#fdfaf5] border border-gray-50 flex items-center justify-center p-8">
                                        {item.image && (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                width="400"
                                                height="400"
                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                                                loading="lazy"
                                            />
                                        )}
                                    </div>
                                </Link>

                                {/* Product Info */}
                                <div className="flex flex-col flex-grow px-2">
                                    {item.category && (
                                        <span className="text-[9px] font-[1000] text-brand-pink tracking-[0.3em] uppercase italic mb-2">
                                            {item.category}
                                        </span>
                                    )}

                                    <Link to={`/product/${item.id}`}>
                                        <h3 className="text-base font-[1000] text-gray-900 mb-6 leading-[1.2] group-hover:text-brand-pink transition-colors italic line-clamp-2 uppercase tracking-tighter">
                                            {item.name}
                                        </h3>
                                    </Link>

                                    <div className="mt-auto flex justify-between items-center pt-6 border-t border-gray-50">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic leading-none mb-1">FUIRA FİYAT</span>
                                            <span className="text-2xl font-[1000] text-gray-900 tracking-tighter italic leading-none">
                                                {item.price.toLocaleString('tr-TR')} TL
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleAddToCart(item)}
                                            aria-label={`${item.name} sepete ekle`}
                                            className="w-14 h-14 rounded-[1.5rem] cursor-pointer bg-gray-900 text-white flex items-center justify-center hover:bg-brand-pink transition-all transform hover:scale-110 shadow-2xl shadow-gray-200"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                                                <path d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
