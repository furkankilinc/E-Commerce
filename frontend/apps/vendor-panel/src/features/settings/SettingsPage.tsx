import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { toast } from 'react-toastify';

const SettingsPage: React.FC = () => {
    const { merchant } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    interface VendorAddress {
        id: string;
        title: string;
        fullName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        district: string;
        neighborhood: string;
        zipCode: string;
        isDefault: boolean;
    }

    const [savedAddresses, setSavedAddresses] = useState<VendorAddress[]>(() => {
        const stored = localStorage.getItem('vendor_saved_addresses');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return [];
            }
        }
        const defaults: VendorAddress[] = [
            {
                id: 'vendor-addr-1',
                title: 'Merkez Depo',
                fullName: 'Furkan Kılınç (Satıcı)',
                email: 'vendor@email.com',
                phone: '+90 532 987 65 43',
                address: 'Büyükdere Cad. Kristal Plaza Kat:22',
                city: 'İSTANBUL',
                district: 'Levent',
                neighborhood: 'Levent Mh.',
                zipCode: '34330',
                isDefault: true
            }
        ];
        localStorage.setItem('vendor_saved_addresses', JSON.stringify(defaults));
        return defaults;
    });

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [newAddressForm, setNewAddressForm] = useState({
        title: '',
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        neighborhood: '',
        zipCode: '',
        isDefault: false
    });

    const handleSaveAddress = () => {
        const { title, fullName, email, phone, address, city, district, neighborhood, zipCode, isDefault } = newAddressForm;
        if (!title || !fullName || !email || !phone || !address || !city || !district || !neighborhood || !zipCode) {
            toast.error('Lütfen tüm yıldızlı (*) alanları doldurun.');
            return;
        }

        let updated: VendorAddress[];
        if (editingAddressId) {
            updated = savedAddresses.map(addr => {
                if (addr.id === editingAddressId) {
                    return { ...newAddressForm, id: editingAddressId };
                }
                return addr;
            });
            setEditingAddressId(null);
            toast.success('Adres başarıyla güncellendi.');
        } else {
            const newAddr: VendorAddress = { ...newAddressForm, id: Date.now().toString() };
            updated = [...savedAddresses, newAddr];
            toast.success('Yeni adres başarıyla eklendi.');
        }

        // If the saved address is marked as default, make all others non-default
        if (isDefault) {
            const currentId = editingAddressId || updated[updated.length - 1].id;
            updated = updated.map(addr => ({
                ...addr,
                isDefault: addr.id === currentId
            }));
        } else if (updated.length === 1) {
            updated[0].isDefault = true;
        } else if (!updated.some(addr => addr.isDefault)) {
            updated[0].isDefault = true;
        }

        setSavedAddresses(updated);
        localStorage.setItem('vendor_saved_addresses', JSON.stringify(updated));

        // Reset form
        setNewAddressForm({
            title: '',
            fullName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            district: '',
            neighborhood: '',
            zipCode: '',
            isDefault: false
        });
        setIsFormOpen(false);
    };

    const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Bu adresi silmek istediğinize emin misiniz?')) {
            let updated = savedAddresses.filter(addr => addr.id !== id);
            if (updated.length > 0 && !updated.some(addr => addr.isDefault)) {
                updated[0].isDefault = true;
            }
            setSavedAddresses(updated);
            localStorage.setItem('vendor_saved_addresses', JSON.stringify(updated));
            toast.success('Adres silindi.');
            if (editingAddressId === id) {
                setEditingAddressId(null);
                setIsFormOpen(false);
            }
        }
    };

    const handleSetDefaultAddress = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedAddresses.map(addr => ({
            ...addr,
            isDefault: addr.id === id
        }));
        setSavedAddresses(updated);
        localStorage.setItem('vendor_saved_addresses', JSON.stringify(updated));
        toast.success('Varsayılan gönderim adresi güncellendi.');
    };

    const handleStartEdit = (addr: VendorAddress, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingAddressId(addr.id);
        setNewAddressForm({
            title: addr.title,
            fullName: addr.fullName,
            email: addr.email,
            phone: addr.phone,
            address: addr.address,
            city: addr.city,
            district: addr.district,
            neighborhood: addr.neighborhood,
            zipCode: addr.zipCode,
            isDefault: addr.isDefault
        });
        setIsFormOpen(true);
    };

    const sidebarItems = [
        { id: 'profile', label: 'Profil', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        { id: 'addresses', label: 'Adresler', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { id: 'security', label: 'Güvenlik', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    ];

    const handleSave = () => {
        toast.success('Ayarlar başarıyla kaydedildi.');
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-screen">
            {/* Settings Sidebar */}
            <aside className="w-full lg:w-72 flex flex-col gap-6 lg:gap-10 shrink-0">
                <div>
                    <h3 className="text-10px font-semibold text-slate-400   mb-4 ">AYARLAR</h3>
                    <nav className="flex flex-row lg:flex-col gap-3 overflow-x-auto whitespace-nowrap pb-2 lg:pb-0 scrollbar-none">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-3 lg:gap-5 px-5 lg:px-8 py-3.5 lg:py-5 rounded-2xl text-xs lg:text-sm font-semibold transition-all  ${activeTab === item.id ? 'bg-rose-50 text-brand-pink  shadow-rose-100/50 scale-105' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

            </aside>

            {/* Content Area */}
            <div className="flex-1 space-y-6 sm:space-y-12">
                {/* Section 1: Personal Information */}
                {activeTab === 'profile' && (
                    <div className="bg-white p-6 sm:p-10 lg:p-12 rounded-xl shadow-sm border border-slate-50 relative group">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 text-center sm:text-left">
                                <div className="relative">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-slate-50 border-4 border-white  overflow-hidden group-hover:rotate-6 transition-transform">
                                        <img src={`https://ui-avatars.com/api/?name=${merchant?.companyName || 'Merchant'}&background=fb7185&color=fff&size=200`} alt="Avatar" className="w-full h-full object-contain" />
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-brand-pink text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white  transition-transform">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </button>
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-4xl font-[1000] text-slate-900   mb-2">Kişisel <span className="text-brand-pink">Bilgiler</span></h1>
                                    <p className="text-slate-400 font-semibold  opacity-70  text-xs ">Fotoğrafını ve hesap detaylarını yönet</p>
                                </div>
                            </div>
                            <button onClick={handleSave} className="w-full md:w-auto px-8 py-4 bg-brand-pink text-white rounded-2xl text-10px font-semibold    shadow-brand-pink/20 hover:bg-brand-pink-hover transition-all active:scale-95 ">Değişiklikleri Kaydet</button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                            <div className="space-y-3">
                                <label className="text-10px font-semibold text-slate-400   ml-4 ">ADINIZ</label>
                                <input type="text" defaultValue={merchant?.companyName?.split(' ')[0] || ''} className="w-full h-14 sm:h-16 px-6 sm:px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink focus:bg-white transition-all " />
                            </div>
                            <div className="space-y-3">
                                <label className="text-10px font-semibold text-slate-400   ml-4 ">SOYADINIZ</label>
                                <input type="text" defaultValue={merchant?.companyName?.split(' ')[1] || ''} className="w-full h-14 sm:h-16 px-6 sm:px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink focus:bg-white transition-all " />
                            </div>
                            <div className="space-y-3">
                                <label className="text-10px font-semibold text-slate-400   ml-4 ">E-POSTA ADRESİ</label>
                                <input type="email" defaultValue={merchant?.email} className="w-full h-14 sm:h-16 px-6 sm:px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink focus:bg-white transition-all " />
                            </div>
                            <div className="space-y-3">
                                <label className="text-10px font-semibold text-slate-400   ml-4 ">TELEFON NUMARASI</label>
                                <input type="text" placeholder="+90 (---) --- -- --" className="w-full h-14 sm:h-16 px-6 sm:px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink focus:bg-white transition-all " />
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 2: Address Management */}
                {activeTab === 'addresses' && (
                    <div className="bg-white p-6 sm:p-10 lg:p-12 rounded-xl shadow-sm border border-slate-50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-[1000] text-slate-900   mb-2">Adres <span className="text-brand-pink">Yönetimi</span></h2>
                                <p className="text-slate-400 font-semibold  opacity-70  text-xs ">Teslimat ve fatura adreslerini düzenle</p>
                            </div>
                            {!isFormOpen && (
                                <button
                                    onClick={() => {
                                        setEditingAddressId(null);
                                        setNewAddressForm({ title: '', fullName: '', email: '', phone: '', address: '', city: '', district: '', neighborhood: '', zipCode: '', isDefault: false });
                                        setIsFormOpen(true);
                                    }}
                                    className="flex items-center gap-3 text-brand-pink font-semibold text-xs    hover:translate-x-1 transition-transform self-start sm:self-auto cursor-pointer"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                    Yeni Ekle
                                </button>
                            )}
                        </div>

                        {isFormOpen ? (
                            /* Beautiful Inline Address Form */
                            <div className="border border-slate-100 rounded-xl p-6 sm:p-8 bg-slate-50/50 space-y-6 animate-in slide-in-from-top-4 duration-300">
                                <h3 className="text-lg font-semibold text-slate-800 ">{editingAddressId ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-10px font-semibold text-slate-400 ml-4 ">ADRES BAŞLIĞI *</label>
                                        <input
                                            type="text"
                                            value={newAddressForm.title}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, title: e.target.value })}
                                            className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink transition-all  text-slate-800"
                                            placeholder="Örn: Merkez Depo"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-10px font-semibold text-slate-400 ml-4 ">YETKİLİ AD SOYAD *</label>
                                        <input
                                            type="text"
                                            value={newAddressForm.fullName}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                                            className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink transition-all  text-slate-800"
                                            placeholder="Örn: Furkan Kılınç"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-10px font-semibold text-slate-400 ml-4 ">TELEFON *</label>
                                        <input
                                            type="text"
                                            value={newAddressForm.phone}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                                            className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink transition-all  text-slate-800"
                                            placeholder="+90 5XX XXX XX XX"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-10px font-semibold text-slate-400 ml-4 ">E-POSTA *</label>
                                        <input
                                            type="email"
                                            value={newAddressForm.email}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, email: e.target.value })}
                                            className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink transition-all  text-slate-800"
                                            placeholder="depo@firma.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-10px font-semibold text-slate-400 ml-4 ">ŞEHİR *</label>
                                        <input
                                            type="text"
                                            value={newAddressForm.city}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value.toUpperCase() })}
                                            className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink transition-all  text-slate-800"
                                            placeholder="İSTANBUL"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-10px font-semibold text-slate-400 ml-4 ">İLÇE *</label>
                                        <input
                                            type="text"
                                            value={newAddressForm.district}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, district: e.target.value })}
                                            className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink transition-all  text-slate-800"
                                            placeholder="Levent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-10px font-semibold text-slate-400 ml-4 ">MAHALLE *</label>
                                        <input
                                            type="text"
                                            value={newAddressForm.neighborhood}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, neighborhood: e.target.value })}
                                            className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink transition-all  text-slate-800"
                                            placeholder="Levent Mh."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-10px font-semibold text-slate-400 ml-4 ">POSTA KODU *</label>
                                        <input
                                            type="text"
                                            value={newAddressForm.zipCode}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, zipCode: e.target.value })}
                                            className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink transition-all  text-slate-800"
                                            placeholder="34330"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-10px font-semibold text-slate-400 ml-4 ">AÇIK ADRES *</label>
                                    <textarea
                                        value={newAddressForm.address}
                                        onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-2xl p-6 text-sm font-semibold focus:outline-none focus:border-brand-pink transition-all  text-slate-800 resize-none h-24"
                                        placeholder="Büyükdere Cad. Kristal Plaza Kat:22"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pl-4">
                                    <input
                                        type="checkbox"
                                        id="isDefaultCheckbox"
                                        checked={newAddressForm.isDefault}
                                        onChange={(e) => setNewAddressForm({ ...newAddressForm, isDefault: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-300 accent-brand-pink cursor-pointer"
                                    />
                                    <label htmlFor="isDefaultCheckbox" className="text-xs font-semibold text-slate-600 cursor-pointer select-none ">Varsayılan gönderim/teslimat adresi yap</label>
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => setIsFormOpen(false)}
                                        className="px-8 py-4 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-2xl text-10px font-semibold transition-all active:scale-95  cursor-pointer"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={handleSaveAddress}
                                        className="px-8 py-4 bg-brand-pink text-white rounded-2xl text-10px font-semibold shadow-brand-pink/20 hover:bg-brand-pink-hover transition-all active:scale-95  cursor-pointer"
                                    >
                                        {editingAddressId ? 'Güncelle ve Kaydet' : 'Adresi Ekle'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Saved Addresses Grid */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                {savedAddresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className={`p-6 sm:p-8 rounded-xl border-2 transition-all flex flex-col justify-between relative overflow-hidden ${addr.isDefault
                                            ? 'border-brand-pink bg-rose-50/20'
                                            : 'border-slate-100 hover:border-brand-pink/30 hover:bg-slate-50/50'
                                            }`}
                                    >
                                        {addr.isDefault && (
                                            <div className="absolute top-0 right-0 px-4 sm:px-6 py-1.5 sm:py-2 bg-brand-pink text-white text-micro font-semibold rounded-bl-[1.5rem] ">VARSAYILAN</div>
                                        )}
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 mb-2  pt-4 uppercase">{addr.title}</h4>
                                            <h5 className="text-xs font-extrabold text-slate-700 mb-2 ">{addr.fullName}</h5>
                                            <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6  opacity-85">
                                                {addr.neighborhood} {addr.district ? `${addr.district}, ` : ''}<br />
                                                {addr.address}<br />
                                                {addr.city}, {addr.zipCode}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-4 mt-auto pt-4 border-t border-slate-100/50 items-center justify-between">
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={(e) => handleStartEdit(addr, e)}
                                                    className="text-10px font-semibold text-brand-pink  hover:opacity-100 opacity-60 transition-opacity cursor-pointer"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteAddress(addr.id, e)}
                                                    className="text-10px font-semibold text-rose-400  hover:opacity-100 opacity-60 transition-opacity cursor-pointer"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                            {!addr.isDefault && (
                                                <button
                                                    onClick={(e) => handleSetDefaultAddress(addr.id, e)}
                                                    className="text-[9px] font-semibold text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg  transition-colors cursor-pointer"
                                                >
                                                    Varsayılan Yap
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => {
                                        setEditingAddressId(null);
                                        setNewAddressForm({ title: '', fullName: '', email: '', phone: '', address: '', city: '', district: '', neighborhood: '', zipCode: '', isDefault: false });
                                        setIsFormOpen(true);
                                    }}
                                    className="p-8 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-brand-pink hover:text-brand-pink transition-all group cursor-pointer bg-white min-h-[220px]"
                                >
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    </div>
                                    <span className="text-10px font-semibold ">YENİ ADRES EKLE</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Section 3: Security */}
                {activeTab === 'security' && (
                    <div className="bg-white p-6 sm:p-10 lg:p-12 rounded-xl shadow-sm border border-slate-50">
                        <div className="mb-6">
                            <h2 className="text-2xl sm:text-3xl font-[1000] text-slate-900   mb-2">Güvenlik <span className="text-brand-pink">&</span> Erişim</h2>
                            <p className="text-slate-400 font-semibold  opacity-70  text-xs ">Hesap güvenliğini ve şifreni güncelle</p>
                        </div>

                        <div className="space-y-8 sm:space-y-10">
                            <div className="grid grid-cols-1 gap-6 sm:gap-8 max-w-2xl">
                                <div className="space-y-3">
                                    <label className="text-10px font-semibold text-slate-400   ml-4 ">MEVCUT ŞİFRE</label>
                                    <div className="relative">
                                        <input type="password" placeholder="••••••••" className="w-full h-14 sm:h-16 px-6 sm:px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink focus:bg-white transition-all " />
                                        <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                    <div className="space-y-3">
                                        <label className="text-10px font-semibold text-slate-400   ml-4 ">YENİ ŞİFRE</label>
                                        <input type="password" placeholder="Min. 8 Karakter" className="w-full h-14 sm:h-16 px-6 sm:px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink focus:bg-white transition-all " />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-10px font-semibold text-slate-400   ml-4 ">ŞİFRE TEKRAR</label>
                                        <input type="password" placeholder="Yeni Şifreyi Onayla" className="w-full h-14 sm:h-16 px-6 sm:px-8 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-pink focus:bg-white transition-all " />
                                    </div>
                                </div>
                            </div>

                            <button className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-slate-900 text-white rounded-2xl text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95 ">Şifreyi Güncelle</button>

                            <div className="h-[1px] bg-slate-100 w-full my-6 sm:my-10"></div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 rounded-xl bg-slate-50 border border-slate-100 gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-1 ">İki Faktörlü Doğrulama (2FA)</h4>
                                    <p className="text-xs font-semibold text-slate-400  opacity-80  ">Hesabına ekstra bir güvenlik katmanı ekle</p>
                                </div>
                                <button className="group flex items-center justify-between sm:justify-end gap-4 self-stretch sm:self-auto border border-slate-200/50 sm:border-0 p-3 sm:p-0 rounded-xl">
                                    <span className="text-10px font-semibold text-emerald-500   ">AKTİF ET</span>
                                    <div className="w-12 h-12 bg-slate-200 rounded-full relative p-1 group-hover:bg-brand-pink/20 transition-colors">
                                        <div className="w-5 h-5 bg-white rounded-full shadow-md transition-transform"></div>
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
