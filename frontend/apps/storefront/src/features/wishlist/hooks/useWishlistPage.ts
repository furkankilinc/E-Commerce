import { useWishlist } from '../store/wishlist.store';
import { useCart } from '../../cart/cart.store';
import { useAuth } from '../../auth/useAuth';
import { toast } from 'react-toastify';

export const useWishlistPage = () => {
    const { isAuthenticated } = useAuth();
    const { items, removeItem, clearWishlist } = useWishlist();
    const { addItem } = useCart();

    const handleAddToCart = (item: any) => {
        addItem(item);
        toast.success(`${item.name} sepete eklendi!`, { autoClose: 2000 });
    };

    const handleRemove = (id: string, name: string) => {
        removeItem(id);
        toast.info(`${name} favorilerden çıkarıldı.`, { autoClose: 1500 });
    };

    const handleClearWishlist = () => {
        clearWishlist();
        toast.info('Tüm favoriler temizlendi.', { autoClose: 1500 });
    };

    return {
        isAuthenticated,
        items,
        handleAddToCart,
        handleRemove,
        handleClearWishlist
    };
};
