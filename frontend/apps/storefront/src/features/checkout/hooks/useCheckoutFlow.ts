import { useEffect } from 'react';
import { useCheckout } from '../checkout.store';
import { useCart } from '../../cart/cart.store';
import { authStore } from '../../auth/auth.store';
import { toast } from 'react-toastify';

export const useCheckoutFlow = () => {
    const checkout = useCheckout();
    const { items, total, clearCart, refreshCart } = useCart();

    useEffect(() => {
        refreshCart();
    }, []);

    const validateStep = () => {
        if (checkout.step === 'address') {
            const { fullName, email, phone, address, city, district, neighborhood, zipCode } = checkout.shippingAddress;
            if (!fullName || !email || !phone || !address || !city || !district || !neighborhood || !zipCode) {
                toast.error('Lütfen tüm zorunlu alanları doldurun.');
                return false;
            }
            if (!email.includes('@')) {
                toast.error('Lütfen geçerli bir e-posta adresi girin.');
                return false;
            }
        } else if (checkout.step === 'payment') {
            const { number, holder, expiry, cvv } = checkout.cardDetails;
            if (!number || !holder || !expiry || !cvv) {
                toast.error('Lütfen tüm kart bilgilerini doldurun.');
                return false;
            }
            if (number.length < 16) {
                toast.error('Geçerli bir kart numarası girin.');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep()) return;

        if (checkout.step === 'review') {
            handlePlaceOrder();
        } else {
            checkout.nextStep();
        }
    };

    const handlePlaceOrder = async () => {
        if (!authStore.isAuthenticated()) {
            toast.error('Sipariş verebilmek için lütfen giriş yapın.');
            return;
        }
        const result = await checkout.placeOrder(items);
        if (result.success) {
            clearCart();
            toast.success('Siparişiniz başarıyla alındı!');
        } else {
            toast.error(result.message || 'Sipariş oluşturulurken bir hata oluştu.');
        }
    };

    return {
        checkout,
        items,
        total,
        handleNext
    };
};
