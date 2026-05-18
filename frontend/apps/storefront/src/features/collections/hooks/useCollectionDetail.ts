import { useState } from 'react';
import { useCollections } from '../store/collections.store';
import { useCart } from '../../cart/cart.store';
import { toast } from 'react-toastify';

export const useCollectionDetail = (collectionId: string) => {
    const { collections, removeItem, delete: deleteCollection, rename } = useCollections();
    const { addItem } = useCart();
    const col = collections.find(c => c.id === collectionId);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmoji, setEditEmoji] = useState('');

    const handleSaveRename = async () => {
        if (editName.trim() && col) {
            await rename(col.id, editName.trim(), editEmoji);
            toast.success('Koleksiyon güncellendi!', { autoClose: 1000 });
        }
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (col && confirm(`"${col.name}" koleksiyonunu silmek istiyor musunuz?`)) {
            await deleteCollection(col.id);
            toast.info('Koleksiyon silindi.', { autoClose: 1500 });
            window.location.href = '/collections';
        }
    };

    const handleRemoveItem = async (itemId: string, itemName: string) => {
        if (col) {
            await removeItem(col.id, itemId);
            toast.info(`${itemName} koleksiyondan çıkarıldı.`, { autoClose: 1500 });
        }
    };

    const handleAddToCart = (item: any) => {
        addItem(item);
        toast.success(`${item.name} sepete eklendi!`, { autoClose: 2000 });
    };

    const startEditing = () => {
        if (col) {
            setEditName(col.name);
            setEditEmoji(col.emoji);
            setIsEditing(true);
        }
    };

    return {
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
    };
};
