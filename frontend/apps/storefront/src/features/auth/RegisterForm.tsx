import React from 'react';
import { Link } from 'react-router-dom';
import { useRegisterForm } from './hooks/useRegisterForm';

const RegisterForm: React.FC = () => {
    const {
        showPassword,
        setShowPassword,
        formData,
        errors,
        isLoading,
        apiError,
        apiSuccess,
        handleChange,
        handleSubmit
    } = useRegisterForm();

    return (
        <div className="w-full max-w-[500px] bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100/50">
            {/* Stepper */}
            <div className="mb-4">
                <div className="flex justify-between  text-nano font-semibold text-gray-300 mb-3 ">
                    <span className="text-brand-pink">Step 01 / 02</span>
                    <span>50%</span>
                </div>
                <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 w-1/2 rounded-full" />
                </div>
            </div>

            {/* Header */}
            <div className="mb-5 text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3  text-gray-900 ">
                    Hesap <span className=" text-brand-pink underline underline-offset-[6px] decoration-gray-900/5">Oluştur</span>
                </h2>
                <p className="text-gray-400 text-xs md:text-sm font-medium px-4">
                    Fuira'ya katıl, premium alışveriş deneyimini yaşa.
                </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
                {apiError && (
                    <div className="p-3 bg-red-50/50 border border-brand-pink/20 rounded-xl text-brand-pink text-xs font-semibold text-center">
                        {apiError}
                    </div>
                )}
                {apiSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs font-semibold text-center">
                        {apiSuccess}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-10px font-semibold text-gray-400   ml-1">Adınız</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="John"
                            required
                            className="w-full p-4 rounded-xl border border-gray-50 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-gray-900 outline-none transition-all placeholder:text-gray-300 font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-10px font-semibold text-gray-400   ml-1">Soyadınız</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Doe"
                            required
                            className="w-full p-4 rounded-xl border border-gray-50 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-gray-900 outline-none transition-all placeholder:text-gray-300 font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-10px font-semibold text-gray-400   ml-1">
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
                    {errors.email && <p className="text-nano font-semibold text-brand-pink   ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-10px font-semibold text-gray-400   ml-1">
                        Şifre
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className={`w-full p-4 rounded-xl border ${errors.password ? 'border-brand-pink bg-red-50/20' : 'border-gray-50 bg-gray-50/50'} text-gray-900 text-sm focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 outline-none transition-all placeholder:text-gray-300 font-medium`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                    </div>
                    {errors.password && <p className="text-nano font-semibold text-brand-pink   ml-1 leading-relaxed">{errors.password}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold text-caption flex items-center justify-center gap-3 hover:bg-brand-pink transform hover:-translate-y-0.5 transition-all  shadow-gray-200 hover:shadow-brand-pink/20 mt-8 active:scale-95 group   disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'İşleniyor...' : 'Hesap Oluştur'}
                    {!isLoading && (
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    )}
                </button>
            </form>

            <p className="text-center mt-10 text-caption text-gray-400 font-semibold ">
                Zaten üyemiz misin? <Link to="/login" className="font-semibold text-gray-900 hover:text-brand-pink transition-colors">GİRİŞ YAP</Link>
            </p>
        </div>
    );
};

export default RegisterForm;
