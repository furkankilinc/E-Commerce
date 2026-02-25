import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/api/apiClient';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

interface Product {
    id: string;
    name: string;
    price: number;
    status: string;
    createdAt: string;
    images: { url: string }[];
}

const DraftsPage: React.FC = () => {
    const [drafts, setDrafts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchDrafts = async () => {
        try {
            const res = await apiClient.get('/api/merchant/products?status=DRAFT');
            if (res.ok) {
                const data = await res.json();
                setDrafts(data.products);
            }
        } catch (err) {
            console.error('Taslaklar çekilemedi:', err);
            toast.error('Taslaklar yüklenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDrafts();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: "Bu taslak kalıcı olarak silinecektir!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff3366',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'Vazgeç',
            background: '#ffffff',
            customClass: {
                title: 'font-black italic uppercase tracking-tighter',
                popup: 'rounded-[3rem]',
                confirmButton: 'rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-[10px]',
                cancelButton: 'rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-[10px]'
            }
        });

        if (result.isConfirmed) {
            try {
                const res = await apiClient.delete(`/api/merchant/products/${id}`);
                if (res.ok) {
                    toast.success('Taslak silindi.');
                    fetchDrafts();
                } else {
                    toast.error('Silme işlemi başarısız.');
                }
            } catch (err) {
                console.error('Delete error:', err);
                toast.error('Bir hata oluştu.');
            }
        }
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-brand-pink/20 border-t-brand-pink rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-6xl font-[1000] text-slate-900 tracking-tighter mb-4 italic leading-none">
                        Taslak <span className="text-brand-pink">Ürünler</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-lg italic opacity-70">Henüz yayınlamadığınız ürünleri buradan yönetebilirsiniz.</p>
                </div>
            </div>

            {drafts.length === 0 ? (
                <div className="bg-white rounded-[3.5rem] p-20 text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-400 italic uppercase mb-4">Taslak Ürün Bulunmuyor</h3>
                    <Link to="/products/create" className="text-brand-pink font-black text-sm uppercase tracking-widest hover:underline">Yeni Ürün Ekle</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {drafts.map((draft) => (
                        <div key={draft.id} className="group bg-white rounded-[3rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all border border-slate-50 relative">
                            <div className="aspect-square rounded-[2rem] bg-slate-50 overflow-hidden mb-6 relative">
                                <img
                                    src={draft.images[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    alt={draft.name}
                                />
                                <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest italic">TASLAK</div>
                            </div>

                            <h3 className="text-lg font-black text-slate-900 mb-2 truncate italic">{draft.name || 'İsimsiz Ürün'}</h3>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-brand-pink font-black text-xl italic">{draft.price} TL</span>
                                <span className="text-[9px] font-bold text-slate-300 uppercase italic">{new Date(draft.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate(`/products/edit/${draft.id}`)}
                                    className="flex-1 h-12 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest italic"
                                >
                                    DÜZENLE
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, draft.id)}
                                    className="w-12 h-12 bg-rose-50 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center p-3"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DraftsPage;
