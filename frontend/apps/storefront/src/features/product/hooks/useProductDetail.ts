import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useCart } from '../../cart/cart.store';
import { useWishlist } from '../../wishlist/store/wishlist.store';
import { apiClient } from '../../../shared/api/apiClient';
import { getSizedImageUrl } from '../../../shared/utils/image.util';
import { preload } from 'react-dom';
import { useToast } from '../../../shared/components/Toast';

export const useProductDetail = (id: string | undefined) => {
    const { isAuthenticated } = useAuth();
    const { addItem } = useCart();
    const { toggleItem, isInWishlist } = useWishlist();
    const toast = useToast();

    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [product, setProduct] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState('description');
    const [mainImage, setMainImage] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    const [canReview, setCanReview] = useState(false);
    const [reviewReason, setReviewReason] = useState('');
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);

    useEffect(() => {
        if (mainImage) {
            const sizedMainImage = getSizedImageUrl(mainImage, 'large');
            if (sizedMainImage) {
                preload(sizedMainImage, { as: 'image', fetchPriority: 'high' });
            }
        }
    }, [mainImage]);

    const handleAddToCart = () => {
        if (product) {
            setIsAdding(true);
            const selectionString = Object.entries(selectedVariants).map(([_, v]) => v).join(' / ');
            const extraPrice = Object.keys(selectedVariants).reduce((acc, key) => {
                const val = selectedVariants[key];
                const variant = product.variants?.find((v: any) => v.name === key && v.value === val);
                return acc + (variant?.price || 0);
            }, 0);
            const basePrice = product.discountPrice || product.price;
            const finalPrice = basePrice + extraPrice;

            const success = addItem({ ...product, price: finalPrice }, selectionString || 'Standard');
            if (success) {
                toast.success(`${product.name} isimli ürün sepete eklendi.`);
                setTimeout(() => setIsAdding(false), 2000);
            } else {
                setIsAdding(false);
            }
        }
    };

    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        setIsLoading(true);
        setProduct(null);
        window.scrollTo(0, 0);

        const fetchProduct = async () => {
            try {
                const res = await apiClient(`/api/products/${id}`, { signal: controller.signal });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.product) {
                        setProduct(data.product);
                        const mainImg = data.product.images?.find((img: any) => img.isMain) || data.product.images?.[0];
                        if (mainImg) setMainImage(mainImg.url);
                    } else {
                        setProduct(data);
                        const images = data.images || [];
                        const mainImg = images.find((img: any) => img.isMain) || images[0];
                        if (mainImg) setMainImage(mainImg.url);
                    }
                }

                const statsRes = await apiClient(`/api/cart/products/${id}/count`, { signal: controller.signal });
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setCartCount(statsData.count);
                }

                const catSlug = product?.category?.slug || (await (await apiClient(`/api/products/${id}`)).json()).category?.slug;
                if (catSlug) {
                    const suggRes = await apiClient(`/api/products?category=${catSlug}&limit=5`, { signal: controller.signal });
                    if (suggRes.ok) {
                        const suggData = await suggRes.json();
                        if (suggData.products) {
                            setSuggestedProducts(suggData.products.filter((p: any) => p.id !== id).slice(0, 4));
                        }
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') console.error('Failed to fetch product:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
        return () => controller.abort();
    }, [id]);

    useEffect(() => {
        if (!id || !isAuthenticated) return;
        const checkReview = async () => {
            try {
                const res = await apiClient(`/api/reviews/can-review/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setCanReview(data.canReview);
                    setReviewReason(data.reason || '');
                }
            } catch (err) { }
        };
        checkReview();
    }, [id, isAuthenticated]);

    const submitReview = async () => {
        if (!reviewForm.comment.trim()) {
            toast.error('Lütfen bir yorum yazın.');
            return;
        }
        setIsSubmittingReview(true);
        try {
            const res = await apiClient('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    rating: reviewForm.rating,
                    title: reviewForm.title || undefined,
                    comment: reviewForm.comment
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Değerlendirmeniz başarıyla eklendi!');
                setShowReviewForm(false);
                setCanReview(false);
                setReviewReason('already_reviewed');
                const prodRes = await apiClient(`/api/products/${id}`);
                if (prodRes.ok) {
                    const prodData = await prodRes.json();
                    setProduct(prodData);
                }
            } else {
                toast.error(data.message || 'Değerlendirme gönderilemedi.');
            }
        } catch (err) {
            toast.error('Sunucu hatası.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleWishlist = () => {
        if (product) {
            if (!isAuthenticated) {
                toast.error('Favorilere eklemek için lütfen giriş yapın.');
                return;
            }
            const added = toggleItem(product);
            if (added) {
                toast.success(`${product.name} favorilere eklendi!`);
            } else {
                toast.info(`${product.name} favorilerden çıkarıldı.`);
            }
        }
    };

    return {
        isAuthenticated,
        product,
        isLoading,
        selectedVariants,
        setSelectedVariants,
        activeTab,
        setActiveTab,
        mainImage,
        setMainImage,
        isAdding,
        cartCount,
        canReview,
        reviewReason,
        showReviewForm,
        setShowReviewForm,
        reviewForm,
        setReviewForm,
        isSubmittingReview,
        suggestedProducts,
        showCollectionModal,
        setShowCollectionModal,
        handleAddToCart,
        submitReview,
        handleWishlist,
        isInWishlist,
        isFetchingNewProduct: product?.id !== id
    };
};
