import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useBlocker, useParams } from 'react-router-dom';
import { authStore } from '../auth/auth.store';
import { toast } from 'react-toastify';

interface Category {
    id: string;
    name: string;
    parentId?: string | null;
    filterValues?: Record<string, string[]>;
    _count?: { children: number };
}

interface Attribute {
    key: string;
    value: string;
}

const ProductCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const token = authStore.getToken();
    const [isLoading, setIsLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const { id } = useParams();
    const submitLock = useRef(false);
    const isSavingDraft = useRef(false);

    // Category States
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [level1Categories, setLevel1Categories] = useState<Category[]>([]);
    const [level2Categories, setLevel2Categories] = useState<Category[]>([]);
    const [level3Categories, setLevel3Categories] = useState<Category[]>([]);

    const [selectedLevel1, setSelectedLevel1] = useState('');
    const [selectedLevel2, setSelectedLevel2] = useState('');
    const [selectedLevel3, setSelectedLevel3] = useState('');

    const [selectedCategoryAttrs, setSelectedCategoryAttrs] = useState<Record<string, string[]>>({});
    const [attributes, setAttributes] = useState<Attribute[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        price: '',
        discountPrice: '',
        stock: '',
        taxRate: '20%',
        currency: 'TL',
        status: 'PUBLISHED' // PUBLISHED or DRAFT
    });
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Navigation Blocker
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    // Initial Load: Categories & Existing Product (if editing)
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Categories
                const catRes = await fetch('/api/categories');
                let catData: Category[] = [];
                if (catRes.ok) {
                    catData = await catRes.json();
                    setAllCategories(catData);
                    setLevel1Categories(catData.filter((c: Category) => !c.parentId));
                }

                // 2. Fetch Product if ID exists
                if (id) {
                    const prodRes = await fetch(`/api/merchant/products/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (prodRes.ok) {
                        const prod = await prodRes.json();
                        setFormData({
                            name: prod.name || '',
                            slug: prod.slug || '',
                            description: prod.description || '',
                            price: prod.price?.toString() || '',
                            discountPrice: prod.metadata?.discountPrice || '',
                            stock: prod.stock?.toString() || '',
                            taxRate: prod.metadata?.taxRate || '20%',
                            currency: prod.metadata?.currency || 'TL',
                            status: prod.status || 'DRAFT'
                        });
                        setUploadedImages(prod.images?.map((img: any) => img.url) || []);

                        // Set Category Levels
                        if (prod.categoryId && catData.length > 0) {
                            const cat3 = catData.find(c => c.id === prod.categoryId);
                            if (cat3) {
                                if (cat3.parentId) {
                                    const cat2 = catData.find(c => c.id === cat3.parentId);
                                    if (cat2 && cat2.parentId) {
                                        // Level 3
                                        setSelectedLevel3(cat3.id);
                                        setSelectedLevel2(cat2.id);
                                        setSelectedLevel1(cat2.parentId);
                                        setLevel2Categories(catData.filter(c => c.parentId === cat2.parentId));
                                        setLevel3Categories(catData.filter(c => c.parentId === cat2.id));
                                    } else if (cat2) {
                                        // Level 2
                                        setSelectedLevel2(cat3.id);
                                        setSelectedLevel1(cat2.id);
                                        setLevel2Categories(catData.filter(c => c.parentId === cat2.id));
                                    }
                                } else {
                                    // Level 1
                                    setSelectedLevel1(cat3.id);
                                }
                            }
                        }

                        // Set Attributes
                        if (prod.variants) {
                            setAttributes(prod.variants.map((v: any) => ({ key: v.name, value: v.value })));
                        }
                    }
                }
            } catch (err) {
                console.error('Veri yükleme hatası:', err);
            } finally {
                setIsLoading(false);
                setIsDirty(false); // Reset dirty state after initial load
            }
        };
        loadData();
    }, [id]);

    // Silent Auto-save on exit
    useEffect(() => {
        if (blocker.state === "blocked" && !submitLock.current && !isSavingDraft.current) {
            const autoSaveAndLeave = async () => {
                isSavingDraft.current = true;
                try {
                    // Only auto-save if product has a name or some content
                    if (formData.name || uploadedImages.length > 0) {
                        await handleSubmit('DRAFT', true);
                    }
                } catch (err) {
                    console.error('Auto-save error:', err);
                } finally {
                    isDirty && setIsDirty(false); // Clear dirty to allow blocker leave
                    blocker.proceed();
                }
            };
            autoSaveAndLeave();
        }
    }, [blocker]);

    const handleLevel1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedLevel1(id);
        setSelectedLevel2('');
        setSelectedLevel3('');
        setIsDirty(true);
        if (id) {
            setLevel2Categories(allCategories.filter(c => c.parentId === id));
        } else {
            setLevel2Categories([]);
            setLevel3Categories([]);
        }
    };

    const handleLevel2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedLevel2(id);
        setSelectedLevel3('');
        setIsDirty(true);
        if (id) {
            setLevel3Categories(allCategories.filter(c => c.parentId === id));
        } else {
            setLevel3Categories([]);
        }
    };

    useEffect(() => {
        if (allCategories.length === 0) return;

        const selectedId = selectedLevel3 || selectedLevel2 || selectedLevel1;
        const cat = allCategories.find(c => c.id === selectedId);

        if (cat?.filterValues && Object.keys(cat.filterValues).length > 0) {
            setSelectedCategoryAttrs(cat.filterValues);
            setAttributes(prev => {
                const newAttrs: Attribute[] = [];
                Object.entries(cat.filterValues!).forEach(([k, v]) => {
                    const exist = prev.find(a => a.key === k);
                    newAttrs.push({
                        key: k,
                        value: (exist && v.includes(exist.value)) ? exist.value : ''
                    });
                });
                return JSON.stringify(newAttrs) !== JSON.stringify(prev) ? newAttrs : prev;
            });
        } else {
            setSelectedCategoryAttrs({});
            setAttributes([]);
        }
    }, [selectedLevel1, selectedLevel2, selectedLevel3, allCategories]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setIsDirty(true);
    };

    const handleAttributeChange = (index: number, field: 'key' | 'value', val: string) => {
        const newAttrs = [...attributes];
        if (newAttrs[index]) {
            newAttrs[index][field] = val;
            setAttributes(newAttrs);
            setIsDirty(true);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const uploadFormData = new FormData();
        Array.from(files).forEach(file => {
            uploadFormData.append('images', file);
        });

        try {
            const res = await fetch('/api/upload/bulk', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: uploadFormData
            });

            if (res.ok) {
                const data = await res.json();
                setUploadedImages(prev => [...prev, ...data.urls]);
                toast.success('Resimler başarıyla WebP formatına yüklendi.');
            } else {
                toast.error('Görsel yükleme başarısız oldu.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('Görsel sunucuya gönderilemedi.');
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = async (url: string) => {
        try {
            // MinIO'dan sil
            const res = await fetch('/api/upload', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url })
            });

            if (res.ok) {
                // UI'dan sil
                setUploadedImages(prev => prev.filter(img => img !== url));
                toast.success('Görsel başarıyla silindi.');
            } else {
                toast.error('Görsel sunucudan silinemedi.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Silme işlemi başarısız oldu.');
        }
    };

    const handleSubmit = async (submitStatus?: string, fromBlocker = false) => {
        if (submitLock.current) return;

        const finalStatus = submitStatus || formData.status;
        const categoryId = selectedLevel3 || selectedLevel2 || selectedLevel1;

        if (!fromBlocker && !categoryId) {
            toast.error('Lütfen bir kategori seçiniz.');
            return;
        }

        setIsLoading(true);
        submitLock.current = true;
        try {
            const metadata: Record<string, string> = {
                taxRate: formData.taxRate,
                discountPrice: formData.discountPrice
            };
            const variants: { name: string, value: string }[] = [];
            attributes.forEach(attr => {
                if (attr.key && attr.value) {
                    metadata[attr.key] = attr.value;
                    variants.push({ name: attr.key, value: attr.value });
                }
            });

            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/merchant/products/${id}` : '/api/merchant/products';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price) || 0,
                    categoryId: categoryId || (id ? undefined : 'ckv1234567890'),
                    status: finalStatus,
                    metadata,
                    stock: parseInt(formData.stock) || 0,
                    images: uploadedImages.length > 0 ? uploadedImages : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30"],
                    variants
                }),
            });

            if (response.ok) {
                localStorage.removeItem('fuira_product_draft');
                setIsDirty(false);
                if (!fromBlocker) {
                    toast.success(finalStatus === 'PUBLISHED' ? 'Ürün başarıyla yayınlandı!' : 'Ürün taslaklara kaydedildi.');
                    navigate('/products');
                }
            } else {
                const err = await response.json();
                if (!fromBlocker) toast.error('Hata: ' + err.message);
            }
        } catch (error) {
            console.error('Gönderim hatası:', error);
            if (!fromBlocker) toast.error('Sunucuya bağlanılamadı.');
        } finally {
            setIsLoading(false);
            submitLock.current = false;
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto min-h-screen pb-20 px-6 pt-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-10">
                <div className="relative group">
                    <h1 className="text-7xl font-[1000] text-slate-900 tracking-tighter mb-4 italic leading-none">
                        {id ? 'Ürünü' : 'Ürün'} <span className="text-brand-pink">{id ? 'Düzenle' : 'Ekle'}</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-lg max-w-lg italic opacity-70">
                        {id ? 'Mevcut ürün bilgilerinizi güncelleyin ve kaydedin.' : 'Ürününüzü tüm detaylarıyla listeleyin, müşterilerinize en doğru bilgiyi ulaştırın.'}
                    </p>
                </div>
                <div className="flex gap-6">
                    <button
                        onClick={() => navigate('/products')}
                        className="px-12 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:border-red-100 transition-all active:scale-95 shadow-sm italic"
                    >
                        VAZGEÇ
                    </button>
                    <button
                        onClick={() => handleSubmit('PUBLISHED')}
                        disabled={isLoading}
                        className="px-12 py-5 bg-brand-pink text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-pink/30 hover:bg-brand-pink-hover transition-all active:scale-95 flex items-center gap-4 italic"
                    >
                        {isLoading && <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                        ŞİMDİ YAYINLA
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                {/* Left Column (Main Form) */}
                <div className="xl:col-span-2 space-y-12">

                    {/* Basic Info */}
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[5rem] -translate-x-12 -translate-y-12 opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>

                        <div className="flex items-center gap-6 mb-12 relative z-10">
                            <div className="w-14 h-14 bg-brand-pink/10 rounded-2xl flex items-center justify-center text-brand-pink shadow-inner shadow-brand-pink/5">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter italic">TEMEL BİLGİLER</h3>
                        </div>

                        <div className="space-y-10 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">ÜRÜN ADI</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Örn: Premium Kablosuz Kulaklık G2"
                                    className="w-full h-20 px-10 rounded-[2.5rem] bg-slate-50 border-2 border-transparent focus:border-brand-pink focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-inner italic"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">KATEGORİ SEÇİMİ (Hepsiburada Tarzı)</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <select
                                        value={selectedLevel1}
                                        onChange={handleLevel1Change}
                                        className="h-16 px-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-pink focus:bg-white outline-none font-bold text-slate-600 shadow-inner italic"
                                    >
                                        <option value="">Ana Kategori</option>
                                        {level1Categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>

                                    <select
                                        value={selectedLevel2}
                                        onChange={handleLevel2Change}
                                        disabled={!selectedLevel1 || level2Categories.length === 0}
                                        className="h-16 px-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-pink focus:bg-white outline-none font-bold text-slate-600 shadow-inner italic disabled:opacity-30"
                                    >
                                        <option value="">Alt Kategori</option>
                                        {level2Categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>

                                    <select
                                        value={selectedLevel3}
                                        onChange={(e) => {
                                            setSelectedLevel3(e.target.value);
                                            setIsDirty(true);
                                        }}
                                        disabled={!selectedLevel2 || level3Categories.length === 0}
                                        className="h-16 px-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-pink focus:bg-white outline-none font-bold text-slate-600 shadow-inner italic disabled:opacity-30"
                                    >
                                        <option value="">Detay Kategori</option>
                                        {level3Categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Attributes */}
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50 relative group">
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                </div>
                                <h3 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter italic">ÜRÜN ÖZELLİKLERİ</h3>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {Object.keys(selectedCategoryAttrs).length === 0 ? (
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 italic font-bold text-sm leading-relaxed">
                                    Bu kategori için henüz özel bir ürün özelliği tanımlanmamış. Özellik eklemek isterseniz Admin paneli üzerinden kategoriye özellik tanımlayabilirsiniz.
                                </div>
                            ) : (
                                attributes.map((attr, index) => {
                                    const options = selectedCategoryAttrs[attr.key] || [];
                                    return (
                                        <div key={index} className="flex gap-6 animate-fadeIn transition-all group/row">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={attr.key}
                                                    disabled
                                                    className="w-full h-14 px-8 rounded-2xl bg-slate-100 border border-slate-200 outline-none font-bold text-slate-500 italic shadow-sm cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                {options.length > 0 ? (
                                                    <select
                                                        value={attr.value}
                                                        onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                                                        className="w-full h-14 px-8 rounded-2xl bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 italic shadow-sm cursor-pointer"
                                                    >
                                                        <option value="">— Seçiniz —</option>
                                                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={attr.value}
                                                        onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                                                        placeholder="Değer girin"
                                                        className="w-full h-14 px-8 rounded-2xl bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 italic shadow-sm"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50 relative group">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h3 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter italic">ÜRÜN AÇIKLAMASI</h3>
                        </div>

                        <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-inner">
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Ürününüzün benzersiz özelliklerini, kullanım alanlarını ve fark yaratan detaylarını buraya yazın..."
                                className="w-full min-h-[400px] p-12 bg-transparent outline-none font-bold text-slate-600 resize-none leading-relaxed placeholder:text-slate-300 placeholder:italic italic"
                            />
                        </div>
                    </div>

                    {/* Image Upload Area */}
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50 relative group">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-brand-pink shadow-inner">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <h3 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter italic">ÜRÜN GÖRSELLERİ</h3>

                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {uploadedImages.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-[2rem] overflow-hidden border-2 border-slate-100 group/img bg-slate-50">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(url)}
                                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-red-500 shadow-lg opacity-0 group-hover/img:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur rounded-lg text-[8px] font-black text-white uppercase italic">WEBP</div>
                                </div>
                            ))}

                            <label className="relative aspect-square rounded-[2rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-brand-pink hover:bg-brand-pink/5 transition-all group/upload">
                                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                                {isUploading ? (
                                    <div className="w-10 h-10 border-4 border-brand-pink/20 border-t-brand-pink rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover/upload:text-brand-pink group-hover/upload:scale-110 transition-all shadow-inner">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] font-black text-slate-400 group-hover/upload:text-brand-pink uppercase tracking-widest italic block">GÖRSEL EKLE</span>
                                            <span className="text-[8px] font-bold text-slate-300 mt-1 block">PNG, JPG, WEBP</span>
                                        </div>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-12">
                    {/* Pricing */}
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50 relative group">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 shadow-inner">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <h3 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter italic">FİYAT & STOK</h3>
                        </div>

                        <div className="space-y-10">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">PARA CİNSİ</label>
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-green-500 outline-none font-black text-slate-700 shadow-inner italic appearance-none cursor-pointer"
                                    >
                                        <option value="TL">TL (TL)</option>
                                        <option value="$">$ (USD)</option>
                                        <option value="€">€ (EUR)</option>
                                        <option value="£">£ (GBP)</option>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">SATIŞ FİYATI</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-green-500 outline-none font-black text-slate-700 shadow-inner italic"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">STOK ADEDİ</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-green-500 outline-none font-black text-slate-700 shadow-inner italic"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">KDV ORANI</label>
                                <select
                                    name="taxRate"
                                    value={formData.taxRate}
                                    onChange={handleChange}
                                    className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-2 border-transparent outline-none font-black text-slate-700 appearance-none cursor-pointer shadow-inner italic"
                                >
                                    <option>%0</option>
                                    <option>%1</option>
                                    <option>%10</option>
                                    <option>%20</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status Display Card */}
                    <div className="bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl shadow-slate-900/40 relative overflow-hidden group border border-white/5">
                        <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-brand-pink/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>

                        <h3 className="text-3xl font-[900] text-white mb-2 relative z-10 tracking-tight italic uppercase">LİSTELEME ÖZETİ</h3>
                        <p className="text-slate-400 text-sm font-bold mb-10 relative z-10 italic">Ürününüz şu anki ayarlara göre {formData.name || 'isimsiz'} olarak kaydedilecektir.</p>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center py-4 border-b border-white/5">
                                <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase italic">Kategori</span>
                                <span className="text-xs font-black text-slate-200 italic">{level1Categories.find(c => c.id === selectedLevel1)?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-white/5">
                                <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase italic">Detay Özellikler</span>
                                <span className="text-xs font-black text-slate-200 italic">{attributes.length} Adet</span>
                            </div>
                        </div>

                        <div className="mt-12 flex items-center justify-center p-6 bg-white/5 rounded-3xl border border-white/5 italic">
                            <span className="text-[10px] font-black text-brand-pink tracking-[0.3em] uppercase">Hazır - Yayına Alabilirsin</span>
                        </div>
                    </div>

                    {/* Guidelines */}
                    <div className="bg-brand-pink/5 rounded-[3.5rem] p-12 border border-brand-pink/10">
                        <h3 className="text-xl font-[900] text-brand-pink mb-6 italic uppercase">HIZLI İPUÇLARI</h3>
                        <ul className="space-y-6">
                            {[
                                "Ürün adında marka ve model belirtin.",
                                "Açıklamada madde imleri kullanın.",
                                "Yüksek çözünürlüklü fotoğraflar yükleyin.",
                                "Tüm detay özellikleri eksiksiz doldurun."
                            ].map((tip, i) => (
                                <li key={i} className="flex gap-4 items-start text-xs font-bold text-slate-600 italic">
                                    <div className="w-5 h-5 rounded-lg bg-brand-pink/20 flex-shrink-0 flex items-center justify-center text-brand-pink text-[10px] font-black">{i + 1}</div>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCreatePage;
