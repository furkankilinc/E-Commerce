import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../shared/api/apiClient';
import { useToast } from '../../shared/components/Toast';

let CART_STORAGE_KEY = 'fuira_cart_items_guest';
let CART_ID_KEY = 'fuira_cart_id_guest';

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
    setUserId: (userId: string | null) => {
        CART_STORAGE_KEY = userId ? `fuira_cart_items_${userId}` : 'fuira_cart_items_guest';
        CART_ID_KEY = userId ? `fuira_cart_id_${userId}` : 'fuira_cart_id_guest';
        
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            cartItems = saved ? JSON.parse(saved) : [];
        } catch (e) {
            cartItems = [];
        }
        isFetchTriggered = false; // Allow fresh fetch from backend
        notify();
        if (userId) {
            cartStore.fetchFromBackend();
        }
    },
    addItem: (product: any, variant?: string) => {
        const hasDiscount = product.discountPrice && product.discountPrice > 0;
        const finalPrice = hasDiscount ? product.discountPrice : product.price;
        const originalPrice = hasDiscount ? product.price : undefined;

        const existingItem = cartItems.find((item) => item.id === product.id && item.variant === variant);
        const currentQty = existingItem ? existingItem.quantity : 0;
        
        // Solid stock boundary check
        if (product.stock !== undefined && currentQty >= product.stock) {
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
                    stock: product.stock, // Keep stock info for further checks
                    merchantId: product.merchantId || product.merchant?.id || ''
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
                return false;
            }
            cartItems = cartItems.map((i) =>
                i.id === id && i.variant === variant
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
            );
            notify();
            return true;
        }
        return false;
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
    refreshCart: async () => {
        if (cartItems.length === 0) return { hasChanges: false, removedItems: [], adjustedItems: [] };
        let hasChanges = false;
        const validItems = [];
        const removedItems: string[] = [];
        const adjustedItems: { name: string; oldQty: number; newQty: number }[] = [];

        for (const item of cartItems) {
            try {
                const res = await apiClient(`/api/products/${item.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const product = data.product || data;
                    if (product && product.status === 'PUBLISHED') {
                        const hasDiscount = product.discountPrice && product.discountPrice > 0;
                        const newPrice = hasDiscount ? product.discountPrice : product.price;
                        const newOriginalPrice = hasDiscount ? product.price : undefined;

                        if (product.stock === 0) {
                            hasChanges = true;
                            removedItems.push(item.name);
                        } else if (item.quantity > product.stock) {
                            hasChanges = true;
                            adjustedItems.push({ name: item.name, oldQty: item.quantity, newQty: product.stock });
                            validItems.push({ 
                                ...item, 
                                price: newPrice, 
                                originalPrice: newOriginalPrice, 
                                stock: product.stock,
                                quantity: product.stock 
                            });
                        } else {
                            if (item.price !== newPrice || item.originalPrice !== newOriginalPrice || item.stock !== product.stock) {
                                hasChanges = true;
                                validItems.push({ ...item, price: newPrice, originalPrice: newOriginalPrice, stock: product.stock });
                            } else {
                                validItems.push(item);
                            }
                        }
                    } else {
                        hasChanges = true; // Ürün yayından kalkmış
                        removedItems.push(item.name);
                    }
                } else {
                    hasChanges = true; // Ürün bulunamadı
                    removedItems.push(item.name);
                }
            } catch (err) {
                validItems.push(item); // Ağ hatasında sepetten silme
            }
        }

        if (hasChanges) {
            cartItems = validItems;
            notify();
        }
        return { hasChanges, removedItems, adjustedItems };
    },
    getItems: () => [...cartItems],
    getItemCount: () => cartItems.reduce((count, item) => count + item.quantity, 0),
    getTotal: () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    subscribe: (listener: (items: any[]) => void) => {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    },
};

// Module-level toast lock to prevent concurrent duplicate notifications within 1.5 seconds
let lastRefreshToastTime = 0;

export const useCart = () => {
    const [items, setItems] = useState(cartStore.getItems());
    const toast = useToast();

    useEffect(() => {
        cartStore.fetchFromBackend();
        const unsubscribe = cartStore.subscribe(setItems);
        return () => unsubscribe();
    }, []);

    const wrappedAddItem = useCallback((product: any, variant?: string) => {
        const existingItem = cartStore.getItems().find((item) => item.id === product.id && item.variant === variant);
        const currentQty = existingItem ? existingItem.quantity : 0;
        if (product.stock !== undefined && currentQty >= product.stock) {
            toast.error(`Üzgünüz, bu üründen stokta sadece ${product.stock} adet var.`);
            return false;
        }
        return cartStore.addItem(product, variant);
    }, [toast]);

    const wrappedIncrementItem = useCallback((id: string, variant?: string) => {
        const item = cartStore.getItems().find((i) => i.id === id && i.variant === variant);
        if (item) {
            if (item.stock !== undefined && item.quantity >= item.stock) {
                toast.error(`Üzgünüz, bu üründen stokta sadece ${item.stock} adet var.`);
                return false;
            }
            return cartStore.incrementItem(id, variant);
        }
        return false;
    }, [toast]);

    const wrappedRefreshCart = useCallback(async () => {
        const result = await cartStore.refreshCart();
        if (result.hasChanges) {
            const now = Date.now();
            if (now - lastRefreshToastTime > 1500) {
                lastRefreshToastTime = now;
                if (result.removedItems.length > 0) {
                    toast.warning(`Stokta kalmayan şu ürünler sepetinizden çıkarıldı: ${result.removedItems.join(', ')}`);
                }
                if (result.adjustedItems.length > 0) {
                    result.adjustedItems.forEach((adj: any) => {
                        toast.info(`Stok yetersizliği nedeniyle "${adj.name}" miktarı ${adj.newQty} adet olarak güncellendi.`);
                    });
                }
                if (result.removedItems.length === 0 && result.adjustedItems.length === 0) {
                    toast.info('Sepetinizdeki bazı ürünlerin fiyat veya stok durumları güncellendi.');
                }
            }
        }
        return result.hasChanges;
    }, [toast]);

    return {
        items,
        addItem: wrappedAddItem,
        incrementItem: wrappedIncrementItem,
        removeItem: cartStore.removeItem,
        decrementItem: cartStore.decrementItem,
        clearCart: cartStore.clearCart,
        refreshCart: wrappedRefreshCart,
        itemCount: cartStore.getItemCount(),
        total: cartStore.getTotal(),
    };
};
