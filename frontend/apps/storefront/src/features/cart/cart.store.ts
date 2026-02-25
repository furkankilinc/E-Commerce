import { useState, useEffect } from 'react';

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

const syncWithBackend = async (items: any[]) => {
    try {
        await fetch('/api/cart', {
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
        const existingItem = cartItems.find((item) => item.id === product.id && item.variant === variant);
        if (existingItem) {
            cartItems = cartItems.map((item) =>
                item.id === product.id && item.variant === variant
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        } else {
            cartItems = [
                ...cartItems,
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: (product.images?.find((img: any) => img.isMain) || product.images?.[0])?.url || '',
                    quantity: 1,
                    variant: variant,
                },
            ];
        }
        notify();
    },
    removeItem: (id: string, variant?: string) => {
        cartItems = cartItems.filter((item) => !(item.id === id && item.variant === variant));
        notify();
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
        try {
            const res = await fetch('/api/cart', {
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
        removeItem: cartStore.removeItem,
        decrementItem: cartStore.decrementItem,
        clearCart: cartStore.clearCart,
        itemCount: cartStore.getItemCount(),
        total: cartStore.getTotal(),
    };
};
