import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from './LoginForm';

const LoginPage: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen w-full flex flex-col bg-[#fafafa] relative overflow-x-hidden font-sans selection:bg-brand-pink/10 selection:text-brand-pink">
            {/* Background Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-red-100/30 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-sky-100/30 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="fixed top-[30%] right-[0%] w-[30vw] h-[30vw] bg-pink-50/40 rounded-full blur-[120px] pointer-events-none z-0" />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 md:h-20 px-6 md:px-12 flex items-center justify-between bg-white/60 backdrop-blur-2xl border-b border-gray-100/50 z-50 transition-all">
                <div className="flex items-center gap-2 group cursor-pointer">
                    <span className="text-xl md:text-2xl font-[1000] tracking-tighter text-gray-900 uppercase italic leading-none">
                        FUI<span className="text-brand-pink">RA</span>
                    </span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-8">
                    <a href="#" className="text-[11px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em]">Shop</a>
                    <a href="#" className="text-[11px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em]">Community</a>
                    <a href="#" className="text-[11px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em]">Drops</a>
                    <Link to="/register" className="px-6 py-2 rounded-full border-2 border-gray-900 text-[11px] font-[1000] text-gray-900 hover:bg-gray-900 hover:text-white transition-all transform active:scale-95 uppercase tracking-widest shadow-sm">
                        Sign Up
                    </Link>
                </nav>

                {/* Mobile menu button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden w-10 h-10 flex items-center justify-center focus:outline-none z-[60] relative"
                >
                    {isMobileMenuOpen ? (
                        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <div className="flex flex-col gap-1.5 items-end">
                            <div className="w-6 h-0.5 bg-gray-900 rounded-full"></div>
                            <div className="w-4 h-0.5 bg-gray-900 rounded-full"></div>
                        </div>
                    )}
                </button>
            </header>

            {/* Fullscreen Mobile Menu (Based on screenshot) */}
            <div className={`fixed inset-0 bg-white z-[55] lg:hidden transition-all duration-500 ease-in-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Menu Header */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
                    <span className="text-xl font-[1000] tracking-tighter text-gray-900 uppercase italic">
                        FUI<span className="text-brand-pink">RA</span>
                    </span>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-10 h-10 flex items-center justify-center -mr-2"
                    >
                        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto py-6 px-6 space-y-4">
                    {/* Shop */}
                    <button className="w-full flex items-center justify-between group py-2">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <span className="text-xl font-[1000] text-gray-900 tracking-tight uppercase">Shop</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
                    </button>

                    {/* Community */}
                    <button className="w-full flex items-center justify-between group py-2">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <span className="text-xl font-[1000] text-gray-900 tracking-tight uppercase">Community</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
                    </button>

                    {/* Drops */}
                    <button className="w-full flex items-center justify-between group py-2">
                        <div className="flex items-center gap-5 text-left">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-[1000] text-gray-900 tracking-tight uppercase">Drops</span>
                                    <span className="bg-brand-pink text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Hot</span>
                                </div>
                                <p className="text-brand-pink text-[9px] font-black uppercase tracking-widest mt-0.5">Limited Edition</p>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {/* Menu Footer */}
                <div className="p-6 bg-[#fafafa] border-t border-gray-50 space-y-8 flex-shrink-0">
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/login" className="py-4 border-2 border-gray-900 rounded-lg text-gray-900 font-[1000] w-full text-center text-sm uppercase tracking-widest bg-white">
                            Sign In
                        </Link>
                        <Link to="/register" className="py-4 bg-brand-pink rounded-lg text-white font-[1000] w-full text-center text-sm uppercase tracking-widest shadow-lg shadow-brand-pink/20">
                            Sign Up
                        </Link>
                    </div>
                    <div className="flex justify-center gap-8">
                        <a href="#" className="text-sm font-bold text-gray-400 hover:text-gray-900">Instagram</a>
                        <a href="#" className="text-sm font-bold text-gray-400 hover:text-gray-900">Twitter</a>
                        <a href="#" className="text-sm font-bold text-gray-400 hover:text-gray-900">Discord</a>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4 md:px-6 z-10">
                <div className="w-full max-w-full flex justify-center animate-in fade-in zoom-in duration-700">
                    <LoginForm />
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-8 px-6 md:px-12 bg-white/40 backdrop-blur-md border-t border-gray-100/50 hidden md:flex flex-col md:flex-row justify-between items-center gap-6 z-20">
                <div className="flex flex-col items-center md:items-start gap-1">
                    <span className="text-sm font-[1000] text-gray-900 uppercase tracking-tighter italic">FUI<span className="text-brand-pink">RA</span></span>
                    <p className="text-[10px] font-bold text-gray-300 tracking-wider">© 2024 DESIGNED FOR THE BOLD.</p>
                </div>

                <div className="flex items-center gap-8 md:gap-10">
                    {['Instagram', 'Twitter', 'Discord'].map(link => (
                        <a key={link} href="#" className="text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors">{link}</a>
                    ))}
                </div>
            </footer>
        </div>
    );
};

export default LoginPage;
