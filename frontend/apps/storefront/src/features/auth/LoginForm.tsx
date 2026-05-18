import React from 'react';
import { Link } from 'react-router-dom';
import { useLoginForm } from './hooks/useLoginForm';

const LoginForm: React.FC = () => {
    const {
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
    } = useLoginForm();

    return (
        <div className="w-full max-w-[480px] bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100/50">
            {/* Header */}
            <div className="mb-5 text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tighter text-gray-900 ">
                    Hoş <span className="italic text-brand-pink underline underline-offset-[6px] decoration-gray-900/5">Geldin</span>
                </h2>
                <p className="text-gray-400 text-xs md:text-sm font-medium px-4">
                    Keşfet, favorilerini listele ve özel indirimleri kaçırma.
                </p>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
                {apiError && (
                    <div className="p-3 bg-red-50/50 border border-brand-pink/20 rounded-xl text-brand-pink text-xs font-bold text-center">
                        {apiError}
                    </div>
                )}
                {apiSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs font-bold text-center">
                        {apiSuccess}
                    </div>
                )}
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-10px font-bold text-gray-400  tracking-widest ml-1">
                        E-Posta Adresi
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@mail.com"
                        required
                        className={`w-full p-4 rounded-xl border ${errors.email ? 'border-brand-pink bg-red-50/20' : 'border-gray-50 bg-gray-50/50'} text-gray-900 text-sm focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 outline-none transition-all placeholder:text-gray-300 font-medium`}
                    />
                    {errors.email && <p className="text-9px font-semibold text-brand-pink  tracking-tighter ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-10px font-bold text-gray-400  tracking-widest">
                            Şifre
                        </label>
                        <a href="#" className="text-10px font-semibold text-gray-300 hover:text-brand-pink transition-colors  tracking-tight">Şifiremi Unuttum?</a>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className="w-full p-4 rounded-xl border border-gray-50 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 outline-none transition-all placeholder:text-gray-300 font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 ml-1">
                    <button
                        type="button"
                        onClick={() => setRememberMe(!rememberMe)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${rememberMe ? 'bg-gray-900 border-gray-900 shadow-md shadow-gray-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                        {rememberMe && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className="text-[11px] font-bold text-gray-500 cursor-pointer select-none tracking-tight" onClick={() => setRememberMe(!rememberMe)}>BİRİ OTURUMUMU AÇIK TUT</span>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold text-[11px] flex items-center justify-center gap-3 hover:bg-brand-pink transform hover:-translate-y-0.5 transition-all  shadow-gray-200 hover:shadow-brand-pink/20 mt-8 active:scale-95 group  tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    {!isLoading && (
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    )}
                </button>
            </form>

            <p className="text-center mt-10 text-[11px] text-gray-400 font-bold tracking-tight">
                Hesabın yok mu? <Link to="/register" className="font-semibold text-gray-900 hover:text-brand-pink transition-colors">ÜYE OL</Link>
            </p>
        </div>
    );
};

export default LoginForm;
