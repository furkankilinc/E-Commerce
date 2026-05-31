import React from 'react';
import { Link } from 'react-router-dom';
import { useCollectionDetail } from '../hooks/useCollectionDetail';
import { useCollectionsPage } from '../hooks/useCollectionsPage';

const EMOJIS = ['📦', '💻', '🎮', '📱', '👟', '⌚', '🎧', '📷', '🏠', '🎁', '💡', '🛒', '❤️', '⭐', '🔥', '✈️'];

// ─── Single Collection View ────────────────────────────────────────────────────
const CollectionDetailView: React.FC<{ collectionId: string }> = ({ collectionId }) => {
    const {
        col,
        isEditing,
        setIsEditing,
        editName,
        setEditName,
        editEmoji,
        setEditEmoji,
        handleSaveRename,
        handleDelete,
        handleRemoveItem,
        handleAddToCart,
        startEditing
    } = useCollectionDetail(collectionId);

    if (!col) {
        return (
            <div className="text-center py-32">
                <p className="text-2xl font-semibold text-gray-900   mb-4">Koleksiyon bulunamadı</p>
                <Link to="/collections" className="text-brand-pink font-semibold text-sm underline">← Geri Dön</Link>
            </div>
        );
    }

    return (
        <div className="max-w-[1650px] mx-auto px-4 sm:px-10 lg:px-20 py-6 sm:py-10">
            {/* Back */}
            <Link to="/collections" className="inline-flex items-center gap-2 text-10px font-semibold text-gray-500    hover:text-brand-pink transition-colors mb-6">
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
                                    className={`w-10 h-10 rounded-md text-xl flex items-center justify-center transition-all ${editEmoji === e ? 'bg-brand-pink/10 ring-2 ring-brand-pink scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >{e}</button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            aria-label="Koleksiyon adını düzenle"
                            className="w-full max-w-md h-16 px-6 bg-gray-50 border-2 border-brand-pink rounded-md text-2xl font-semibold  outline-none"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-gray-50 text-gray-500 rounded-md text-10px font-semibold  ">İptal</button>
                            <button onClick={handleSaveRename} className="px-10 py-3 bg-brand-pink text-white rounded-md text-10px font-semibold    shadow-brand-pink/20">Kaydet</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-10px font-semibold text-brand-pink    mb-3">Koleksiyon</p>
                        <h1 className="text-3xl sm:text-4xl lg:text-4xl font-[1000] text-gray-900 leading-none    flex items-center gap-4">
                            <span>{col.emoji}</span>
                            <span>{col.name}</span>
                        </h1>
                        <p className="text-gray-500 text-sm font-bold mt-4 ">{(col.items || []).length} ürün</p>
                    </div>
                )}

                {!isEditing && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={startEditing}
                            className="px-6 py-3 bg-gray-50 text-gray-500 rounded-md text-10px font-semibold    hover:bg-gray-100 transition-all"
                        >Düzenle</button>
                        <button
                            onClick={handleDelete}
                            className="px-6 py-3 bg-gray-50 text-red-400 rounded-md text-10px font-semibold    hover:bg-red-50 hover:text-red-500 transition-all"
                        >Sil</button>
                    </div>
                )}
            </div>

            {/* Items Grid */}
            {(col.items || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-md bg-gray-50/30">
                    <span className="text-4xl mb-4">{col.emoji}</span>
                    <h2 className="text-2xl font-semibold text-gray-900   mb-4">Bu koleksiyon boş</h2>
                    <p className="text-gray-500 text-sm font-bold mb-6 ">Ürünleri ürün sayfasından koleksiyona ekleyebilirsiniz.</p>
                    <Link to="/shop" className="px-12 py-5 bg-brand-pink text-white rounded-md text-caption font-semibold   shadow-xl shadow-brand-pink/20  transition-all ">
                        Ürünleri Keşfet
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12">
                    {(col.items || []).map(item => (
                        <div key={item.id} className="group relative flex flex-col bg-white rounded-md p-4 transition-all border-2 border-transparent hover:shadow-xl hover:shadow-gray-200/50">
                            <button
                                onClick={() => handleRemoveItem(item.id, item.name)}
                                aria-label="Koleksiyondan Çıkar"
                                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-300 shadow-sm lg:opacity-0 lg:group-hover:opacity-100 opacity-100 transition-all hover:bg-red-50 hover:text-red-500 "
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
                            </button>

                            <Link to={`/product/${item.id}`}>
                                <div className="aspect-square rounded-md overflow-hidden mb-4 bg-[#fdfaf5] border border-gray-50 flex items-center justify-center p-8">
                                    {item.image && <img src={item.image} alt={item.name} width="400" height="400" className="w-full h-full object-contain group- transition-transform duration-700" loading="lazy" />}
                                </div>
                            </Link>

                            <div className="flex flex-col flex-grow px-2">
                                {item.category && <span className="text-nano font-[1000] text-brand-pink    mb-2">{item.category}</span>}
                                <Link to={`/product/${item.id}`}>
                                    <h3 className="text-base font-[1000] text-gray-900 mb-6 leading-[1.2] group-hover:text-brand-pink transition-colors  line-clamp-2  ">{item.name}</h3>
                                </Link>
                                <div className="mt-auto flex justify-between items-center pt-6 border-t border-gray-50">
                                    <div>
                                        <span className="text-micro font-semibold text-gray-500    leading-none block mb-1">
                                            {item.originalPrice ? 'İNDİRİMLİ FİYAT' : 'FUIRA FİYAT'}
                                        </span>
                                        <div className="flex items-baseline gap-2">
                                            {item.originalPrice && (
                                                <span className="text-xs font-bold text-gray-400 line-through opacity-60 ">
                                                    {item.originalPrice.toLocaleString('tr-TR')} ₺
                                                </span>
                                            )}
                                            <span className="text-2xl font-[1000] text-gray-900   leading-none">
                                                {item.price.toLocaleString('tr-TR')} ₺
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddToCart(item)}
                                        aria-label={`${item.name} sepete ekle`}
                                        className="w-14 h-14 rounded-md bg-gray-900 text-white flex items-center justify-center hover:bg-brand-pink transition-all transform  shadow-xl shadow-gray-200"
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
    const {
        isAuthenticated,
        collectionId,
        collections,
        isCreating,
        setIsCreating,
        newName,
        setNewName,
        selectedEmoji,
        setSelectedEmoji,
        isSubmitting,
        handleCreate
    } = useCollectionsPage();

    if (collectionId) {
        return (
            <div className="bg-white min-h-screen">
                <CollectionDetailView collectionId={collectionId} />
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-[1650px] mx-auto px-4 sm:px-10 lg:px-20 py-6 sm:py-10">
                {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-md bg-gray-50/30">
                        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center  mb-5 border border-gray-50 text-brand-pink">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-semibold text-gray-900 mb-4   ">Giriş Yapmalısınız</h2>
                        <p className="text-gray-500 text-sm font-bold mb-6  ">Koleksiyonlarınızı görmek ve yönetmek için lütfen oturum açın.</p>
                        <Link
                            to="/login"
                            className="px-12 py-5 bg-brand-pink text-white rounded-md text-caption font-semibold   shadow-xl shadow-brand-pink/20  transition-all "
                        >
                            Giriş Yap
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-8">
                            <div>
                                <p className="text-10px font-semibold text-brand-pink    mb-3">Listelerim</p>
                                <h1 className="text-3xl sm:text-4xl lg:text-4xl font-[1000] text-gray-900 leading-none   ">
                                    KOLEKSİ<span className="text-brand-pink">YONLARIM</span>
                                </h1>
                            </div>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-md text-caption font-semibold     hover:bg-brand-pink transition-all "
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3" /></svg>
                                Yeni Koleksiyon
                            </button>
                        </div>

                        {/* Create Modal */}
                        {isCreating && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) setIsCreating(false); }}>
                                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
                                <div className="relative w-full max-w-md bg-white rounded-md shadow-xl z-10 p-10">
                                    <h2 className="text-2xl font-[1000] text-gray-900    mb-4">Yeni Koleksiyon</h2>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {EMOJIS.map(e => (
                                            <button key={e} onClick={() => setSelectedEmoji(e)}
                                                className={`w-11 h-11 rounded-md text-2xl flex items-center justify-center transition-all ${selectedEmoji === e ? 'bg-brand-pink/10 ring-2 ring-brand-pink scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
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
                                        className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-brand-pink rounded-md text-sm font-semibold  outline-none transition-all placeholder:text-gray-300 mb-6"
                                    />
                                    <div className="flex gap-4">
                                        <button onClick={() => setIsCreating(false)} className="flex-1 h-14 rounded-md bg-gray-50 text-gray-500 text-10px font-semibold  ">İptal</button>
                                        <button
                                            onClick={handleCreate}
                                            disabled={!newName.trim() || isSubmitting}
                                            className="flex-1 h-14 rounded-md bg-brand-pink text-white text-10px font-semibold    shadow-brand-pink/20  transition-all disabled:opacity-50"
                                        >{isSubmitting ? '...' : 'Oluştur'}</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {(collections || []).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-md bg-gray-50/30">
                                <span className="text-4xl mb-4">📚</span>
                                <h2 className="text-3xl font-semibold text-gray-900   mb-4 ">Henüz koleksiyon yok</h2>
                                <p className="text-gray-500 text-sm font-bold mb-6 ">Ürünleri kategorilere göre organize et.</p>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="px-12 py-5 bg-brand-pink text-white rounded-md text-caption font-semibold   shadow-xl shadow-brand-pink/20  transition-all "
                                >İlk Koleksiyonu Oluştur</button>
                            </div>
                        ) : (
                            /* Collections Grid */
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                                {(collections || []).map(col => (
                                    <Link
                                        key={col.id}
                                        to={`/collections/${col.id}`}
                                        className="group flex flex-col bg-white rounded-md p-4 sm:p-8 border-2 border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all"
                                    >
                                        {/* Cover images */}
                                        <div className="aspect-square rounded-md overflow-hidden mb-4 bg-gray-50 border border-gray-50 relative">
                                            {(col.items || []).length > 0 ? (
                                                <div className="grid grid-cols-2 gap-1 w-full h-full p-3">
                                                    {(col.items || []).slice(0, 4).map((item, i) => (
                                                        <div key={i} className="bg-[#fdfaf5] rounded-md flex items-center justify-center p-2 overflow-hidden">
                                                            {item.image && <img src={item.image} alt="" className="w-full h-full object-contain" loading="lazy" />}
                                                        </div>
                                                    ))}
                                                    {Array.from({ length: Math.max(0, 4 - (col.items || []).length) }).map((_, i) => (
                                                        <div key={`empty-${i}`} className="rounded-md bg-gray-100/50" />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl">{col.emoji}</div>
                                            )}
                                        </div>

                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xl font-[1000] text-gray-900    group-hover:text-brand-pink transition-colors mb-1">
                                                    {col.emoji} {col.name}
                                                </p>
                                                <p className="text-10px font-semibold text-gray-400   ">{(col.items || []).length} Ürün</p>
                                            </div>
                                            <svg className="w-6 h-6 text-gray-300 group-hover:text-brand-pink transition-colors mt-1 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" /></svg>
                                        </div>
                                    </Link>
                                ))}

                                {/* Add new card */}
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="flex flex-col items-center justify-center aspect-[3/2] sm:aspect-auto rounded-md p-8 border-2 border-dashed border-gray-200 hover:border-brand-pink hover:text-brand-pink text-gray-300 transition-all group"
                                >
                                    <svg className="w-10 h-10 mb-4 group- transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" /></svg>
                                    <p className="text-caption font-semibold   ">Yeni Koleksiyon</p>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CollectionsPage;
