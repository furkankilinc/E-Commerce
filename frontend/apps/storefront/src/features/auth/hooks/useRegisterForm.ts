import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../shared/api/apiClient';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const useRegisterForm = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({
        email: '',
        password: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        setApiError('');
        setApiSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = { email: '', password: '' };
        let hasError = false;

        if (!formData.firstName.trim()) {
            newErrors.email = 'Adınız gereklidir.';
            hasError = true;
        }

        if (!formData.lastName.trim()) {
            newErrors.email = newErrors.email || 'Soyadınız gereklidir.';
            hasError = true;
        }

        if (!EMAIL_REGEX.test(formData.email)) {
            newErrors.email = newErrors.email || 'Geçerli bir e-posta adresi girin.';
            hasError = true;
        }

        if (!PASSWORD_REGEX.test(formData.password)) {
            newErrors.password = 'En az 8 karakter, harf ve rakam içermelidir.';
            hasError = true;
        }

        setErrors(newErrors);

        if (!hasError) {
            setIsLoading(true);
            setApiError('');
            setApiSuccess('');

            try {
                const res = await apiClient('/api/auth/user/register', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: `${formData.firstName} ${formData.lastName}`.trim(),
                        email: formData.email,
                        password: formData.password
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    setApiError(data.message || 'Kayıt başarısız oldu.');
                } else {
                    setApiSuccess('Hesabınız oluşturuldu! Yönlendiriliyorsunuz...');
                    setFormData({ firstName: '', lastName: '', email: '', password: '' });
                    setTimeout(() => navigate('/login'), 2000);
                }
            } catch (err) {
                setApiError('Ağ bağlantısı hatası. Lütfen daha sonra tekrar deneyin.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return {
        showPassword,
        setShowPassword,
        formData,
        errors,
        isLoading,
        apiError,
        apiSuccess,
        handleChange,
        handleSubmit
    };
};
