import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { apiClient } from '../../../shared/api/apiClient';
import Pagination from '../../../shared/components/Pagination';

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
                        : <span className="text-slate-300 ">Yok</span>}
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
                                        const res = await apiClient.put(`/api/categories/admin/${cat.id}`, { isActive: true });
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
    availableAttributes: { name: string; values: string[] }[];
    onChange: (specs: FilterSpec[]) => void;
}> = ({ specs, availableAttributes, onChange }) => {
    const [newName, setNewName] = useState('');
    const [newVal, setNewVal] = useState<Record<number, string>>({});
    const [showSuggestions, setShowSuggestions] = useState(false);

    const addSpec = (name?: string, values?: string[]) => {
        const finalName = (name || newName).trim();
        if (!finalName) return;
        if (specs.some(s => s.name === finalName)) return;
        onChange([...specs, { name: finalName, values: values || [] }]);
        setNewName('');
        setShowSuggestions(false);
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
            {/* Add new spec with suggestions */}
            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            value={newName}
                            onChange={e => { setNewName(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="Örn: RAM, CPU, Ekran Kartı"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-pink/5 transition-all"
                        />
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-xl rounded-2xl z-20 max-h-60 overflow-y-auto py-2 animate-in fade-in slide-in-from-top-2">
                                {availableAttributes
                                    .filter(a => a.name.toLowerCase().includes(newName.toLowerCase()) && !specs.some(s => s.name === a.name))
                                    .map(attr => (
                                        <button
                                            key={attr.name}
                                            type="button"
                                            onClick={() => addSpec(attr.name, attr.values)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                                                {attr.name}
                                            </span>
                                            <span className="text-nano bg-slate-100 px-2 py-0.5 rounded-full text-slate-400  ">
                                                {attr.values.length} seçenek
                                            </span>
                                        </button>
                                    ))}
                                <button onClick={() => setShowSuggestions(false)} className="w-full py-2 text-10px text-slate-300 font-bold hover:text-slate-500   border-t border-slate-50 mt-1">Kapat</button>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => addSpec()}
                        className="px-6 py-3 bg-brand-pink text-white text-sm font-semibold rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-brand-pink/20"
                    >
                        + EKLE
                    </button>
                </div>
            </div>

            {/* Spec list */}
            <div className="grid grid-cols-1 gap-4">
                {specs.map((spec, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-pink/30 hover: hover:shadow-slate-200/50 transition-all group">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                            <span className="font-semibold text-xs text-admin-dark   flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                                {spec.name}
                            </span>
                            <button type="button" onClick={() => removeSpec(idx)} className="text-10px text-red-400 hover:text-red-500 font-semibold   transition-colors">Kaldır</button>
                        </div>

                        {/* Values */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {spec.values.map(val => (
                                <span key={val} className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl text-10px font-semibold text-slate-500 ">
                                    {val}
                                    <button type="button" onClick={() => removeValue(idx, val)} className="text-slate-300 hover:text-red-500 transition-colors">×</button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                value={newVal[idx] || ''}
                                onChange={e => setNewVal(prev => ({ ...prev, [idx]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addValue(idx, newVal[idx] || ''))}
                                placeholder="Yeni değer..."
                                className="flex-1 px-4 py-2 text-xs border border-slate-100 rounded-xl focus:outline-none focus:border-brand-pink transition-all bg-slate-50/50 font-bold"
                            />
                            <button
                                type="button"
                                onClick={() => addValue(idx, newVal[idx] || '')}
                                className="px-4 py-2 bg-slate-100 text-slate-500 text-10px font-semibold rounded-xl hover:bg-slate-200 transition-colors  "
                            >
                                EKLE
                            </button>
                        </div>
                    </div>
                ))}
            </div>
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

    const [globalAttrs, setGlobalAttrs] = useState<{ name: string; values: string[] }[]>([]);

    useEffect(() => {
        // Fetch all attributes to provide suggestions
        const fetchAttrs = async () => {
            try {
                const res = await apiClient.get('/api/attributes');
                if (res.ok) {
                    const data = await res.json();
                    setGlobalAttrs(data.map((a: any) => ({
                        name: a.name,
                        values: a.values.map((v: any) => v.value)
                    })));
                }
            } catch (err) { }
        };
        fetchAttrs();
    }, []);

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

    // Merge global attributes with all existing category attributes for better suggestions
    const allAvailableAttributes = useMemo(() => {
        const merged: Record<string, Set<string>> = {};

        // 1. From Global Attributes
        globalAttrs.forEach(a => {
            if (!a || !a.name) return;
            if (!merged[a.name]) merged[a.name] = new Set<string>();
            const targetSet = merged[a.name];
            if (targetSet) {
                (a.values || []).forEach(v => targetSet.add(v));
            }
        });

        // 2. From all existing categories (The "bilgisayar" part the user mentioned)
        categories.forEach(c => {
            if (c && c.filterValues) {
                Object.entries(c.filterValues).forEach(([name, values]) => {
                    if (!name) return;
                    if (!merged[name]) merged[name] = new Set<string>();
                    const targetSet = merged[name];
                    if (targetSet && Array.isArray(values)) {
                        values.forEach(v => targetSet.add(v as string));
                    }
                });
            }
        });

        return Object.entries(merged).map(([name, values]) => ({
            name,
            values: Array.from(values)
        }));
    }, [globalAttrs, categories]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50">
                    <div>
                        <h2 className="text-xl font-semibold text-admin-dark ">
                            {initial ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
                        </h2>
                        <p className="text-10px font-bold text-slate-400   mt-0.5">Kategori Yapılandırması</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" /></svg>
                    </button>
                </div>

                {/* Body */}
                <form id="cat-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-8 py-6 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-pulse flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-10px font-semibold text-slate-400   flex items-center gap-2">
                                    <span className="w-1 h-3 bg-brand-pink rounded-full"></span>
                                    Kategori Adı *
                                </label>
                                <input
                                    required
                                    value={name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-pink/5 focus:bg-white focus:border-brand-pink/30 transition-all"
                                    placeholder="Örn: Akıllı Telefonlar"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-10px font-semibold text-slate-400  ">Slug *</label>
                                <input
                                    required
                                    value={slug}
                                    onChange={e => setSlug(slugify(e.target.value))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-mono text-slate-500 focus:outline-none focus:ring-4 focus:ring-brand-pink/5 transition-all"
                                    placeholder="akilli-telefonlar"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-10px font-semibold text-slate-400  ">Üst Kategori</label>
                            <select
                                value={parentId}
                                onChange={e => setParentId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-pink/5 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">— Ana Kategori (Üst yok) —</option>
                                {eligible.map(c => (
                                    <option key={c.id} value={c.id}>{c.parentId ? `  ↳ ${c.name}` : c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-10px font-semibold text-slate-400  ">Açıklama</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-pink/5 transition-all resize-none"
                                placeholder="..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-10px font-semibold text-slate-400  ">Görsel URL</label>
                                <input
                                    value={image}
                                    onChange={e => setImage(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs focus:outline-none focus:ring-4 focus:ring-brand-pink/5 transition-all"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex flex-col justify-end pb-1">
                                <div className="flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                    <span className="text-10px font-semibold text-slate-600  ">Aktif Kategori</span>
                                </div>
                            </div>
                        </div>

                        {/* ─── Özel Filtreler ─────────────────────────────────── */}
                        <div className="pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                                    <h3 className="text-sm font-semibold text-admin-dark  ">Ürün Özellikleri</h3>
                                </div>
                            </div>
                            <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-2xl p-6">
                                <FilterSpecBuilder
                                    specs={filterSpecs}
                                    availableAttributes={allAvailableAttributes}
                                    onChange={setFilterSpecs}
                                />
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
    const [page, setPage] = useState(1);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/categories/admin');
            if (res.ok) setCategories(await res.json());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = async (data: Partial<Category>) => {
        const url = editTarget ? `/api/categories/admin/${editTarget.id}` : '/api/categories/admin';

        const res = editTarget
            ? await apiClient.put(url, data)
            : await apiClient.post(url, data);

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
            const res = await apiClient.delete(`/api/categories/admin/${deleteTarget.id}`);
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

    useEffect(() => {
        setPage(1);
    }, [search]);

    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.includes(search.toLowerCase())
    );

    const treeRoots = buildTree(filtered);
    const limit = 10;
    const paginatedTreeRoots = useMemo(() => {
        const start = (page - 1) * limit;
        return treeRoots.slice(start, start + limit);
    }, [treeRoots, page]);

    const totalPages = Math.ceil(treeRoots.length / limit) || 1;

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg ${toast.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-admin-dark ">Kategoriler</h1>
                    <p className="text-slate-500 mt-1 font-medium text-xs sm:text-sm">{categories.length} kategori — hiyerarşik özel filtrelerle yönetin</p>
                </div>
                <button
                    onClick={() => { setEditTarget(null); setModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-pink text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-brand-pink/20 hover:opacity-90 transition-opacity"
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
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400  ">Kategori</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400  ">Tip</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400  ">Ürün</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400  ">Özel Filtreler</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400  ">Durum</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400  ">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTreeRoots.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-400 text-sm font-medium">
                                            {search ? 'Sonuç bulunamadı.' : 'Henüz kategori yok. İlk kategoriyi oluşturun!'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTreeRoots.map(cat => (
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
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="mt-8">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            )}

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
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
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
