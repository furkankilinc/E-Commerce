import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCollections } from '../store/collections.store';
import { useCart } from '../../cart/cart.store';
import { toast } from 'react-toastify';

const EMOJIS = ['📦', '💻', '🎮', '📱', '👟', '⌚', '🎧', '📷', '🏠', '🎁', '💡', '🛒', '❤️', '⭐', '🔥', '✈️'];

// ─── Single Collection View ────────────────────────────────────────────────────
const CollectionDetailView: React.FC<{ collectionId: string }> = ({ collectionId }) => {
    const { collections, removeItem, delete: deleteCollection, rename } = useCollections();
    const { addItem } = useCart();
    const col = collections.find(c => c.id === collectionId);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmoji, setEditEmoji] = useState('');

    if (!col) {
        return (
            <div className="text-center py-32">
                <p className="text-2xl font-black text-gray-900 italic uppercase mb-4">Koleksiyon bulunamadı</p>
                <Link to="/collections" className="text-brand-pink font-black text-sm underline">← Geri Dön</Link>
            </div>
        );
    }

    const handleSaveRename = async () => {
        if (editName.trim()) {
            await rename(col.id, editName.trim(), editEmoji);
            toast.success('Koleksiyon güncellendi!', { autoClose: 1000 });
        }
        setIsEditing(false);
    };

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20 py-20">
            {/* Back */}
            <Link to="/collections" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest italic hover:text-brand-pink transition-colors mb-12">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" /></svg>
                Koleksiyonlarım
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
                {isEditing ? (
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {EMOJIS.map(e => (
                                <button key={e} onClick={() => setEditEmoji(e)}
                                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${editEmoji === e ? 'bg-brand-pink/10 ring-2 ring-brand-pink scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >{e}</button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            aria-label="Koleksiyon adını düzenle"
                            className="w-full max-w-md h-16 px-6 bg-gray-50 border-2 border-brand-pink rounded-2xl text-2xl font-black italic outline-none"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">İptal</button>
                            <button onClick={handleSaveRename} className="px-10 py-3 bg-brand-pink text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-pink/20">Kaydet</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-[10px] font-black text-brand-pink tracking-[0.4em] uppercase italic mb-3">Koleksiyon</p>
                        <h1 className="text-5xl sm:text-7xl font-[1000] text-gray-900 leading-none tracking-tighter italic uppercase flex items-center gap-4">
                            <span>{col.emoji}</span>
                            <span>{col.name}</span>
                        </h1>
                        <p className="text-gray-500 text-sm font-bold mt-4 italic">{col.items.length} ürün</p>
                    </div>
                )}

                {!isEditing && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setEditName(col.name); setEditEmoji(col.emoji); setIsEditing(true); }}
                            className="px-6 py-3 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:bg-gray-100 transition-all"
                        >Düzenle</button>
                        <button
                            onClick={async () => {
                                if (confirm(`"${col.name}" koleksiyonunu silmek istiyor musunuz?`)) {
                                    await deleteCollection(col.id);
                                    toast.info('Koleksiyon silindi.', { autoClose: 1500 });
                                    window.location.href = '/collections';
                                }
                            }}
                            className="px-6 py-3 bg-gray-50 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:bg-red-50 hover:text-red-500 transition-all"
                        >Sil</button>
                    </div>
                )}
            </div>

            {/* Items Grid */}
            {col.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[4rem] bg-gray-50/30">
                    <span className="text-6xl mb-8">{col.emoji}</span>
                    <h2 className="text-2xl font-black text-gray-900 italic uppercase mb-4">Bu koleksiyon boş</h2>
                    <p className="text-gray-500 text-sm font-bold mb-12 italic">Ürünleri ürün sayfasından koleksiyona ekleyebilirsiniz.</p>
                    <Link to="/shop" className="px-12 py-5 bg-brand-pink text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-brand-pink/20 hover:scale-105 transition-all italic">
                        Ürünleri Keşfet
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-8 gap-y-12">
                    {col.items.map(item => (
                        <div key={item.id} className="group relative flex flex-col bg-white rounded-[3.5rem] p-6 border-2 border-transparent hover:border-gray-50 hover:shadow-2xl hover:shadow-gray-200/50 transition-all">
                            <button
                                onClick={async () => { await removeItem(col.id, item.id); toast.info(`${item.name} koleksiyondan çıkarıldı.`, { autoClose: 1500 }); }}
                                aria-label="Koleksiyondan Çıkar"
                                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-500 hover:scale-110"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
                            </button>

                            <Link to={`/product/${item.id}`}>
                                <div className="aspect-square rounded-[3rem] overflow-hidden mb-8 bg-[#fdfaf5] border border-gray-50 flex items-center justify-center p-8">
                                    {item.image && <img src={item.image} alt={item.name} width="400" height="400" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" loading="lazy" />}
                                </div>
                            </Link>

                            <div className="flex flex-col flex-grow px-2">
                                {item.category && <span className="text-[9px] font-[1000] text-brand-pink tracking-[0.3em] uppercase italic mb-2">{item.category}</span>}
                                <Link to={`/product/${item.id}`}>
                                    <h3 className="text-base font-[1000] text-gray-900 mb-6 leading-[1.2] group-hover:text-brand-pink transition-colors italic line-clamp-2 uppercase tracking-tighter">{item.name}</h3>
                                </Link>
                                <div className="mt-auto flex justify-between items-center pt-6 border-t border-gray-50">
                                    <div>
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic leading-none block mb-1">FUIRA FİYAT</span>
                                        <span className="text-2xl font-[1000] text-gray-900 tracking-tighter italic leading-none">{item.price.toLocaleString('tr-TR')} TL</span>
                                    </div>
                                    <button
                                        onClick={() => { addItem(item as any); toast.success(`${item.name} sepete eklendi!`, { autoClose: 2000 }); }}
                                        aria-label={`${item.name} sepete ekle`}
                                        className="w-14 h-14 rounded-[1.5rem] bg-gray-900 text-white flex items-center justify-center hover:bg-brand-pink transition-all transform hover:scale-110 shadow-2xl shadow-gray-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M12 4v16m8-8H4" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── All Collections View ──────────────────────────────────────────────────────
const CollectionsPage: React.FC = () => {
    const { collectionId } = useParams<{ collectionId?: string }>();
    const { collections, create } = useCollections();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('📦');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (collectionId) {
        return (
            <div className="bg-white min-h-screen">
                <CollectionDetailView collectionId={collectionId} />
            </div>
        );
    }

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setIsSubmitting(true);
        await create(newName.trim(), selectedEmoji);
        toast.success(`"${newName}" koleksiyonu oluşturuldu!`, { autoClose: 1500 });
        setNewName('');
        setIsCreating(false);
        setIsSubmitting(false);
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20 py-20">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-20">
                    <div>
                        <p className="text-[10px] font-black text-brand-pink tracking-[0.4em] uppercase italic mb-3">Listelerim</p>
                        <h1 className="text-5xl sm:text-7xl font-[1000] text-gray-900 leading-none tracking-tighter italic uppercase">
                            KOLEKSİ<span className="text-brand-pink">YONLARIM</span>
                        </h1>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest italic shadow-xl hover:bg-brand-pink transition-all hover:scale-105"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3" /></svg>
                        Yeni Koleksiyon
                    </button>
                </div>

                {/* Create Modal */}
                {isCreating && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) setIsCreating(false); }}>
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
                        <div className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl z-10 p-10">
                            <h2 className="text-2xl font-[1000] text-gray-900 italic uppercase tracking-tight mb-8">Yeni Koleksiyon</h2>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {EMOJIS.map(e => (
                                    <button key={e} onClick={() => setSelectedEmoji(e)}
                                        className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all ${selectedEmoji === e ? 'bg-brand-pink/10 ring-2 ring-brand-pink scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
                                    >{e}</button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                placeholder="Koleksiyon adı... (örn: Gaming Setup)"
                                autoFocus
                                aria-label="Koleksiyon adı"
                                className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-brand-pink rounded-2xl text-sm font-black italic outline-none transition-all placeholder:text-gray-300 mb-6"
                            />
                            <div className="flex gap-4">
                                <button onClick={() => setIsCreating(false)} className="flex-1 h-14 rounded-2xl bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest">İptal</button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newName.trim() || isSubmitting}
                                    className="flex-1 h-14 rounded-2xl bg-brand-pink text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-pink/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                                >{isSubmitting ? '...' : 'Oluştur'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {collections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[4rem] bg-gray-50/30">
                        <span className="text-7xl mb-8">📚</span>
                        <h2 className="text-3xl font-black text-gray-900 italic uppercase mb-4 tracking-tighter">Henüz koleksiyon yok</h2>
                        <p className="text-gray-500 text-sm font-bold mb-12 italic">Ürünleri kategorilere göre organize et.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="px-12 py-5 bg-brand-pink text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-brand-pink/20 hover:scale-105 transition-all italic"
                        >İlk Koleksiyonu Oluştur</button>
                    </div>
                ) : (
                    /* Collections Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {collections.map(col => (
                            <Link
                                key={col.id}
                                to={`/collections/${col.id}`}
                                className="group flex flex-col bg-white rounded-[3.5rem] p-8 border-2 border-transparent hover:border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all"
                            >
                                {/* Cover images */}
                                <div className="aspect-square rounded-[3rem] overflow-hidden mb-8 bg-gray-50 border border-gray-50 relative">
                                    {col.items.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-1 w-full h-full p-3">
                                            {col.items.slice(0, 4).map((item, i) => (
                                                <div key={i} className="bg-[#fdfaf5] rounded-2xl flex items-center justify-center p-2 overflow-hidden">
                                                    {item.image && <img src={item.image} alt="" className="w-full h-full object-contain" loading="lazy" />}
                                                </div>
                                            ))}
                                            {Array.from({ length: Math.max(0, 4 - col.items.length) }).map((_, i) => (
                                                <div key={`empty-${i}`} className="rounded-2xl bg-gray-100/50" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-6xl">{col.emoji}</div>
                                    )}
                                </div>

                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xl font-[1000] text-gray-900 italic uppercase tracking-tight group-hover:text-brand-pink transition-colors mb-1">
                                            {col.emoji} {col.name}
                                        </p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{col.items.length} Ürün</p>
                                    </div>
                                    <svg className="w-6 h-6 text-gray-300 group-hover:text-brand-pink transition-colors mt-1 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" /></svg>
                                </div>
                            </Link>
                        ))}

                        {/* Add new card */}
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex flex-col items-center justify-center aspect-[3/2] sm:aspect-auto rounded-[3.5rem] p-8 border-2 border-dashed border-gray-200 hover:border-brand-pink hover:text-brand-pink text-gray-300 transition-all group"
                        >
                            <svg className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" /></svg>
                            <p className="text-[11px] font-black uppercase tracking-widest italic">Yeni Koleksiyon</p>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollectionsPage;
