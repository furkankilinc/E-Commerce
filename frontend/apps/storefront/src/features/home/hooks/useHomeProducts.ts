import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { preload } from 'react-dom';
import { apiClient } from '../../../shared/api/apiClient';
import { getSizedImageUrl } from '../../../shared/utils/image.util';
import { Product, PaginationData, FilterMeta, FilterState } from '../home.types';

export const useHomeProducts = () => {
    const { pathname } = useLocation();
    const isNewPage = pathname === '/new';
    const isSalePage = pathname === '/sale';
    
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [meta, setMeta] = useState<FilterMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMetaLoading, setIsMetaLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const isFirstLoad = useRef(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [filters, setFilters] = useState<FilterState>(() => {
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

    const [localSearch, setLocalSearch] = useState(filters.search);

    // React 19: Preload the first few product images for better LCP
    useEffect(() => {
        products.slice(0, 3).forEach((product: Product) => {
            const imageUrl = getSizedImageUrl((product.images.find((img: any) => img.isMain) || product.images[0])?.url, 'medium');
            if (imageUrl) {
                preload(imageUrl, { as: 'image', fetchPriority: 'high' });
            }
        });
    }, [products]);

    // Sync searchParams to filters
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

    // Sync filters to searchParams
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

    // Debounce local search
    useEffect(() => {
        if (localSearch === filters.search) return;
        const timer = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: localSearch }));
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearch, filters.search]);

    // Sync local search when global search filter changes
    useEffect(() => {
        setLocalSearch(filters.search);
    }, [filters.search]);

    const fetchMeta = async (catSlug: string, signal?: AbortSignal) => {
        setIsMetaLoading(true);
        try {
            const res = await apiClient(`/api/products-meta/filters?category=${catSlug}`, { signal });
            if (res.ok) {
                const data = await res.json();
                setMeta(data);

                if (data.priceRange) {
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
                }
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
        sort: filters.sort,
        isNewPage,
        isSalePage
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
                ...(variantQuery && { variants: variantQuery }),
                ...(isNewPage && { isNewArrival: 'true' }),
                ...(isSalePage && { isOnSale: 'true' })
            });

            const res = await apiClient(`/api/products?${queryParams.toString()}`, { signal });
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

    useEffect(() => {
        const controller = new AbortController();
        if (!isFirstLoad.current) {
            setFilters(prev => ({ ...prev, selectedVariants: {}, merchants: [] }));
            setCurrentPage(1);
        }
        fetchMeta(filters.category, controller.signal);
        return () => controller.abort();
    }, [filters.category]);

    useEffect(() => {
        const controller = new AbortController();
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

    const updateCategory = (slug: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (slug) newParams.set('category', slug);
        else newParams.delete('category');
        setSearchParams(newParams);
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

    return {
        products,
        pagination,
        meta,
        isLoading,
        isMetaLoading,
        currentPage,
        isMobileFiltersOpen,
        setIsMobileFiltersOpen,
        localSearch,
        setLocalSearch,
        collapsedSections,
        filters,
        setFilters,
        isNewPage,
        isSalePage,
        handlePageChange,
        updateCategory,
        toggleMerchant,
        toggleVariant,
        clearFilters,
        toggleSection
    };
};
