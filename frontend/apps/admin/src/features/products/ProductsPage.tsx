import React, { useEffect, useState } from 'react';
import { apiClient } from '../../shared/api/apiClient';
import { toast } from 'react-toastify';
import Pagination from '../../shared/components/Pagination';

const ProductsPage: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const baseUrl = filter === 'ALL' ? '/api/admin/products' : `/api/admin/products?status=${filter}`;
            const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page}&limit=10`;
            const res = await apiClient.get(url);
            const data = await apiClient.handleResponse(res);
            if (data.success) {
                setProducts(data.products);
                setTotalPages(data.pages);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [filter]);

    useEffect(() => {
        fetchProducts();
    }, [filter, page]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await apiClient.patch(`/api/admin/products/${id}/status`, { status: newStatus });
            if (res.ok) {
                toast.success('Ürün durumu güncellendi.');
                fetchProducts();
            }
        } catch (err) {
            toast.error('Guncelleme başarısız.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu ürünü kalıcı olarak silmek istediğinize emin misiniz?')) return;
        try {
            const res = await apiClient.delete(`/api/admin/products/${id}`);
            if (res.ok) {
                toast.success('Ürün silindi.');
                fetchProducts();
            }
        } catch (err) {
            toast.error('Silme işlemi başarısız.');
        }
    };

    return (
        <div className="p-10 space-y-10">
            <div className="flex justify-between items-end">
                <div>
                   <h1 className="text-4xl font-[1000] text-admin-navy tracking-tighter italic uppercase leading-none mb-4">ÜRÜN <span className="text-brand-pink">MODERASYONU</span></h1>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Sitedeki tüm ürünleri incele ve onayla</p>
                </div>
                
                <div className="flex bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
                    {['ALL', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic ${filter === f ? 'bg-admin-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {f === 'ALL' ? 'TÜMÜ' : f.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-50 bg-slate-50/50">
                            <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Ürün</th>
                            <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Satıcı</th>
                            <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Fiyat</th>
                            <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Durum</th>
                            <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold italic uppercase tracking-widest">Yükleniyor...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold italic uppercase tracking-widest">Ürün bulunamadı.</td></tr>
                        ) : (
                            products.map(product => (
                                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                <img src={product.images?.[0]?.url || 'https://via.placeholder.com/50'} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 italic uppercase">{product.name}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{product.category?.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900 italic uppercase">{product.merchant?.companyName}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{product.merchant?.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="text-xs font-black text-slate-900 italic">${product.price.toLocaleString()}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic ${
                                            product.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-600' :
                                            product.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-600' :
                                            'bg-rose-100 text-rose-600'
                                        }`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right space-x-2">
                                        {product.status === 'PENDING_APPROVAL' && (
                                            <button 
                                                onClick={() => handleStatusUpdate(product.id, 'PUBLISHED')}
                                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                                            >
                                                Onayla
                                            </button>
                                        )}
                                        {product.status !== 'REJECTED' && (
                                            <button 
                                                onClick={() => handleStatusUpdate(product.id, 'REJECTED')}
                                                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-lg shadow-amber-500/20 hover:bg-amber-600"
                                            >
                                                Reddet
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(product.id)}
                                            className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-lg shadow-rose-500/20 hover:bg-rose-600"
                                        >
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={setPage} 
            />
        </div>
    );
};

export default ProductsPage;
