import React, { useState } from 'react';
import { useCollections, Collection } from '../store/collections.store';
import { useToast } from '../../../shared/components/Toast';

interface AddToCollectionModalProps {
    product: any;
    onClose: () => void;
}

const EMOJIS = ['📦', '💻', '🎮', '📱', '👟', '⌚', '🎧', '📷', '🏠', '🎁', '💡', '🛒', '❤️', '⭐', '🔥', '✈️'];

const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({ product, onClose }) => {
    const { collections, create, addItem, removeItem, isInCollection } = useCollections();
    const toast = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('📦');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToggle = async (col: Collection) => {
        if (isInCollection(col.id, product.id)) {
            await removeItem(col.id, product.id);
            toast.info(`${product.name} "${col.name}" koleksiyonundan çıkarıldı.`);
        } else {
            await addItem(col.id, product);
            toast.success(`${product.name} "${col.name}" koleksiyonuna eklendi!`);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setIsSubmitting(true);
        const newCol = await create(newName.trim(), selectedEmoji);
        if (newCol) {
            await addItem(newCol.id, product);
            toast.success(`"${newCol.name}" koleksiyonu oluşturuldu ve ürün eklendi!`);
            setNewName('');
            setIsCreating(false);
        }
        setIsSubmitting(false);
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full sm:max-w-md bg-white rounded-md shadow-xl z-10 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-gray-50">
                    <div>
                        <p className="text-nano font-semibold text-brand-pink   italic mb-1">Kaydet</p>
                        <h2 className="text-xl font-[1000] text-gray-900 italic  ">Koleksiyona Ekle</h2>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Kapat"
                        className="w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
                    </button>
                </div>

                {/* Product preview */}
                <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-50 flex items-center gap-4">
                    {product.images?.[0]?.url && (
                        <img src={product.images[0].url} alt={product.name} className="w-12 h-12 rounded-md object-contain bg-white border border-gray-100 p-1" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-10px font-semibold text-gray-900 italic  truncate">{product.name}</p>
                        <p className="text-caption font-semibold text-brand-pink">{(product.discountPrice ?? product.price)?.toLocaleString('tr-TR')} ₺</p>
                    </div>
                </div>

                {/* Collections List */}
                <div className="px-8 py-6 max-h-64 overflow-y-auto space-y-3">
                    {(collections || []).length === 0 && !isCreating && (
                        <p className="text-center text-xs font-bold text-gray-400 italic py-4">Henüz koleksiyonunuz yok.</p>
                    )}
                    {(collections || []).map(col => {
                        const inCol = isInCollection(col.id, product.id);
                        return (
                            <button
                                key={col.id}
                                onClick={() => handleToggle(col)}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-md border-2 transition-all text-left ${inCol
                                    ? 'border-brand-pink bg-brand-pink/5 text-brand-pink'
                                    : 'border-gray-100 bg-white hover:border-gray-200 text-gray-900'
                                    }`}
                            >
                                <span className="text-xl">{col.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-caption font-semibold  italic  truncate">{col.name}</p>
                                    <p className="text-nano font-bold text-gray-400">{(col.items || []).length} ürün</p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${inCol ? 'border-brand-pink bg-brand-pink' : 'border-gray-200'}`}>
                                    {inCol && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" /></svg>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Create new */}
                <div className="px-8 pb-8">
                    {isCreating ? (
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            {/* Emoji picker */}
                            <div className="flex flex-wrap gap-2">
                                {EMOJIS.map(e => (
                                    <button
                                        key={e}
                                        onClick={() => setSelectedEmoji(e)}
                                        className={`w-10 h-10 rounded-md text-xl flex items-center justify-center transition-all ${selectedEmoji === e ? 'bg-brand-pink/10 ring-2 ring-brand-pink scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
                                    >{e}</button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                placeholder="Koleksiyon adı... (örn: Laptoplar)"
                                autoFocus
                                aria-label="Koleksiyon adı"
                                className="w-full h-14 px-5 bg-gray-50 border-2 border-transparent focus:border-brand-pink rounded-md text-12px font-semibold italic outline-none transition-all placeholder:text-gray-300"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setIsCreating(false); setNewName(''); }}
                                    className="flex-1 h-16 rounded-md bg-gray-50 text-gray-500 text-10px font-semibold  "
                                >İptal</button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newName.trim() || isSubmitting}
                                    className="flex-1 h-16 rounded-md bg-brand-pink text-white text-10px font-semibold   disabled:opacity-50  shadow-brand-pink/20  transition-all"
                                >{isSubmitting ? '...' : 'Oluştur & Ekle'}</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full mt-4 h-14 border-2 border-dashed border-gray-200 rounded-md text-caption font-semibold text-gray-400   italic hover:border-brand-pink hover:text-brand-pink transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3" /></svg>
                            Yeni Koleksiyon
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToCollectionModal;
