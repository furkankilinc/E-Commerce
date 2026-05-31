import React, { useEffect, useState } from 'react';
import { apiClient } from '../../shared/api/apiClient';
import { toast } from 'react-toastify';

interface ShippingCompany {
    id: string;
    name: string;
    logo: string;
    basePrice: number;
    deliveryTime: string;
    isActive?: boolean;
}

const ShippingPage: React.FC = () => {
    const [companies, setCompanies] = useState<ShippingCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editTarget, setEditTarget] = useState<ShippingCompany | null>(null);

    const [newForm, setNewForm] = useState({
        name: '',
        logo: '🚚',
        basePrice: '',
        deliveryTime: '2-3 İş Günü',
        isActive: true
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

    const handleToggleActive = async (company: ShippingCompany) => {
        try {
            const targetStatus = company.isActive !== undefined ? !company.isActive : false;
            const res = await apiClient.put(`/api/admin/products/shipping-companies/${company.id}`, {
                isActive: targetStatus
            });
            if (res.ok) {
                toast.success(`${company.name} durumu güncellendi.`);
                fetchCompanies();
            } else {
                toast.error('Durum güncellenirken hata oluştu.');
            }
        } catch (err) {
            toast.error('Bir hata oluştu.');
        }
    };

    const handleEditClick = (company: ShippingCompany) => {
        setEditTarget(company);
        setNewForm({
            name: company.name,
            logo: company.logo,
            basePrice: company.basePrice.toString(),
            deliveryTime: company.deliveryTime,
            isActive: company.isActive !== undefined ? company.isActive : true
        });
        setShowAddModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, logo, basePrice, deliveryTime, isActive } = newForm;
        if (!name || !logo) {
            toast.warning('Lütfen zorunlu alanları doldurun.');
            return;
        }

        try {
            if (editTarget) {
                // Update
                const res = await apiClient.put(`/api/admin/products/shipping-companies/${editTarget.id}`, {
                    name,
                    logo,
                    basePrice: parseFloat(basePrice) || 0,
                    deliveryTime,
                    isActive
                });
                if (res.ok) {
                    toast.success('Kargo firması başarıyla güncellendi!');
                    setShowAddModal(false);
                    setEditTarget(null);
                    setNewForm({ name: '', logo: '🚚', basePrice: '', deliveryTime: '2-3 İş Günü', isActive: true });
                    fetchCompanies();
                } else {
                    const data = await res.json();
                    toast.error(data.message || 'Kargo firması güncellenemedi.');
                }
            } else {
                // Create
                const res = await apiClient.post('/api/admin/products/shipping-companies', {
                    name,
                    logo,
                    basePrice: parseFloat(basePrice) || 0,
                    deliveryTime,
                    isActive: true
                });
                if (res.ok) {
                    toast.success('Kargo firması başarıyla eklendi!');
                    setShowAddModal(false);
                    setNewForm({ name: '', logo: '🚚', basePrice: '', deliveryTime: '2-3 İş Günü', isActive: true });
                    fetchCompanies();
                } else {
                    const data = await res.json();
                    toast.error(data.message || 'Kargo firması eklenemedi.');
                }
            }
        } catch (err) {
            toast.error('Bir hata oluştu.');
        }
    };

    // Calculate metrics
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.isActive !== false).length;
    const cheapestPrice = companies.length > 0 ? Math.min(...companies.map(c => c.basePrice)) : 0;
    const fastestCarrier = companies.length > 0 ? companies[0] : null;

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10 font-['Inter']">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-2xl md:text-4xl font-[1000] text-admin-navy  leading-none mb-4">
                        KARGO <span className="text-brand-pink">FİRMALARI</span>
                    </h1>
                    <p className="text-10px font-semibold text-slate-400  opacity-70">
                        Sistemde kayıtlı aktif kargo şirketlerini ve ek ücretlendirmelerini yönetin
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditTarget(null);
                        setNewForm({ name: '', logo: '🚚', basePrice: '', deliveryTime: '2-3 İş Günü', isActive: true });
                        setShowAddModal(true);
                    }}
                    className="w-full sm:w-auto px-6 py-4 bg-brand-pink text-white rounded-xl text-10px font-semibold  shadow-lg shadow-brand-pink/20 hover:opacity-95 active:scale-95 transition-all whitespace-nowrap"
                >
                    ＋ YENİ FİRMA EKLE
                </button>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 font-bold text-xl shadow-inner">
                        🚚
                    </div>
                    <div>
                        <div className="text-slate-400 text-md font-bold uppercase  mb-0.5">Toplam Kargo</div>
                        <div className="text-md font-bold text-slate-800">{totalCompanies} Firma</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 font-bold text-xl shadow-inner">
                        ⚡
                    </div>
                    <div>
                        <div className="text-slate-400 text-md font-bold uppercase  mb-0.5">Aktif Kurye</div>
                        <div className="text-md font-bold text-slate-800">{activeCompanies} Dağıtıcı</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 font-bold text-xl shadow-inner">
                        💸
                    </div>
                    <div>
                        <div className="text-slate-400 text-md font-bold uppercase  mb-0.5">En Uygun Taban</div>
                        <div className="text-md font-bold text-slate-800">{cheapestPrice} ₺</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 font-bold text-xl shadow-inner">
                        🚀
                    </div>
                    <div>
                        <div className="text-slate-400 text-md font-bold uppercase  mb-0.5">Hızlı Taşıma</div>
                        <div className="text-md font-bold text-slate-800">{fastestCarrier ? fastestCarrier.name : 'Yok'}</div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50">
                                <th className="px-10 py-8 text-10px font-semibold text-slate-400  text-left">Logo</th>
                                <th className="px-10 py-8 text-10px font-semibold text-slate-400  text-left">Firma Adı</th>
                                <th className="px-10 py-8 text-10px font-semibold text-slate-400  text-left">Teslimat Süresi</th>
                                <th className="px-10 py-8 text-10px font-semibold text-slate-400  text-left">Taban Ücret</th>
                                <th className="px-10 py-8 text-10px font-semibold text-slate-400  text-center">Durum</th>
                                <th className="px-10 py-8 text-10px font-semibold text-slate-400  text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-slate-400 font-bold ">
                                        <div className="w-8 h-8 border-3 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : companies.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-slate-400 font-bold ">
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
                                            <span className="text-xs font-semibold text-slate-900 ">{company.name}</span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-xs font-bold text-slate-500 ">{company.deliveryTime}</span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-xs font-semibold text-slate-900 ">{company.basePrice.toFixed(2)} ₺</span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <button
                                                onClick={() => handleToggleActive(company)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${company.isActive !== false
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {company.isActive !== false ? 'AKTİF' : 'PASİF'}
                                            </button>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleEditClick(company)}
                                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-nano font-semibold  border border-slate-200 hover:bg-slate-200"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(company.id)}
                                                    className="px-4 py-2 bg-rose-50 text-rose-500 rounded-xl text-nano font-semibold  border border-rose-100 hover:bg-rose-500 hover:text-white"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Glassmorphic Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-lg shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-slate-50/50">
                            <h3 className="text-lg font-[1000] text-slate-900 ">
                                {editTarget ? 'FİRMAYI' : 'YENİ'} <span className="text-brand-pink">DÜZENLE</span>
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
                                <label className="text-nano font-semibold text-gray-400 ml-2 ">FİRMA ADI *</label>
                                <input
                                    type="text"
                                    required
                                    value={newForm.name}
                                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                                    className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                    placeholder="Örn: Sürat Kargo"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-nano font-semibold text-gray-400 ml-2 ">LOGO İKONU *</label>
                                    <select
                                        value={newForm.logo}
                                        onChange={(e) => setNewForm({ ...newForm, logo: e.target.value })}
                                        className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                    >
                                        <option value="🚚">🚚 Kamyon</option>
                                        <option value="⚡">⚡ Şimşek</option>
                                        <option value="📦">📦 Paket</option>
                                        <option value="✈️">✈️ Uçak</option>
                                        <option value="🛵">🛵 Motor</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-nano font-semibold text-gray-400 ml-2 ">TESLİMAT SÜRESİ</label>
                                    <input
                                        type="text"
                                        value={newForm.deliveryTime}
                                        onChange={(e) => setNewForm({ ...newForm, deliveryTime: e.target.value })}
                                        className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                        placeholder="Örn: 2-3 İş Günü"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-nano font-semibold text-gray-400 ml-2 ">TABAN ÜCRET (₺)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newForm.basePrice}
                                    onChange={(e) => setNewForm({ ...newForm, basePrice: e.target.value })}
                                    className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newForm.isActive}
                                        onChange={(e) => setNewForm({ ...newForm, isActive: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                                <span className="text-10px font-semibold text-slate-600 ">Aktif Kargo Firması</span>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-4 py-5 bg-brand-pink text-white rounded-md text-10px font-semibold shadow-lg shadow-brand-pink/20 cursor-pointer flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors "
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
