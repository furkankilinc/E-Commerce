import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { toast } from 'react-toastify';
import { Navigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
    const { user, logout, isAuthenticated, token } = useAuth();
    const [activeTab, setActiveTab] = useState('settings');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    // Form States
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

    useEffect(() => {
        if (user) {
            const names = user.name ? user.name.trim().split(' ') : ['', ''];
            // If there's only one name, it's the first name. Last name stays empty.
            setFormData({
                firstName: user.firstName || names[0] || '',
                lastName: user.lastName || (names.length > 1 ? names.slice(1).join(' ') : '') || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    const handleSaveProfile = async () => {
        // Only trigger verification if email or phone changed
        if (formData.email !== user?.email || formData.phone !== user?.phone) {
            setIsVerifying(true);
            return;
        }
        toast.info('Ad ve Soyad bilgileri değiştirilemez.');
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
                    phone: formData.phone
                })
            });

            if (res.ok) {
                toast.success('Bilgileriniz başarıyla doğrulandı ve güncellendi! 😎');
                setIsVerifying(false);
                setVerificationCode('');
            } else {
                toast.error('Güncelleme başarısız oldu.');
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

    const renderContent = () => {
        switch (activeTab) {
            case 'settings':
                return (
                    <div className="space-y-16 animate-in fade-in duration-500">
                        {/* Verification Modal (Simulated) */}
                        {isVerifying && (
                            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                                <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                                    <h3 className="text-3xl font-[1000] text-gray-900 italic uppercase mb-4 leading-tight">
                                        GÜVENLİK <span className="text-brand-pink">ONAYI</span>
                                    </h3>
                                    <p className="text-sm font-bold text-gray-400 mb-8 italic uppercase tracking-tight">E-posta ve Telefon değişikliğini onayla. (Şimdilik herhangi bir kod yazıp "ONAYLA" diyebilirsin)</p>
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        className="w-full h-20 bg-gray-50 border-2 border-gray-100 rounded-[2rem] text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-brand-pink mb-8 italic"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setIsVerifying(false)} className="py-5 text-[10px] font-black italic uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">VAZGEÇ</button>
                                        <button onClick={confirmVerification} className="py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black italic uppercase tracking-widest hover:bg-brand-pink transition-all">ONAYLA</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Header Info */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-12 border-b border-gray-100/50">
                            <div>
                                <h2 className="text-5xl font-[1000] text-gray-900 tracking-tighter uppercase italic leading-none mb-4">
                                    PROFİL <span className="text-brand-pink">AYARLARI</span>
                                </h2>
                                <p className="text-sm font-bold text-gray-400 max-w-md italic">Verilerini güncel tut, daha hızlı alışveriş yap ve özel "FUIRA" deneyimini yönet.</p>
                            </div>
                            <button onClick={handleSaveProfile} className="px-12 py-5 bg-gray-900 text-white rounded-[2rem] text-[11px] font-[1000] uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 hover:bg-brand-pink hover:-translate-y-1 transition-all active:scale-95 italic text-center min-w-[240px]">
                                DEĞİŞİKLİKLERİ KAYDET
                            </button>
                        </div>

                        {/* Form Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic flex items-center gap-3">ADINIZ <span className="w-1 h-1 bg-gray-200 rounded-full"></span></label>
                                <div className="relative group">
                                    <input type="text" value={formData.firstName} readOnly disabled className="w-full h-20 px-8 bg-gray-50/50 border-2 border-gray-100 rounded-[2.5rem] text-sm font-bold italic text-gray-300 cursor-not-allowed" />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-900 text-[8px] font-black text-white italic rounded-full opacity-0 group-hover:opacity-100 transition-opacity">SABİT</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic flex items-center gap-3">SOYADINIZ <span className="w-1 h-1 bg-gray-200 rounded-full"></span></label>
                                <div className="relative group">
                                    <input type="text" value={formData.lastName} readOnly disabled className="w-full h-20 px-8 bg-gray-50/50 border-2 border-gray-100 rounded-[2.5rem] text-sm font-bold italic text-gray-300 cursor-not-allowed" />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-900 text-[8px] font-black text-white italic rounded-full opacity-0 group-hover:opacity-100 transition-opacity">SABİT</div>
                                </div>
                            </div>
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic flex items-center gap-3">E-POSTA ADRESİ <span className="w-1 h-1 bg-brand-pink rounded-full"></span></label>
                                <input
                                    type="email"
                                    autoComplete="off"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full h-20 px-8 bg-white border-2 border-gray-50 rounded-[2.5rem] text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white focus:ring-[12px] focus:ring-brand-pink/5 transition-all italic text-gray-900"
                                />
                            </div>
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic flex items-center gap-3">TELEFON NUMARASI <span className="w-1 h-1 bg-brand-pink rounded-full"></span></label>
                                <input
                                    type="text"
                                    autoComplete="off"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+90 (5xx) xxx xx xx"
                                    className="w-full h-20 px-8 bg-white border-2 border-gray-50 rounded-[2.5rem] text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white focus:ring-[12px] focus:ring-brand-pink/5 transition-all italic text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Security */}
                        <div className="pt-20 border-t border-gray-100/50">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shrink-0">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </div>
                                    <h3 className="text-3xl font-[1000] text-gray-900 tracking-tighter uppercase italic leading-none">ŞİFRE <span className="text-brand-pink">GÜNCELLE</span></h3>
                                </div>
                                <button onClick={handlePasswordChange} className="text-[10px] font-black italic uppercase tracking-widest px-8 py-3 bg-gray-100 rounded-xl hover:bg-gray-900 hover:text-white transition-all">ŞİFREYİ DEĞİŞTİR</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Current Password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full h-20 px-8 bg-white border-2 border-gray-50 rounded-[2.5rem] text-sm font-bold focus:outline-none focus:border-gray-900 transition-all italic"
                                />
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="New Password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full h-20 px-8 bg-white border-2 border-gray-50 rounded-[2.5rem] text-sm font-bold focus:outline-none focus:border-gray-900 transition-all italic"
                                />
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Confirm Password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full h-20 px-8 bg-white border-2 border-gray-50 rounded-[2.5rem] text-sm font-bold focus:outline-none focus:border-gray-900 transition-all italic"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'addresses':
                return (
                    <div className="space-y-16 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end pb-12 border-b border-gray-100/50">
                            <div>
                                <h2 className="text-5xl font-[1000] text-gray-900 tracking-tighter uppercase italic leading-none mb-4">ADRES <span className="text-brand-pink">REHBERİM</span></h2>
                                <p className="text-sm font-bold text-gray-400 italic">Siparişlerini nereye göndereceğimizi seç.</p>
                            </div>
                            <button className="flex items-center gap-4 text-xs font-black text-brand-pink hover:text-gray-900 transition-colors uppercase tracking-[0.2em] italic">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
                                YENİ ADRES EKLE
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-10 rounded-[3rem] border-2 border-brand-pink bg-rose-50/20 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 px-6 py-2 bg-brand-pink text-white text-[8px] font-black uppercase tracking-widest rounded-bl-[1.5rem] italic">VARSAYILAN</div>
                                <h4 className="text-xl font-black text-gray-900 mb-2 italic">Ev Adresim</h4>
                                <p className="text-xs font-bold text-gray-500 leading-relaxed mb-8 italic opacity-80">Cumhuriyet Mah. İstiklal Cad. No:123 D:4<br />Kadıköy, İstanbul</p>
                                <div className="flex gap-6">
                                    <button className="text-[10px] font-black text-brand-pink uppercase tracking-widest italic opacity-60 hover:opacity-100">DÜZENLE</button>
                                    <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic opacity-60 hover:opacity-100">KAYDI SİL</button>
                                </div>
                            </div>
                            <button className="p-10 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 text-gray-300 hover:border-brand-pink hover:text-brand-pink transition-all group">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest italic">YENİ ADRES EKLE</span>
                            </button>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-16 animate-in fade-in duration-500">
                        <div className="pb-12 border-b border-gray-100/50 text-left">
                            <h2 className="text-5xl font-[1000] text-gray-900 tracking-tighter uppercase italic leading-none mb-4">BİLDİRİM <span className="text-brand-pink">TERCİHLERİ</span></h2>
                            <p className="text-sm font-bold text-gray-400 italic">Yeniliklerden ve indirimlerden haberdar ol.</p>
                        </div>
                        <div className="space-y-10">
                            {[
                                { title: 'Kampanya Duyuruları', desc: 'Yeni drop ve indirimlerden anında haberdar ol.' },
                                { title: 'Sipariş Durum Güncellemeleri', desc: 'Kargo ve teslimat süreçlerini takip et.' },
                                { title: 'FUIRA Bülten', desc: 'Haftalık stil ve topluluk haberlerini al.' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-10 rounded-[3rem] bg-gray-50/50 border border-gray-50 group hover:border-brand-pink/20 transition-all">
                                    <div>
                                        <h4 className="text-xl font-black text-gray-900 italic mb-1 uppercase tracking-tight">{item.title}</h4>
                                        <p className="text-xs font-bold text-gray-400 italic opacity-80 uppercase tracking-widest">{item.desc}</p>
                                    </div>
                                    <button className="w-16 h-8 bg-gray-900 rounded-full relative p-1">
                                        <div className="w-6 h-6 bg-white rounded-full translate-x-8"></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'orders':
                return (
                    <div className="space-y-16 animate-in fade-in duration-500">
                        <div className="pb-12 border-b border-gray-100/50 text-left">
                            <h2 className="text-5xl font-[1000] text-gray-900 tracking-tighter uppercase italic leading-none mb-4">SİPARİŞ <span className="text-brand-pink">GEÇMİŞİM</span></h2>
                            <p className="text-sm font-bold text-gray-400 italic">Geçmiş siparişlerini ve durumlarını kontrol et.</p>
                        </div>
                        <div className="py-20 text-center flex flex-col items-center gap-8 opacity-20">
                            <div className="w-32 h-32 border-4 border-dashed border-gray-900 rounded-[3rem] flex items-center justify-center">
                                <svg className="text-gray-900 w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            </div>
                            <h3 className="text-2xl font-black italic uppercase tracking-[0.3em]">HİÇ SİPARİŞİN YOK</h3>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex flex-col lg:flex-row gap-16 md:gap-24">
                {/* Left Sidebar */}
                <div className="lg:w-1/3 xl:w-1/4 space-y-12">
                    <div className="relative group inline-block">
                        <div className="w-48 h-48 md:w-56 md:h-56 rounded-[4rem] bg-gray-50 border-8 border-white shadow-2xl shadow-gray-200 overflow-hidden group-hover:rotate-6 transition-all duration-700">
                            <img src={`https://ui-avatars.com/api/?name=${formData.firstName || 'User'}&background=fb7185&color=fff&size=200`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <button className="absolute -bottom-4 -right-4 w-16 h-16 bg-gray-900 text-white rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white hover:bg-brand-pink hover:scale-110 transition-all active:scale-90">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-[1000] text-gray-900 tracking-tighter uppercase italic leading-none">
                            {formData.firstName || 'Dostum'}<br />
                            {formData.lastName && <span className="text-brand-pink">{formData.lastName}</span>}
                        </h1>
                        <p className="text-xs font-black text-gray-300 uppercase tracking-[0.3em] italic">PLATINUM ÜYE</p>
                    </div>

                    <nav className="flex flex-col gap-3">
                        {[
                            { id: 'settings', label: 'HESAP AYARLARI' },
                            { id: 'addresses', label: 'ADRESLERİM' },
                            { id: 'orders', label: 'SİPARİŞLERİM' },
                            { id: 'notifications', label: 'BİLDİRİMLER' },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`text-left px-0 py-3 text-xs font-black tracking-widest transition-all italic border-b-2 ${activeTab === item.id ? 'text-gray-900 border-gray-900 translate-x-4' : 'text-gray-300 border-transparent hover:text-gray-500 hover:translate-x-2'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <button onClick={logout} className="flex items-center gap-4 text-xs font-black text-gray-400 hover:text-brand-pink transition-colors uppercase tracking-widest italic group">
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        GÜVENLİ ÇIKIŞ
                    </button>
                </div>

                {/* Right Content */}
                <div className="flex-1 min-h-[600px]">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
