import { useState } from 'react';
import { apiClient } from '../../shared/api/apiClient';

export interface Address {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
}

export interface CardDetails {
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
}

export interface CheckoutState {
    step: 'address' | 'shipping' | 'payment' | 'review' | 'success';
    shippingAddress: Address;
    billingAddress: Address;
    isBillingSameAsShipping: boolean;
    shippingMethod: string;
    paymentMethod: string;
    cardDetails: CardDetails;
    isProcessing: boolean;
    orderSuccess: any | null;
}

const initialAddress: Address = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'Türkiye'
};

const initialCard: CardDetails = {
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
};

export const useCheckout = () => {
    const [state, setState] = useState<CheckoutState>({
        step: 'address',
        shippingAddress: { ...initialAddress },
        billingAddress: { ...initialAddress },
        isBillingSameAsShipping: true,
        shippingMethod: 'standard',
        paymentMethod: 'credit_card',
        cardDetails: { ...initialCard },
        isProcessing: false,
        orderSuccess: null
    });

    const updateShippingAddress = (address: Partial<Address>) => {
        setState(prev => ({
            ...prev,
            shippingAddress: { ...prev.shippingAddress, ...address }
        }));
    };

    const updateBillingAddress = (address: Partial<Address>) => {
        setState(prev => ({
            ...prev,
            billingAddress: { ...prev.billingAddress, ...address }
        }));
    };

    const toggleBillingSame = () => {
        setState(prev => ({
            ...prev,
            isBillingSameAsShipping: !prev.isBillingSameAsShipping
        }));
    };

    const nextStep = () => {
        const steps: CheckoutState['step'][] = ['address', 'shipping', 'payment', 'review', 'success'];
        const currentIndex = steps.indexOf(state.step);
        if (currentIndex < steps.length - 1) {
            setState(prev => ({ ...prev, step: steps[currentIndex + 1] }));
        }
    };

    const prevStep = () => {
        const steps: CheckoutState['step'][] = ['address', 'shipping', 'payment', 'review', 'success'];
        const currentIndex = steps.indexOf(state.step);
        if (currentIndex > 0) {
            setState(prev => ({ ...prev, step: steps[currentIndex - 1] }));
        }
    };

    const placeOrder = async (cartItems: any[]) => {
        setState(prev => ({ ...prev, isProcessing: true }));
        try {
            const res = await apiClient('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shippingAddress: state.shippingAddress,
                    billingAddress: state.isBillingSameAsShipping ? state.shippingAddress : state.billingAddress,
                    paymentMethod: state.paymentMethod,
                    items: cartItems
                })
            });

            const data = await res.json();

            if (data.success) {
                setState(prev => ({ ...prev, step: 'success', orderSuccess: data.order, isProcessing: false }));
                return { success: true };
            } else {
                throw new Error(data.message || 'Sipariş oluşturulamadı.');
            }
        } catch (err: any) {
            console.error('Order placement failed:', err);
            setState(prev => ({ ...prev, isProcessing: false }));
            return { success: false, message: err.message || 'Sipariş oluşturulurken beklenmeyen bir hata oluştu.' };
        }
    };

    const updateCardDetails = (details: Partial<CardDetails>) => {
        setState(prev => ({
            ...prev,
            cardDetails: { ...prev.cardDetails, ...details }
        }));
    };

    return {
        ...state,
        updateShippingAddress,
        updateBillingAddress,
        updateCardDetails,
        toggleBillingSame,
        nextStep,
        prevStep,
        placeOrder,
        setStep: (step: CheckoutState['step']) => setState(prev => ({ ...prev, step })),
        setPaymentMethod: (method: string) => setState(prev => ({ ...prev, paymentMethod: method })),
        setShippingMethod: (method: string) => setState(prev => ({ ...prev, shippingMethod: method }))
    };
};
