import React from 'react';
import { Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { useCart } from '../../features/cart/cart.store';
import { useWishlist } from '../../features/wishlist/store/wishlist.store';
import { getSizedImageUrl } from '../../shared/utils/image.util';
import UserGeolocationTracker from '../../shared/components/UserGeolocationTracker';
import { useTranslation } from '../../shared/i18n/I18nContext';
import { authStore } from '../../features/auth/auth.store';

const MainLayout: React.FC = () => {
    const { logout, user, isAuthenticated } = useAuth();
    const { items, decrementItem, itemCount, total, refreshCart } = useCart();
    const { itemCount: wishlistCount } = useWishlist();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { locale, setLocale, t } = useTranslation();
    const [searchValue, setSearchValue] = React.useState(searchParams.get('search') || '');
    const [suggestions, setSuggestions] = React.useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [isSuggesting, setIsSuggesting] = React.useState(false);
    const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const [showCart, setShowCart] = React.useState(false);
    const searchRef = React.useRef<HTMLDivElement>(null);
    const userMenuRef = React.useRef<HTMLDivElement>(null);
    const cartRef = React.useRef<HTMLDivElement>(null);

    // Token Expiration Heartbeat
    React.useEffect(() => {
        if (!isAuthenticated) return;

        const isTokenExpired = (token: string | null): boolean => {
            if (!token) return true;
            try {
                const parts = token.split('.');
                if (parts.length !== 3) return true;
                const payloadDecoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
                const payload = JSON.parse(payloadDecoded);
                if (!payload.exp) return false;

                const now = Math.floor(Date.now() / 1000);
                return payload.exp <= now + 5;
            } catch {
                return true;
            }
        };

        const checkToken = async () => {
            const token = authStore.getToken();
            const refToken = authStore.getRefreshToken();

            if (isTokenExpired(token)) {
                if (refToken) {
                    try {
                        const res = await fetch('/api/auth/refresh', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refreshToken: refToken })
                        });

                        if (res.ok) {
                            const data = await res.json();
                            authStore.setAuth(data.accessToken, authStore.getUser()!, data.refreshToken);
                        } else {
                            throw new Error('Refresh failed');
                        }
                    } catch (err) {
                        console.error('[Storefront Token Heartbeat] Token refresh failed, logging out...', err);
                        logout();
                        navigate('/login');
                    }
                } else {
                    logout();
                    navigate('/login');
                }
            }
        };

        checkToken();
        const interval = setInterval(checkToken, 5000);
        return () => clearInterval(interval);
    }, [isAuthenticated, logout, navigate]);

    // Load recent searches
    React.useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse recent searches', e);
            }
        }
    }, []);

    const saveRecentSearch = (term: string) => {
        if (!term || !term.trim()) return;
        const trimmed = term.trim();
        const newRecent = [
            trimmed,
            ...recentSearches.filter(s => s !== trimmed)
        ].slice(0, 5); // Keep last 5
        setRecentSearches(newRecent);
        localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    };

    const removeRecentSearch = (term: string) => {
        const newRecent = recentSearches.filter(s => s !== term);
        setRecentSearches(newRecent);
        localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    // Close suggestions when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
                setShowCart(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sepet dropdown'ı açıldığında fiyatları doğrula ve açık kaldığı sürece senkronize kal
    React.useEffect(() => {
        if (!showCart) return;
        refreshCart();
        const intervalId = setInterval(() => {
            refreshCart();
        }, 5000);
        return () => clearInterval(intervalId);
    }, [showCart, refreshCart]);

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
        navigate('/login');
    };

    // Fetch suggestions as user types
    React.useEffect(() => {
        const controller = new AbortController();

        const fetchSuggestions = async () => {
            if (searchValue.trim().length < 2) {
                setSuggestions([]);
                return;
            }
            setIsSuggesting(true);
            try {
                const res = await fetch(`/api/products?search=${encodeURIComponent(searchValue)}&limit=5`, {
                    signal: controller.signal
                });
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.products);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Suggestion fetch failed:', err);
                }
            } finally {
                setIsSuggesting(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchValue]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        const params = new URLSearchParams(searchParams);
        if (searchValue.trim()) {
            params.set('search', searchValue.trim());
            saveRecentSearch(searchValue.trim());
        } else {
            params.delete('search');
        }
        navigate(`/shop?${params.toString()}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <UserGeolocationTracker />
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-50">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20">
                    <div className="flex justify-between items-center h-24">
                        {/* Logo & Nav */}
                        <div className="flex items-center gap-16">
                            <Link to="/" className="flex items-center">
                                <span className="text-2xl font-extrabold tracking-tighter text-gray-900 italic ">
                                    <span className="text-brand-pink">FUI & </span>RA
                                </span>
                            </Link>
                            <nav className="hidden lg:flex items-center gap-10 text-10px font-bold  tracking-widest text-gray-500">
                                <Link to="/shop" className="hover:text-gray-900 transition-colors">{t('nav.allProducts')}</Link>
                                <Link to="/new" className="hover:text-gray-900 transition-colors">{t('nav.newArrivals')}</Link>
                                <Link to="/sale" className="hover:text-gray-900 transition-colors">{t('nav.sale')}</Link>
                            </nav>
                        </div>

                        {/* Search Bar */}
                        <div ref={searchRef} className="flex-1 max-w-lg mx-12 hidden md:block relative">
                            <form onSubmit={handleSearch} className="relative group z-10">
                                <input
                                    type="text"
                                    aria-label={t('search.placeholder')}
                                    placeholder={t('search.placeholder')}
                                    value={searchValue}
                                    onChange={(e) => {
                                        setSearchValue(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onClick={() => setShowSuggestions(true)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-md py-3.5 pl-14 pr-6 focus:ring-4 focus:ring-brand-pink/5 focus:bg-white focus:border-brand-pink transition-all text-xs font-bold"
                                />
                                <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-brand-pink transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </form>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-md shadow-xl border border-gray-50 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Recent Searches Section */}
                                    {searchValue.trim().length < 2 && recentSearches.length > 0 && (
                                        <div className="py-4">
                                            <div className="px-8 pb-4 border-b border-gray-50 mb-2 flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-2.5 h-2.5 text-brand-pink" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                                                    <span className="text-9px font-bold text-gray-400  tracking-widest">{t('search.recent')}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        clearRecentSearches();
                                                    }}
                                                    className="text-8px font-semibold text-brand-pink/50 hover:text-brand-pink  tracking-widest transition-colors italic"
                                                >
                                                    {t('search.clear')}
                                                </button>
                                            </div>
                                            {recentSearches.map((term, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between px-8 py-3.5 hover:bg-gray-50 transition-colors group cursor-pointer"
                                                    onClick={() => {
                                                        setSearchValue(term);
                                                        const params = new URLSearchParams(searchParams);
                                                        params.set('search', term);
                                                        saveRecentSearch(term);
                                                        setShowSuggestions(false);
                                                        navigate(`/shop?${params.toString()}`);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                                                            <svg className="w-3 h-3 text-gray-300 group-hover:text-brand-pink transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </div>
                                                        <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-900  italic transition-colors truncate">{term}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeRecentSearch(term);
                                                        }}
                                                        className="p-2 text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Search Suggestions Section */}
                                    {searchValue.trim().length >= 2 && (
                                        <>
                                            {isSuggesting && suggestions.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <div className="w-6 h-6 border-2 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                                    <span className="text-10px font-semibold text-gray-300  tracking-widest italic">{t('search.searching')}</span>
                                                </div>
                                            ) : suggestions.length > 0 ? (
                                                <div className="py-4">
                                                    <div className="px-8 pb-4 border-b border-gray-50 mb-2">
                                                        <span className="text-9px font-semibold text-gray-300  tracking-widest">{t('search.recommended')}</span>
                                                    </div>
                                                    {suggestions.map((product) => (
                                                        <Link
                                                            key={product.id}
                                                            to={`/product/${product.id}`}
                                                            onClick={() => {
                                                                saveRecentSearch(searchValue);
                                                                setShowSuggestions(false);
                                                            }}
                                                            className="flex items-center gap-6 px-8 py-4 hover:bg-gray-50 transition-colors group"
                                                        >
                                                            <div className="w-14 h-14 bg-[#fdfaf5] rounded-md flex items-center justify-center p-2 border border-gray-50 shadow-sm group-hover:scale-105 transition-transform">
                                                                <img
                                                                    src={getSizedImageUrl((product.images.find((img: any) => img.isMain) || product.images[0])?.url, 'small')}
                                                                    alt=""
                                                                    width="56"
                                                                    height="56"
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            </div>
                                                            <div className="flex-1 truncate">
                                                                <h4 className="text-[11px] font-bold text-gray-900  italic truncate leading-none mb-1.5">{product.name}</h4>
                                                                <div className="flex items-center gap-3">
                                                                    {product.discountPrice ? (
                                                                        <>
                                                                            <span className="text-8px font-bold text-gray-400 line-through italic opacity-60">
                                                                                {product.price.toLocaleString()} ₺
                                                                            </span>
                                                                            <span className="text-10px font-semibold text-brand-pink italic">
                                                                                {product.discountPrice.toLocaleString()} ₺
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-10px font-semibold text-brand-pink italic">
                                                                            {product.price.toLocaleString()} ₺
                                                                        </span>
                                                                    )}
                                                                    <span className="text-8px font-semibold text-gray-300  tracking-widest">{product.category?.name}</span>
                                                                </div>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full border border-gray-50 flex items-center justify-center text-gray-200 group-hover:text-brand-pink group-hover:border-brand-pink/20 transition-all">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : !isSuggesting && (
                                                <div className="p-12 text-center">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                                        <svg className="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                    </div>
                                                    <p className="text-10px font-semibold text-gray-300  tracking-widest italic leading-relaxed">{t('search.noResults')}<br /></p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Empty state if nothing to show */}
                                    {searchValue.trim().length < 2 && recentSearches.length === 0 && (
                                        <div className="p-12 text-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                                <svg className="w-6 h-6 text-brand-pink/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.246.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                            </div>
                                            <p className="text-10px font-semibold text-gray-300  tracking-widest italic leading-relaxed">{t('search.start')}<br /></p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Icons */}
                        <div className="flex items-center gap-8">
                            {/* Language Switcher Toggle */}
                            <button
                                onClick={() => setLocale(locale === 'tr' ? 'en' : 'tr')}
                                className="w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center border border-gray-100 hover:border-brand-pink hover:text-brand-pink transition-all text-[11px] font-semibold tracking-widest text-gray-900 cursor-pointer shadow-xs"
                                title={locale === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
                            >
                                {locale.toUpperCase()}
                            </button>

                            <Link to="/wishlist" className="relative group p-2" aria-label="Favorilerim">
                                <svg
                                    className="w-7 h-7 text-gray-900 group-hover:text-brand-pink transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {isAuthenticated && wishlistCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-pink text-white text-9px font-bold rounded-full flex items-center justify-center shadow-lg shadow-brand-pink/40 border-2 border-white">{wishlistCount}</span>
                                )}
                            </Link>

                            <Link to="/collections" className="relative group p-2" aria-label="Koleksiyonlarım">
                                <svg className="w-7 h-7 text-gray-900 group-hover:text-brand-pink transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </Link>

                            <div ref={cartRef} className="relative">
                                <button
                                    onClick={() => setShowCart(!showCart)}
                                    aria-label="Sepetim"
                                    className={`relative group p-2 rounded-md transition-all ${showCart ? 'bg-brand-pink/5 text-brand-pink' : 'text-gray-900 hover:bg-gray-50'}`}
                                >
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-pink text-white text-9px font-semibold rounded-full flex items-center justify-center shadow-lg shadow-brand-pink/40 border-2 border-white">{itemCount}</span>
                                </button>

                                {showCart && (
                                    <div className="absolute top-full right-0 mt-2 w-[380px] bg-white rounded-md shadow-xl border border-gray-50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-10px font-semibold text-gray-400  tracking-widest">{t('cart.title')}</p>
                                                <span className="text-10px font-semibold text-brand-pink bg-brand-pink/5 px-3 py-1 rounded-full italic">{t('cart.itemsCount', { count: itemCount })}</span>
                                            </div>
                                        </div>

                                        <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
                                            {items.length === 0 ? (
                                                <div className="py-20 text-center">
                                                    <p className="text-10px font-semibold text-gray-300  tracking-widest italic">{t('cart.empty')}</p>
                                                </div>
                                            ) : (
                                                items.map((item) => (
                                                    <div key={`${item.id}-${item.variant}`} className="flex gap-4 p-4 rounded-md hover:bg-gray-50 transition-colors group relative overflow-hidden">
                                                        <div className="w-20 h-16 bg-white rounded-md border border-gray-100 flex items-center justify-center p-2 flex-shrink-0 group-hover:scale-105 transition-transform">
                                                            <img src={getSizedImageUrl(item.image, 'small')} alt={item.name} width="80" height="80" className="w-full h-full object-contain" />
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <h4 className="text-[11px] font-[1000] text-gray-900  italic truncate mb-1">{item.name}</h4>
                                                            <p className="text-9px font-bold text-gray-400  tracking-widest mb-2">{item.variant || t('cart.standardEdition')}</p>
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    {item.originalPrice ? (
                                                                        <>
                                                                            <span className="text-10px font-bold text-gray-400 line-through italic opacity-60">
                                                                                {item.originalPrice.toLocaleString()} ₺
                                                                            </span>
                                                                            <span className="text-xs font-semibold text-brand-pink italic">
                                                                                {item.price.toLocaleString()} ₺
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-xs font-semibold text-brand-pink italic">
                                                                            {item.price.toLocaleString()} ₺
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-10px font-semibold text-gray-300 italic">x {item.quantity}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => decrementItem(item.id, item.variant)}
                                                            aria-label="Ürünü Sil"
                                                            className="absolute top-1/2 -translate-y-1/2 -right-12 group-hover:right-4 w-10 h-10 rounded-md bg-white  shadow-red-500/10 border border-gray-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-all duration-300"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="p-8 bg-gray-50/50 border-t border-gray-50">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-10px font-bold text-gray-400  tracking-widest italic">{t('cart.total')}</span>
                                                <span className="text-xl font-bold text-gray-900 tracking-tighter italic leading-none">{total.toLocaleString()}&nbsp;₺</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Link
                                                    to="/cart"
                                                    onClick={() => setShowCart(false)}
                                                    className="py-4 rounded-md bg-white border border-gray-100 text-10px font-semibold text-gray-900  tracking-widest text-center hover:bg-gray-900 hover:text-white transition-all italic"
                                                >
                                                    {t('cart.goToCart')}
                                                </Link>
                                                <Link
                                                    to="/checkout"
                                                    onClick={() => setShowCart(false)}
                                                    className="py-4 rounded-md bg-brand-pink text-white text-10px font-semibold  tracking-widest text-center  shadow-brand-pink/20 hover:scale-105 transition-all italic"
                                                >
                                                    {t('cart.checkout')}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div ref={userMenuRef} className="relative">
                                {isAuthenticated ? (
                                    <>
                                        <button
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            aria-label="Kullanıcı Menüsü"
                                            className={`w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center border transition-all overflow-hidden ${showUserMenu ? 'border-brand-pink ring-4 ring-brand-pink/5' : 'border-gray-100 hover:border-brand-pink'}`}
                                        >
                                            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </button>

                                        {showUserMenu && (
                                            <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-md shadow-xl border border-gray-50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                                    <p className="text-9px font-semibold text-gray-400  tracking-widest mb-1">{t('user.welcome')}</p>
                                                    <p className="text-xs font-semibold text-gray-900 truncate italic ">{user?.name || 'Kullanıcı'}</p>
                                                </div>
                                                <div className="p-3">
                                                    <Link
                                                        to="/profile"
                                                        onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-4 px-5 py-3.5 rounded-md text-10px font-semibold text-gray-400  tracking-widest hover:bg-gray-50 hover:text-gray-900 transition-all italic"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                        {t('user.profile')}
                                                    </Link>
                                                    <Link
                                                        to="/profile/orders"
                                                        onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-4 px-5 py-3.5 rounded-md text-10px font-semibold text-gray-400  tracking-widest hover:bg-gray-50 hover:text-gray-900 transition-all italic"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                        {t('user.orders')}
                                                    </Link>
                                                    <div className="h-px bg-gray-50 my-2 mx-5" />
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex cursor-pointer items-center gap-4 px-5 py-3.5 rounded-md text-10px font-semibold text-red-400  tracking-widest hover:bg-red-50 transition-all italic"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                                        {t('user.logout')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="px-6 h-10 rounded-md bg-gray-900 text-white text-10px font-semibold  tracking-widest flex items-center justify-center hover:bg-brand-pink transition-all shadow-lg shadow-gray-200"
                                    >
                                        {t('user.login')}
                                    </Link>
                                )}
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
            <footer className="bg-white border-t border-gray-50 pt-32 pb-16">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-32">
                        <div className="col-span-1 md:col-span-1">
                            <Link to="/" className="inline-block mb-5">
                                <span className="text-2xl font-extrabold tracking-tighter text-gray-900 italic ">
                                    <span className="text-brand-pink">F</span>UIRA
                                </span>
                            </Link>
                            <p className="text-gray-600 text-xs font-bold leading-relaxed mb-5 italic">
                                {t('footer.about')}
                            </p>
                            <div className="flex gap-6">
                                {['facebook', 'instagram', 'twitter'].map(social => (
                                    <a key={social} href="#" aria-label={`${social} hesabımız`} className="w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center text-gray-300 hover:bg-brand-pink hover:text-white transition-all transform hover:-translate-y-1 shadow-sm">
                                        <div className="w-4 h-4 border-2 border-current rounded-sm rotate-45"></div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-10px font-semibold text-gray-900 mb-5  tracking-[0.2em] italic">{t('footer.helpTitle')}</h4>
                            <ul className="space-y-6 text-[11px] font-[900] text-gray-500  tracking-widest italic">
                                <li><a href="#" className="hover:text-brand-pink transition-colors">{t('footer.shipping')}</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">{t('footer.returns')}</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">{t('footer.sizeGuide')}</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">{t('footer.faq')}</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-10px font-semibold text-gray-900 mb-5  tracking-[0.2em] italic">{t('footer.categoriesTitle')}</h4>
                            <ul className="space-y-6 text-[11px] font-[900] text-gray-500  tracking-widest italic">
                                <li><a href="#" className="hover:text-brand-pink transition-colors">{t('footer.accessories')}</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">{t('footer.clothing')}</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">{t('footer.electronics')}</a></li>
                                <li><a href="#" className="hover:text-brand-pink transition-colors">{t('footer.wearable')}</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-10px font-bold text-gray-900 mb-5  tracking-[0.2em] italic">{t('footer.newsletterTitle')}</h4>
                            <p className="text-[11px] font-bold text-gray-600 mb-4 italic">{t('footer.newsletterDesc')}</p>
                            <div className="flex flex-col gap-4">
                                <input aria-label={t('footer.emailPlaceholder')} type="email" placeholder={t('footer.emailPlaceholder')} className="w-full bg-gray-50 border border-gray-100 rounded-md px-6 py-4 text-xs font-bold focus:ring-4 focus:ring-brand-pink/5" />
                                <button className="w-full bg-brand-pink text-gray-900 py-3 rounded-md text-10px font-bold  tracking-widest shadow-lg shadow-brand-pink/20 hover:bg-brand-pink-hover transition-all italic">{t('footer.subscribe')}</button>
                            </div>
                        </div>
                    </div>

                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
