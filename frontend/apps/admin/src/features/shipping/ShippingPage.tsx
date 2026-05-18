import React, { useEffect, useState } from 'react';
import { apiClient } from '../../shared/api/apiClient';
import { toast } from 'react-toastify';

interface ShippingCompany {
    id: string;
    name: string;
    logo: string;
    basePrice: number;
    deliveryTime: string;
}

const ShippingPage: React.FC = () => {
    const [companies, setCompanies] = useState<ShippingCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const [newForm, setNewForm] = useState({
        name: '',
        logo: '🚚',
        basePrice: '',
        deliveryTime: '2-3 İş Günü'
    });

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/products/shipping-companies');
            const data = await apiClient.handleResponse(res);
            if (data.success) {
                setCompanies(data.data);
            }
        } catch (err) {
            console.error('Kargo firmaları yüklenemedi:', err);
            toast.error('Kargo firmaları listesi alınamadı.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu kargo firmasını silmek istediğinizden emin misiniz?')) return;
        try {
            const res = await apiClient.delete(`/api/admin/products/shipping-companies/${id}`);
            if (res.ok) {
                toast.success('Kargo firması silindi.');
                fetchCompanies();
            } else {
                toast.error('Silme işlemi başarısız.');
            }
        } catch (err) {
            toast.error('Bir hata oluştu.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, logo, basePrice, deliveryTime } = newForm;
        if (!name || !logo) {
            toast.warning('Lütfen zorunlu alanları doldurun.');
            return;
        }

        try {
            const res = await apiClient.post('/api/admin/products/shipping-companies', {
                name,
                logo,
                basePrice: parseFloat(basePrice) || 0,
                deliveryTime
            });
            if (res.ok) {
                toast.success('Kargo firması başarıyla eklendi!');
                setShowAddModal(false);
                setNewForm({ name: '', logo: '🚚', basePrice: '', deliveryTime: '2-3 İş Günü' });
                fetchCompanies();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Kargo firması eklenemedi.');
            }
        } catch (err) {
            toast.error('Bir hata oluştu.');
        }
    };

    return (
        <div className="p-10 space-y-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-[1000] text-admin-navy tracking-tighter italic leading-none mb-4">
                        KARGO <span className="text-brand-pink">FİRMALARI</span>
                    </h1>
                    <p className="text-10px font-semibold text-slate-400 tracking-widest italic opacity-70">
                        Sistemde kayıtlı aktif kargo şirketlerini ve ek ücretlendirmelerini yönetin
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-4 bg-brand-pink text-white rounded-xl text-10px font-semibold tracking-widest italic shadow-lg shadow-brand-pink/20 hover:scale-105 transition-all"
                >
                    ＋ YENİ FİRMA EKLE
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-50 bg-slate-50/50">
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400 tracking-widest italic text-left">Logo</th>
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400 tracking-widest italic text-left">Firma Adı</th>
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400 tracking-widest italic text-left">Teslimat Süresi</th>
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400 tracking-widest italic text-left">Taban Ücret</th>
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400 tracking-widest italic text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center text-slate-400 font-bold italic tracking-widest">
                                    Yükleniyor...
                                </td>
                            </tr>
                        ) : companies.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center text-slate-400 font-bold italic tracking-widest">
                                    Kargo firması bulunamadı.
                                </td>
                            </tr>
                        ) : (
                            companies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-8">
                                        <span className="text-3xl">{company.logo}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="text-xs font-semibold text-slate-900 italic">{company.name}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="text-xs font-bold text-slate-500 italic">{company.deliveryTime}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="text-xs font-semibold text-slate-900 italic">{company.basePrice.toFixed(2)} ₺</span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button
                                            onClick={() => handleDelete(company.id)}
                                            className="px-4 py-2 bg-rose-500 text-white rounded-xl text-9px font-semibold tracking-widest italic shadow-lg shadow-rose-500/20 hover:bg-rose-600"
                                        >
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Glassmorphic Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-lg shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-slate-50/50">
                            <h3 className="text-lg font-[1000] text-slate-900 italic tracking-tighter">
                                YENİ <span className="text-brand-pink">KARGO FİRMASI</span>
                            </h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-8 h-8 rounded-full border border-gray-100 hover:border-gray-200 text-gray-400 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer font-semibold text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-9px font-semibold text-gray-400 tracking-widest ml-2 italic">FİRMA ADI *</label>
                                <input
                                    type="text"
                                    required
                                    value={newForm.name}
                                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                                    className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic text-slate-800"
                                    placeholder="Örn: Sürat Kargo"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-9px font-semibold text-gray-400 tracking-widest ml-2 italic">LOGO İKONU *</label>
                                    <select
                                        value={newForm.logo}
                                        onChange={(e) => setNewForm({ ...newForm, logo: e.target.value })}
                                        className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic text-slate-800"
                                    >
                                        <option value="🚚">🚚 Kamyon</option>
                                        <option value="⚡">⚡ Şimşek</option>
                                        <option value="📦">📦 Paket</option>
                                        <option value="✈️">✈️ Uçak</option>
                                        <option value="🛵">🛵 Motor</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-9px font-semibold text-gray-400 tracking-widest ml-2 italic">TESLİMAT SÜRESİ</label>
                                    <input
                                        type="text"
                                        value={newForm.deliveryTime}
                                        onChange={(e) => setNewForm({ ...newForm, deliveryTime: e.target.value })}
                                        className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic text-slate-800"
                                        placeholder="Örn: 2-3 İş Günü"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-9px font-semibold text-gray-400 tracking-widest ml-2 italic">TABAN ÜCRET (₺)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newForm.basePrice}
                                    onChange={(e) => setNewForm({ ...newForm, basePrice: e.target.value })}
                                    className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic text-slate-800"
                                    placeholder="0.00"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-4 py-5 bg-brand-pink text-white rounded-md text-10px font-semibold tracking-widest shadow-lg shadow-brand-pink/20 cursor-pointer flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors italic"
                            >
                                💾 FİRMAYI KAYDET
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingPage;
