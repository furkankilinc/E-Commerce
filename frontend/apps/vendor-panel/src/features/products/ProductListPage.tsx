import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authStore } from '../auth/auth.store';

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
            const res = await fetch(`/api/merchant/products?page=${page}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${authStore.getToken()}`
                }
            });
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
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 italic">Product Inventory</h1>
                    <p className="text-slate-400 font-bold text-lg">Manage your showcase and keep track of your stock levels.</p>
                </div>
                <Link
                    to="/products/create"
                    className="px-10 py-5 bg-brand-pink text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-pink/30 hover:bg-brand-pink-hover transition-all active:scale-95 flex items-center gap-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    Add New Product
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-white flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 relative w-full">
                    <input
                        type="text"
                        placeholder="Search by product name or SKU..."
                        className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all"
                    />
                    <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                    Showing {products.length} of {pagination.total} Products
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-[3rem] shadow-sm border border-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 italic">
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Product Details</th>
                                <th className="px-6 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Stock</th>
                                <th className="px-6 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Price</th>
                                <th className="px-6 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Status</th>
                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-10 py-8"><div className="h-12 bg-slate-50 rounded-2xl w-64"></div></td>
                                        <td className="px-6 py-8 text-center"><div className="h-8 bg-slate-50 rounded-xl w-16 mx-auto"></div></td>
                                        <td className="px-6 py-8 text-center"><div className="h-8 bg-slate-50 rounded-xl w-24 mx-auto"></div></td>
                                        <td className="px-6 py-8 text-center"><div className="h-8 bg-slate-50 rounded-xl w-20 mx-auto"></div></td>
                                        <td className="px-10 py-8 text-right"><div className="h-8 bg-slate-50 rounded-xl w-12 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-20">
                                            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" /></svg>
                                            <span className="text-2xl font-black uppercase tracking-[0.5em]">No Products Found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                                    <img
                                                        src={product.images?.[0]?.url || 'https://via.placeholder.com/64'}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-base font-black text-slate-900 block group-hover:text-brand-pink transition-colors">{product.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{product.sku || 'SKU-PENDING'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <div className={`inline-flex px-4 py-2 rounded-xl text-xs font-black italic items-center gap-2 ${product.stock < 10 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                <div className={`w-2 h-2 rounded-full ${product.stock < 10 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                                {product.stock} in stock
                                            </div>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <span className="text-base font-black text-slate-900">${product.price.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <span className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10">Active</span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 shadow-sm transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-600 shadow-sm transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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
                <div className="flex justify-center items-center gap-4 py-10">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-pink disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm active:scale-95"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    <div className="flex items-center gap-2 bg-white px-6 py-2 rounded-3xl border border-slate-100 shadow-sm">
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
                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${pagination.page === pageNum ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/30 scale-110' : 'text-slate-400 hover:text-slate-900'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-pink disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm active:scale-95"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductListPage;
