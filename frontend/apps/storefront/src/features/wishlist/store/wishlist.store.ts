import { useState, useEffect } from 'react';
import { apiClient } from '../../../shared/api/apiClient';
import { authStore } from '../../auth/auth.store';

const WISHLIST_STORAGE_KEY = 'fuira_wishlist_items';
const WISHLIST_ID_KEY = 'fuira_wishlist_id';

export interface WishlistItem {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category?: string;
    slug?: string;
}

const getWishlistId = (): string => {
    let id = localStorage.getItem(WISHLIST_ID_KEY);
    if (!id) {
        id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(WISHLIST_ID_KEY, id);
    }
    return id;
};

let wishlistItems: WishlistItem[] = (() => {
    try {
        const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
})();

const listeners = new Set<(items: WishlistItem[]) => void>();
let isFetchTriggered = false;

const notify = () => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
    listeners.forEach(listener => listener([...wishlistItems]));
};

const syncWithBackend = async (items: WishlistItem[]) => {
    if (!authStore.isAuthenticated()) return;
    try {
        await apiClient('/api/wishlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-wishlist-id': getWishlistId(),
            },
            body: JSON.stringify({ items }),
        });
    } catch (err) {
        console.error('Failed to sync wishlist with backend:', err);
    }
};

export const wishlistStore = {
    addItem: (product: any) => {
        const exists = wishlistItems.find(item => item.id === product.id);
        if (!exists) {
            wishlistItems = [
                ...wishlistItems,
                {
                    id: product.id,
                    name: product.name,
                    price: product.discountPrice ?? product.price,
                    originalPrice: product.discountPrice ? product.price : undefined,
                    image: (product.images?.find((img: any) => img.isMain) || product.images?.[0])?.url || '',
                    category: product.category?.name,
                    slug: product.slug,
                },
            ];
            notify();
            syncWithBackend(wishlistItems);
        }
    },

    removeItem: (id: string) => {
        wishlistItems = wishlistItems.filter(item => item.id !== id);
        notify();
        syncWithBackend(wishlistItems);
    },

    toggleItem: (product: any): boolean => {
        const exists = wishlistItems.find(item => item.id === product.id);
        if (exists) {
            wishlistStore.removeItem(product.id);
            return false;
        } else {
            wishlistStore.addItem(product);
            return true;
        }
    },

    isInWishlist: (id: string): boolean => {
        return wishlistItems.some(item => item.id === id);
    },

    clearWishlist: () => {
        wishlistItems = [];
        notify();
        syncWithBackend([]);
    },

    getItems: (): WishlistItem[] => [...wishlistItems],
    getCount: (): number => wishlistItems.length,

    fetchFromBackend: async () => {
        if (isFetchTriggered || !authStore.isAuthenticated()) return;
        isFetchTriggered = true;
        try {
            const res = await apiClient('/api/wishlist', {
                headers: { 'x-wishlist-id': getWishlistId() },
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    wishlistItems = data;
                    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
                    listeners.forEach(listener => listener([...wishlistItems]));
                }
            }
        } catch (err) {
            console.error('Failed to fetch wishlist from backend:', err);
        }
    },

    subscribe: (listener: (items: WishlistItem[]) => void) => {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    },
};

export const useWishlist = () => {
    const [items, setItems] = useState<WishlistItem[]>(wishlistStore.getItems());

    useEffect(() => {
        wishlistStore.fetchFromBackend();
        const unsubscribe = wishlistStore.subscribe(setItems);
        return () => unsubscribe();
    }, []);

    return {
        items,
        addItem: wishlistStore.addItem,
        removeItem: wishlistStore.removeItem,
        toggleItem: wishlistStore.toggleItem,
        isInWishlist: (id: string) => items.some(item => item.id === id),
        clearWishlist: wishlistStore.clearWishlist,
        itemCount: items.length,
    };
};
