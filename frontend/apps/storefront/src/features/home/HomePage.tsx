import React, { Suspense, lazy, useState } from 'react';
import { Link } from 'react-router-dom';
const AddToCollectionModal = lazy(() => import('../collections/components/AddToCollectionModal'));
import ProductCard from './components/ProductCard';
import Pagination from '../../shared/components/Pagination';
import FilterSidebar from './components/FilterSidebar';
import { useHomeProducts } from './hooks/useHomeProducts';
import { Product } from './home.types';
import { useTranslation } from '../../shared/i18n/I18nContext';

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const {
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
    } = useHomeProducts();

    const [collectionModalProduct, setCollectionModalProduct] = useState<any | null>(null);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortOptions = [
        { value: 'popular', label: t('sort.popular') },
        { value: 'newest', label: t('sort.newest') },
        { value: 'price-low', label: t('sort.priceLow') },
        { value: 'price-high', label: t('sort.priceHigh') },
        { value: 'rating', label: t('sort.rating') },
    ];

    const activeSortOption = sortOptions.find(opt => opt.value === filters.sort) || sortOptions[0];

    const ProductSkeleton = () => (
        <div className="space-y-6">
            <div className="aspect-square rounded-md bg-gray-50 animate-pulse" />
            <div className="space-y-3">
                <div className="h-4 bg-gray-50 rounded-full w-2/3 animate-pulse" />
                <div className="h-4 bg-gray-50 rounded-full w-1/3 animate-pulse" />
            </div>
        </div>
    );

    return (
        <div className="max-w-[1650px] mx-auto px-4 sm:px-10 lg:px-20 py-6 sm:py-10">
            {collectionModalProduct && (
                <Suspense fallback={null}>
                    <AddToCollectionModal
                        product={collectionModalProduct}
                        onClose={() => setCollectionModalProduct(null)}
                    />
                </Suspense>
            )}

            <div className="mb-6 flex items-center gap-2 text-10px font-semibold text-gray-500   italic min-h-[20px]">
                <Link to="/" className="hover:text-brand-pink transition-colors">{t('nav.home') || 'ANASAYFA'}</Link>
                {meta ? (() => {
                    const currentCat = meta.categories.find(c => c.slug === filters.category);
                    const parentCat = currentCat?.parentId ? meta.categories.find(c => c.id === currentCat.parentId) : null;

                    return (
                        <>
                            {parentCat && (
                                <>
                                    <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <button onClick={() => updateCategory(parentCat.slug)} className="hover:text-brand-pink transition-colors ">
                                        {parentCat.name}
                                    </button>
                                </>
                            )}
                            <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <span className="text-gray-900 border-b-2 border-brand-pink/20 ">
                                {currentCat?.name || (isNewPage ? t('nav.newArrivals') : isSalePage ? t('nav.sale') : t('nav.allProducts'))}
                            </span>
                        </>
                    );
                })() : (
                    <>
                        <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span className="text-gray-900 border-b-2 border-brand-pink/20 ">
                            {isNewPage ? t('nav.newArrivals') : isSalePage ? t('nav.sale') : t('nav.allProducts')}
                        </span>
                    </>
                )}
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-[0.95]  mb-4 italic ">
                        {isNewPage ? t('home.titleNew') : isSalePage ? t('home.titleSale') : <>FUI & <span className="text-brand-pink">RA</span></>}
                    </h1>
                    <p className="text-sm font-bold text-gray-500">
                        {isNewPage ? t('home.descNew') : isSalePage ? t('home.descSale') : t('home.descDefault')}
                    </p>
                </div>

                <div className="flex items-center gap-4 px-4 mt-4 h-10">
                    <button
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="lg:hidden flex items-center gap-3 shadow-xs h-full px-6 py-2  text-black rounded-md text-caption font-semibold   italic  shadow-gray-200"
                    >
                        <svg className="w-5 h-5 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeWidth="2.5" strokeLinecap="round" /></svg>
                        {t('home.filters')}
                    </button>

                    <div ref={sortRef} className="relative h-full select-none">
                        <button
                            onClick={() => setIsSortOpen(prev => !prev)}
                            className="flex items-center justify-between gap-6 cursor-pointer bg-white border border-gray-100 h-full px-5 rounded-md outline-none text-caption font-semibold text-gray-900 italic focus:border-brand-pink transition-all shadow-xs min-w-[190px] text-left"
                        >
                            <span>{activeSortOption.label}</span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>

                        {isSortOpen && (
                            <div className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-xl border border-gray-100/50 py-1.5 z-[100] animate-dropdown">
                                {sortOptions.map(opt => {
                                    const isSelected = opt.value === filters.sort;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                setFilters(prev => ({ ...prev, sort: opt.value }));
                                                setIsSortOpen(false);
                                            }}
                                            className={`w-full flex items-center pl-10 pr-4 py-3 text-caption font-semibold italic transition-all text-left relative ${isSelected
                                                    ? 'bg-brand-pink/5 text-brand-pink font-bold'
                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            {isSelected && (
                                                <span className="absolute left-3.5 inset-y-0 flex items-center text-brand-pink">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path d="M5 13l4 4L19 7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </span>
                                            )}
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 relative">
                {isMobileFiltersOpen && (
                    <div className="lg:hidden fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[90]" onClick={() => setIsMobileFiltersOpen(false)} />
                )}

                <FilterSidebar
                    isMobileFiltersOpen={isMobileFiltersOpen}
                    setIsMobileFiltersOpen={setIsMobileFiltersOpen}
                    localSearch={localSearch}
                    setLocalSearch={setLocalSearch}
                    filters={filters as any}
                    setFilters={setFilters as any}
                    collapsedSections={collapsedSections}
                    toggleSection={toggleSection}
                    meta={meta}
                    isMetaLoading={isMetaLoading}
                    updateCategory={updateCategory}
                    toggleVariant={toggleVariant}
                    toggleMerchant={toggleMerchant}
                    clearFilters={clearFilters}
                />

                <div className="flex-1">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12">
                        {isLoading && products.length === 0 ? (
                            [...Array(6)].map((_, i) => <ProductSkeleton key={i} />)
                        ) : products.length > 0 ? (
                            products.map((product: Product, index: number) => (
                                <ProductCard key={product.id} product={product} index={index} />
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center bg-gray-50/50 rounded-md border-2 border-dashed border-gray-100">
                                <div className="w-20 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200 border border-gray-50 shadow-sm">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" /></svg>
                                </div>
                                <p className="text-10px font-semibold text-gray-600   italic">{t('search.noResults')}</p>
                                <button onClick={clearFilters} className="mt-8 text-brand-pink text-10px font-semibold   border-b-2 border-brand-pink/20 hover:border-brand-pink transition-all italic">{t('sidebar.reset')}</button>
                            </div>
                        )}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
