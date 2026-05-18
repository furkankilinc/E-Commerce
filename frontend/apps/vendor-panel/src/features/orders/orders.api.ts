import { apiClient } from '../../shared/api/apiClient';

export interface OrderItem {
    id: string;
    productId: string;
    product: {
        name: string;
        images: { url: string; isMain: boolean }[];
    };
    quantity: number;
    price: number;
    variantName?: string;
    variantValue?: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    totalAmount: number;
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
    items: OrderItem[];
}

export const ordersApi = {
    getOrders: async (page = 1, limit = 10, status?: string, search?: string, sort?: string) => {
        let url = `/api/merchant/orders?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (sort) url += `&sort=${sort}`;
        const res = await apiClient.get(url);
        return res.json();
    },

    getOrder: async (id: string) => {
        const res = await apiClient.get(`/api/merchant/orders/${id}`);
        return res.json();
    },

    updateStatus: async (id: string, status: string) => {
        const res = await apiClient.patch(`/api/merchant/orders/${id}/status`, { status });
        return res.json();
    }
};
