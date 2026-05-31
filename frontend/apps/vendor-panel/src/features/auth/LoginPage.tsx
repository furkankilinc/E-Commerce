import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './useAuth';

const VendorLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        setApiError('');
        setApiSuccess('');

        try {
            const res = await fetch('/api/auth/merchant/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setApiError(data.message || 'Giriş başarısız.');
            } else {
                setApiSuccess('Başarıyla giriş yapıldı!');
                login(data.accessToken, data.refreshToken, data.merchant);
                setTimeout(() => navigate('/dashboard'), 1000);
            }
        } catch (err) {
            setApiError('Bağlantı hatası. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white font-sans">
            {/* Left side - Branding & Image */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] p-12 flex-col justify-between text-white relative overflow-hidden">
                {/* Abstract background decorative elements */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-brand-pink/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 bg-brand-pink/5 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-brand-pink rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-semibold ">
                            Merchant.<span className="text-brand-pink font-extrabold ">Fuira</span>
                        </span>
                    </div>

                    <div className="mt-20 max-w-lg">
                        <h1 className="text-4xl font-semibold leading-tight mb-6   ">
                            Kurumsal Seviye<br />
                            Ticaret<br />
                            Altyapısı.
                        </h1>
                        <p className="text-lg text-slate-400 font-light leading-relaxed">
                            Küresel işlemleri yönetin, müşteri içgörülerini analiz edin ve profesyonel satıcı panelimizle iş operasyonlarınızı ölçeklendirin.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-pink" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>SOC2 Uyumlu</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-pink" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Uçtan Uca Şifreleme</span>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-left">
                        <h2 className="text-4xl font-semibold text-slate-900 mb-2">Tekrar Hoş Geldiniz</h2>
                        <p className="text-slate-500">Satıcı panelinize erişmek için lütfen bilgilerinizi girin.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {apiError && (
                            <div className="p-3 bg-red-50/50 border border-brand-pink/20 rounded-xl text-brand-pink text-sm font-semibold text-center">
                                {apiError}
                            </div>
                        )}
                        {apiSuccess && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm font-semibold text-center">
                                {apiSuccess}
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">E-Posta Adresi</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-pink transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="isim@sirket.com"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-slate-700">Şifre</label>
                                <a href="#" className="text-sm font-semibold text-brand-pink hover:text-brand-pink-hover transition-colors">Şifremi Unuttum?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-pink transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-pink text-white py-3 px-4 rounded-xl font-semibold text-lg hover:bg-brand-pink-hover transform active:scale-[0.98] transition-all shadow-lg shadow-brand-pink/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Giriş Yapılıyor...' : 'Panele Giriş Yap'}
                        </button>
                    </form>

                    <p className="text-center text-slate-600">
                        Platformda yeni misiniz? <Link to="/register" className="font-semibold text-brand-pink hover:text-brand-pink-hover transition-colors underline underline-offset-4">İşletmenizi kaydedin</Link>
                    </p>
                </div>

                <div className="mt-auto pt-8 flex gap-8 text-xs font-medium text-slate-400">
                    <a href="#" className="hover:text-slate-600 transition-colors">Gizlilik Politikası</a>
                    <a href="#" className="hover:text-slate-600 transition-colors">Hizmet Şartları</a>
                    <a href="#" className="hover:text-slate-600 transition-colors">Sistem Durumu</a>
                </div>
            </div>
        </div>
    );
};

export default VendorLoginPage;
