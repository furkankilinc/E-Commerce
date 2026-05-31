import React, { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AttributeValue {
    id: string;
    attributeId: string;
    value: string;
}

interface Attribute {
    id: string;
    name: string;
    values: AttributeValue[];
    categories: { id: string, name: string }[];
    createdAt: string;
    updatedAt: string;
}

interface Category {
    id: string;
    name: string;
    parentId?: string;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
const AttributeModal: React.FC<{
    initial?: Attribute | null;
    allCategories: Category[];
    onSave: (data: { name: string; values: string[]; categoryIds: string[] }) => Promise<void>;
    onClose: () => void;
}> = ({ initial, allCategories, onSave, onClose }) => {
    const [name, setName] = useState(initial?.name || '');
    const [values, setValues] = useState<string[]>(initial?.values.map(v => v.value) || []);
    const [selectedCatIds, setSelectedCatIds] = useState<string[]>(initial?.categories.map(c => c.id) || []);
    const [newValue, setNewValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const addValue = () => {
        if (!newValue.trim()) return;
        if (values.includes(newValue.trim())) {
            setNewValue('');
            return;
        }
        setValues([...values, newValue.trim()]);
        setNewValue('');
    };

    const removeValue = (val: string) => {
        setValues(values.filter(v => v !== val));
    };

    const toggleCategory = (id: string) => {
        setSelectedCatIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return setError('İsim zorunludur.');
        if (values.length === 0) return setError('En az bir değer eklemelisiniz.');

        setSaving(true);
        setError('');
        try {
            await onSave({ name: name.trim(), values, categoryIds: selectedCatIds });
        } catch (err: any) {
            setError(err.message || 'Kaydetme hatası.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col my-8">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-extrabold text-slate-800">
                        {initial ? 'Özelliği Düzenle' : 'Yeni Özellik Ekle'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">{error}</div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Side: General Info */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500   mb-1.5">Özellik Adı</label>
                                <input
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-semibold"
                                    placeholder="Örn: Renk, Beden, Materyal"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500   mb-1.5">Seçenek Değerleri</label>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        value={newValue}
                                        onChange={e => setNewValue(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addValue())}
                                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-colors"
                                        placeholder="Değer ekle (örn: Kırmızı)"
                                    />
                                    <button
                                        type="button"
                                        onClick={addValue}
                                        className="px-4 py-3 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-colors "
                                    >
                                        Ekle
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[100px]">
                                    {values.length === 0 && (
                                        <span className="text-slate-400 text-xs ">Henüz değer eklenmedi...</span>
                                    )}
                                    {values.map(val => (
                                        <span key={val} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm transition-all ">
                                            {val}
                                            <button type="button" onClick={() => removeValue(val)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" /></svg>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Category Selection */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500   mb-3">Geçerli Kategoriler</label>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 h-[320px] overflow-y-auto space-y-2 custom-scrollbar">
                                {allCategories.length === 0 && <p className="text-slate-400 text-xs p-4 ">Kategori bulunamadı.</p>}
                                {allCategories.map(cat => (
                                    <label key={cat.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-pink-200 hover:bg-pink-50/30 transition-all group">
                                        <input
                                            type="checkbox"
                                            checked={selectedCatIds.includes(cat.id)}
                                            onChange={() => toggleCategory(cat.id)}
                                            className="w-5 h-5 rounded-lg text-pink-500 focus:ring-pink-500 border-slate-200 cursor-pointer"
                                        />
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-semibold transition-colors ${selectedCatIds.includes(cat.id) ? 'text-pink-600' : 'text-slate-700'}`}>
                                                {cat.name}
                                            </span>
                                            {cat.parentId && <span className="text-10px text-slate-400 font-medium">Alt Kategori</span>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <p className="mt-2 text-10px text-slate-400 font-medium ">* Kategori seçilmezse "Global" olarak kabul edilir.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-xs font-semibold  bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors ">İptal</button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-4 text-xs font-semibold  bg-pink-500 text-white rounded-xl hover:bg-pink-600 shadow-lg shadow-pink-500/20 transition-all disabled:opacity-50 "
                        >
                            {saving ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AttributesPage: React.FC = () => {
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Attribute | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Attribute | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [attrRes, catRes] = await Promise.all([
                fetch('/api/attributes/admin'),
                fetch('/api/categories')
            ]);
            if (attrRes.ok) setAttributes(await attrRes.json());
            if (catRes.ok) setCategories(await catRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = async (data: { name: string; values: string[]; categoryIds: string[] }) => {
        const method = editTarget ? 'PUT' : 'POST';
        const url = editTarget ? `/api/attributes/admin/${editTarget.id}` : '/api/attributes/admin';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            showToast(editTarget ? 'Özellik başarıyla güncellendi.' : 'Yeni özellik başarıyla oluşturuldu.');
            setModalOpen(false);
            setEditTarget(null);
            load();
        } else {
            const err = await res.json();
            throw new Error(err.message || 'Bir hata oluştu.');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`/api/attributes/admin/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Özellik silindi.');
                setDeleteTarget(null);
                load();
            }
        } catch (err) {
            showToast('Silme hatası.', false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg animate-slideIn ${toast.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 ">Ürün Seçenekleri</h1>
                    <p className="text-slate-500 font-medium mt-1 text-xs sm:text-sm">Varyantlar için kullanılabilecek global özellikleri yönetin.</p>
                </div>
                <button
                    onClick={() => { setEditTarget(null); setModalOpen(true); }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-lg shadow-pink-500/20 transition-transform whitespace-nowrap"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3" /></svg>
                    Yeni Ekle
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-slate-400 font-semibold text-sm">Yükleniyor...</span>
                    </div>
                ) : attributes.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="text-4xl mb-4">✨</div>
                        <p className="text-slate-400 font-medium">Henüz bir özellik tanımlanmamış.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400  ">Özellik</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400  ">Değerler</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400  ">Kategoriler</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400   text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {attributes.map(attr => (
                                    <tr key={attr.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-6 py-5">
                                            <span className="font-semibold text-slate-800">{attr.name}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {attr.values.map(v => (
                                                    <span key={v.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-caption font-semibold  ">
                                                        {v.value}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {attr.categories.length === 0 ? (
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md text-10px font-semibold  ">Global</span>
                                                ) : (
                                                    attr.categories.map(c => (
                                                        <span key={c.id} className="px-2 py-0.5 bg-pink-50 text-pink-500 rounded-md text-10px font-semibold  ">
                                                            {c.name}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setEditTarget(attr); setModalOpen(true); }}
                                                    className="p-2 text-slate-400 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(attr)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <AttributeModal
                    initial={editTarget}
                    allCategories={categories}
                    onSave={handleSave}
                    onClose={() => { setModalOpen(false); setEditTarget(null); }}
                />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl animate-popIn">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2" /></svg>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">Emin misiniz?</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            <span className="font-semibold text-slate-800">"{deleteTarget.name}"</span> özelliği ve tüm değerleri kalıcı olarak silinecek.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">Vazgeç</button>
                            <button onClick={handleDelete} className="flex-1 py-3 text-sm font-semibold text-white bg-red-500 rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all">Evet, Sil</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttributesPage;
