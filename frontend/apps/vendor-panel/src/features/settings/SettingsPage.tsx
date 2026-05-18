import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { toast } from 'react-toastify';

const SettingsPage: React.FC = () => {
    const { merchant } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    const sidebarItems = [
        { id: 'profile', label: 'Profil', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        { id: 'addresses', label: 'Adresler', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { id: 'security', label: 'Güvenlik', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    ];

    const handleSave = () => {
        toast.success('Ayarlar başarıyla kaydedildi.');
    };

    return (
        <div className="flex gap-12 min-h-screen">
            {/* Settings Sidebar */}
            <aside className="w-72 flex flex-col gap-10">
                <div>
                    <h3 className="text-10px font-semibold text-slate-400  tracking-widest mb-4 italic">AYARLAR</h3>
                    <nav className="flex flex-col gap-4">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-5 px-8 py-5 rounded-2xl text-sm font-semibold transition-all italic ${activeTab === item.id ? 'bg-rose-50 text-brand-pink  shadow-rose-100/50 scale-105' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

            </aside>

            {/* Content Area */}
            <div className="flex-1 space-y-12">
                {/* Section 1: Personal Information */}
                {activeTab === 'profile' && (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-50 relative group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-10">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-xl bg-slate-50 border-4 border-white  overflow-hidden group-hover:rotate-6 transition-transform">
                                        <img src={`https://ui-avatars.com/api/?name=${merchant?.companyName || 'Merchant'}&background=fb7185&color=fff&size=200`} alt="Avatar" className="w-full h-full object-contain" />
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 w-12 h-12 bg-brand-pink text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white hover:scale-110 transition-transform">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </button>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-[1000] text-slate-900 tracking-tighter italic mb-2">Kişisel <span className="text-brand-pink">Bilgiler</span></h1>
                                    <p className="text-slate-400 font-bold italic opacity-70  text-xs tracking-widest">Fotoğrafını ve hesap detaylarını yönet</p>
                                </div>
                            </div>
                            <button onClick={handleSave} className="px-8 py-4 bg-brand-pink text-white rounded-2xl text-10px font-semibold  tracking-widest  shadow-brand-pink/20 hover:bg-brand-pink-hover transition-all active:scale-95 italic">Değişiklikleri Kaydet</button>
                        </div>

                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-10px font-semibold text-slate-400  tracking-widest ml-4 italic">ADINIZ</label>
                                <input type="text" defaultValue={merchant?.companyName?.split(' ')[0] || ''} className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-10px font-semibold text-slate-400  tracking-widest ml-4 italic">SOYADINIZ</label>
                                <input type="text" defaultValue={merchant?.companyName?.split(' ')[1] || ''} className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-10px font-semibold text-slate-400  tracking-widest ml-4 italic">E-POSTA ADRESİ</label>
                                <input type="email" defaultValue={merchant?.email} className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-10px font-semibold text-slate-400  tracking-widest ml-4 italic">TELEFON NUMARASI</label>
                                <input type="text" placeholder="+90 (---) --- -- --" className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 2: Address Management */}
                {activeTab === 'addresses' && (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-50">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-3xl font-[1000] text-slate-900 tracking-tighter italic mb-2">Adres <span className="text-brand-pink">Yönetimi</span></h2>
                                <p className="text-slate-400 font-bold italic opacity-70  text-xs tracking-widest">Teslimat ve fatura adreslerini düzenle</p>
                            </div>
                            <button className="flex items-center gap-3 text-brand-pink font-semibold text-xs  tracking-widest italic hover:translate-x-1 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                Yeni Ekle
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            {/* Default Address */}
                            <div className="p-8 rounded-xl border-2 border-brand-pink bg-rose-50/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 px-6 py-2 bg-brand-pink text-white text-8px font-semibold  tracking-widest rounded-bl-[1.5rem] italic">VARSAYILAN</div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-4 italic">Ev Adresim</h4>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed mb-4 italic opacity-80">Cumhuriyet Mah. İstiklal Cad. No:123 D:4<br />Kadıköy, İstanbul 34744</p>
                                <div className="flex gap-6 mt-auto">
                                    <button className="text-10px font-semibold text-brand-pink  tracking-widest italic hover:opacity-100 opacity-60 transition-opacity">Düzenle</button>
                                    <button className="text-10px font-semibold text-rose-400  tracking-widest italic hover:opacity-100 opacity-60 transition-opacity">Sil</button>
                                </div>
                            </div>

                            {/* Secondary Address */}
                            <div className="p-8 rounded-xl border border-slate-100 hover:border-brand-pink/30 hover:bg-slate-50/50 transition-all group">
                                <h4 className="text-sm font-semibold text-slate-900 mb-4 italic">Ofis / Plaza</h4>
                                <p className="text-xs font-bold text-slate-400 leading-relaxed mb-4 italic opacity-80">Büyükdere Cad. Kristal Plaza Kat:22<br />Levent, İstanbul 34330</p>
                                <div className="flex gap-6 mt-auto">
                                    <button className="text-10px font-semibold text-brand-pink  tracking-widest italic hover:opacity-100 opacity-60 transition-opacity">Düzenle</button>
                                    <button className="text-10px font-semibold text-rose-400  tracking-widest italic hover:opacity-100 opacity-60 transition-opacity">Sil</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 3: Security */}
                {activeTab === 'security' && (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-50">
                        <div className="mb-6">
                            <h2 className="text-3xl font-[1000] text-slate-900 tracking-tighter italic mb-2">Güvenlik <span className="text-brand-pink">&</span> Erişim</h2>
                            <p className="text-slate-400 font-bold italic opacity-70  text-xs tracking-widest">Hesap güvenliğini ve şifreni güncelle</p>
                        </div>

                        <div className="space-y-10">
                            <div className="grid grid-cols-1 gap-8 max-w-2xl">
                                <div className="space-y-3">
                                    <label className="text-10px font-semibold text-slate-400  tracking-widest ml-4 italic">MEVCUT ŞİFRE</label>
                                    <div className="relative">
                                        <input type="password" placeholder="••••••••" className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" />
                                        <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-10px font-semibold text-slate-400  tracking-widest ml-4 italic">YENİ ŞİFRE</label>
                                        <input type="password" placeholder="Min. 8 Karakter" className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-10px font-semibold text-slate-400  tracking-widest ml-4 italic">ŞİFRE TEKRAR</label>
                                        <input type="password" placeholder="Yeni Şifreyi Onayla" className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" />
                                    </div>
                                </div>
                            </div>

                            <button className="px-12 py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-semibold  tracking-widest hover:bg-slate-800 transition-all active:scale-95 italic">Şifreyi Güncelle</button>

                            <div className="h-[1px] bg-slate-100 w-full my-10"></div>

                            <div className="flex items-center justify-between p-8 rounded-xl bg-slate-50 border border-slate-100">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-1 italic">İki Faktörlü Doğrulama (2FA)</h4>
                                    <p className="text-xs font-bold text-slate-400 italic opacity-80  tracking-tighter">Hesabına ekstra bir güvenlik katmanı ekle</p>
                                </div>
                                <button className="group flex items-center gap-4">
                                    <span className="text-10px font-semibold text-emerald-500  tracking-widest italic">AKTİF ET</span>
                                    <div className="w-16 h-16 bg-slate-200 rounded-full relative p-1 group-hover:bg-brand-pink/20 transition-colors">
                                        <div className="w-6 h-6 bg-white rounded-full shadow-md transition-transform"></div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
