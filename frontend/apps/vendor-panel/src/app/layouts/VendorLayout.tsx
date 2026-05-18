import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import GeolocationTracker from '../../shared/components/GeolocationTracker';

const VendorLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, merchant } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        {
            label: 'Panel', path: '/dashboard', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            )
        },

        {
            label: 'Ürünler', path: '/products', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            )
        },
        {
            label: 'Taslaklar', path: '/products/drafts', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            )
        },
        {
            label: 'Stoklar', path: '/stocks', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            )
        },
        {
            label: 'Siparişler', path: '/orders', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            )
        },
        {
            label: 'Ayarlar', path: '/settings', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )
        }
    ];

    return (
        <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans">
            <GeolocationTracker />
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-pink rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-pink/20">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </div>
                        <div>
                            <span className="text-lg font-semibold text-slate-900 leading-none block italic">Satıcı Paneli</span>
                            <span className="text-10px font-bold text-brand-pink tracking-wider  italic">FUIRA Enterprise</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = item.path === '/products'
                            ? (location.pathname.startsWith('/products') && !location.pathname.startsWith('/products/drafts'))
                            : location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all cursor-pointer ${isActive ? 'bg-rose-50 text-brand-pink shadow-sm shadow-rose-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span className={isActive ? 'text-brand-pink' : 'text-slate-400'}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-4 border border-white shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm shrink-0">
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(merchant?.contactPerson || merchant?.companyName || 'Satıcı')}&background=fb7185&color=fff&bold=true`} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-slate-900 block truncate leading-tight italic">{merchant?.contactPerson || 'Furkan Kılınç'}</span>
                            <span className="text-9px font-semibold text-slate-400 block truncate tracking-wider mt-0.5">{merchant?.companyName || 'FUIRA Enterprise'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full h-12 rounded-2xl border border-slate-200 hover:border-red-200 hover:bg-red-50/50 text-slate-500 hover:text-red-500 flex items-center justify-center gap-3 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        OTURUMU KAPAT
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-12 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-slate-900  tracking-tight italic">
                            {menuItems.find(m => location.pathname.startsWith(m.path))?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-8">
                    </div>
                </header>

                <div className="p-12">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default VendorLayout;
