import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const VendorRegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [step] = useState(1);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [formData, setFormData] = useState({
        companyName: '',
        taxId: '',
        contactPerson: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        if (formData.password !== formData.confirmPassword) {
            setApiError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setApiError('');
        setApiSuccess('');

        try {
            const res = await fetch('/api/auth/merchant/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    companyName: formData.companyName,
                    taxId: formData.taxId,
                    contactPerson: formData.contactPerson,
                    phone: formData.phone
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setApiError(data.message || 'Registration failed');
            } else {
                setApiSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setApiError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fb] font-sans selection:bg-brand-pink/20">
            {/* Header */}
            <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-pink rounded flex items-center justify-center transform rotate-3">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                        Merchant.<span className="text-brand-pink">Fuira</span>
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                    <a href="#" className="hover:text-brand-pink transition-colors">Home</a>
                    <div className="relative group">
                        <button
                            className="flex items-center gap-1 hover:text-brand-pink transition-colors"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            Network
                            <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {/* Dropdown Menu */}
                        <div className={`absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl transition-all duration-200 ${dropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                            <div className="p-2">
                                <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-pink rounded-lg transition-all">Wholesale</a>
                                <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-pink rounded-lg transition-all">Partners</a>
                                <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-pink rounded-lg transition-all">Dropshipping</a>
                            </div>
                        </div>
                    </div>
                    <a href="#" className="hover:text-brand-pink transition-colors">Support</a>
                </div>

                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-bold text-brand-pink hover:text-brand-pink-hover transition-colors">Log in</Link>
                    <Link to="/register" className="bg-brand-pink text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-brand-pink-hover shadow-lg shadow-brand-pink/20 transition-all active:scale-95">
                        Register Now
                    </Link>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-[#0f172a] mb-4">Join our Merchant Network</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                        Complete the form below to register your business and start reaching thousands of new customers today.
                    </p>
                </div>

                {/* Form Container */}
                <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden border border-white">
                    {/* Stepper */}
                    <div className="flex border-b border-slate-100">
                        {[
                            { id: 1, label: 'Registration' },
                            { id: 2, label: 'Verification' },
                            { id: 3, label: 'Finish' }
                        ].map((s) => (
                            <div
                                key={s.id}
                                className={`flex-1 flex items-center justify-center py-6 gap-3 transition-all relative ${step === s.id ? 'text-brand-pink' : 'text-slate-400'}`}
                            >
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === s.id ? 'bg-brand-pink text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {s.id}
                                </span>
                                <span className="font-bold text-sm tracking-wide">{s.label}</span>
                                {step === s.id && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-brand-pink"></div>}
                            </div>
                        ))}
                    </div>

                    <div className="p-10 lg:p-16 space-y-12">
                        {apiError && (
                            <div className="p-4 bg-red-50/50 border border-brand-pink/20 rounded-xl text-brand-pink text-sm font-bold text-center">
                                {apiError}
                            </div>
                        )}
                        {apiSuccess && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm font-bold text-center">
                                {apiSuccess}
                            </div>
                        )}
                        {/* Business Details Section */}
                        <section className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-pink/10 rounded-xl flex items-center justify-center text-brand-pink">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Business Details</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="col-span-full md:col-span-1 space-y-2">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest px-1">Legal Business Name</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="Enter legal business name"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="col-span-full md:col-span-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest px-1">Tax ID / EIN</label>
                                        <div className="w-4 h-4 rounded-full bg-slate-200 text-white flex items-center justify-center text-[10px] cursor-help" title="Your federal employer identification number">?</div>
                                    </div>
                                    <input
                                        type="text"
                                        name="taxId"
                                        value={formData.taxId}
                                        onChange={handleChange}
                                        placeholder="XX-XXXXXXX"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all placeholder:text-slate-300 font-mono"
                                    />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest px-1">Contact Person</label>
                                    <input
                                        type="text"
                                        name="contactPerson"
                                        value={formData.contactPerson}
                                        onChange={handleChange}
                                        placeholder="Full name of primary contact"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Security Section */}
                        <section className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-pink/10 rounded-xl flex items-center justify-center text-brand-pink">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Security & Credentials</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest px-1">Business Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="email@company.com"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest px-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest px-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all placeholder:text-slate-300"
                                        />
                                        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-pink transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">Must be at least 8 characters with a symbol.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest px-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <input type="checkbox" id="terms" className="mt-1.5 w-4 h-4 text-brand-pink border-slate-300 rounded focus:ring-brand-pink cursor-pointer" />
                            <label htmlFor="terms" className="text-sm text-slate-500 leading-relaxed cursor-pointer select-none">
                                I agree to the <a href="#" className="font-bold text-brand-pink hover:underline uppercase text-xs tracking-wider">Terms of Service</a> and <a href="#" className="font-bold text-brand-pink hover:underline uppercase text-xs tracking-wider">Privacy Policy</a>. I understand that my business information will be verified before activation.
                            </label>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between pt-6 gap-6">
                            <p className="text-sm font-bold text-slate-500">
                                Already have an account? <Link to="/login" className="text-brand-pink hover:underline tracking-tight">Log in here</Link>
                            </p>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full md:w-auto bg-brand-pink text-white py-4 px-10 rounded-2xl font-black text-lg hover:bg-brand-pink-hover transform active:scale-95 transition-all shadow-xl shadow-brand-pink/30 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Processing...' : 'Complete Registration'}
                                {!isLoading && (
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Footer */}
                <div className="mt-16 flex flex-wrap justify-center gap-12 text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Secure Encrypted Connection
                    </div>
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Fraud Protection Enabled
                    </div>
                    <div className="flex items-center gap-3 text-brand-pink">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        24/7 Merchant Support
                    </div>
                </div>
            </main>

            {/* Footer Bottom */}
            <footer className="mt-20 border-t border-slate-100 bg-white py-10 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-bold text-slate-400">© 2024 Merchant Network Inc. All rights reserved.</p>
                    <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <a href="#" className="hover:text-brand-pink transition-colors">Privacy</a>
                        <a href="#" className="hover:text-brand-pink transition-colors">Terms</a>
                        <a href="#" className="hover:text-brand-pink transition-colors">Cookies</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default VendorRegisterPage;
