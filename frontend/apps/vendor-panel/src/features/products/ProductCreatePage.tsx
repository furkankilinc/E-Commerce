import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { authStore } from '../auth/auth.store';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

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
    const submitLock = useRef(false);

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
        currency: '₺',
        status: 'PUBLISHED' // PUBLISHED or DRAFT
    });

    // Navigation Blocker
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    // Initial Load & Draft Recovery
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                if (res.ok) {
                    const data = await res.json();
                    setAllCategories(data);
                    setLevel1Categories(data.filter((c: Category) => !c.parentId));
                }
            } catch (err) {
                console.error('Kategoriler çekilemedi:', err);
            }
        };
        fetchCategories();

        // Check for local draft
        const savedDraft = localStorage.getItem('fuira_product_draft');
        if (savedDraft) {
            Swal.fire({
                title: 'Taslak Bulundu!',
                text: 'Yarım kalan bir ürün girişiniz var, devam etmek ister misiniz?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ff3366',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: 'Evet, Devam Et',
                cancelButtonText: 'Hayır, Sil',
                background: '#ffffff',
                customClass: {
                    title: 'font-black italic uppercase tracking-tighter',
                    popup: 'rounded-[3rem]',
                    confirmButton: 'rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-xs',
                    cancelButton: 'rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-xs'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    try {
                        const parsed = JSON.parse(savedDraft);
                        setFormData(parsed.formData);
                        setAttributes(parsed.attributes || []);
                        setSelectedLevel1(parsed.selectedLevel1 || '');
                        setSelectedLevel2(parsed.selectedLevel2 || '');
                        setSelectedLevel3(parsed.selectedLevel3 || '');
                        toast.info('Taslak başarıyla yüklendi.');
                    } catch (e) {
                        localStorage.removeItem('fuira_product_draft');
                    }
                } else {
                    localStorage.removeItem('fuira_product_draft');
                }
            });
        }
    }, []);

    // Local Auto-save
    useEffect(() => {
        if (isDirty) {
            const timer = setTimeout(() => {
                const draftData = { formData, attributes, selectedLevel1, selectedLevel2, selectedLevel3 };
                localStorage.setItem('fuira_product_draft', JSON.stringify(draftData));
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [formData, attributes, selectedLevel1, selectedLevel2, selectedLevel3, isDirty]);

    // Handle Blocker Trigger
    useEffect(() => {
        if (blocker.state === "blocked") {
            Swal.fire({
                title: 'Kaydedilmemiş Değişiklikler!',
                text: 'Sayfadan ayrılmadan önce ürününüzü taslak olarak kaydetmek ister misiniz?',
                icon: 'warning',
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: 'Taslak Olarak Kaydet',
                denyButtonText: 'Hayır, Sil',
                cancelButtonText: 'Vazgeç',
                confirmButtonColor: '#ff3366',
                denyButtonColor: '#94a3b8',
                background: '#ffffff',
                customClass: {
                    title: 'font-black italic uppercase tracking-tighter',
                    popup: 'rounded-[3rem]',
                    confirmButton: 'rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-[10px]',
                    denyButton: 'rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-[10px]',
                    cancelButton: 'rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-[10px]'
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await handleSubmit('DRAFT', true);
                    blocker.proceed();
                } else if (result.isDenied) {
                    localStorage.removeItem('fuira_product_draft');
                    blocker.proceed();
                } else {
                    blocker.reset();
                }
            });
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
            const metadata: Record<string, string> = {};
            const variants: { name: string, value: string }[] = [];
            attributes.forEach(attr => {
                if (attr.key && attr.value) {
                    metadata[attr.key] = attr.value;
                    variants.push({ name: attr.key, value: attr.value });
                }
            });

            const response = await fetch('/api/merchant/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price) || 0,
                    categoryId: categoryId || 'ckv1234567890', // Default if leaving
                    status: finalStatus,
                    metadata,
                    stock: parseInt(formData.stock) || 0,
                    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30"], // Mock
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
                        Ürün <span className="text-brand-pink">Ekle</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-lg max-w-lg italic opacity-70">Ürününüzü tüm detaylarıyla listeleyin, müşterilerinize en doğru bilgiyi ulaştırın.</p>
                </div>
                <div className="flex gap-6">
                    <button
                        onClick={() => navigate('/products')}
                        className="px-12 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:border-red-100 transition-all active:scale-95 shadow-sm italic"
                    >
                        VAZGEÇ
                    </button>
                    {!isDirty && (
                        <div className="flex items-center gap-3 px-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-[10px] font-black text-slate-400 uppercase italic">
                            <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                            Değişiklik Yok
                        </div>
                    )}
                    {isDirty && (
                        <div className="flex items-center gap-3 px-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 text-[10px] font-black text-indigo-500 uppercase italic animate-pulse">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            Otomatik Kaydediliyor...
                        </div>
                    )}
                    <button
                        onClick={() => handleSubmit('PUBLISHED')}
                        disabled={isLoading}
                        className="px-12 py-5 bg-brand-pink text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-pink/30 hover:bg-brand-pink-hover transition-all active:scale-95 flex items-center gap-4 italic"
                    >
                        {isLoading && <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                        YAYINLA
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
                                        <option value="₺">₺ (TL)</option>
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
