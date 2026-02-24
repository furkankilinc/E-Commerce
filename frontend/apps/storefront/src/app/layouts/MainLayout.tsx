import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const MainLayout: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-8">
                            <Link to="/" className="flex items-center">
                                <div className="w-8 h-8 bg-brand-pink rounded-full flex items-center justify-center mr-2">
                                    <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
                                </div>
                                <span className="text-2xl font-black tracking-tighter text-gray-900">VIBRANT</span>
                            </Link>
                            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                                <Link to="/shop" className="hover:text-brand-pink border-b-2 border-transparent hover:border-brand-pink py-1 transition-all">Shop All</Link>
                                <Link to="/new" className="hover:text-brand-pink transition-all">New Arrivals</Link>
                                <Link to="/sale" className="hover:text-brand-pink transition-all text-brand-pink">Sale</Link>
                            </nav>
                        </div>

                        {/* Search */}
                        <div className="flex-1 max-w-md mx-8 hidden lg:block">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full bg-brand-light-gray border-none rounded-full py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-brand-pink/20 transition-all text-sm"
                                />
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Icons */}
                        <div className="flex items-center gap-5">
                            <button className="p-2 text-gray-600 hover:text-brand-pink relative">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
                            </button>
                            <button className="p-2 text-gray-600 hover:text-brand-pink">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border-2 border-white shadow-sm overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name=User&background=FF8A65&color=fff" alt="User" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center mb-6">
                                <div className="w-6 h-6 bg-brand-pink rounded-full flex items-center justify-center mr-2">
                                    <div className="w-3 h-3 bg-white rounded-sm transform rotate-45"></div>
                                </div>
                                <span className="text-xl font-black tracking-tighter text-gray-900 uppercase">Vibrant</span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                Curating the world's most vibrant and high-contrast products for the modern aesthetic seeker. Quality and style, delivered.
                            </p>
                            <div className="flex gap-4">
                                {['facebook', 'instagram', 'twitter'].map(social => (
                                    <a key={social} href="#" className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-brand-pink hover:text-white transition-all">
                                        <span className="sr-only">{social}</span>
                                        <div className="w-4 h-4 border border-current rounded-sm"></div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-6 uppercase text-sm tracking-wider">Help & Support</h4>
                            <ul className="space-y-4 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Shipping Policy</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Returns & Exchanges</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Size Guide</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">FAQ</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-6 uppercase text-sm tracking-wider">Company</h4>
                            <ul className="space-y-4 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-brand-pink transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Store Locator</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-6 uppercase text-sm tracking-wider">Join Our Newsletter</h4>
                            <p className="text-sm text-gray-500 mb-4">Subscribe to get special offers and first looks.</p>
                            <div className="flex gap-2">
                                <input type="email" placeholder="Email address" className="flex-1 bg-brand-light-gray border-none rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-brand-pink/20" />
                                <button className="bg-brand-pink text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-brand-pink-hover transition-colors">Join</button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-medium uppercase tracking-widest">
                        <p>© 2024 VIBRANT STORE. BUILT FOR THE BOLD.</p>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-gray-900">Privacy Policy</a>
                            <a href="#" className="hover:text-gray-900">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
