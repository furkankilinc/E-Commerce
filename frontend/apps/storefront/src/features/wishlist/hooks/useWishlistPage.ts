import { useWishlist } from '../store/wishlist.store';
import { useCart } from '../../cart/cart.store';
import { useAuth } from '../../auth/useAuth';
import { useToast } from '../../../shared/components/Toast';

export const useWishlistPage = () => {
    const { isAuthenticated } = useAuth();
    const { items, removeItem, clearWishlist } = useWishlist();
    const { addItem } = useCart();
    const toast = useToast();

    const handleAddToCart = (item: any) => {
        const success = addItem(item);
        if (success) {
            toast.success(`${item.name} sepete eklendi!`);
        }
    };

    const handleRemove = (id: string, name: string) => {
        removeItem(id);
        toast.info(`${name} favorilerden çıkarıldı.`);
    };

    const handleClearWishlist = () => {
        clearWishlist();
        toast.info('Tüm favoriler temizlendi.');
    };

    return {
        isAuthenticated,
        items,
        handleAddToCart,
        handleRemove,
        handleClearWishlist
    };
};
