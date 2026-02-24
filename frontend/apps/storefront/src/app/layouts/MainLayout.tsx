import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const MainLayout: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-50">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20">
                    <div className="flex justify-between items-center h-24">
                        {/* Logo & Nav */}
                        <div className="flex items-center gap-16">
                            <Link to="/" className="flex items-center">
                                <span className="text-3xl font-[1000] tracking-tighter text-gray-900 italic uppercase">
                                    <span className="text-brand-pink">F</span>UIRA
                                </span>
                            </Link>
                            <nav className="hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                <Link to="/shop" className="hover:text-gray-900 transition-colors">TÜM ÜRÜNLER</Link>
                                <Link to="/new" className="hover:text-gray-900 transition-colors">YENİ GELENLER</Link>
                                <Link to="/sale" className="hover:text-gray-900 transition-colors">İNDİRİM</Link>
                            </nav>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-lg mx-12 hidden md:block">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Ürünleri ara..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-14 pr-6 focus:ring-4 focus:ring-brand-pink/5 focus:bg-white focus:border-brand-pink transition-all text-xs font-bold"
                                />
                                <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-brand-pink transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Icons */}
                        <div className="flex items-center gap-8">
                            <button className="relative group">
                                <svg className="w-7 h-7 text-gray-900 group-hover:text-brand-pink transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-pink text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-brand-pink/40 border-2 border-white">0</span>
                            </button>
                            <button className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group hover:border-brand-pink transition-all">
                                <svg className="w-5 h-5 text-gray-900 group-hover:text-brand-pink transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-50 pt-32 pb-16">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-32">
                        <div className="col-span-1 md:col-span-1">
                            <Link to="/" className="inline-block mb-10">
                                <span className="text-2xl font-[1000] tracking-tighter text-gray-900 italic uppercase">
                                    <span className="text-brand-pink">F</span>UIRA
                                </span>
                            </Link>
                            <p className="text-gray-400 text-xs font-bold leading-relaxed mb-10 opacity-70 italic">
                                Dünyanın en canlı ve modern ürünlerini estetik arayanlar için bir araya getiriyoruz. Kalite ve stil, kapınızda.
                            </p>
                            <div className="flex gap-6">
                                {['facebook', 'instagram', 'twitter'].map(social => (
                                    <a key={social} href="#" className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 hover:bg-brand-pink hover:text-white transition-all transform hover:-translate-y-1 shadow-sm">
                                        <div className="w-4 h-4 border-2 border-current rounded-sm rotate-45"></div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-gray-900 mb-10 uppercase tracking-[0.2em] italic">YARDIM VE DESTEK</h4>
                            <ul className="space-y-6 text-[11px] font-[900] text-gray-400 uppercase tracking-widest italic">
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Kargo Politikası</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">İade ve Değişim</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Beden Rehberi</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">SSS</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-gray-900 mb-10 uppercase tracking-[0.2em] italic">ÜRÜN KATEGORİLERİ</h4>
                            <ul className="space-y-6 text-[11px] font-[900] text-gray-400 uppercase tracking-widest italic">
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Aksesuarlar</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Giyim</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Elektronik</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Giyilebilir</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-gray-900 mb-10 uppercase tracking-[0.2em] italic">BÜLTENİMİZE KATILIN</h4>
                            <p className="text-[11px] font-bold text-gray-400 mb-8 italic opacity-70">Özel teklifler ve ilk bakış için abone olun.</p>
                            <div className="flex flex-col gap-4">
                                <input type="email" placeholder="E-posta adresi" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold focus:ring-4 focus:ring-brand-pink/5" />
                                <button className="w-full bg-brand-pink text-white py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-pink/20 hover:bg-brand-pink-hover transition-all italic">ABONE OL</button>
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-16 border-t border-gray-50">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] italic leading-relaxed">
                            © 2024 FUIRA STORE. CESURLAR İÇİN TASARLANDI.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
