export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    merchant: { id: string; companyName: string };
    category: { name: string; slug: string };
    images: { url: string; isMain: boolean }[];
    rating: number;
    reviewCount: number;
    discountPrice?: number;
    isOnSale?: boolean;
    stock: number;
    metadata?: any;
}

export interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface FilterMeta {
    categories: { id: string; name: string; slug: string; parentId: string | null }[];
    merchants: { id: string; companyName: string }[];
    priceRange: { min: number; max: number };
    variants: Record<string, string[]>;
}

export interface FilterState {
    search: string;
    category: string;
    minPrice: string;
    maxPrice: string;
    rating: number;
    merchants: string[];
    selectedVariants: Record<string, string[]>;
    sort: string;
    filterSearch: string;
}
