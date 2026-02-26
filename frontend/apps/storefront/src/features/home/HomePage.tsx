import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../cart/cart.store';
import { useWishlist } from '../wishlist/store/wishlist.store';
import AddToCollectionModal from '../collections/components/AddToCollectionModal';
import { toast } from 'react-toastify';
import { getSizedImageUrl } from '../../shared/utils/image.util';

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    merchant: { id: string; companyName: string };
    category: { name: string; slug: string };
    images: { url: string; isMain: boolean }[];
    rating: number;
    reviewCount: number;
    metadata?: any;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface FilterMeta {
    categories: { id: string; name: string; slug: string; parentId: string | null }[];
    merchants: { id: string; companyName: string }[];
    priceRange: { min: number; max: number };
    variants: Record<string, string[]>;
}

const CategoryItem: React.FC<{
    category: { id: string; name: string; slug: string; parentId: string | null },
    allCategories: { id: string; name: string; slug: string; parentId: string | null }[],
    selectedSlug: string,
    onSelect: (slug: string) => void
}> = ({ category, allCategories, selectedSlug, onSelect }) => {
    const children = allCategories.filter(c => c.parentId === category.id);
    const isSelected = selectedSlug === category.slug;

    const isChildSelected = useCallback((parentId: string, currentSelectedSlug: string): boolean => {
        const item = allCategories.find(c => c.slug === currentSelectedSlug);
        if (!item || !item.parentId) return false;
        if (item.parentId === parentId) return true;
        let up = allCategories.find(c => c.id === item.parentId);
        while (up) {
            if (up.id === parentId) return true;
            up = allCategories.find(c => c.id === up?.parentId);
        }
        return false;
    }, [allCategories]);

    const activeChildBranch = isChildSelected(category.id, selectedSlug);
    const showChildren = isSelected || activeChildBranch;

    return (
        <div className="space-y-1">
            <button
                onClick={() => onSelect(category.slug)}
                className={`w-full flex items-center justify-between px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all group ${isSelected ? 'bg-brand-pink text-white shadow-xl shadow-brand-pink/20' : activeChildBranch ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <span className="truncate pr-4">{category.name}</span>
                {children.length > 0 && (
                    <svg
                        className={`w-3.5 h-3.5 transition-transform duration-500 ${showChildren ? 'rotate-90' : ''} ${isSelected || activeChildBranch ? 'text-white' : 'text-gray-300'}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path d="M9 5l7 7-7 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>

            {showChildren && children.length > 0 && (
                <div className="ml-5 mt-1 space-y-1 border-l-2 border-brand-pink/20 pl-4 py-1 animate-in slide-in-from-top-2 duration-300">
                    {children.map(child => (
                        <CategoryItem
                            key={child.id}
                            category={child}
                            allCategories={allCategories}
                            selectedSlug={selectedSlug}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const HomePage: React.FC = () => {
    const { addItem } = useCart();
    const { toggleItem, isInWishlist } = useWishlist();
    const [collectionModalProduct, setCollectionModalProduct] = useState<any | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [meta, setMeta] = useState<FilterMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMetaLoading, setIsMetaLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    const isFirstLoad = useRef(true);
    const [searchParams, setSearchParams] = useSearchParams();

    const [filters, setFilters] = useState(() => {
        const s = searchParams.get('search') || '';
        const c = searchParams.get('category') || '';
        const minP = searchParams.get('minPrice') || '';
        const maxP = searchParams.get('maxPrice') || '';
        const r = parseInt(searchParams.get('rating') || '0');
        const m = searchParams.get('merchants')?.split(',').filter(Boolean) || [];
        const sort = searchParams.get('sort') || 'popular';

        const v: Record<string, string[]> = {};
        const vParam = searchParams.get('variants');
        if (vParam) {
            vParam.split(';').forEach(pair => {
                const [key, values] = pair.split(':');
                if (key && values) v[key] = values.split(',');
            });
        }

        return {
            search: s,
            category: c,
            minPrice: minP,
            maxPrice: maxP,
            rating: r,
            merchants: m,
            selectedVariants: v,
            sort,
            filterSearch: ''
        };
    });

    useEffect(() => {
        const s = searchParams.get('search') || '';
        const c = searchParams.get('category') || '';
        const minP = searchParams.get('minPrice') || '';
        const maxP = searchParams.get('maxPrice') || '';
        const r = parseInt(searchParams.get('rating') || '0');
        const m = searchParams.get('merchants')?.split(',').filter(Boolean) || [];
        const sort = searchParams.get('sort') || 'popular';

        const v: Record<string, string[]> = {};
        const vParam = searchParams.get('variants');
        if (vParam) {
            vParam.split(';').forEach(pair => {
                const [key, values] = pair.split(':');
                if (key && values) v[key] = values.split(',');
            });
        }

        setFilters(prev => ({
            ...prev,
            search: s,
            category: c,
            minPrice: minP,
            maxPrice: maxP,
            rating: r,
            merchants: m,
            selectedVariants: v,
            sort
        }));
    }, [searchParams]);

    useEffect(() => {
        const newParams = new URLSearchParams(searchParams);
        if (filters.search) newParams.set('search', filters.search); else newParams.delete('search');
        if (filters.category) newParams.set('category', filters.category); else newParams.delete('category');
        if (filters.minPrice) newParams.set('minPrice', filters.minPrice); else newParams.delete('minPrice');
        if (filters.maxPrice) newParams.set('maxPrice', filters.maxPrice); else newParams.delete('maxPrice');
        if (filters.rating > 0) newParams.set('rating', filters.rating.toString()); else newParams.delete('rating');
        if (filters.merchants.length > 0) newParams.set('merchants', filters.merchants.join(',')); else newParams.delete('merchants');
        if (filters.sort !== 'popular') newParams.set('sort', filters.sort); else newParams.delete('sort');

        const vQuery = Object.entries(filters.selectedVariants)
            .filter(([_, vals]) => vals.length > 0)
            .map(([k, vals]) => `${k}:${vals.join(',')}`)
            .join(';');
        if (vQuery) newParams.set('variants', vQuery); else newParams.delete('variants');

        if (newParams.toString() !== searchParams.toString()) {
            setSearchParams(newParams, { replace: true });
        }
    }, [filters.search, filters.category, filters.minPrice, filters.maxPrice, filters.rating, filters.merchants, filters.selectedVariants, filters.sort]);

    const updateCategory = (slug: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (slug) newParams.set('category', slug);
        else newParams.delete('category');
        setSearchParams(newParams);
    };

    const [localSearch, setLocalSearch] = useState(filters.search);

    useEffect(() => {
        setLocalSearch(filters.search);
    }, [filters.search]);

    useEffect(() => {
        if (localSearch === filters.search) return;
        const timer = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: localSearch }));
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearch, filters.search]);

    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const fetchMeta = async (catSlug: string, signal?: AbortSignal) => {
        setIsMetaLoading(true);
        try {
            const res = await fetch(`/api/products-meta/filters?category=${catSlug}`, { signal });
            if (res.ok) {
                const data = await res.json();
                setMeta(data);

                setFilters(prev => {
                    const newMin = data.priceRange.min;
                    const newMax = data.priceRange.max;
                    let currentMin = parseFloat(prev.minPrice);
                    let currentMax = parseFloat(prev.maxPrice);
                    const updatedMin = isNaN(currentMin) ? newMin : Math.max(newMin, Math.min(newMax, currentMin));
                    const updatedMax = isNaN(currentMax) ? newMax : Math.min(newMax, Math.max(newMin, currentMax));

                    return {
                        ...prev,
                        minPrice: updatedMin.toString(),
                        maxPrice: updatedMax.toString()
                    };
                });
                isFirstLoad.current = false;
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Failed to fetch meta:', err);
            }
        } finally {
            setIsMetaLoading(false);
        }
    };

    const filtersString = JSON.stringify({
        search: filters.search,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        merchants: filters.merchants,
        selectedVariants: filters.selectedVariants,
        sort: filters.sort
    });

    const fetchProducts = useCallback(async (signal?: AbortSignal) => {
        setIsLoading(true);
        try {
            const variantQuery = Object.entries(filters.selectedVariants)
                .filter(([_, values]) => values.length > 0)
                .map(([name, values]) => `${name}:${values.join(',')}`)
                .join(';');

            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: '12',
                sort: filters.sort,
                ...(filters.category && { category: filters.category }),
                ...(filters.search && { search: filters.search }),
                ...(filters.minPrice && { minPrice: filters.minPrice }),
                ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
                ...(filters.rating > 0 && { rating: filters.rating.toString() }),
                ...(filters.merchants.length > 0 && { merchants: filters.merchants.join(',') }),
                ...(variantQuery && { variants: variantQuery })
            });

            const res = await fetch(`/api/products?${queryParams.toString()}`, { signal });
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products);
                setPagination(data.pagination);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Failed to fetch products:', err);
            }
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    }, [currentPage, filtersString]);

    // Fetch Meta Effect
    useEffect(() => {
        const controller = new AbortController();
        if (!isFirstLoad.current) {
            setFilters(prev => ({
                ...prev,
                selectedVariants: {},
                merchants: []
            }));
            setCurrentPage(1);
        }
        fetchMeta(filters.category, controller.signal);
        return () => controller.abort();
    }, [filters.category]);

    // Fetch Products Effect with Debounce (Initial load optimized)
    useEffect(() => {
        const controller = new AbortController();

        // Use a small timeout to debounce rapid filter changes (like price slider)
        // Skip debounce only for the very first load to optimize LCP
        if (isFirstLoad.current) {
            fetchProducts(controller.signal);
            return () => controller.abort();
        }

        const timer = setTimeout(() => {
            fetchProducts(controller.signal);
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [fetchProducts]);

    const handlePageChange = (newPage: number) => {
        if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const toggleMerchant = (id: string) => {
        setFilters(prev => ({
            ...prev,
            merchants: prev.merchants.includes(id)
                ? prev.merchants.filter(m => m !== id)
                : [...prev.merchants, id]
        }));
        setCurrentPage(1);
    };

    const toggleVariant = (name: string, value: string) => {
        setFilters(prev => {
            const currentValues = prev.selectedVariants[name] || [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];

            return {
                ...prev,
                selectedVariants: {
                    ...prev.selectedVariants,
                    [name]: newValues
                }
            };
        });
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            category: '',
            minPrice: meta?.priceRange.min.toString() || '',
            maxPrice: meta?.priceRange.max.toString() || '',
            rating: 0,
            merchants: [],
            selectedVariants: {},
            sort: 'popular',
            filterSearch: ''
        });
        setLocalSearch('');
        setCurrentPage(1);
    };

    const toggleSection = (name: string) => {
        setCollapsedSections(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const CategorySkeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />
            ))}
        </div>
    );

    const ProductSkeleton = () => (
        <div className="space-y-6">
            <div className="aspect-square rounded-[3rem] bg-gray-50 animate-pulse" />
            <div className="space-y-3">
                <div className="h-4 bg-gray-50 rounded-full w-2/3 animate-pulse" />
                <div className="h-4 bg-gray-50 rounded-full w-1/3 animate-pulse" />
            </div>
        </div>
    );

    return (
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-20 py-10">
            {collectionModalProduct && (
                <AddToCollectionModal
                    product={collectionModalProduct}
                    onClose={() => setCollectionModalProduct(null)}
                />
            )}

            <div className="mb-6 flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest italic min-h-[20px]">
                <Link to="/" className="hover:text-brand-pink transition-colors">ANASAYFA</Link>
                {meta ? (() => {
                    const currentCat = meta.categories.find(c => c.slug === filters.category);
                    const parentCat = currentCat?.parentId ? meta.categories.find(c => c.id === currentCat.parentId) : null;

                    return (
                        <>
                            {parentCat && (
                                <>
                                    <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <button onClick={() => updateCategory(parentCat.slug)} className="hover:text-brand-pink transition-colors uppercase">
                                        {parentCat.name}
                                    </button>
                                </>
                            )}
                            <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <span className="text-gray-900 border-b-2 border-brand-pink/20 uppercase">
                                {currentCat?.name || "Tüm Ürünler"}
                            </span>
                        </>
                    );
                })() : (
                    <>
                        <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span className="w-24 h-3 bg-gray-50 rounded-full animate-pulse" />
                    </>
                )}
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div>
                    <h1 className="text-4xl sm:text-5xl lg:text-[72px] font-[1000] text-gray-900 leading-[0.85] tracking-tighter mb-4 italic uppercase">
                        FUI & <span className="text-brand-pink">RA</span>
                    </h1>
                    <p className="text-sm font-bold text-gray-500">En yeni teknolojiler, Fuira güvencesiyle kapınızda.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="lg:hidden flex items-center gap-3 px-6 h-16 bg-gray-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest italic shadow-xl shadow-gray-200"
                    >
                        <svg className="w-5 h-5 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeWidth="2.5" strokeLinecap="round" /></svg>
                        FİLTRELER
                    </button>

                    <div className="relative">
                        <select
                            aria-label="Sıralama Seçeneği"
                            value={filters.sort}
                            onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                            className="appearance-none cursor-pointer bg-white border-2 border-gray-50 h-16 pl-8 pr-14 rounded-[2rem] text-[11px] font-black text-gray-900 italic uppercase tracking-widest focus:outline-none focus:border-brand-pink transition-all shadow-sm"
                        >
                            <option value="popular">Popülerlik</option>
                            <option value="newest">En Yeniler</option>
                            <option value="price-low">Fiyat: Artan</option>
                            <option value="price-high">Fiyat: Azalan</option>
                            <option value="rating">Puan</option>
                        </select>
                        <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-16 relative">
                {isMobileFiltersOpen && (
                    <div className="lg:hidden fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[90]" onClick={() => setIsMobileFiltersOpen(false)} />
                )}

                <aside className={`
                    fixed lg:sticky top-0 lg:top-24 left-0 w-[85%] sm:w-80 lg:w-80 h-full lg:h-auto 
                    bg-white lg:bg-transparent z-[100] lg:z-0 p-8 lg:p-0
                    transition-transform duration-500 ease-in-out lg:transition-none
                    ${isMobileFiltersOpen ? 'translate-x-0 shadow-2xl overflow-y-auto' : '-translate-x-full lg:translate-x-0'}
                    flex-shrink-0
                `}>
                    <div className="space-y-10">
                        <div className="lg:hidden flex items-center justify-between mb-10 pb-6 border-b-2 border-gray-50">
                            <h2 className="text-xl font-[1000] text-gray-900 italic uppercase">FİLTRELER</h2>
                            <button aria-label="Filtreleri Kapat" onClick={() => setIsMobileFiltersOpen(false)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                aria-label="Filtrelerde Ara"
                                type="text"
                                placeholder="Model, özellik veya satici..."
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="w-full h-14 pl-12 pr-6 bg-gray-50 rounded-2xl text-[11px] font-bold italic focus:bg-white border-2 border-transparent focus:border-brand-pink outline-none transition-all placeholder:text-gray-300"
                            />
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="3" /></svg>
                        </div>

                        <div>
                            <button onClick={() => toggleSection('category')} className="w-full flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 italic hover:text-gray-900 transition-colors">
                                KATEGORİ
                                <svg className={`w-4 h-4 transform transition-transform ${collapsedSections['category'] ? '-rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg>
                            </button>
                            {!collapsedSections['category'] && (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar min-h-[350px]">
                                    {!meta ? <CategorySkeleton /> : (
                                        <>
                                            <button
                                                onClick={() => updateCategory('')}
                                                className={`w-full flex items-center justify-between px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all ${!filters.category ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                Hepsi
                                            </button>
                                            {meta.categories.filter(c => c.parentId === null).map(cat => (
                                                <CategoryItem key={cat.id} category={cat} allCategories={meta.categories} selectedSlug={filters.category} onSelect={updateCategory} />
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="py-2">
                            <div role="heading" aria-level={2} className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-8 italic">FİYAT ARALIĞI</div>
                            <div className="flex gap-4">
                                <div className="flex-1 bg-white border-2 border-gray-50 p-4 rounded-2xl shadow-sm min-h-[72px] flex flex-col justify-center">
                                    <span className="text-[8px] font-black text-gray-500 uppercase block mb-1 leading-none">MİN</span>
                                    <input aria-label="Minimum Fiyat" type="number" value={filters.minPrice} onChange={e => setFilters(prev => ({ ...prev, minPrice: e.target.value }))} className="bg-transparent w-full outline-none text-xs font-black text-gray-900 italic h-5 leading-none" />
                                </div>
                                <div className="flex-1 bg-white border-2 border-gray-50 p-4 rounded-2xl shadow-sm min-h-[72px] flex flex-col justify-center">
                                    <span className="text-[8px] font-black text-gray-500 uppercase block mb-1 leading-none">MAX</span>
                                    <input aria-label="Maksimum Fiyat" type="number" value={filters.maxPrice} onChange={e => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))} className="bg-transparent w-full outline-none text-xs font-black text-gray-900 italic h-5 leading-none" />
                                </div>
                            </div>
                        </div>

                        <div className={`relative transition-opacity duration-300 ${isMetaLoading ? 'opacity-40' : 'opacity-100'}`}>
                            {isMetaLoading && <div className="absolute top-0 right-0 w-4 h-4 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />}
                            {meta && Object.entries(meta.variants).map(([name, values]) => {
                                const label = name === 'Color' ? 'RENK' : name === 'Size' ? 'BEDEN' : name.toUpperCase();
                                const isColorFilter = name === 'Color' || name.toLowerCase() === 'renk' || name.toLowerCase() === 'color';
                                return (
                                    <div key={name} className="mb-10 animate-in fade-in slide-in-from-top-2">
                                        <button onClick={() => toggleSection(name)} className="w-full flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 italic">
                                            {label}
                                            <svg className={`w-4 h-4 transform transition-transform ${collapsedSections[name] ? '-rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg>
                                        </button>
                                        {!collapsedSections[name] && (
                                            <div className={isColorFilter ? 'flex flex-wrap gap-3' : 'flex flex-col gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar'}>
                                                {values.map(val => (
                                                    isColorFilter ? (
                                                        <button
                                                            key={val}
                                                            onClick={() => toggleVariant(name, val)}
                                                            title={val}
                                                            className={`w-8 h-8 rounded-full border-2 transition-all transform hover:scale-125 ${filters.selectedVariants[name]?.includes(val) ? 'border-brand-pink ring-4 ring-brand-pink/10 shadow-lg' : 'border-gray-100'}`}
                                                            style={{ backgroundColor: val.toLowerCase() }}
                                                        />
                                                    ) : (
                                                        <label key={val} className="flex items-center group cursor-pointer">
                                                            <div className="relative">
                                                                <input type="checkbox" checked={filters.selectedVariants[name]?.includes(val)} onChange={() => toggleVariant(name, val)} className="w-5 h-5 border-2 border-gray-200 rounded-lg appearance-none checked:bg-brand-pink checked:border-brand-pink cursor-pointer transition-all" />
                                                                {filters.selectedVariants[name]?.includes(val) && <svg className="absolute w-3.5 h-3.5 text-white left-0.5 top-0.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                                            </div>
                                                            <span className="ml-3 text-[11px] font-black text-gray-500 group-hover:text-gray-900 transition-colors uppercase italic">{val}</span>
                                                        </label>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <div>
                                <button onClick={() => toggleSection('merchants')} className="w-full flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 italic">
                                    SATICILAR
                                    <svg className={`w-4 h-4 transform transition-transform ${collapsedSections['merchants'] ? '-rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg>
                                </button>
                                {!collapsedSections['merchants'] && (
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {meta?.merchants.filter(m => m.companyName.toLowerCase().includes(localSearch.toLowerCase())).map(m => (
                                            <label key={m.id} className="flex items-center group cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" checked={filters.merchants.includes(m.id)} onChange={() => toggleMerchant(m.id)} className="w-5 h-5 border-2 border-gray-200 rounded-lg appearance-none checked:bg-brand-pink checked:border-brand-pink cursor-pointer transition-all" />
                                                    {filters.merchants.includes(m.id) && <svg className="absolute w-3.5 h-3.5 text-white left-0.5 top-0.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                                </div>
                                                <span className="ml-3 text-[11px] font-black text-gray-500 group-hover:text-gray-900 transition-colors uppercase italic">{m.companyName}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-10">
                            <button onClick={clearFilters} className="w-full py-5 bg-gray-50 text-gray-500 rounded-[2rem] text-[11px] font-black uppercase tracking-widest italic hover:bg-brand-pink hover:text-white transition-all shadow-sm">FİLTRELERİ SIFIRLA</button>
                        </div>
                    </div>
                </aside>

                <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                        {isLoading && products.length === 0 ? (
                            [...Array(6)].map((_, i) => <ProductSkeleton key={i} />)
                        ) : products.length > 0 ? (
                            products.map((product, index) => (
                                <Link to={`/product/${product.id}`} key={product.id} className="group flex flex-col bg-white rounded-[3.5rem] p-6 transition-all border-2 border-transparent hover:border-gray-50 hover:shadow-2xl hover:shadow-gray-200/50">
                                    <div className="relative aspect-square rounded-[3rem] overflow-hidden mb-8 bg-[#fdfaf5] border border-gray-50 flex items-center justify-center p-8">
                                        <img
                                            src={getSizedImageUrl((product.images.find(img => img.isMain) || product.images[0])?.url, 'medium')}
                                            alt={product.name}
                                            width="400"
                                            height="400"
                                            loading={index < 3 ? "eager" : "lazy"}
                                            {...(index < 3 ? { fetchPriority: "high" } : {})}
                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                                            {product.rating >= 4.5 && <div className="px-3.5 py-1.5 rounded-xl text-[8px] font-black tracking-[0.2em] bg-gray-900 text-white shadow-xl uppercase italic">EN POPÜLER</div>}
                                            {product.price > 1000 && <div className="px-3.5 py-1.5 rounded-xl text-[8px] font-black tracking-[0.2em] bg-brand-pink text-white shadow-xl uppercase italic">PREMIUM</div>}
                                        </div>
                                        <button
                                            aria-label={isInWishlist(product.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                                            onClick={(e) => {
                                                e.preventDefault(); e.stopPropagation(); toggleItem(product);
                                                toast[isInWishlist(product.id) ? 'info' : 'success'](isInWishlist(product.id) ? `${product.name} favorilerden çıkarıldı.` : `${product.name} favorilere eklendi!`, { autoClose: 1500 });
                                            }}
                                            className={`absolute top-6 right-6 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border transition-all hover:scale-110 ${isInWishlist(product.id) ? 'bg-brand-pink border-brand-pink text-white' : 'bg-white border-gray-100 text-gray-300 opacity-0 group-hover:opacity-100'}`}
                                        >
                                            <svg className="w-4 h-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                        </button>
                                    </div>

                                    <div className="flex flex-col flex-grow px-2">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[9px] font-[1000] text-gray-900 tracking-[0.3em] uppercase italic">{product.category?.name}</span>
                                            <div className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-full text-gray-900 font-black text-[10px]">
                                                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                {product.rating}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-[1000] text-gray-900 mb-8 leading-[1.1] group-hover:text-brand-pink transition-colors italic line-clamp-2 uppercase tracking-tighter">{product.name}</h3>
                                        <div className="mt-auto flex justify-between items-center pt-8 border-t border-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic leading-none mb-1">FUIRA FİYAT</span>
                                                <span className="text-3xl font-[1000] text-gray-900 tracking-tighter italic leading-none">{product.price.toLocaleString()} TL</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(product); toast.success(`${product.name} sepete eklendi.`); }}
                                                aria-label="Sepete Ekle"
                                                className="w-16 h-16 rounded-[1.8rem] bg-gray-900 text-white flex items-center justify-center hover:bg-brand-pink transition-all transform hover:scale-110 shadow-2xl shadow-gray-200"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M12 4v16m8-8H4" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center bg-gray-50/50 rounded-[4rem] border-2 border-dashed border-gray-100">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200 border border-gray-50 shadow-sm">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" /></svg>
                                </div>
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Ürün bulunamadı.</p>
                                <button onClick={clearFilters} className="mt-8 text-brand-pink text-[10px] font-black uppercase tracking-widest border-b-2 border-brand-pink/20 hover:border-brand-pink transition-all italic">FİLTRELERİ TEMİZLE</button>
                            </div>
                        )}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="mt-24 flex justify-center items-center gap-6">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="w-16 h-16 rounded-[1.8rem] bg-white border-2 border-gray-50 flex items-center justify-center text-gray-300 hover:text-brand-pink hover:border-brand-pink disabled:opacity-30 transition-all group shadow-sm">
                                <svg className="w-6 h-6 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3.5" /></svg>
                            </button>
                            <div className="flex items-center gap-3">
                                {[...Array(pagination.totalPages)].map((_, i) => {
                                    const p = i + 1;
                                    if (p === 1 || p === pagination.totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                                        return (
                                            <button key={p} onClick={() => handlePageChange(p)} className={`w-14 h-14 rounded-2xl text-xs font-black transition-all ${currentPage === p ? 'bg-brand-pink text-white shadow-xl shadow-brand-pink/20' : 'bg-white border-2 border-gray-50 text-gray-300 hover:text-gray-900'}`}>{p}</button>
                                        );
                                    }
                                    if (p === currentPage - 2 || p === currentPage + 2) return <span key={p} className="text-gray-200 font-black">...</span>;
                                    return null;
                                })}
                            </div>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages} className="w-16 h-16 rounded-[1.8rem] bg-white border-2 border-gray-50 flex items-center justify-center text-gray-300 hover:text-brand-pink hover:border-brand-pink disabled:opacity-30 transition-all shadow-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3.5" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
