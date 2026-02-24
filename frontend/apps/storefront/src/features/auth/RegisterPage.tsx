import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import { useAuth } from './useAuth';

const RegisterPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (isAuthenticated) return <Navigate to="/" replace />;

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
                    <Link to="/login" className="px-6 py-2 rounded-full border-2 border-gray-900 text-[11px] font-[1000] text-gray-900 hover:bg-gray-900 hover:text-white transition-all transform active:scale-95 uppercase tracking-widest shadow-sm">
                        Sign In
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

            {/* Mobile Menu */}
            <div className={`fixed inset-0 bg-white z-[55] lg:hidden transition-all duration-500 ease-in-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-16 px-6 flex items-center justify-between border-b border-gray-50">
                    <span className="text-xl font-[1000] tracking-tighter text-gray-900 uppercase italic">FUI<span className="text-brand-pink">RA</span></span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center -mr-2">
                        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-6 space-y-4">
                    <button className="w-full text-left py-4 text-xl font-[1000] text-gray-900 uppercase italic border-b border-gray-50">SHOP</button>
                    <button className="w-full text-left py-4 text-xl font-[1000] text-gray-900 uppercase italic border-b border-gray-50">COMMUNITY</button>
                    <button className="w-full text-left py-4 text-xl font-[1000] text-gray-900 uppercase italic border-b border-gray-50 flex justify-between">DROPS <span className="bg-brand-pink text-white text-[9px] px-2 py-0.5 rounded-full">HOT</span></button>
                </div>
                <div className="p-6 bg-[#fafafa] border-t border-gray-50 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/login" className="py-4 border-2 border-gray-900 rounded-lg text-gray-900 font-[1000] text-center text-sm uppercase italic">Sign In</Link>
                        <Link to="/register" className="py-4 bg-brand-pink rounded-lg text-white font-[1000] text-center text-sm uppercase italic">Sign Up</Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4 md:px-6 z-10">
                <div className="w-full max-w-full flex justify-center animate-in fade-in zoom-in duration-700">
                    <RegisterForm />
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-8 px-6 md:px-12 bg-white/40 backdrop-blur-md border-t border-gray-100/50 hidden md:flex flex-row justify-between items-center gap-6 z-20">
                <div className="flex flex-col items-start gap-1">
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

export default RegisterPage;
