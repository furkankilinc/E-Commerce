import React, { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parentId: string | null;
    isActive: boolean;
    filterValues: Record<string, string[]> | null;
    createdAt: string;
    _count: { children: number; products: number };
}

interface FilterSpec {
    name: string;         // e.g. "RAM"
    values: string[];     // e.g. ["8GB", "16GB", "32GB"]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const slugify = (val: string) =>
    val.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const buildTree = (cats: Category[]): (Category & { children: Category[] })[] => {
    const map: Record<string, Category & { children: Category[] }> = {};
    cats.forEach(c => { map[c.id] = { ...c, children: [] }; });
    const roots: (Category & { children: Category[] })[] = [];
    cats.forEach(c => {
        const node = map[c.id];
        if (!node) return;
        if (c.parentId && map[c.parentId]) {
            map[c.parentId]!.children.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
};

// ─── Single Row ──────────────────────────────────────────────────────────────
const CategoryRow: React.FC<{
    cat: Category & { children: Category[] };
    depth: number;
    onEdit: (c: Category) => void;
    onDelete: (c: Category) => void;
}> = ({ cat, depth, onEdit, onDelete }) => {
    const [open, setOpen] = useState(depth === 0);

    return (
        <>
            <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${!cat.isActive ? 'opacity-50' : ''}`}>
                <td className="py-3 px-4">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
                        {cat.children.length > 0 ? (
                            <button onClick={() => setOpen(p => !p)} className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors flex-shrink-0">
                                <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 5l7 7-7 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        ) : (
                            <div className="w-6 h-6 flex-shrink-0" />
                        )}
                        <div>
                            <div className="font-semibold text-sm text-admin-dark">{cat.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{cat.slug}</div>
                        </div>
                    </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-500">{cat.parentId ? '↳ Alt kategori' : 'Ana kategori'}</td>
                <td className="py-3 px-4 text-sm text-slate-500">{cat._count.products}</td>
                <td className="py-3 px-4 text-sm text-slate-500">
                    {cat.filterValues && Object.keys(cat.filterValues).length > 0
                        ? Object.keys(cat.filterValues).join(', ')
                        : <span className="text-slate-300 italic">Yok</span>}
                </td>
                <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${cat.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {cat.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                </td>
                <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                        {!cat.isActive && (
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`/api/categories/admin/${cat.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ isActive: true })
                                        });
                                        if (res.ok) window.location.reload();
                                    } catch (err) { }
                                }}
                                className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white shadow-md shadow-emerald-500/20 rounded-lg hover:bg-emerald-600 transition-all"
                            >
                                Aktifleştir
                            </button>
                        )}
                        {cat.isActive && (
                            <button
                                onClick={() => onEdit(cat)}
                                className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-brand-pink hover:text-white transition-all"
                            >
                                Düzenle
                            </button>
                        )}
                        <button
                            onClick={() => onDelete(cat)}
                            className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                        >
                            Sil
                        </button>
                    </div>
                </td>
            </tr>
            {open && cat.children.map(child => (
                <CategoryRow key={child.id} cat={child as any} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
            ))}
        </>
    );
};


// ─── Filter Spec Builder ─────────────────────────────────────────────────────
const FilterSpecBuilder: React.FC<{
    specs: FilterSpec[];
    onChange: (specs: FilterSpec[]) => void;
}> = ({ specs, onChange }) => {
    const [newName, setNewName] = useState('');
    const [newVal, setNewVal] = useState<Record<number, string>>({});

    const addSpec = () => {
        if (!newName.trim()) return;
        onChange([...specs, { name: newName.trim(), values: [] }]);
        setNewName('');
    };

    const removeSpec = (idx: number) => {
        onChange(specs.filter((_, i) => i !== idx));
    };

    const addValue = (idx: number, val: string) => {
        if (!val.trim()) return;
        const updated = [...specs];
        const spec = updated[idx];
        if (spec && !spec.values.includes(val.trim())) {
            updated[idx] = { name: spec.name, values: [...spec.values, val.trim()] };
            onChange(updated);
        }
        setNewVal(prev => ({ ...prev, [idx]: '' }));
    };

    const removeValue = (idx: number, val: string) => {
        const updated = [...specs];
        const spec = updated[idx];
        if (!spec) return;
        updated[idx] = { name: spec.name, values: spec.values.filter(v => v !== val) };
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {/* Add new spec */}
            <div className="flex gap-2">
                <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpec())}
                    placeholder="Filtre adı (örn: RAM, CPU, Renk)"
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-pink"
                />
                <button
                    type="button"
                    onClick={addSpec}
                    className="px-4 py-2 bg-brand-pink text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                    + Ekle
                </button>
            </div>

            {/* Spec list */}
            {specs.map((spec, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm text-admin-dark">{spec.name}</span>
                        <button type="button" onClick={() => removeSpec(idx)} className="text-xs text-red-400 hover:text-red-600 font-semibold">Kaldır</button>
                    </div>

                    {/* Values */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {spec.values.map(val => (
                            <span key={val} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                                {val}
                                <button type="button" onClick={() => removeValue(idx, val)} className="text-slate-400 hover:text-red-500 transition-colors">×</button>
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            value={newVal[idx] || ''}
                            onChange={e => setNewVal(prev => ({ ...prev, [idx]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addValue(idx, newVal[idx] || ''))}
                            placeholder={`${spec.name} değeri ekle...`}
                            className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-pink"
                        />
                        <button
                            type="button"
                            onClick={() => addValue(idx, newVal[idx] || '')}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Ekle
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
const CategoryModal: React.FC<{
    initial?: Category | null;
    categories: Category[];
    onSave: (data: Partial<Category>) => Promise<void>;
    onClose: () => void;
}> = ({ initial, categories, onSave, onClose }) => {
    const [name, setName] = useState(initial?.name || '');
    const [slug, setSlug] = useState(initial?.slug || '');
    const [description, setDescription] = useState(initial?.description || '');
    const [image, setImage] = useState(initial?.image || '');
    const [parentId, setParentId] = useState<string>(initial?.parentId || '');
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);
    const [filterSpecs, setFilterSpecs] = useState<FilterSpec[]>(() => {
        if (!initial?.filterValues) return [];
        return Object.entries(initial.filterValues).map(([name, values]) => ({ name, values }));
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleNameChange = (val: string) => {
        setName(val);
        if (!initial) setSlug(slugify(val));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const filterValues = filterSpecs.reduce<Record<string, string[]>>((acc, s) => {
                if (s.values.length > 0) acc[s.name] = s.values;
                return acc;
            }, {});

            await onSave({
                name,
                slug,
                description: description || undefined,
                image: image || undefined,
                parentId: parentId || undefined,
                isActive,
                filterValues,
            });
        } catch (err: any) {
            setError(err.message || 'Kaydetme hatası.');
        } finally {
            setSaving(false);
        }
    };

    const eligible = categories.filter(c => c.id !== initial?.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-extrabold text-admin-dark">
                        {initial ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" /></svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-6 py-5 space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">{error}</div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Kategori Adı *</label>
                                <input
                                    required
                                    value={name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-pink transition-colors"
                                    placeholder="Dizüstü Bilgisayar"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Slug *</label>
                                <input
                                    required
                                    value={slug}
                                    onChange={e => setSlug(slugify(e.target.value))}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-pink transition-colors"
                                    placeholder="dizustu-bilgisayar"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Üst Kategori</label>
                            <select
                                value={parentId}
                                onChange={e => setParentId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-pink transition-colors"
                            >
                                <option value="">— Ana Kategori (Üst yok) —</option>
                                {eligible.map(c => (
                                    <option key={c.id} value={c.id}>{c.parentId ? `  ↳ ${c.name}` : c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Açıklama</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-pink transition-colors resize-none"
                                placeholder="Opsiyonel kategori açıklaması..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Görsel URL</label>
                            <input
                                value={image}
                                onChange={e => setImage(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-pink transition-colors"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                            </label>
                            <span className="text-sm font-semibold text-slate-600">Aktif</span>
                        </div>

                        {/* ─── Özel Filtreler ─────────────────────────────────── */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-extrabold text-admin-dark">Özel Filtreler</h3>
                                <span className="text-xs text-slate-400 font-medium">Bu kategoriye özel filtre seçenekleri</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <FilterSpecBuilder specs={filterSpecs} onChange={setFilterSpecs} />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">İptal</button>
                    <button
                        type="submit"
                        form="cat-form"
                        onClick={handleSubmit as any}
                        disabled={saving}
                        className="px-6 py-2 text-sm font-bold text-white bg-brand-pink rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-pink/20"
                    >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const CategoriesPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Category | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/categories/admin');
            if (res.ok) setCategories(await res.json());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = async (data: Partial<Category>) => {
        const method = editTarget ? 'PUT' : 'POST';
        const url = editTarget ? `/api/categories/admin/${editTarget.id}` : '/api/categories/admin';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Hata');

        showToast(editTarget ? 'Kategori güncellendi.' : 'Kategori oluşturuldu.');
        setModalOpen(false);
        setEditTarget(null);
        load();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/categories/admin/${deleteTarget.id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            showToast(json.message);
            setDeleteTarget(null);
            load();
        } catch (err: any) {
            showToast(err.message, false);
        } finally {
            setDeleting(false);
        }
    };

    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.includes(search.toLowerCase())
    );

    const treeRoots = buildTree(filtered);

    return (
        <div className="p-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg ${toast.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-admin-dark tracking-tight">Kategoriler</h1>
                    <p className="text-slate-500 mt-1 font-medium">{categories.length} kategori — hiyerarşik özel filtrelerle yönetin</p>
                </div>
                <button
                    onClick={() => { setEditTarget(null); setModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-pink text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-pink/20 hover:opacity-90 transition-opacity"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3" strokeLinecap="round" /></svg>
                    Yeni Kategori
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6 w-full max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" /></svg>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Kategori ara..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-pink transition-colors"
                />
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
                        <div className="w-6 h-6 border-2 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-semibold text-sm">Yükleniyor...</span>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Kategori</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tip</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Ürün</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Özel Filtreler</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Durum</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {treeRoots.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400 text-sm font-medium">
                                        {search ? 'Sonuç bulunamadı.' : 'Henüz kategori yok. İlk kategoriyi oluşturun!'}
                                    </td>
                                </tr>
                            ) : (
                                treeRoots.map(cat => (
                                    <CategoryRow
                                        key={cat.id}
                                        cat={cat}
                                        depth={0}
                                        onEdit={c => { setEditTarget(c); setModalOpen(true); }}
                                        onDelete={setDeleteTarget}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <CategoryModal
                    initial={editTarget}
                    categories={categories}
                    onSave={handleSave}
                    onClose={() => { setModalOpen(false); setEditTarget(null); }}
                />
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-extrabold text-admin-dark mb-2">Kategoriyi Sil</h3>
                        <p className="text-sm text-slate-500 mb-1">
                            <span className="font-bold text-admin-dark">{deleteTarget.name}</span> kategorisini silmek istediğinizden emin misiniz?
                        </p>
                        {deleteTarget._count.children > 0 && (
                            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 font-semibold mb-3">⚠ {deleteTarget._count.children} alt kategorisi var, önce onları silin.</p>
                        )}
                        {deleteTarget._count.products > 0 && (
                            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 font-semibold mb-3">⚠ {deleteTarget._count.products} ürünü var, kategori pasif yapılacak.</p>
                        )}
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">İptal</button>
                            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
                                {deleting ? 'Siliniyor...' : 'Sil'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesPage;
