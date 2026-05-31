import { useState, useEffect } from 'react';

const COLLECTIONS_STORAGE_KEY = 'fuira_collections';
const COLLECTIONS_ID_KEY = 'fuira_collections_id';

export interface CollectionItem {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category?: string;
    slug?: string;
    addedAt?: string;
}

export interface Collection {
    id: string;
    name: string;
    emoji: string;
    items: CollectionItem[];
    createdAt: string;
}

const getCollectionsId = (): string => {
    let id = localStorage.getItem(COLLECTIONS_ID_KEY);
    if (!id) {
        id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(COLLECTIONS_ID_KEY, id);
    }
    return id;
};

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-collections-id': getCollectionsId(),
});

let collections: Collection[] = (() => {
    try {
        const saved = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
            return parsed.filter(c => c && c.id && c.id !== 'undefined');
        }
        return [];
    } catch {
        return [];
    }
})();

const listeners = new Set<(c: Collection[]) => void>();

const notify = () => {
    localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
    listeners.forEach(l => l([...collections]));
};

export const collectionsStore = {

    getAll: (): Collection[] => [...collections],

    subscribe: (listener: (c: Collection[]) => void) => {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    },

    fetchFromBackend: async () => {
        try {
            const res = await fetch('/api/collections', { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                // Only overwrite if backend returned valid collection list to avoid wiping out LocalStorage with mock []
                if (Array.isArray(data) && data.length > 0 && data.every(c => c.id)) {
                    collections = data.map(c => ({
                        id: c.id,
                        name: c.name || 'İsimsiz Koleksiyon',
                        emoji: c.emoji || '📦',
                        items: c.items || [],
                        createdAt: c.createdAt || new Date().toISOString()
                    }));
                    localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
                    listeners.forEach(l => l([...collections]));
                }
            }
        } catch (err) {
            console.error('Failed to fetch collections:', err);
        }
    },

    create: async (name: string, emoji: string = '📦'): Promise<Collection | null> => {
        const generatedCol: Collection = {
            id: 'col_' + Math.random().toString(36).substring(2, 9),
            name,
            emoji,
            items: [],
            createdAt: new Date().toISOString()
        };

        try {
            await fetch('/api/collections', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ name, emoji }),
            });
        } catch (err) {
            console.error('Failed to create collection on backend:', err);
        }

        // Always keep and return valid frontend-generated collection with real fields
        collections = [...collections, generatedCol];
        notify();
        return generatedCol;
    },

    rename: async (collectionId: string, name: string, emoji?: string) => {
        try {
            await fetch(`/api/collections/${collectionId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ name, emoji }),
            });
        } catch (err) {
            console.error('Failed to rename collection:', err);
        }

        // Always update local state immediately
        collections = collections.map(c =>
            c.id === collectionId
                ? { ...c, name, ...(emoji ? { emoji } : {}) }
                : c
        );
        notify();
    },

    delete: async (collectionId: string) => {
        try {
            await fetch(`/api/collections/${collectionId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
        } catch (err) {
            console.error('Failed to delete collection:', err);
        }

        // Always update local state immediately
        collections = collections.filter(c => c.id !== collectionId);
        notify();
    },

    addItem: async (collectionId: string, product: any) => {
        const item: CollectionItem = {
            id: product.id,
            name: product.name,
            price: product.discountPrice ?? product.price,
            originalPrice: product.discountPrice ? product.price : undefined,
            image: (product.images?.find((img: any) => img.isMain) || product.images?.[0])?.url || '',
            category: product.category?.name,
            slug: product.slug,
        };

        try {
            await fetch(`/api/collections/${collectionId}/items`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ product: item }),
            });
        } catch (err) {
            console.error('Failed to add item to collection on backend:', err);
        }

        // Always update local state immediately
        collections = collections.map(c => {
            if (c.id === collectionId) {
                const currentItems = c.items || [];
                if (!currentItems.find(i => i.id === item.id)) {
                    return { ...c, items: [...currentItems, { ...item, addedAt: new Date().toISOString() }] };
                }
            }
            return c;
        });
        notify();
    },

    removeItem: async (collectionId: string, productId: string) => {
        try {
            await fetch(`/api/collections/${collectionId}/items/${productId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
        } catch (err) {
            console.error('Failed to remove item from collection on backend:', err);
        }

        // Always update local state immediately
        collections = collections.map(c =>
            c.id === collectionId
                ? { ...c, items: (c.items || []).filter(i => i.id !== productId) }
                : c
            );
        notify();
    },

    isInCollection: (collectionId: string, productId: string): boolean => {
        const col = collections.find(c => c.id === collectionId);
        return col ? (col.items || []).some(i => i.id === productId) : false;
    },

    getProductCollections: (productId: string): Collection[] => {
        return collections.filter(c => (c.items || []).some(i => i.id === productId));
    },
};

export const useCollections = () => {
    const [cols, setCols] = useState<Collection[]>(collectionsStore.getAll());

    useEffect(() => {
        collectionsStore.fetchFromBackend();
        const unsub = collectionsStore.subscribe(setCols);
        return () => unsub();
    }, []);

    return {
        collections: cols,
        create: collectionsStore.create,
        rename: collectionsStore.rename,
        delete: collectionsStore.delete,
        addItem: collectionsStore.addItem,
        removeItem: collectionsStore.removeItem,
        isInCollection: collectionsStore.isInCollection,
        getProductCollections: collectionsStore.getProductCollections,
    };
};
