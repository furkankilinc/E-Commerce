import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiClient } from '../../../shared/api/apiClient';
import { useAuth } from '../../auth/useAuth';

export const useOrderDetail = (id: string | undefined) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);

    const fetchOrder = async () => {
        try {
            const res = await apiClient(`/api/orders/${id}`);
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
            } else {
                toast.error(data.message || 'Sipariş bulunamadı.');
                navigate('/profile/orders');
            }
        } catch (err) {
            toast.error('Sipariş yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (id) fetchOrder();
    }, [id, isAuthenticated]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'text-amber-500 bg-amber-50';
            case 'PROCESSING': return 'text-indigo-500 bg-indigo-50';
            case 'SHIPPED': return 'text-blue-500 bg-blue-50';
            case 'DELIVERED': return 'text-emerald-500 bg-emerald-50';
            case 'CANCELLED': return 'text-rose-500 bg-rose-50';
            default: return 'text-gray-500 bg-gray-50';
        }
    };

    const getStatusText = (status: string) => {
        switch(status) {
            case 'PENDING': return 'BEKLİYOR';
            case 'PROCESSING': return 'HAZIRLANIYOR';
            case 'SHIPPED': return 'KARGODA';
            case 'DELIVERED': return 'TESLİM EDİLDİ';
            case 'CANCELLED': return 'İPTAL EDİLDİ';
            default: return status;
        }
    };

    return {
        order,
        loading,
        reviewingItemId,
        setReviewingItemId,
        fetchOrder,
        getStatusColor,
        getStatusText
    };
};
