import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { apiClient } from '../../../shared/api/apiClient';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const useLoginForm = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({
        email: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors.email && name === 'email') {
            setErrors({ email: '' });
        }
        setApiError('');
        setApiSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!EMAIL_REGEX.test(formData.email)) {
            setErrors({ email: 'Lütfen geçerli bir e-posta adresi girin.' });
            return;
        }

        setIsLoading(true);
        setApiError('');
        setApiSuccess('');

        try {
            const res = await apiClient('/api/auth/user/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setApiError(data.message || 'Giriş başarısız oldu.');
            } else {
                setApiSuccess('Başarıyla giriş yapıldı!');
                login(data.accessToken, data.user, data.refreshToken);
                setTimeout(() => navigate('/'), 1000);
            }
        } catch (err) {
            setApiError('Ağ bağlantısı hatası. Lütfen daha sonra tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        showPassword,
        setShowPassword,
        rememberMe,
        setRememberMe,
        formData,
        errors,
        isLoading,
        apiError,
        apiSuccess,
        handleChange,
        handleSubmit
    };
};
