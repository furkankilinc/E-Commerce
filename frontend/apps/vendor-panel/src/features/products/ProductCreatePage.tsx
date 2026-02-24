import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../auth/auth.store';

const ProductCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const token = authStore.getToken();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        price: '',
        discountPrice: '',
        categoryId: '',
        brand: '',
        stock: '',
        taxRate: '10%',
        status: 'Published' // Published or Draft
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/merchant/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    categoryId: formData.categoryId,
                    stock: parseInt(formData.stock),
                    sku: 'AUTO-' + Math.random().toString(36).substring(7).toUpperCase(),
                    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30"], // Mock image
                    variants: []
                }),
            });

            if (response.ok) {
                navigate('/products');
            } else {
                const err = await response.json();
                alert('Hata: ' + err.message);
            }
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto min-h-screen pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Create Listing</h1>
                    <p className="text-slate-400 font-bold text-lg">Add detailed information to showcase your product to customers.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/products')}
                        className="px-10 py-4 bg-white border-2 border-slate-100 rounded-3xl text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all active:scale-95 shadow-sm"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-10 py-4 bg-brand-pink text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-pink/30 hover:bg-brand-pink-hover transition-all active:scale-95 flex items-center gap-3"
                    >
                        {isLoading && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                        Save Product
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Left Column (Main) */}
                <div className="xl:col-span-2 space-y-10">

                    {/* Basic Information */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-white">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-brand-pink">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Basic Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Minimalist Leather Watch"
                                    className="w-full h-16 px-8 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-brand-pink focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Slug</label>
                                <div className="flex h-16">
                                    <div className="flex items-center px-6 rounded-l-3xl bg-slate-100 border-2 border-r-0 border-transparent text-slate-400 text-sm font-bold shadow-inner">
                                        mystore.com/
                                    </div>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        placeholder="minimalist-leather-watch"
                                        className="flex-1 px-6 rounded-r-3xl bg-slate-50 border-2 border-l-0 border-transparent focus:border-brand-pink focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                                <div className="relative">
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        className="w-full h-16 px-8 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-brand-pink focus:bg-white outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer shadow-inner"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                    <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    placeholder="e.g. Chronos Design"
                                    className="w-full h-16 px-8 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-brand-pink focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media Gallery */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-white">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-brand-pink">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Media Gallery</h3>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min. 5 images required</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="col-span-1 md:col-span-2 aspect-[4/3] rounded-[2.5rem] border-4 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-slate-100/50 hover:border-brand-pink/20 transition-all group overflow-hidden relative">
                                <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center text-slate-300 group-hover:text-brand-pink group-hover:scale-110 transition-all z-10">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <span className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400 z-10">Main Cover</span>
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-200/20 group-hover:to-rose-500/5 transition-all"></div>
                            </div>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="aspect-square rounded-[2rem] bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100/80 hover:border-brand-pink/20 hover:text-brand-pink transition-all group shadow-sm">
                                    <svg className="w-10 h-10 group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 4v16m8-8H4" /></svg>
                                </div>
                            ))}
                        </div>
                        <p className="mt-8 text-slate-400 text-xs font-bold italic opacity-70">Drag and drop images here, or click to browse. Supports JPG, PNG up to 5MB.</p>
                    </div>

                    {/* Product Variants */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-white">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-brand-pink">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Product Variants</h3>
                            </div>
                            <button className="flex items-center gap-3 text-brand-pink font-black text-sm uppercase tracking-wider hover:text-rose-600 transition-all">
                                <svg className="w-5 h-5 bg-rose-50 rounded-lg flex items-center justify-center" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                Add Option
                            </button>
                        </div>

                        <div className="space-y-8">
                            {[
                                { name: 'Black Leather / Silver', price: '129.00', stock: '45', sku: 'WATCH-BLK-S' },
                                { name: 'Brown Leather / Gold', price: '139.00', stock: '20', sku: 'WATCH-BRN-G' }
                            ].map((variant, i) => (
                                <div key={i} className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group">
                                    <div className="flex items-center justify-between mb-8">
                                        <span className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-3">
                                            <div className="w-3 h-3 bg-brand-pink rounded-full"></div>
                                            {variant.name}
                                        </span>
                                        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Price Override</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-black">$</span>
                                                <input type="text" defaultValue={variant.price} className="w-full h-12 pl-8 pr-4 rounded-xl bg-white border border-slate-100 font-bold text-slate-700 text-sm focus:border-brand-pink outline-none transition-all shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Stock</label>
                                            <input type="text" defaultValue={variant.stock} className="w-full h-12 px-4 rounded-xl bg-white border border-slate-100 font-bold text-slate-700 text-sm focus:border-brand-pink outline-none transition-all shadow-sm" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">SKU Code</label>
                                            <input type="text" defaultValue={variant.sku} className="w-full h-12 px-4 rounded-xl bg-white border border-slate-100 font-bold text-slate-700 text-sm focus:border-brand-pink outline-none transition-all uppercase tracking-tighter shadow-sm" />
                                        </div>
                                        <button className="h-12 w-full bg-slate-200/40 hover:bg-slate-200 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 transition-all border border-slate-200/50 shadow-sm">Manage Media</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Description */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-white">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-brand-pink">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Product Description</h3>
                        </div>

                        <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                            <div className="flex items-center gap-8 px-10 py-6 border-b border-slate-100 bg-white">
                                <button className="text-slate-400 hover:text-slate-900 transition-colors font-black text-xl">B</button>
                                <button className="text-slate-400 hover:text-slate-900 transition-colors font-serif font-black italic text-xl">I</button>
                                <button className="text-slate-400 hover:text-slate-900 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                                <button className="text-slate-400 hover:text-slate-900 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg></button>
                                <button className="text-slate-400 hover:text-slate-900 transition-colors">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16L9.01703 16C7.91246 16 7.01703 15.1046 7.01703 14L7.01703 11C7.01703 9.89543 7.91246 9 9.01703 9L15.017 9C16.1216 9 17.017 9.89543 17.017 11L17.017 21L14.017 21Z" fillOpacity="0.4" /><path d="M10.017 21L10.017 18C10.017 16.8954 9.12157 16 8.017 16L5.01703 16C3.91246 16 3.01703 15.1046 3.01703 14L3.01703 11C3.01703 9.89543 3.91246 9 5.01703 9L11.017 9C12.1216 9 13.017 9.89543 13.017 11L13.017 21L10.017 21Z" /></svg>
                                </button>
                                <button className="text-slate-400 hover:text-slate-900 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                            </div>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your product's unique features..."
                                className="w-full min-h-[350px] p-12 bg-transparent outline-none font-bold text-slate-600 resize-none leading-relaxed placeholder:text-slate-300 placeholder:italic shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column (Side Cards) */}
                <div className="space-y-10">

                    {/* Pricing & Inventory */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-white">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-brand-pink">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953 1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pricing & Inventory</h3>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Base Price</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">$</span>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full h-16 pl-14 pr-6 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-brand-pink focus:bg-white outline-none transition-all font-black text-slate-700 placeholder:text-slate-200 shadow-inner"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Discounted Price (Optional)</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">$</span>
                                    <input
                                        type="number"
                                        name="discountPrice"
                                        value={formData.discountPrice}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full h-16 pl-14 pr-6 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-brand-pink focus:bg-white outline-none transition-all font-black text-slate-700 placeholder:text-slate-200 shadow-inner"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Tax Rate</label>
                                    <select
                                        name="taxRate"
                                        value={formData.taxRate}
                                        onChange={handleChange}
                                        className="w-full h-16 px-6 rounded-[2rem] bg-slate-50 border-2 border-transparent outline-none font-black text-slate-700 appearance-none cursor-pointer shadow-inner"
                                    >
                                        <option>10%</option>
                                        <option>15%</option>
                                        <option>20%</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Stock</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full h-16 px-6 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-brand-pink focus:bg-white outline-none transition-all font-black text-slate-700 shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Auto-Stock Alert</span>
                                <div className="w-14 h-7 bg-brand-pink rounded-full relative cursor-pointer shadow-lg shadow-brand-pink/20 transition-all">
                                    <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-white">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-brand-pink">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Status</h3>
                        </div>

                        <div className="space-y-4">
                            {[
                                { id: 'Draft', desc: 'Only visible to you' },
                                { id: 'Published', desc: 'Visible to all customers' }
                            ].map(st => (
                                <div
                                    key={st.id}
                                    onClick={() => setFormData({ ...formData, status: st.id })}
                                    className={`p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all flex items-center gap-6 shadow-sm ${formData.status === st.id ? 'border-brand-pink bg-rose-50' : 'border-slate-50 bg-slate-50'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.status === st.id ? 'border-brand-pink bg-white shadow-sm' : 'border-slate-300 bg-white'}`}>
                                        {formData.status === st.id && <div className="w-3 h-3 bg-brand-pink rounded-full animate-pulse"></div>}
                                    </div>
                                    <div className="flex-1">
                                        <span className={`text-sm font-black block transition-colors ${formData.status === st.id ? 'text-brand-pink' : 'text-slate-900'}`}>{st.id}</span>
                                        <span className="text-[10px] font-bold text-slate-400 italic leading-none opacity-80">{st.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Search Tags */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-white">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Search Tags</h3>
                        <div className="flex flex-wrap gap-3 mb-8">
                            {['Watch', 'Leather'].map(t => (
                                <div key={t} className="px-5 py-3 bg-slate-50 rounded-2xl text-xs font-black text-slate-600 border border-slate-100 flex items-center gap-3 shadow-sm group">
                                    {t} <button className="text-slate-300 hover:text-brand-pink transition-colors font-black">×</button>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-brand-pink hover:bg-rose-50 hover:border-brand-pink/20 transition-all flex items-center justify-center gap-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                            Add Tag
                        </button>
                    </div>

                    {/* Need Help */}
                    <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[3rem] p-12 shadow-2xl shadow-slate-900/40 relative overflow-hidden group border border-white/5">
                        <div className="absolute top-[-20%] right-[-20%] w-72 h-72 bg-brand-pink/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
                        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

                        <h3 className="text-3xl font-black text-white mb-6 relative z-10 tracking-tight leading-none italic">Need Help?</h3>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed mb-10 relative z-10 opacity-80">Read our guidelines on how to optimize your product listing for better brand visibility and conversion.</p>
                        <a href="#" className="flex items-center gap-3 text-brand-pink font-black text-sm uppercase tracking-widest group/link relative z-10 transition-all hover:text-rose-400 underline decoration-brand-pink/30 hover:decoration-rose-100 underline-offset-8">
                            Merchant Guide
                            <svg className="w-6 h-6 group-hover/link:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCreatePage;
