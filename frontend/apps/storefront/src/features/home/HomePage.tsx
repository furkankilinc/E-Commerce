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
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const HomePage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchProducts = async (page: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/products?page=${page}&limit=12`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(currentPage);
    }, [currentPage]);

    const handlePageChange = (newPage: number) => {
        if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-center flex-col gap-4">
                <div className="w-16 h-16 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black text-xs uppercase tracking-[0.3em] text-gray-300 italic">Koleksiyon Hazırlanıyor...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20 py-10">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Link to="/" className="hover:text-gray-900 transition-colors">ANASAYFA</Link>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-gray-900">TÜM ÜRÜNLER</span>
            </div>

            {/* Title & Count */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                <div>
                    <h1 className="text-[64px] font-[900] text-gray-900 leading-[0.9] tracking-tighter mb-4 italic">Koleksiyonumuz</h1>
                    {pagination && (
                        <p className="text-gray-400 text-sm font-bold">{pagination.total} premium üründen <span className="text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span> arası gösteriliyor</p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                        <button className="p-2.5 bg-brand-pink text-white rounded-lg shadow-lg shadow-brand-pink/20">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </button>
                        <button className="p-2.5 text-gray-400 hover:text-gray-900 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>
                        </button>
                    </div>
                    <div className="flex items-center bg-white border border-gray-100 rounded-xl px-6 py-3.5 text-xs font-black text-gray-900 shadow-sm cursor-pointer hover:border-gray-200 transition-all uppercase tracking-widest italic">
                        Sıralama: <span className="ml-2 text-gray-400 group-hover:text-gray-900 transition-colors">Öne Çıkanlar</span>
                        <svg className="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                </div>
            </div>

            {/* MOST POPULAR SECTION */}
            <div className="mb-20">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] italic mb-10 text-gray-900">EN POPÜLER ÜRÜNLER</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {products.slice(0, 3).map((product, i) => (
                        <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer">
                            <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden mb-8 bg-[#fdfaf5] shadow-sm border border-gray-50">
                                <img src={(product.images.find(img => img.isMain) || product.images[0])?.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out p-6" />
                                <div className="absolute top-6 left-6 flex items-center gap-2 bg-brand-pink text-white text-[9px] font-black tracking-[0.2em] px-3.5 py-1.5 rounded-lg shadow-xl uppercase italic">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    EN ÇOK SATAN
                                </div>
                            </div>
                            <div className="flex justify-between items-start px-2">
                                <div>
                                    <span className="text-[9px] font-black text-brand-pink tracking-[0.2em] uppercase mb-1.5 block leading-none">{product.category?.name || 'CORETECH'}</span>
                                    <h3 className="text-xl font-black text-gray-900 group-hover:text-brand-pink transition-colors line-clamp-1 italic">{product.name}</h3>
                                    <p className="text-lg font-black text-gray-900 mt-2">${product.price.toLocaleString()}</p>
                                </div>
                                <button className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-brand-pink group-hover:bg-brand-pink group-hover:text-white transition-all transform group-hover:scale-110 border border-gray-50 flex-shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-20">
                {/* Sidebar */}
                <aside className="w-full lg:w-64 flex-shrink-0 border-r border-gray-50 lg:pr-12">
                    <div className="mb-14">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-8 italic">KATEGORİLER</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Aksesuarlar', checked: true },
                                { label: 'Elektronik', checked: false },
                                { label: 'Yaşam', checked: false }
                            ].map((cat, i) => (
                                <label key={i} className="flex items-center group cursor-pointer">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" checked={cat.checked} className="w-5 h-5 border-2 border-gray-200 rounded text-brand-pink focus:ring-brand-pink transition-all cursor-pointer appearance-none checked:bg-brand-pink checked:border-brand-pink" />
                                        {cat.checked && <svg className="absolute w-3.5 h-3.5 text-white left-0.5 top-0.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                    </div>
                                    <span className="ml-4 text-xs font-black text-gray-600 group-hover:text-gray-900 transition-colors uppercase tracking-tight italic">{cat.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mb-14">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-8 italic">FİYAT ARALIĞI</h3>
                        <div className="px-1">
                            <div className="relative h-1 bg-gray-100 rounded-full mb-8">
                                <div className="absolute left-[0%] right-[30%] top-0 bottom-0 bg-brand-pink rounded-full shadow-[0_0_10px_rgba(255,51,102,0.3)]"></div>
                                <div className="absolute left-[0%] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-brand-pink border-[3px] border-white rounded-full shadow-lg cursor-pointer"></div>
                                <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-brand-pink border-[3px] border-white rounded-full shadow-lg cursor-pointer"></div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1 bg-white border border-gray-100 h-10 flex items-center justify-center rounded-xl text-[11px] font-[900] text-gray-900 italic shadow-sm">$50</div>
                                <div className="flex-1 bg-white border border-gray-100 h-10 flex items-center justify-center rounded-xl text-[11px] font-[900] text-gray-900 italic shadow-sm">$800</div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-14">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-8 italic text-left">DEĞERLENDİRME</h3>
                        <div className="space-y-4">
                            {[4].map(r => (
                                <div key={r} className="flex items-center gap-1.5 group cursor-pointer group">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className={`w-3.5 h-3.5 ${i < r ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                    <span className="ml-2 text-[10px] font-[900] text-gray-400 group-hover:text-gray-900 transition-colors mt-0.5">& Üzeri</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Promo Card */}
                    <div className="bg-[#fff1f5] rounded-[2.5rem] p-10 relative overflow-hidden group border border-[#ffe4ec]">
                        <div className="relative z-10">
                            <h4 className="text-xl font-black text-brand-pink mb-2 leading-none italic">Yaz İndirimi!</h4>
                            <p className="text-[#a85b74] text-[10px] font-bold mb-8 leading-relaxed italic opacity-80">Tüm aksesuarlarda %40'a varan indirimleri kaçırmayın.</p>
                            <button className="w-full bg-brand-pink text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-pink/20 hover:bg-brand-pink-hover transition-all active:scale-95 italic">FIRSATLARI GÖR</button>
                        </div>
                        <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
                    </div>
                </aside>

                {/* Main Content Product Grid */}
                <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                        {products.map(product => (
                            <Link to={`/product/${product.id}`} key={product.id} className="group flex flex-col h-full bg-white rounded-[2.5rem] p-4 transition-all border border-transparent hover:border-gray-50 cursor-pointer">
                                <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-8 bg-[#fdfaf5] border border-gray-50 flex items-center justify-center p-8">
                                    <img src={(product.images.find(img => img.isMain) || product.images[0])?.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                                    <div className="absolute top-5 left-5 px-3.5 py-1.5 rounded-lg text-[9px] font-black tracking-[0.2em] bg-white/90 backdrop-blur-md shadow-sm text-gray-900 uppercase italic">
                                        STOKTA
                                    </div>
                                    <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-200 hover:text-brand-pink transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                                <div className="flex flex-col flex-grow px-2">
                                    <span className="text-[9px] font-black text-brand-pink tracking-[0.2em] uppercase mb-2 block leading-none">{product.category?.name || 'MİNİMALİST'}</span>
                                    <h3 className="text-sm font-[900] text-gray-900 mb-4 leading-tight group-hover:text-brand-pink transition-colors italic line-clamp-1">{product.name}</h3>

                                    <div className="flex items-center gap-1.5 mb-6">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className={`w-3 h-3 ${i < 4 ? 'text-yellow-400' : 'text-gray-100'}`} fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                        <span className="text-[10px] font-black text-gray-400 leading-none mt-0.5">(4.5)</span>
                                    </div>

                                    <div className="mt-auto flex justify-between items-center bg-gray-50/50 hover:bg-white p-5 rounded-[2rem] border border-gray-100 hover:shadow-xl hover:shadow-gray-100 transition-all hover:border-transparent">
                                        <span className="text-xl font-[900] text-gray-900 tracking-tighter italic">${product.price.toLocaleString()}</span>
                                        <button className="w-10 h-10 rounded-2xl bg-brand-pink text-white flex items-center justify-center hover:bg-brand-pink-hover transition-all transform hover:scale-110 shadow-lg shadow-brand-pink/20">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="mt-24 flex justify-center items-center gap-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-pink disabled:opacity-20 transition-all shadow-sm active:scale-90"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>

                            <div className="flex items-center gap-3 bg-white px-8 py-2.5 rounded-[2.2rem] border border-gray-100 shadow-sm">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum = currentPage;
                                    if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;

                                    if (pageNum <= 0 || pageNum > pagination.totalPages) return null;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-11 h-11 rounded-xl text-xs font-black transition-all ${currentPage === pageNum ? 'bg-brand-pink text-white shadow-xl shadow-brand-pink/40 scale-110' : 'text-gray-400 hover:text-gray-900'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.totalPages}
                                className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-pink disabled:opacity-20 transition-all shadow-sm active:scale-90"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
