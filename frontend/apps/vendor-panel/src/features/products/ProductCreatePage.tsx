import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useBlocker, useParams } from 'react-router-dom';
import { apiClient } from '../../shared/api/apiClient';
import { toast } from 'react-toastify';

interface Category {
    id: string;
    name: string;
    parentId?: string | null;
    filterValues?: Record<string, string[]>;
    _count?: { children: number };
}

interface ContentBlock {
    id: string;
    type: 'HEADING' | 'TEXT' | 'IMAGE' | 'FEATURES' | 'SPLIT';
    content: any;
}

interface ProductVariant {
    name: string;
    value: string;
    price: number;
    stock: number;
    sku: string;
}

const ProductCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const submitLock = useRef(false);
    const isSavingDraft = useRef(false);
    const isTransitioning = useRef(false);

    // Category States
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [level1Categories, setLevel1Categories] = useState<Category[]>([]);
    const [level2Categories, setLevel2Categories] = useState<Category[]>([]);
    const [level3Categories, setLevel3Categories] = useState<Category[]>([]);

    const [selectedLevel1, setSelectedLevel1] = useState('');
    const [selectedLevel2, setSelectedLevel2] = useState('');
    const [selectedLevel3, setSelectedLevel3] = useState('');

    const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);

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
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
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
                const catRes = await apiClient.get('/api/categories');
                let catData: Category[] = [];
                if (catRes.ok) {
                    catData = await catRes.json();
                    setAllCategories(catData);
                    setLevel1Categories(catData.filter((c: Category) => !c.parentId));
                }

                // 2. Fetch Product if ID exists
                if (id) {
                    const prodRes = await apiClient.get(`/api/merchant/products/${id}`);
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

                        // Set Description Blocks
                        try {
                            if (prod.description && (prod.description.startsWith('[') || prod.description.startsWith('{'))) {
                                setBlocks(JSON.parse(prod.description));
                            } else {
                                setBlocks([{ id: 'init', type: 'TEXT', content: prod.description || '' }]);
                            }
                        } catch (e) {
                            setBlocks([{ id: 'init', type: 'TEXT', content: prod.description || '' }]);
                        }

                        // Set Product Variants
                        if (prod.variants) {
                            setProductVariants(prod.variants.map((v: any) => ({
                                name: v.name,
                                value: v.value,
                                price: v.price || 0,
                                stock: v.stock || 0,
                                sku: v.sku || `VAR-${Date.now()}` // Ensure SKU exists or generate a temporary one
                            })));
                        }
                    }
                }
            } catch (err) {
                console.error('Veri yükleme hatası:', err);
            } finally {
                setIsLoading(false);
                setIsDirty(false);
            }
        };
        loadData();
    }, [id]);

    // Silent Auto-save on exit
    useEffect(() => {
        if (blocker.state === "blocked" && !submitLock.current && !isSavingDraft.current && !isTransitioning.current && isDirty) {
            const autoSaveAndLeave = async () => {
                isSavingDraft.current = true;
                try {
                    if (formData.name || uploadedImages.length > 0) {
                        await handleSubmit('DRAFT', true);
                    }
                } catch (err) {
                    console.error('Auto-save error:', err);
                } finally {
                    setIsDirty(false);
                    blocker.proceed();
                }
            };
            autoSaveAndLeave();
        } else if (blocker.state === "blocked") {
            // If we are locked or transitioning, just proceed without auto-saving as draft
            blocker.proceed();
        }
    }, [blocker, isDirty, formData.name, uploadedImages.length]); // Added dependencies for useEffect

    const handleLevel1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const catId = e.target.value;
        setSelectedLevel1(catId);
        setSelectedLevel2('');
        setSelectedLevel3('');
        setIsDirty(true);
        if (catId) {
            setLevel2Categories(allCategories.filter(c => c.parentId === catId));
        } else {
            setLevel2Categories([]);
            setLevel3Categories([]);
        }
    };

    const handleLevel2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const catId = e.target.value;
        setSelectedLevel2(catId);
        setSelectedLevel3('');
        setIsDirty(true);
        if (catId) {
            setLevel3Categories(allCategories.filter(c => c.parentId === catId));
        } else {
            setLevel3Categories([]);
        }
    };

    // This useEffect was previously setting 'attributes' based on category filterValues.
    // Since 'attributes' state is removed and 'productVariants' is used for actual product variants,
    // this useEffect now only sets 'selectedCategoryAttrs' if needed for display or other logic,
    // but does not directly modify 'productVariants' based on category filterValues.
    /*
        useEffect(() => {
            if (allCategories.length === 0) return;
    
            const catId = selectedLevel3 || selectedLevel2 || selectedLevel1;
            const cat = allCategories.find(c => c.id === catId);
    
            if (cat?.filterValues && Object.keys(cat.filterValues).length > 0) {
                // Deprecated global category attributes
            }
        }, [selectedLevel1, selectedLevel2, selectedLevel3, allCategories]);
    */

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setIsDirty(true);
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
            const res = await apiClient.post('/api/upload/bulk', uploadFormData);

            if (res.ok) {
                const data = await res.json();
                setUploadedImages(prev => [...prev, ...data.urls]);
                toast.success('Görseller yüklendi.');
                setIsDirty(true);
            } else {
                toast.error('Görsel yükleme başarısız.');
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
            const res = await apiClient.delete('/api/upload', {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (res.ok) {
                setUploadedImages(prev => prev.filter(img => img !== url));
                toast.success('Görsel silindi.');
                setIsDirty(true);
            } else {
                toast.error('Görsel silinemedi.');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    // --- Block Builder Logic ---
    const addBlock = (type: ContentBlock['type']) => {
        const newBlock: ContentBlock = {
            id: Date.now().toString(),
            type,
            content: type === 'FEATURES' ? ['Yeni Özellik'] :
                type === 'SPLIT' ? { text: '', image: '', reverse: false } :
                    type === 'IMAGE' ? { url: '', width: '100', align: 'center' } : ''
        };
        setBlocks([...blocks, newBlock]);
        setIsDirty(true);
    };

    const removeBlock = (blockId: string) => {
        setBlocks(blocks.filter(b => b.id !== blockId));
        setIsDirty(true);
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const newBlocks = [...blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= blocks.length) return;

        const temp = newBlocks[index]!;
        newBlocks[index] = newBlocks[targetIndex]!;
        newBlocks[targetIndex] = temp;
        setBlocks(newBlocks);
        setIsDirty(true);
    };

    const updateBlock = (blockId: string, content: any) => {
        setBlocks(blocks.map(b => b.id === blockId ? { ...b, content } : b));
        setIsDirty(true);
    };

    const handleBlockImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId: string, splitKey?: 'image') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('images', file);

        try {
            const res = await apiClient.post('/api/upload/bulk', uploadFormData);

            if (res.ok) {
                const data = await res.json();
                const url = data.urls[0];
                if (splitKey) {
                    const block = blocks.find(b => b.id === blockId);
                    updateBlock(blockId, { ...block?.content, image: url });
                } else {
                    const block = blocks.find(b => b.id === blockId);
                    if (block?.type === 'IMAGE') {
                        const currentContent = typeof block.content === 'string' ? { url: '', width: '100', align: 'center' } : (block.content || { url: '', width: '100', align: 'center' });
                        updateBlock(blockId, { ...currentContent, url });
                    } else {
                        updateBlock(blockId, url);
                    }
                }
                toast.success('Görsel yüklendi.');
                setIsDirty(true);
            }
        } catch (err) {
            toast.error('Görsel yüklenemedi.');
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
            // No longer iterating over 'attributes' for metadata or variants.
            // 'productVariants' directly holds the variant data.

            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/merchant/products/${id}` : '/api/merchant/products';

            const response = await apiClient.fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    description: JSON.stringify(blocks),
                    price: parseFloat(formData.price) || 0,
                    categoryId: categoryId || (id ? undefined : 'ckv1234567890'), // Placeholder if no category selected on edit
                    status: finalStatus,
                    metadata,
                    stock: parseInt(formData.stock) || 0,
                    images: uploadedImages.length > 0 ? uploadedImages : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30"],
                    variants: productVariants, // Use the productVariants state directly
                }),
            });

            if (response.ok) {
                setIsDirty(false);
                if (!fromBlocker) {
                    isTransitioning.current = true;
                    toast.success(finalStatus === 'PUBLISHED' ? 'Ürün yayına alındı!' : 'Taslak başarıyla kaydedildi.');
                    setTimeout(() => navigate('/products'), 500);
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
                    <h1 className="text-5xl font-black text-slate-800 tracking-tight mb-2">
                        {id ? 'Ürünü' : 'Yeni Ürün'} <span className="text-indigo-600">{id ? 'Güncelle' : 'Tanımla'}</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-base max-w-lg">
                        {id ? 'Mevcut ürün verilerini ve içerik bloklarını düzenleyin.' : 'Ürün kataloğu için yeni bir kayıt oluşturun.'}
                    </p>
                </div>
                <div className="flex gap-6">
                    <button
                        onClick={() => navigate('/products')}
                        className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-50 transition-all"
                    >
                        İPTAL
                    </button>
                    <button
                        onClick={() => handleSubmit('DRAFT')}
                        disabled={isLoading}
                        className="px-8 py-4 bg-white border border-indigo-100 rounded-2xl text-xs font-bold uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        TASLAK KAYDET
                    </button>
                    <button
                        onClick={() => handleSubmit('PUBLISHED')}
                        disabled={isLoading}
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-3"
                    >
                        {isLoading && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                        ÜRÜNÜ YAYINLA
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                <div className="xl:col-span-2 space-y-12">
                    {/* Basic Info */}
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[5rem] -translate-x-12 -translate-y-12 opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
                        <div className="flex items-center gap-4 mb-10 relative z-10">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Genel Bilgiler</h3>
                        </div>

                        <div className="space-y-10 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">ÜRÜN ADI</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ürün başlığını buraya yazın..."
                                    className="w-full h-16 px-8 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none transition-all font-semibold text-slate-700"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">KATEGORİ SEÇİMİ</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <select value={selectedLevel1} onChange={handleLevel1Change} className="h-16 px-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-pink outline-none font-bold italic">
                                        <option value="">Ana Kategori</option>
                                        {level1Categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                    <select value={selectedLevel2} onChange={handleLevel2Change} disabled={!selectedLevel1 || level2Categories.length === 0} className="h-16 px-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-pink outline-none font-bold italic disabled:opacity-30">
                                        <option value="">Alt Kategori</option>
                                        {level2Categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                    <select value={selectedLevel3} onChange={(e) => { setSelectedLevel3(e.target.value); setIsDirty(true); }} disabled={!selectedLevel2 || level3Categories.length === 0} className="h-16 px-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-pink outline-none font-bold italic disabled:opacity-30">
                                        <option value="">Detay Kategori</option>
                                        {level3Categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variant Management */}
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50 relative group">
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                </div>
                                <h3 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter italic">ÜRÜN VARYANTLARI</h3>
                            </div>
                        </div>

                        {/* Variant Add Form */}
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 mb-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Özellik (Tip)</label>
                                    <input
                                        id="newAttrKey"
                                        type="text"
                                        placeholder="Örn: Renk, Beden..."
                                        className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Değer (Seçenek)</label>
                                    <input
                                        id="newAttrVal"
                                        type="text"
                                        placeholder="Örn: Mavi, XL..."
                                        className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fiyat Farkı (+/-)</label>
                                    <input id="newAttrPrice" type="number" placeholder="0.00" className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Stok</label>
                                    <input id="newAttrStock" type="number" placeholder="0" className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500" />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const keyInput = document.getElementById('newAttrKey') as HTMLInputElement;
                                            const valInput = document.getElementById('newAttrVal') as HTMLInputElement;
                                            const priceInput = document.getElementById('newAttrPrice') as HTMLInputElement;
                                            const stockInput = document.getElementById('newAttrStock') as HTMLInputElement;

                                            const key = keyInput.value.trim();
                                            const val = valInput.value.trim();
                                            const price = parseFloat(priceInput.value) || 0;
                                            const stock = parseInt(stockInput.value) || 0;
                                            const sku = `VAR-${Date.now()}`;

                                            if (!key || !val) return toast.warning('Lütfen özellik adı ve değer girin.');

                                            setProductVariants(prev => [...prev, { name: key, value: val, price, stock, sku }]);
                                            setIsDirty(true);

                                            // Clear inputs for next variant
                                            valInput.value = '';
                                            priceInput.value = '';
                                            stockInput.value = '';
                                        }}
                                        className="w-full h-12 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-indigo-100 hover:scale-105 transition-all active:scale-95"
                                    >
                                        Seçenek Ekle
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Variant List Table */}
                        <div className="overflow-x-auto rounded-3xl border border-slate-100">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Özellik</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Değer</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiyat</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stok</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sil</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {productVariants.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm font-bold">Henüz varyant eklenmedi. Ürün standart tek tip olarak kaydedilecek.</td>
                                        </tr>
                                    )}
                                    {productVariants.map((v, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-black text-slate-800 uppercase italic">{v.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase">{v.value}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={v.price || 0}
                                                    onChange={(e) => {
                                                        const newVar = [...productVariants];
                                                        if (newVar[i]) {
                                                            newVar[i].price = parseFloat(e.target.value) || 0;
                                                            setProductVariants(newVar);
                                                            setIsDirty(true);
                                                        }
                                                    }}
                                                    className="w-24 h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-bold outline-none focus:border-indigo-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={v.stock || 0}
                                                    onChange={(e) => {
                                                        const newVar = [...productVariants];
                                                        if (newVar[i]) {
                                                            newVar[i].stock = parseInt(e.target.value) || 0;
                                                            setProductVariants(newVar);
                                                            setIsDirty(true);
                                                        }
                                                    }}
                                                    className="w-24 h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-bold outline-none focus:border-indigo-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setProductVariants(productVariants.filter((_, idx) => idx !== i))}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50 relative group">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Ürün İçerik Editörü</h3>
                            </div>
                        </div>

                        <div className="space-y-6 mb-10">
                            {blocks.length === 0 && (
                                <div className="py-16 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Henüz içerik bloğu eklenmedi.</p>
                                </div>
                            )}

                            {blocks.map((block, index) => (
                                <div key={block.id} className="group/block relative bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/block:opacity-100 transition-all z-10">
                                        <button onClick={() => moveBlock(index, 'up')} className="w-8 h-8 bg-white border border-slate-200 shadow-sm rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg></button>
                                        <button onClick={() => moveBlock(index, 'down')} className="w-8 h-8 bg-white border border-slate-200 shadow-sm rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg></button>
                                    </div>
                                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-all z-10">
                                        <button onClick={() => removeBlock(block.id)} className="w-8 h-8 bg-white border border-red-100 shadow-sm rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                    </div>

                                    {block.type === 'HEADING' && (
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">BÖLÜM BAŞLIĞI</span>
                                            <input type="text" value={block.content} onChange={(e) => updateBlock(block.id, e.target.value)} placeholder="Başlık..." className="w-full bg-transparent text-2xl font-bold text-slate-800 outline-none" />
                                        </div>
                                    )}

                                    {block.type === 'TEXT' && (
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PARAGRAF METNİ</span>
                                            <textarea value={block.content} onChange={(e) => updateBlock(block.id, e.target.value)} placeholder="Açıklama metni..." className="w-full min-h-[100px] bg-transparent text-sm font-medium text-slate-600 outline-none leading-relaxed resize-none" />
                                        </div>
                                    )}

                                    {block.type === 'IMAGE' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GÖRSEL BLOĞU</span>
                                                {block.content && typeof block.content !== 'string' && block.content.url && (
                                                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                                                        <div className="flex border-r border-slate-200 pr-1 gap-1">
                                                            {['33', '50', '75', '100'].map(w => (
                                                                <button key={w} onClick={() => updateBlock(block.id, { ...block.content, width: w })} className={`px-2 py-1 text-[9px] font-black rounded-lg transition-all ${block.content.width === w ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{w}%</button>
                                                            ))}
                                                        </div>
                                                        <div className="flex pl-1 gap-1">
                                                            {['left', 'center', 'right'].map(a => (
                                                                <button key={a} onClick={() => updateBlock(block.id, { ...block.content, align: a })} className={`px-2 py-1 text-[9px] font-black rounded-lg transition-all uppercase ${block.content.align === a ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{a[0]}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-200 min-h-[100px] flex items-center justify-center">
                                                {block.content && (typeof block.content === 'string' ? block.content : block.content.url) ? (
                                                    <div className="relative group/img w-full">
                                                        <img src={typeof block.content === 'string' ? block.content : block.content.url} className="w-full h-auto max-h-[400px] object-contain p-4 transition-all" alt="" />
                                                        <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                                                            <input type="file" className="hidden" onChange={(e) => handleBlockImageUpload(e, block.id)} />
                                                            <span className="text-white font-black text-[10px] uppercase tracking-widest backdrop-blur-sm px-4 py-2 rounded-xl bg-white/10 border border-white/20">DEĞİŞTİR</span>
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                                        <input type="file" className="hidden" onChange={(e) => handleBlockImageUpload(e, block.id)} />
                                                        <svg className="w-6 h-6 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GÖRSEL EKLE</span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {block.type === 'FEATURES' && (
                                        <div className="space-y-3">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TEKNİK DETAY LİSTESİ</span>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {block.content.map((feature: string, fIdx: number) => (
                                                    <input key={fIdx} value={feature} onChange={(e) => {
                                                        const newFeats = [...block.content];
                                                        newFeats[fIdx] = e.target.value;
                                                        updateBlock(block.id, newFeats);
                                                    }} className="h-10 px-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white" />
                                                ))}
                                                <button onClick={() => updateBlock(block.id, [...block.content, 'Yeni Detay'])} className="h-10 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50">+</button>
                                            </div>
                                        </div>
                                    )}

                                    {block.type === 'SPLIT' && (
                                        <div className="space-y-3">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">METİN & GÖRSEL (IKILI)</span>
                                            <div className={`flex flex-col md:flex-row gap-6 ${block.content.reverse ? 'md:flex-row-reverse' : ''}`}>
                                                <textarea value={block.content.text} onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })} placeholder="Metin..." className="flex-1 min-h-[120px] bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs font-medium text-slate-600 outline-none focus:bg-white focus:border-indigo-500" />
                                                <div className="flex-1 aspect-video rounded-xl bg-slate-50 border border-slate-200 overflow-hidden relative">
                                                    {block.content.image ? <img src={block.content.image} className="w-full h-full object-contain p-2" alt="" /> : (
                                                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"><input type="file" className="hidden" onChange={(e) => handleBlockImageUpload(e, block.id, 'image')} /><span className="text-[10px] font-bold text-slate-400 uppercase">+ GÖRSEL</span></label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Block Menu Toolbar */}
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                            <button onClick={() => addBlock('HEADING')} className="px-4 h-10 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition-colors">H Başlık</button>
                            <button onClick={() => addBlock('TEXT')} className="px-4 h-10 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition-colors">Metin Paragrafı</button>
                            <button onClick={() => addBlock('IMAGE')} className="px-4 h-10 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition-colors">Görsel Blok</button>
                            <button onClick={() => addBlock('FEATURES')} className="px-4 h-10 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition-colors">Detay Listesi</button>
                            <button onClick={() => addBlock('SPLIT')} className="ml-auto px-6 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">Metin + Görsel Ekle</button>
                        </div>
                    </div>

                    {/* Image Upload Area */}
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-brand-pink">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <h3 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter italic">ÜRÜN GÖRSELLERİ</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {uploadedImages.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-[2rem] overflow-hidden border-2 border-slate-100 group bg-slate-50">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button onClick={() => removeImage(url)} className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-xl flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all">X</button>
                                </div>
                            ))}
                            {isUploading && (
                                <div className="aspect-square rounded-[2rem] border-2 border-slate-100 bg-slate-50 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-brand-pink border-t-white rounded-full animate-spin"></div>
                                </div>
                            )}
                            <label className="relative aspect-square rounded-[2rem] border-4 border-dashed border-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-50">
                                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                                <span className="text-[10px] font-black text-slate-400 italic">+ EKLE</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Pricing & Stock */}
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-50">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" strokeWidth="3" /></svg>
                            </div>
                            <h3 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter italic">FİYAT & STOK</h3>
                        </div>
                        <div className="space-y-10">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black uppercase text-slate-400 italic">PARA CİNSİ</label>
                                    <select name="currency" value={formData.currency} onChange={handleChange} className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-2 border-transparent outline-none font-black italic">
                                        <option value="TL">TL</option>
                                        <option value="$">USD</option>
                                        <option value="€">EUR</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black uppercase text-slate-400 italic">FİYAT</label>
                                    <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-2 border-transparent outline-none font-black italic" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase text-slate-400 italic">STOK</label>
                                <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="0" className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-2 border-transparent outline-none font-black italic" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ProductCreatePage;
