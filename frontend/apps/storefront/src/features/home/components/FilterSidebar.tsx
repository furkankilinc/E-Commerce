import React, { useCallback } from 'react';
import { FilterMeta, FilterState } from '../home.types';
import { useTranslation } from '../../../shared/i18n/I18nContext';

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
                className={`w-full flex items-center justify-between px-5 py-3 rounded-md text-10px font-semibold    transition-all group ${isSelected ? 'bg-brand-pink text-white  shadow-brand-pink/20' : activeChildBranch ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
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

const CategorySkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-10 bg-gray-50 rounded-md animate-pulse" />
        ))}
    </div>
);

interface FilterSidebarProps {
    isMobileFiltersOpen: boolean;
    setIsMobileFiltersOpen: (open: boolean) => void;
    localSearch: string;
    setLocalSearch: (search: string) => void;
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    collapsedSections: Record<string, boolean>;
    toggleSection: (name: string) => void;
    meta: FilterMeta | null;
    isMetaLoading: boolean;
    updateCategory: (slug: string) => void;
    toggleVariant: (name: string, value: string) => void;
    toggleMerchant: (id: string) => void;
    clearFilters: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
    isMobileFiltersOpen,
    setIsMobileFiltersOpen,
    localSearch,
    setLocalSearch,
    filters,
    setFilters,
    collapsedSections,
    toggleSection,
    meta,
    isMetaLoading,
    updateCategory,
    toggleVariant,
    toggleMerchant,
    clearFilters
}) => {
    const { t } = useTranslation();
    return (
        <aside className={`
            fixed lg:sticky top-0 lg:top-24 left-0 w-[75%] sm:w-72 lg:w-64 h-full lg:h-auto 
            bg-white lg:bg-transparent z-[100] lg:z-0 p-8 lg:p-0
            transition-transform duration-500 ease-in-out lg:transition-none
            ${isMobileFiltersOpen ? 'translate-x-0 shadow-xl overflow-y-auto' : '-translate-x-full lg:translate-x-0'}
            flex-shrink-0
        `}>
            <div className="flex flex-col gap-6">
                <div className="lg:hidden flex items-center justify-between pb-6 border-b-2 border-gray-50">
                    <h2 className="text-xl font-semibold text-gray-900  ">{t('sidebar.filters')}</h2>
                    <button aria-label={t('sidebar.filters')} onClick={() => setIsMobileFiltersOpen(false)} className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
                    </button>
                </div>

                <div className="relative">
                    <input
                        aria-label={t('sidebar.search')}
                        type="text"
                        placeholder={t('sidebar.searchPlaceholder')}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-full py-2 pl-12 pr-6 bg-gray-50 rounded-md text-caption font-semibold  focus:bg-white border-2 border-transparent focus:border-brand-pink outline-none transition-all placeholder:text-gray-300"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="3" /></svg>
                </div>

                <div>
                    <button onClick={() => toggleSection('category')} className="w-full flex items-center justify-between text-10px font-semibold text-gray-500   mb-4  hover:text-gray-900 transition-colors">
                        {t('sidebar.category')}
                        <svg className={`w-4 h-4 transform transition-transform ${collapsedSections['category'] ? '-rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg>
                    </button>
                    {!collapsedSections['category'] && (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar min-h-[350px]">
                            {!meta ? <CategorySkeleton /> : (
                                <>
                                    <button
                                        onClick={() => updateCategory('')}
                                        className={`w-full flex items-center justify-between px-5 py-3 rounded-md text-10px font-semibold    transition-all ${!filters.category ? 'bg-gray-900 text-white ' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {t('sidebar.all')}
                                    </button>
                                    {meta?.categories?.filter(c => c.parentId === null).map(cat => (
                                        <CategoryItem key={cat.id} category={cat} allCategories={meta.categories} selectedSlug={filters.category} onSelect={updateCategory} />
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="py-2">
                    <div role="heading" aria-level={2} className="text-10px font-semibold text-gray-500   mb-4 ">{t('sidebar.priceRange')}</div>
                    <div className="flex gap-4">
                        <div className="flex-1 bg-white border border-gray-50 p-4 rounded-md shadow-xs py-2 flex flex-col justify-center">
                            <span className="text-micro font-semibold text-gray-500  block mb-1 leading-none">{t('sidebar.min')}</span>
                            <input aria-label={t('sidebar.min')} type="number" value={filters.minPrice} onChange={e => setFilters(prev => ({ ...prev, minPrice: e.target.value }))} className="bg-transparent w-full outline-none text-xs font-semibold text-gray-900  h-5 leading-none no-spinner" />
                        </div>
                        <div className="flex-1 bg-white border border-gray-50 p-4 rounded-md shadow-xs py-2 flex flex-col justify-center">
                            <span className="text-micro font-semibold text-gray-500  block mb-1 leading-none">{t('sidebar.max')}</span>
                            <input aria-label={t('sidebar.max')} type="number" value={filters.maxPrice} onChange={e => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))} className="bg-transparent w-full outline-none text-xs font-semibold text-gray-900  h-5 leading-none no-spinner" />
                        </div>
                    </div>
                </div>

                <div className={`relative flex flex-col gap-6 transition-opacity duration-300 ${isMetaLoading ? 'opacity-40' : 'opacity-100'}`}>
                    {isMetaLoading && <div className="absolute top-0 right-0 w-4 h-4 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />}
                    {meta && meta.variants && Object.entries(meta.variants).map(([name, values]) => {
                        const label = name === 'Color' ? t('sidebar.color') : name === 'Size' ? t('sidebar.size') : name;
                        const isColorFilter = name === 'Color' || name.toLowerCase() === 'renk' || name.toLowerCase() === 'color';
                        return (
                            <div key={name} className="animate-in fade-in slide-in-from-top-2">
                                <button onClick={() => toggleSection(name)} className="w-full flex items-center justify-between text-10px font-semibold text-gray-500   mb-6 ">
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
                                                    className={`w-8 h-8 rounded-full border-2 transition-all transform ${filters.selectedVariants[name]?.includes(val) ? 'border-brand-pink ring-4 ring-brand-pink/10 shadow-lg' : 'border-gray-100'}`}
                                                    style={{ backgroundColor: val.toLowerCase() }}
                                                />
                                            ) : (
                                                <label key={val} className="flex items-center group cursor-pointer">
                                                    <div className="relative">
                                                        <input type="checkbox" checked={filters.selectedVariants[name]?.includes(val) || false} onChange={() => toggleVariant(name, val)} className="w-5 h-5 border-2 border-gray-200 rounded-md appearance-none checked:bg-brand-pink checked:border-brand-pink cursor-pointer transition-all" />
                                                        {filters.selectedVariants[name]?.includes(val) && <svg className="absolute w-3.5 h-3.5 text-white left-0.5 top-0.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                                    </div>
                                                    <span className="ml-3 text-caption font-semibold text-gray-500 group-hover:text-gray-900 transition-colors  ">{val}</span>
                                                </label>
                                            )
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div>
                        <button onClick={() => toggleSection('merchants')} className="w-full flex items-center justify-between text-10px font-semibold text-gray-500   mb-4 ">
                            {t('sidebar.merchants')}
                            <svg className={`w-4 h-4 transform transition-transform ${collapsedSections['merchants'] ? '-rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg>
                        </button>
                        {!collapsedSections['merchants'] && (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {meta?.merchants?.filter((m: any) => m.companyName.toLowerCase().includes(localSearch.toLowerCase())).map((m: any) => (
                                    <label key={m.id} className="flex items-center group cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" checked={filters.merchants.includes(m.id)} onChange={() => toggleMerchant(m.id)} className="w-5 h-5 border-2 border-gray-200 rounded-md appearance-none checked:bg-brand-pink checked:border-brand-pink cursor-pointer transition-all" />
                                            {filters.merchants.includes(m.id) && <svg className="absolute w-3.5 h-3.5 text-white left-0.5 top-0.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </div>
                                        <span className="ml-3 text-caption font-semibold text-gray-500 group-hover:text-gray-900 transition-colors  ">{m.companyName}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <button onClick={clearFilters} className="w-full py-4 bg-gray-50 text-gray-500 rounded-md text-caption font-semibold    hover:bg-brand-pink hover:text-white transition-all shadow-sm">{t('sidebar.reset')}</button>
                </div>
            </div>
        </aside>
    );
};

export default FilterSidebar;
