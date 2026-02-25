import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../shared/api/apiClient';

const ProductListPage: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });

    const fetchProducts = async (page: number) => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/api/merchant/products?page=${page}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Fetch products failed:', err);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchProducts(1);
    }, []);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchProducts(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-6xl font-[1000] text-slate-900 tracking-tighter mb-2 italic">Ürün <span className="text-brand-pink">Envanteri</span></h1>
                    <p className="text-slate-400 font-bold text-lg italic opacity-70">Vitrinini yönet ve stok seviyelerini gerçek zamanlı takip et.</p>
                </div>
                <Link
                    to="/products/create"
                    className="px-10 py-5 bg-brand-pink text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-pink/30 hover:bg-brand-pink-hover transition-all active:scale-95 flex items-center gap-4 italic"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    YENİ ÜRÜN EKLE
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 relative w-full group">
                    <input
                        type="text"
                        placeholder="Ürün adı veya SKU ile ara..."
                        className="w-full h-16 pl-16 pr-6 bg-slate-50 border-2 border-transparent rounded-[2rem] text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic shadow-inner"
                    />
                    <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-brand-pink transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="flex items-center gap-6 w-full md:w-auto text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 italic">
                    <span className="text-slate-900">{pagination.total} Üründen</span> {products.length} Tanesi Gösteriliyor
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 italic">
                                <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ürün Detayları</th>
                                <th className="px-6 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Stok Durumu</th>
                                <th className="px-6 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Birim Fiyat</th>
                                <th className="px-6 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Durum</th>
                                <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-12 py-10"><div className="h-14 bg-slate-50 rounded-2xl w-72"></div></td>
                                        <td className="px-6 py-10 text-center"><div className="h-10 bg-slate-50 rounded-xl w-20 mx-auto"></div></td>
                                        <td className="px-6 py-10 text-center"><div className="h-10 bg-slate-50 rounded-xl w-28 mx-auto"></div></td>
                                        <td className="px-6 py-10 text-center"><div className="h-10 bg-slate-50 rounded-xl w-24 mx-auto"></div></td>
                                        <td className="px-12 py-10 text-right"><div className="h-10 bg-slate-50 rounded-xl w-16 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-40 text-center">
                                        <div className="flex flex-col items-center gap-8 opacity-20 group">
                                            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center border-4 border-dashed border-slate-100 group-hover:rotate-12 transition-transform">
                                                <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" /></svg>
                                            </div>
                                            <span className="text-3xl font-black uppercase tracking-[0.4em] italic leading-none">HENÜZ ÜRÜN YOK</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="group hover:bg-slate-50/30 transition-all">
                                        <td className="px-12 py-10">
                                            <div className="flex items-center gap-8">
                                                <div className="w-20 h-20 rounded-[2rem] bg-[#fdfaf5] border border-slate-100 overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-500 p-2">
                                                    <img
                                                        src={product.images?.[0]?.url || 'https://via.placeholder.com/64'}
                                                        alt={product.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-lg font-black text-slate-900 block group-hover:text-brand-pink transition-colors italic leading-tight">{product.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1 block">{product.sku || 'SKU-BEKLEMEDE'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-10 text-center">
                                            <div className={`inline-flex px-5 py-2.5 rounded-2xl text-[11px] font-black italic items-center gap-3 ${product.stock < 10 ? 'bg-rose-50 text-rose-500 shadow-sm shadow-rose-100/50' : 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100/50'}`}>
                                                <div className={`w-2 h-2 rounded-full ${product.stock < 10 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                                {product.stock} Adet Stok
                                            </div>
                                        </td>
                                        <td className="px-6 py-10 text-center">
                                            <span className="text-xl font-black text-slate-900 italic tracking-tighter">${product.price.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-10 text-center">
                                            {product.status === 'PUBLISHED' ? (
                                                <span className="px-5 py-2.5 rounded-2xl bg-indigo-900 text-white text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/20 italic">YAYINDA</span>
                                            ) : (
                                                <span className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest italic border border-slate-200">TASLAK</span>
                                            )}
                                        </td>
                                        <td className="px-12 py-10 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <button className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 shadow-sm transition-all active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                <button className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-600 shadow-sm transition-all active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 py-16">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="w-16 h-16 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-pink disabled:opacity-20 transition-all shadow-sm active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>

                    <div className="flex items-center gap-3 bg-white px-8 py-3 rounded-[3rem] border border-slate-50 shadow-sm">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum = pagination.page;
                            if (pagination.page <= 3) pageNum = i + 1;
                            else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                            else pageNum = pagination.page - 2 + i;

                            if (pageNum <= 0 || pageNum > pagination.totalPages) return null;

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-12 h-12 rounded-2xl text-[11px] font-black transition-all ${pagination.page === pageNum ? 'bg-brand-pink text-white shadow-xl shadow-brand-pink/30 scale-110' : 'text-slate-400 hover:text-slate-900 italic'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="w-16 h-16 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-pink disabled:opacity-20 transition-all shadow-sm active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductListPage;
