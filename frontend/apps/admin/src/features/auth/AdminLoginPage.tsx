import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthStore } from './admin.store';

const AdminLoginPage = () => {
    const navigate = useNavigate();
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
            const res = await fetch('/api/auth/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setApiError(data.message || 'Giriş başarısız.');
            } else {
                // Bulk persist via store
                adminAuthStore.setAuth(data.accessToken, data.refreshToken, data.admin);

                setApiSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
                setTimeout(() => navigate('/dashboard'), 800);
            }
        } catch (err) {
            setApiError('Ağ hatası. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white font-['Inter']">
            {/* Left Side - Hero Section */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-admin-navy">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center brightness-[0.4]"
                    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069)' }}
                ></div>

                {/* Decorative Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-admin-navy via-transparent to-transparent opacity-80"></div>

                <div className="relative z-10 w-full p-16 flex flex-col justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-pink rounded-lg flex items-center justify-center shadow-lg shadow-brand-pink/20">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Fuira Admin Portal</span>
                    </div>

                    {/* Hero Content */}
                    <div className="max-w-xl">
                        <h1 className="text-6xl font-extrabold text-white leading-tight mb-8">
                            Mastering System <br />
                            <span className="text-brand-pink">Governance</span>
                        </h1>
                        <p className="text-slate-300 text-lg leading-relaxed font-medium">
                            Centralized control, security, and real-time monitoring for the entire platform.
                            Empower your administrative team with professional-grade tools.
                        </p>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-8">
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium transition-colors hover:text-white">
                            <svg className="w-5 h-5 text-brand-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            SOC2 Compliant
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium transition-colors hover:text-white">
                            <svg className="w-5 h-5 text-brand-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            End-to-end Encryption
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-10">
                    <div className="text-left space-y-3">
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome Administrator</h2>
                        <p className="text-slate-500 font-medium">Enter your credentials to access the management suite.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {apiError && (
                            <div className="p-3 bg-red-50/50 border border-brand-pink/20 rounded-xl text-brand-pink text-sm font-bold text-center">
                                {apiError}
                            </div>
                        )}
                        {apiSuccess && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm font-bold text-center">
                                {apiSuccess}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Admin Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-pink transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@fuira.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-pink/10 focus:border-brand-pink focus:bg-white transition-all font-semibold text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-bold text-slate-700">Password</label>
                                <a href="#" className="text-sm font-bold text-brand-pink hover:text-brand-pink-hover transition-colors">Forgot password?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-pink transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-pink/10 focus:border-brand-pink focus:bg-white transition-all font-semibold text-slate-700"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29M7.532 7.532l3.29 3.29M3 3l18 18" />
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

                        {/* Removed Remember Me checkbox as per security requirement */}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-pink text-white py-5 rounded-2xl font-black text-lg hover:bg-brand-pink-hover shadow-xl shadow-brand-pink/20 transform active:scale-[0.98] transition-all tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-slate-100"></div></div>
                        <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-slate-400">
                            <span className="px-5 bg-white">Or continue with SSO</span>
                        </div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-slate-100 rounded-2xl bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all">
                        <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                        </svg>
                        Sign in with Okta / Azure AD
                    </button>

                    {/* Omitted the registration link as per user's "no register" requirement */}
                </div>

                {/* Floating Footer */}
                <div className="absolute bottom-10 flex gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <a href="#" className="hover:text-brand-pink transition-colors">System Status</a>
                    <a href="#" className="hover:text-brand-pink transition-colors">Security Policy</a>
                    <a href="#" className="hover:text-brand-pink transition-colors">Audit Logs</a>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
