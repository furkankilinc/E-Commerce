import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { toast } from 'react-toastify';

export const useProfileLogic = (tabName?: string) => {
    const { user, logout, isAuthenticated, token } = useAuth();
    const [activeTab, setActiveTab] = useState(tabName || 'settings');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const formatPhoneNumber = (value: string) => {
        const digits = value.replace(/\D/g, '');
        let cleaned = digits;
        if (cleaned.startsWith('90')) cleaned = cleaned.substring(2);
        else if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
        cleaned = cleaned.substring(0, 10);

        let formatted = '+90';
        if (cleaned.length > 0) {
            formatted += ' (' + cleaned.substring(0, 3);
            if (cleaned.length >= 3) formatted += ')';
        }
        if (cleaned.length > 3) formatted += ' ' + cleaned.substring(3, 6);
        if (cleaned.length > 6) formatted += ' ' + cleaned.substring(6, 8);
        if (cleaned.length > 8) formatted += ' ' + cleaned.substring(8, 10);
        return formatted;
    };

    useEffect(() => {
        if (tabName) setActiveTab(tabName);
    }, [tabName]);

    useEffect(() => {
        if (user) {
            const names = user.name ? user.name.trim().split(' ') : ['', ''];
            setFormData({
                firstName: user.firstName || names[0] || '',
                lastName: user.lastName || (names.length > 1 ? names.slice(1).join(' ') : '') || '',
                email: user.email || '',
                phone: user.phone ? formatPhoneNumber(user.phone) : '+90'
            });
        }
    }, [user]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setFormData({ ...formData, phone: formatted });
    };

    const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (formData.phone === '+90' && (e.key === 'Backspace' || e.key === 'Delete')) {
            e.preventDefault();
        }
    };

    const handleSaveProfile = async () => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const phoneRegex = /^(\+90|0)?\s?(\(?\d{3}\)?)\s?\d{3}\s?\d{2}\s?\d{2}$|^(\+90|0)?5[0-9]{9}$/;

        if (!formData.email || !emailRegex.test(formData.email)) {
            toast.error('Lütfen geçerli bir e-posta adresi girin.');
            return;
        }

        const effectivePhone = formData.phone === '+90' ? '' : formData.phone;
        const currentPhone = user?.phone || '';

        if (effectivePhone && !phoneRegex.test(effectivePhone)) {
            toast.error('Lütfen geçerli bir telefon numarası girin.');
            return;
        }

        const emailChanged = formData.email !== user?.email;
        const phoneChanged = effectivePhone !== currentPhone;

        if (emailChanged || phoneChanged) {
            setIsVerifying(true);
            return;
        }
    };

    const confirmVerification = async () => {
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: formData.email,
                    phone: formData.phone === '+90' ? '' : formData.phone
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Bilgileriniz başarıyla doğrulandı ve güncellendi! 😎');
                setIsVerifying(false);
                setVerificationCode('');
            } else {
                toast.error(data.message || 'Güncelleme başarısız oldu.');
            }
        } catch (err) {
            toast.error('Bağlantı hatası.');
        }
    };

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error('Lütfen tüm alanları doldurun.');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Şifreler uyuşmuyor!');
            return;
        }

        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Şifreniz başarıyla değiştirildi! 🔐');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.error(data.message || 'Hata oluştu.');
            }
        } catch (err) {
            toast.error('Bağlantı hatası.');
        }
    };

    return {
        isAuthenticated,
        activeTab,
        setActiveTab,
        isVerifying,
        setIsVerifying,
        verificationCode,
        setVerificationCode,
        formData,
        setFormData,
        passwordData,
        setPasswordData,
        handlePhoneChange,
        handlePhoneKeyDown,
        handleSaveProfile,
        confirmVerification,
        handlePasswordChange,
        logout
    };
};
