import { useState, useEffect } from 'react';
import { apiClient } from '../../shared/api/apiClient';
import { toast } from 'react-toastify';

const CART_STORAGE_KEY = 'fuira_cart_items';
const CART_ID_KEY = 'fuira_cart_id';

// Get or generate a unique cart ID for Redis storage
const getCartId = () => {
    let cartId = localStorage.getItem(CART_ID_KEY);
    if (!cartId) {
        cartId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(CART_ID_KEY, cartId);
    }
    return cartId;
};

let cartItems: any[] = (() => {
    try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
})();

const listeners = new Set<(items: any[]) => void>();
let isFetchTriggered = false;

const syncWithBackend = async (items: any[]) => {
    try {
        await apiClient('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cart-id': getCartId()
            },
            body: JSON.stringify({ items })
        });
    } catch (err) {
        console.error('Failed to sync cart with Redis:', err);
    }
};

const notify = () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    listeners.forEach((listener) => listener([...cartItems]));
    syncWithBackend(cartItems);
};

export const cartStore = {
    addItem: (product: any, variant?: string) => {
        const hasDiscount = product.discountPrice && product.discountPrice > 0;
        const finalPrice = hasDiscount ? product.discountPrice : product.price;
        const originalPrice = hasDiscount ? product.price : undefined;

        const existingItem = cartItems.find((item) => item.id === product.id && item.variant === variant);
        
        // Stock check
        const currentQty = existingItem ? existingItem.quantity : 0;
        if (product.stock !== undefined && currentQty >= product.stock) {
            toast.error(`Üzgünüz, bu üründen stokta sadece ${product.stock} adet var.`);
            return false;
        }

        if (existingItem) {
            cartItems = cartItems.map((item) =>
                item.id === product.id && item.variant === variant
                    ? { ...item, quantity: item.quantity + 1, price: finalPrice, originalPrice: originalPrice }
                    : item
            );
        } else {
            cartItems = [
                ...cartItems,
                {
                    id: product.id,
                    name: product.name,
                    price: finalPrice,
                    originalPrice: originalPrice,
                    image: (product.images?.find((img: any) => img.isMain) || product.images?.[0])?.url || '',
                    quantity: 1,
                    variant: variant,
                    stock: product.stock // Keep stock info for further checks
                },
            ];
        }
        notify();
        return true;
    },
    removeItem: (id: string, variant?: string) => {
        cartItems = cartItems.filter((item) => !(item.id === id && item.variant === variant));
        notify();
    },
    incrementItem: (id: string, variant?: string) => {
        const item = cartItems.find((i) => i.id === id && i.variant === variant);
        if (item) {
            if (item.stock !== undefined && item.quantity >= item.stock) {
                toast.error(`Üzgünüz, bu üründen stokta sadece ${item.stock} adet var.`);
                return;
            }
            cartItems = cartItems.map((i) =>
                i.id === id && i.variant === variant
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
            );
            notify();
        }
    },
    decrementItem: (id: string, variant?: string) => {
        const existingItem = cartItems.find((item) => item.id === id && item.variant === variant);
        if (existingItem) {
            if (existingItem.quantity > 1) {
                cartItems = cartItems.map((item) =>
                    item.id === id && item.variant === variant
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
            } else {
                cartItems = cartItems.filter((item) => !(item.id === id && item.variant === variant));
            }
            notify();
        }
    },
    clearCart: () => {
        cartItems = [];
        notify();
    },
    fetchFromBackend: async () => {
        if (isFetchTriggered) return;
        isFetchTriggered = true;
        try {
            const res = await apiClient('/api/cart', {
                headers: { 'x-cart-id': getCartId() }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    cartItems = data;
                    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
                    listeners.forEach((listener) => listener([...cartItems]));
                }
            }
        } catch (err) {
            console.error('Failed to fetch cart from Redis:', err);
        }
    },
    getItems: () => [...cartItems],
    getItemCount: () => cartItems.reduce((count, item) => count + item.quantity, 0),
    getTotal: () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    subscribe: (listener: (items: any[]) => void) => {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    },
};

export const useCart = () => {
    const [items, setItems] = useState(cartStore.getItems());

    useEffect(() => {
        cartStore.fetchFromBackend();
        const unsubscribe = cartStore.subscribe(setItems);
        return () => unsubscribe();
    }, []);

    return {
        items,
        addItem: cartStore.addItem,
        incrementItem: cartStore.incrementItem,
        removeItem: cartStore.removeItem,
        decrementItem: cartStore.decrementItem,
        clearCart: cartStore.clearCart,
        itemCount: cartStore.getItemCount(),
        total: cartStore.getTotal(),
    };
};
