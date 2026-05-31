import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../shared/api/apiClient';
import { toast } from 'react-toastify';

interface Product {
    id: string;
    name: string;
    sku: string;
    stock: number;
    price: number;
    status: string;
    images: { url: string; isMain: boolean }[];
    category: { name: string };
}

const StocksPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [editedStocks, setEditedStocks] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
        totalStock: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        limit: 20
    });

    const fetchProducts = useCallback(async (page: number = 1, search: string = debouncedSearch, filter: string = stockFilter) => {
        setIsLoading(true);
        try {
            let url = `/api/merchant/products?page=${page}&limit=20&search=${encodeURIComponent(search)}`;
            if (filter === 'low') url += '&stockStatus=low';
            if (filter === 'out') url += '&stockStatus=out';

            const res = await apiClient.get(url);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
                setPagination(data.pagination || {
                    page: 1,
                    totalPages: 1,
                    total: data.products?.length || 0,
                    totalStock: 0,
                    lowStockCount: 0,
                    outOfStockCount: 0,
                    limit: 20
                });
            }
        } catch (err) {
            toast.error('Ürünler yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, stockFilter]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        fetchProducts(1, debouncedSearch, stockFilter);
    }, [fetchProducts, debouncedSearch, stockFilter]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchProducts(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleStockChange = (productId: string, value: string) => {
        const numValue = parseInt(value) || 0;
        setEditedStocks(prev => ({ ...prev, [productId]: numValue }));
    };

    const handleSaveAll = async () => {
        const updates = Object.entries(editedStocks).map(([productId, stock]) => ({
            productId,
            stock
        }));

        if (updates.length === 0) {
            toast.info('Değişiklik yapılmadı.');
            return;
        }

        setIsSaving(true);
        try {
            const res = await apiClient.patch('/api/merchant/products/bulk-stock', { updates });
            if (res.ok) {
                toast.success(`${updates.length} ürünün stoğu güncellendi!`);
                setEditedStocks({});
                fetchProducts(pagination.page);
            } else {
                toast.error('Stok güncellemesi başarısız oldu.');
            }
        } catch (err) {
            toast.error('Sunucu hatası.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetChanges = () => {
        setEditedStocks({});
        toast.info('Değişiklikler sıfırlandı.');
    };

    const filteredProducts = products;

    const changedCount = Object.keys(editedStocks).length;
    const totalStockVolume = pagination.totalStock;
    const lowStockCount = pagination.lowStockCount;
    const outOfStockCount = pagination.outOfStockCount;

    return (
        <div className="max-w-[1400px] mx-auto min-h-screen pb-20 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-semibold text-slate-800  mb-2">
                        Stok <span className="text-indigo-600">Yönetimi</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm max-w-lg">
                        Tüm ürünlerinizin stok seviyelerini buradan görüntüleyin ve toplu olarak düzenleyin.
                    </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    {changedCount > 0 && (
                        <>
                            <button
                                onClick={handleResetChanges}
                                className="w-full md:w-auto px-6 py-3 bg-white border border-slate-200 rounded-md text-xs font-bold  r text-slate-400 hover:bg-slate-50 transition-all"
                            >
                                SIFIRLA
                            </button>
                            <button
                                onClick={handleSaveAll}
                                disabled={isSaving}
                                className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-md text-xs font-bold   shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                {isSaving && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                                {changedCount} ÜRÜN KAYDET
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-md p-4 sm:p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-md flex items-center justify-center">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <span className="text-10px font-semibold text-slate-400  ">TOPLAM STOK ADEDİ</span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-semibold text-indigo-600">{(totalStockVolume || 0).toLocaleString()}</span>
                </div>
                {/* Product count card removed as requested */}
                <div className="bg-white rounded-md p-4 sm:p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-md flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        </div>
                        <span className="text-10px font-semibold text-slate-400  ">DÜŞÜK STOK (SAYFA)</span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-semibold text-amber-600">{lowStockCount}</span>
                </div>
                <div className="bg-white rounded-md p-4 sm:p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-rose-50 rounded-md flex items-center justify-center">
                            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </div>
                        <span className="text-10px font-semibold text-slate-400  ">TÜKENMİŞ (SAYFA)</span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-semibold text-rose-600">{outOfStockCount}</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-md p-4 border border-slate-100 shadow-sm flex flex-row gap-4 items-center justify-start md:justify-end overflow-x-auto">
                <div className="flex gap-2">
                    {(['all', 'low', 'out'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setStockFilter(f)}
                            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-md text-10px font-semibold  r transition-all whitespace-nowrap ${stockFilter === f
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            {f === 'all' ? 'TÜMÜ' : f === 'low' ? 'DÜŞÜK STOK' : 'TÜKENMİŞ'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-20 text-center">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400 font-bold text-xs  ">Yükleniyor...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-20 text-center">
                        <p className="text-slate-400 font-bold text-sm ">Ürün bulunamadı.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-10px font-semibold text-slate-400  ">ÜRÜN</th>
                                    <th className="px-6 py-4 text-10px font-semibold text-slate-400  ">SKU</th>
                                    <th className="px-6 py-4 text-10px font-semibold text-slate-400  ">KATEGORİ</th>
                                    <th className="px-6 py-4 text-10px font-semibold text-slate-400  ">FİYAT</th>
                                    <th className="px-6 py-4 text-10px font-semibold text-slate-400  ">MEVCUT STOK</th>
                                    <th className="px-6 py-4 text-10px font-semibold text-slate-400  ">YENİ STOK</th>
                                    <th className="px-6 py-4 text-10px font-semibold text-slate-400  ">DURUM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredProducts.map(product => {
                                    const isEdited = editedStocks[product.id] !== undefined;
                                    const mainImage = product.images?.find(i => i.isMain) || product.images?.[0];
                                    const stockLevel = product.stock <= 0 ? 'out' : product.stock <= 10 ? 'low' : 'ok';

                                    return (
                                        <tr key={product.id} className={`hover:bg-slate-50/50 transition-colors ${isEdited ? 'bg-indigo-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-md bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                                        {mainImage ? (
                                                            <img src={mainImage.url} alt="" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">{product.sku}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-slate-500">{product.category?.name || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-slate-800">{product.price.toLocaleString()} ₺</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-lg font-semibold ${stockLevel === 'out' ? 'text-rose-600' : stockLevel === 'low' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={isEdited ? editedStocks[product.id] : ''}
                                                    placeholder={product.stock.toString()}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '' || parseInt(val) === product.stock) {
                                                            setEditedStocks(prev => {
                                                                const next = { ...prev };
                                                                delete next[product.id];
                                                                return next;
                                                            });
                                                        } else {
                                                            handleStockChange(product.id, val);
                                                        }
                                                    }}
                                                    className={`w-28 h-10 px-4 rounded-md border text-sm font-bold outline-none transition-all ${isEdited
                                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 focus:border-indigo-500'
                                                        : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-500'
                                                        }`}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-md text-nano font-semibold  r ${stockLevel === 'out'
                                                    ? 'bg-rose-50 text-rose-600'
                                                    : stockLevel === 'low'
                                                        ? 'bg-amber-50 text-amber-600'
                                                        : 'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                    {stockLevel === 'out' ? 'TÜKENDİ' : stockLevel === 'low' ? 'DÜŞÜK' : 'YETERLİ'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination UI */}
            {!isLoading && pagination.totalPages > 1 && (
                <div className="ui-pagination-container">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="ui-pagination-btn"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-3">
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
                                    className={`ui-pagination-btn ${pagination.page === pageNum ? 'active' : ''}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="ui-pagination-btn"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
            )}

            {/* Floating Save Bar */}
            {changedCount > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-md px-8 py-2 shadow-xl shadow-slate-900/40 flex items-center gap-6 z-50 animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center text-white font-semibold text-sm">{changedCount}</div>
                        <span className="text-sm font-bold">ürün değiştirildi</span>
                    </div>
                    <div className="w-px h-16 bg-slate-700"></div>
                    <button
                        onClick={handleResetChanges}
                        className="text-xs font-bold  r text-slate-400 hover:text-white transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-md text-xs font-bold  r transition-all flex items-center gap-2"
                    >
                        {isSaving && <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                        KAYDET
                    </button>
                </div>
            )}
        </div>
    );
};

export default StocksPage;
