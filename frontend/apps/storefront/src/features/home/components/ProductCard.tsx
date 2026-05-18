import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSizedImageUrl } from '../../../shared/utils/image.util';
import { useCart } from '../../cart/cart.store';
import { useWishlist } from '../../wishlist/store/wishlist.store';
import { useAuth } from '../../auth/useAuth';
import { Product } from '../home.types';

interface ProductCardProps {
    product: Product;
    index: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
    const { isAuthenticated } = useAuth();
    const { addItem } = useCart();
    const { toggleItem, isInWishlist } = useWishlist();

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.error('Favorilere eklemek için lütfen giriş yapın.', {
                position: 'top-center',
                autoClose: 3000
            });
            return;
        }
        const added = toggleItem(product);
        toast[added ? 'success' : 'info'](
            added ? `${product.name} favorilere eklendi!` : `${product.name} favorilerden çıkarıldı.`,
            { autoClose: 1500 }
        );
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
        toast.success(`${product.name} sepete eklendi.`);
    };

    return (
        <Link to={`/product/${product.id}`} className="group flex flex-col bg-white rounded-md p-4 transition-all border-2 border-transparent hover:border-gray-50 hover:shadow-xl hover:shadow-gray-200/50">
            <div className="relative aspect-square rounded-md overflow-hidden mb-4 bg-[#fdfaf5] border border-gray-50 flex items-center justify-center">
                <img
                    src={getSizedImageUrl((product.images.find((img: any) => img.isMain) || product.images[0])?.url, 'medium')}
                    alt={product.name}
                    width="400"
                    height="400"
                    loading={index < 3 ? "eager" : "lazy"}
                    {...(index < 3 ? { fetchPriority: "high" } as any : {})}
                    className="w-full h-full object-contain transition-transform duration-700"
                />
                <button
                    aria-label={isInWishlist(product.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                    onClick={handleWishlist}
                    className={`absolute top-3 right-3 w-10 h-10 rounded-md flex items-center justify-center shadow-lg border transition-all hover:scale-110 ${isInWishlist(product.id) ? 'bg-brand-pink border-brand-pink text-white' : 'bg-white border-gray-100 text-gray-300 opacity-0 group-hover:opacity-100'}`}
                >
                    <svg className="w-4 h-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
            </div>

            <div className="flex flex-col flex-grow px-2">
                <div className="flex justify-between items-center mb-3 ">
                    <span className="text-10px font-bold text-gray-600 tracking-[0.025rem]">{product.category?.name}</span>
                    <div className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-full text-gray-900 font-semibold text-10px">
                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {parseFloat(product.rating.toFixed(1))}
                    </div>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-4 leading-tight  group-hover:text-brand-pink transition-colors italic line-clamp-2  tracking-tight">{product.name}</h3>
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-50">
                    <div className="flex flex-col">
                        <span className="text-8px font-semibold text-gray-500  tracking-widest italic leading-none block mb-1">
                            {product.discountPrice ? 'İNDİRİMLİ FİYAT' : 'FUIRA FİYAT'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            {product.discountPrice ? (
                                <>
                                    <span className="text-xs font-bold text-gray-400 line-through opacity-60 italic">
                                        {product.price.toLocaleString()} ₺
                                    </span>
                                    <span className="text-xl font-[1000] text-gray-900 tracking-tighter italic leading-none">
                                        {product.discountPrice.toLocaleString()} ₺
                                    </span>
                                </>
                            ) : (
                                <span className="text-xl font-[1000] text-gray-900 tracking-tighter italic leading-none">
                                    {product.price.toLocaleString()} ₺
                                </span>
                            )}
                        </div>
                    </div>
                    {product.stock > 0 ? (
                        <button
                            onClick={handleAddToCart}
                            aria-label="Sepete Ekle"
                            className="p-2.5 cursor-pointer rounded-md bg-brand-pink hover:bg-brand-pink/90 text-white flex items-center justify-center transition-all transform shadow-lg shadow-gray-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M12 4v16m8-8H4" /></svg>
                        </button>
                    ) : (
                        <div className="px-4 py-2 bg-gray-100 text-gray-400 rounded-md text-9px font-semibold  tracking-widest italic border border-gray-100 flex items-center gap-2">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            STOKTA YOK
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
