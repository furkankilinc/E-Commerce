import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    merchant: { companyName: string };
    category: { name: string; slug: string };
    images: { url: string; isMain: boolean }[];
    rating: number;
    reviewCount: number;
    badge?: string;
    badgeColor?: string;
    isFeatured?: boolean;
}

const HomePage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products');
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } catch (err) {
                console.error('Failed to fetch products:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Fallback if no products are in DB yet
    const displayProducts = products.length > 0 ? products : [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex gap-12">
                {/* Sidebar */}
                <aside className="w-64 hidden md:block flex-shrink-0">
                    <div className="mb-10">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Categories</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Tech & Gadgets', count: 12, checked: true },
                                { label: 'Wearables', count: 8 },
                                { label: 'Home Office', count: 14 }
                            ].map((cat, i) => (
                                <label key={i} className="flex items-center group cursor-pointer">
                                    <input type="checkbox" defaultChecked={cat.checked} className="w-5 h-5 border-2 border-gray-200 rounded text-brand-pink focus:ring-brand-pink transition-all" />
                                    <span className="ml-3 text-sm font-semibold text-gray-600 group-hover:text-brand-pink">{cat.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mb-10">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Price Range</h3>
                        <div className="px-2">
                            <div className="relative h-1.5 bg-gray-100 rounded-full mb-6">
                                <div className="absolute left-[20%] right-[30%] top-0 bottom-0 bg-brand-pink rounded-full"></div>
                                <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-4 h-4 bg-brand-pink border-2 border-white rounded-full shadow-md cursor-pointer"></div>
                                <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-4 h-4 bg-brand-pink border-2 border-white rounded-full shadow-md cursor-pointer"></div>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex-1 bg-brand-light-gray h-10 flex items-center justify-center rounded-lg text-sm font-bold">$50</div>
                                <div className="flex-1 bg-brand-light-gray h-10 flex items-center justify-center rounded-lg text-sm font-bold">$800</div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Rating</h3>
                        <div className="space-y-3">
                            {[4, 3, 2, 1].map(r => (
                                <div key={r} className="flex items-center gap-1 group cursor-pointer">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className={`w-4 h-4 ${i < r ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                    <span className="ml-2 text-xs font-bold text-gray-500 group-hover:text-brand-pink transition-colors">& Up</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Promotion Box */}
                    <div className="relative overflow-hidden rounded-2xl bg-rose-50 p-6">
                        <div className="relative z-10">
                            <h4 className="text-rose-600 font-black text-lg mb-1 leading-tight">Summer Sale!</h4>
                            <p className="text-rose-600/60 text-xs mb-5 font-medium leading-relaxed">Get up to 40% off on all tech accessories this weekend.</p>
                            <button className="w-full bg-brand-pink text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-pink-hover transition-all shadow-lg shadow-brand-pink/20">Shop Deal</button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-100 rounded-full blur-2xl opacity-50"></div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Top Bar */}
                    <div className="mb-4 text-xs font-bold text-gray-400 flex items-center gap-2">
                        <span>Home</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span className="text-gray-900">All Products</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 mb-2">Our Collection</h1>
                            <p className="text-gray-400 text-sm font-medium">Showing <span className="text-gray-900">1-{displayProducts.length}</span> of {displayProducts.length} premium products</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-50 p-1 rounded-lg">
                                <button className="p-2 bg-white shadow-sm rounded-md text-brand-pink">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                </button>
                                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>
                                </button>
                            </div>
                            <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 text-sm font-bold text-gray-700 cursor-pointer">
                                Sort by: <span className="ml-1 text-gray-400">Featured</span>
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                        </div>
                    </div>

                    {displayProducts.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-2">Henüz ürün bulunmuyor</h3>
                            <p className="text-gray-400 text-sm">Merchant panelinden ürün eklediğinizde burada görünecektir.</p>
                        </div>
                    ) : (
                        <>
                            {/* Most Popular Section */}
                            <div className="mb-16 uppercase tracking-[0.2em] font-black text-gray-900 text-sm">
                                Most Popular
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                                {displayProducts.slice(0, 3).map(product => (
                                    <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer">
                                        <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 bg-brand-light-gray">
                                            <img src={(product.images.find(img => img.isMain) || product.images[0])?.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                            <div className="absolute top-6 left-6 flex items-center gap-2 bg-brand-pink text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                BEST SELLER
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-brand-pink tracking-widest uppercase mb-1 block">{product.merchant.companyName}</span>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-brand-pink transition-colors">{product.name}</h3>
                                                    <p className="text-lg font-black text-gray-900 mt-2 tracking-tight">${product.price.toLocaleString()}</p>
                                                </div>
                                                <button className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-brand-pink group-hover:bg-brand-pink group-hover:text-white transition-all transform group-hover:scale-110 border border-gray-100">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Product Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                                {displayProducts.map(product => (
                                    <Link to={`/product/${product.id}`} key={product.id} className="group flex flex-col h-full bg-white rounded-3xl p-4 hover:shadow-2xl hover:shadow-gray-200 transition-all border border-transparent hover:border-gray-50">
                                        <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 bg-brand-light-gray">
                                            <img src={(product.images.find(img => img.isMain) || product.images[0])?.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-brand-pink transition-colors">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                                            </button>
                                            <div className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest bg-green-100 text-green-700 backdrop-blur-md`}>
                                                IN STOCK
                                            </div>
                                        </div>
                                        <div className="flex flex-col flex-grow px-2">
                                            <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-1 block leading-none">{product.merchant.companyName}</span>
                                            <h3 className="text-sm font-bold text-gray-900 mb-2 leading-tight group-hover:text-brand-pink transition-colors">{product.name}</h3>

                                            <div className="flex items-center gap-1 mb-4">
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <svg key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400">({product.reviewCount})</span>
                                            </div>

                                            <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-50">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-lg font-black text-gray-900 tracking-tight">${product.price.toLocaleString()}</span>
                                                </div>
                                                <button className="w-10 h-10 rounded-full bg-brand-pink text-white flex items-center justify-center hover:bg-brand-pink-hover transition-all transform hover:scale-110 shadow-lg shadow-brand-pink/30">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    <div className="mt-20 flex justify-center items-center gap-2">
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        <div className="flex gap-2">
                            {[1].map((p, i) => (
                                <button key={i} className={`w-10 h-10 rounded-full text-sm font-black transition-all ${p === 1 ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/20' : 'text-gray-400 hover:bg-gray-50'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;

