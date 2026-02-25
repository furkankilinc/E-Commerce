import React from 'react';
import { Link } from 'react-router-dom';

const WishlistPage: React.FC = () => {
    // This is a placeholder for the favorites page
    // In a real app, we would fetch the user's favorites from an API or state
    const favorites: any[] = [];

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20 py-20">
                <div className="text-center mb-20">
                    <h1 className="text-6xl font-[1000] text-gray-900 leading-none tracking-tighter mb-6 italic uppercase">FAVORİLERİM</h1>
                    <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em] italic">Beğendiğiniz ürünler burada saklanır.</p>
                </div>

                {favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/30">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-10 text-gray-200">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight italic">Henüz favori ürününüz yok</h2>
                        <Link to="/shop" className="px-10 py-4 bg-brand-pink text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-pink/20 hover:bg-brand-pink-hover transition-all">KEŞFETMEYE BAŞLA</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {/* Favorite items would go here */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
