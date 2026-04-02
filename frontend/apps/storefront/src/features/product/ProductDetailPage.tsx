import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../cart/cart.store';
import { useWishlist } from '../wishlist/store/wishlist.store';
import { useAuth } from '../auth/useAuth';
import AddToCollectionModal from '../collections/components/AddToCollectionModal';
import { toast } from 'react-toastify';
import { getSizedImageUrl } from '../../shared/utils/image.util';
import { preload } from "react-dom";
import { apiClient } from '../../shared/api/apiClient';

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    category: {
        name: string;
        slug: string;
        parent?: { name: string; slug: string }
    };
    merchant: { companyName: string };
    images: { url: string; isMain: boolean }[];
    variants: { id: string; name: string; value: string; price?: number }[];
    reviews: {
        id: string;
        title: string;
        comment: string;
        rating: number;
        isVerified?: boolean;
        images?: { id: string; url: string }[];
        user: { name: string };
        createdAt: string;
    }[];
    rating: number;
    reviewCount: number;
    stock: number;
    discountPrice?: number;
    isOnSale?: boolean;
    shortDescription?: string;
    metadata?: any;
}

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { isAuthenticated } = useAuth();
    const { addItem } = useCart();
    const { toggleItem, isInWishlist } = useWishlist();
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState('description');
    const [mainImage, setMainImage] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    
    // Review states
    const [canReview, setCanReview] = useState(false);
    const [reviewReason, setReviewReason] = useState('');
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);

    // React 19: Preload the main image for better LCP
    const sizedMainImage = getSizedImageUrl(mainImage, 'large');
    if (sizedMainImage) {
        preload(sizedMainImage, { as: 'image', fetchPriority: 'high' });
    }

    const handleAddToCart = () => {
        if (product) {
            setIsAdding(true);
            // Combine selected variants into a string and calculate total price
            const selectionString = Object.entries(selectedVariants)
                .map(([_, v]) => v)
                .join(' / ');

            const extraPrice = Object.keys(selectedVariants).reduce((acc, key) => {
                const val = selectedVariants[key];
                const variant = product.variants.find(v => v.name === key && v.value === val);
                return acc + (variant?.price || 0);
            }, 0);

            const basePrice = product.discountPrice || product.price;
            const finalPrice = basePrice + extraPrice;
            
            const success = addItem({ ...product, price: finalPrice }, selectionString || 'Standard');
            if (success) {
                toast.success(`${product.name} isimli ürün sepete eklendi.`, {
                    autoClose: 2000
                });
                setTimeout(() => setIsAdding(false), 2000);
            } else {
                setIsAdding(false);
            }
        }
    };

    useEffect(() => {
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
                        setProduct(data); // Fallback for old/other format
                        const images = data.images || [];
                        const mainImg = images.find((img: any) => img.isMain) || images[0];
                        if (mainImg) setMainImage(mainImg.url);
                    }
                }

                // Fetch cart stats
                const statsRes = await apiClient(`/api/cart/stats/${id}`, { signal: controller.signal });
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setCartCount(statsData.count);
                }

                // Fetch suggested products from same category
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
                if (err.name !== 'AbortError') {
                    console.error('Failed to fetch product:', err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }

        return () => controller.abort();
    }, [id]);

    // Check if user can review this product
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
            } catch (err) {
                // Silent fail
            }
        };
        checkReview();
    }, [id, isAuthenticated]);

    // Prevent flicker: if id changed but product hasn't been fetched yet, show loading
    const isFetchingNewProduct = product?.id !== id;

    if (isLoading || isFetchingNewProduct) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold text-[10px] uppercase tracking-[0.2em] text-gray-400 italic">Ürün Detayları Yükleniyor...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-md flex items-center justify-center mb-6 border border-gray-100 shadow-inner rotate-3">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-tight italic">Ürün Bulunamadı</h2>
                <Link to="/" className="px-8 py-3 bg-brand-pink text-white rounded-md text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-brand-pink/20 hover:bg-brand-pink-hover transition-all">Ana Sayfaya Dön</Link>
            </div>
        );
    }

    return (
        <div className="bg-white">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20 py-10">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-16 italic">
                    <Link to="/" className="hover:text-gray-900 transition-colors">ANASAYFA</Link>

                    {product.category?.parent && (
                        <>
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <Link to={`/shop?category=${product.category.parent.slug}`} className="hover:text-gray-900 transition-colors">
                                {product.category.parent.name.toUpperCase()}
                            </Link>
                        </>
                    )}

                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <Link to={`/shop?category=${product.category?.slug}`} className="hover:text-gray-900 transition-colors">
                        {product.category?.name?.toUpperCase() || 'KATEGORİ'}
                    </Link>

                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="text-gray-900">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-32">
                    {/* Image Gallery Side Strip */}
                    <div className="lg:col-span-1 hidden lg:flex flex-col gap-6">
                        {product.images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setMainImage(img.url)}
                                className={`aspect-square w-full rounded-md overflow-hidden border-2 transition-all bg-[#fdfaf5] ${mainImage === img.url ? 'border-brand-pink shadow-lg shadow-brand-pink/10' : 'border-transparent opacity-50 hover:opacity-100 hover:border-gray-200'}`}
                            >
                                {img.url && <img src={getSizedImageUrl(img.url, 'small')} alt="" className="w-full h-full object-contain" width="200" height="200" loading="lazy" />}
                            </button>
                        ))}
                    </div>

                    {/* Main Image View */}
                    <div className="lg:col-span-4 relative group flex flex-col items-start">
                        <div className="w-full aspect-square relative rounded-md overflow-hidden bg-white border border-gray-100 flex items-center justify-center shadow-sm transition-all duration-700">
                            {mainImage && (
                                <img
                                    src={getSizedImageUrl(mainImage, 'large')}
                                    alt={product.name}
                                    width="800"
                                    height="800"
                                    fetchPriority="high"
                                    loading="eager"
                                    className="absolute inset-0 w-full h-full object-contain transition-transform duration-1000"
                                />
                            )}
                        </div>
                        <div className="absolute top-4 left-4 flex flex-col gap-3">
                            <span className="px-4 py-2 bg-white/90 backdrop-blur shadow-sm border border-gray-100 text-[9px] font-bold tracking-widest text-gray-900 uppercase italic rounded-lg">
                                {product.category?.name || 'CORETECH'}
                            </span>
                        </div>
                        <button 
                            onClick={() => {
                                if (product) {
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
                                }
                            }}
                            className={`absolute top-4 right-4 w-12 h-12 rounded-full shadow-md flex items-center justify-center transition-all transform hover:scale-110 border ${isInWishlist(product.id) ? 'bg-brand-pink border-brand-pink text-white' : 'bg-white border-gray-100 text-gray-400 hover:text-brand-pink'}`}
                        >
                            <svg className="w-5 h-5" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </button>
                    </div>

                    {/* Product Info Panel */}
                    <div className="lg:col-span-7 flex flex-col pt-2">
                        <div className="mb-6 flex items-center gap-4">
                            <span className="text-[10px] font-black text-brand-pink tracking-[0.2em] uppercase bg-brand-pink/5 px-4 py-2 rounded-md">{product.merchant?.companyName || 'FUIRA STORE'}</span>
                            <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                <span className="text-[11px] font-black text-gray-900 border-b border-gray-900 leading-none pb-0.5">{product.rating?.toFixed(1) || '0.0'}</span>
                                <span className="text-[11px] font-bold text-gray-400">({product.reviewCount || 0} Değerlendirme)</span>
                            </div>
                        </div>

                        <h1 className="text-2xl lg:text-[1.75rem] font-semibold text-gray-800 leading-[1.3] mb-8">{product.name}</h1>


                        {cartCount > 0 && product.stock > 0 && cartCount >= (product.stock * 0.8) && (
                            <div className="mb-8 flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-md animate-pulse">
                                <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <p className="text-[11px] font-[900] text-orange-900 uppercase tracking-tight">
                                    DİKKAT! <span className="text-orange-600 text-sm mx-0.5">{cartCount}</span> kişi bu ürünü sepetinde tutuyor ve stoklar tükenmek üzere!
                                </p>
                            </div>
                        )}
                        {/* Price & Badge */}
                        <div className="flex items-center gap-6 mb-10">
                            <div className="flex flex-col">
                                {product.discountPrice && (
                                    <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1 italic">İNDİRİMLİ FİYAT</span>
                                )}
                                <div className="flex items-center gap-4">
                                    {product.discountPrice ? (
                                        <>
                                            <span className="text-xl font-bold text-slate-400 line-through opacity-60 italic">
                                                {(product.price + Object.keys(selectedVariants).reduce((acc, key) => {
                                                    const val = selectedVariants[key];
                                                    const variant = product.variants.find(v => v.name === key && v.value === val);
                                                    return acc + (variant?.price || 0);
                                                }, 0)).toLocaleString()}&nbsp;₺
                                            </span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-4xl lg:text-5xl font-[1000] text-slate-900 tracking-tighter italic">
                                                    {(product.discountPrice + Object.keys(selectedVariants).reduce((acc, key) => {
                                                        const val = selectedVariants[key];
                                                        const variant = product.variants.find(v => v.name === key && v.value === val);
                                                        return acc + (variant?.price || 0);
                                                    }, 0)).toLocaleString()}&nbsp;₺
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-4xl lg:text-5xl font-[1000] text-slate-900 tracking-tighter italic">
                                            {(product.price + Object.keys(selectedVariants).reduce((acc, key) => {
                                                const val = selectedVariants[key];
                                                const variant = product.variants.find(v => v.name === key && v.value === val);
                                                return acc + (variant?.price || 0);
                                            }, 0)).toLocaleString()}&nbsp;₺
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <p className="text-slate-500 font-bold leading-loose mb-10 text-sm whitespace-pre-wrap italic">
                            {product.shortDescription || 'Bu ürün için henüz kısa açıklama girilmemiş.'}
                        </p>

                        {/* Dynamic Variants Section */}
                        <div className="mb-10 space-y-10">
                            {(() => {
                                // Group variants by name (e.g., "Color", "Size")
                                const uniqueGroups = Array.from(new Set(product.variants.map(v => v.name)));

                                return uniqueGroups.map(groupName => {
                                    const groupValues = Array.from(new Set(
                                        product.variants
                                            .filter(v => v.name === groupName)
                                            .map(v => v.value)
                                    ));

                                    return (
                                        <div key={groupName}>
                                            <div className="flex justify-between items-center mb-6">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                                                    {groupName.toUpperCase()} SEÇİN
                                                </span>
                                                {groupName.toUpperCase() === 'BEDEN' && (
                                                    <button className="text-[10px] font-black text-brand-pink uppercase tracking-widest underline underline-offset-4 decoration-2">Beden Rehberi</button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                {groupValues.map(val => {
                                                    const varInfo = product.variants.find(v => v.name === groupName && v.value === val);
                                                    const isSelected = selectedVariants[groupName] === val;
                                                    const priceDiff = varInfo?.price || 0;

                                                    return (
                                                        <button
                                                            key={val}
                                                            onClick={() => setSelectedVariants(prev => ({ ...prev, [groupName]: val }))}
                                                            className={`h-16 rounded-md text-xs font-black transition-all border-2 flex flex-col items-center justify-center gap-1 ${isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20 scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-900 hover:text-slate-900'}`}
                                                        >
                                                            <span>{val}</span>
                                                            {priceDiff !== 0 && (
                                                                <span className={`text-[9px] ${isSelected ? 'text-indigo-400' : 'text-indigo-500'} font-bold`}>
                                                                    {priceDiff > 0 ? `+${priceDiff}` : priceDiff} ₺
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        <div className="flex gap-4 mt-4">
                            {product && product.stock > 0 ? (
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isAdding}
                                    className={`flex-grow h-20 rounded-md font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all transform hover:-translate-y-1 shadow-2xl italic ${isAdding ? 'bg-green-500 shadow-green-500/40' : 'bg-brand-pink hover:bg-brand-pink-hover shadow-brand-pink/40 text-white'}`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={isAdding ? "M5 13l4 4L19 7" : "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"} /></svg>
                                    {isAdding ? 'EKLENDİ!' : 'SEPETE EKLE'}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="flex-grow h-20 bg-gray-100 text-gray-400 rounded-md font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 italic border border-gray-100 cursor-not-allowed"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                    STOKTA YOK
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (product) {
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
                                    }
                                }}
                                aria-label={product && isInWishlist(product.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                                className={`w-20 h-20 border rounded-md flex items-center justify-center transition-all shadow-sm ${product && isInWishlist(product.id)
                                    ? 'bg-brand-pink border-brand-pink text-white shadow-brand-pink/30'
                                    : 'bg-gray-50 text-gray-900 border-gray-100 hover:bg-white hover:border-brand-pink hover:text-brand-pink'
                                    }`}
                            >
                                <svg className="w-7 h-7" fill={product && isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                            {/* Add to Collection Button */}
                            <button
                                onClick={() => {
                                    if (!isAuthenticated) {
                                        toast.error('Koleksiyon oluşturmak için lütfen giriş yapın.', {
                                            position: 'top-center',
                                            autoClose: 3000
                                        });
                                        return;
                                    }
                                    setShowCollectionModal(true);
                                }}
                                aria-label="Koleksiyona Ekle"
                                className="w-20 h-20 bg-gray-50 text-gray-900 border border-gray-100 rounded-md flex items-center justify-center hover:bg-white hover:border-gray-900 transition-all shadow-sm"
                            >
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </button>
                        </div>

                        {showCollectionModal && product && (
                            <AddToCollectionModal product={product} onClose={() => setShowCollectionModal(false)} />
                        )}

                        <div className="mt-8 flex items-center justify-center gap-6 text-[9px] font-black text-gray-300 uppercase tracking-widest italic">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                ÜCRETSİZ KARGO
                            </div>
                            <div className="w-1 h-1 bg-gray-100 rounded-full"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                30 GÜN İADE
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Tabs */}
                <div className="mb-32">
                    <div className="flex border-b border-gray-50 gap-16 mb-20 overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {['AÇIKLAMA', 'ÖZELLİKLER', 'DEĞERLENDİRMELER'].map(tab => {
                            const key = tab === 'AÇIKLAMA' ? 'description' : (tab === 'ÖZELLİKLER' ? 'specs' : 'reviews');
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`pb-8 text-[11px] font-black tracking-[0.25em] transition-all relative ${activeTab === key ? 'text-gray-900 italic' : 'text-gray-300 hover:text-gray-500'}`}
                                >
                                    {tab}
                                    {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-brand-pink rounded-full shadow-[0_0_10px_rgba(255,51,102,0.5)]"></div>}
                                </button>
                            )
                        })}
                    </div>

                    <div className="min-h-[400px]">
                        {activeTab === 'description' && (
                            <div className="animate-fadeIn max-w-[900px] mx-auto py-10">
                                <DescriptionRenderer content={product.description} mainImage={mainImage} />
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="animate-fadeIn">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
                                    <div>
                                        <h2 className="text-[40px] font-black text-gray-900 mb-4 tracking-tighter italic uppercase">Müşteri Yorumları</h2>
                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-5 h-5 ${i < Math.round(product.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                ))}
                                            </div>
                                            <span className="text-lg font-black text-gray-900 border-b-2 border-brand-pink leading-none pb-1">{product.rating?.toFixed(1) || '0.0'} Skor</span>
                                            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{product.reviewCount || 0} DEĞERLENDİRME</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                toast.error('Yorum yapmak için lütfen giriş yapın.', { position: 'top-center', autoClose: 3000 });
                                                return;
                                            }
                                            if (!canReview) {
                                                if (reviewReason === 'already_reviewed') {
                                                    toast.info('Bu ürün için zaten bir değerlendirme yaptınız.', { autoClose: 3000 });
                                                } else {
                                                    toast.warning('Yalnızca teslim edilen siparişlerdeki ürünlere yorum yapabilirsiniz.', { autoClose: 4000 });
                                                }
                                                return;
                                            }
                                            setShowReviewForm(true);
                                        }}
                                        className="bg-gray-900 text-white px-12 py-5 rounded-md text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-pink transition-all shadow-xl shadow-gray-900/10 italic"
                                    >
                                        Yorum Yaz
                                    </button>
                                </div>

                                {/* Review Form */}
                                {showReviewForm && (
                                    <div className="bg-white border border-gray-100 rounded-md p-8 mb-12 shadow-lg">
                                        <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight mb-6">Değerlendirmeniz</h3>
                                        
                                        {/* Star Rating Selector */}
                                        <div className="mb-6">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">PUAN VERİN</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                                        className="transition-transform hover:scale-125"
                                                    >
                                                        <svg className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </button>
                                                ))}
                                                <span className="ml-3 text-sm font-black text-gray-900 self-center">{reviewForm.rating}/5</span>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <div className="mb-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">BAŞLIK (OPSİYONEL)</label>
                                            <input
                                                type="text"
                                                value={reviewForm.title}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                                                placeholder="Kısa bir başlık yazın..."
                                                className="w-full h-12 px-6 rounded-md bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-brand-pink transition-all"
                                            />
                                        </div>

                                        {/* Comment */}
                                        <div className="mb-6">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">YORUMUNUZ</label>
                                            <textarea
                                                value={reviewForm.comment}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                                placeholder="Ürün hakkındaki deneyiminizi paylaşın..."
                                                rows={4}
                                                className="w-full px-6 py-4 rounded-md bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:border-brand-pink transition-all resize-none"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowReviewForm(false)}
                                                className="px-6 py-3 bg-gray-100 text-gray-500 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                            >
                                                İPTAL
                                            </button>
                                            <button
                                                onClick={async () => {
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
                                                            // Refresh product data to show new review
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
                                                }}
                                                disabled={isSubmittingReview}
                                                className="px-8 py-3 bg-brand-pink text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-brand-pink-hover transition-all flex items-center gap-2 shadow-lg shadow-brand-pink/20"
                                            >
                                                {isSubmittingReview && <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                                                GÖNDER
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {(product.reviews && product.reviews.length > 0) ? product.reviews.map(review => (
                                        <div key={review.id} className="bg-white p-12 rounded-md border border-gray-100 hover:shadow-2xl hover:shadow-gray-100 transition-all group overflow-hidden relative">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-md -translate-x-12 -translate-y-12 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                                            <div className="flex items-start justify-between mb-10 relative z-10">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 rounded-md bg-[#fdfaf5] border border-gray-100 flex items-center justify-center font-black text-brand-pink text-xl shadow-inner italic">
                                                        {review.user?.name ? review.user.name[0] : 'U'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-[900] text-gray-900 text-base uppercase italic tracking-tight">{review.user?.name || 'Kullanıcı'}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest leading-none">Doğrulanmış Alıcı</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5 text-yellow-400">
                                                    {[...Array(review.rating || 5)].map((_, i) => (
                                                        <svg key={i} className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="relative z-10">
                                                <h5 className="text-base font-black text-gray-900 mb-4 uppercase leading-tight italic tracking-tight">{review.title}</h5>
                                                <p className="text-sm text-gray-500 font-bold leading-relaxed opacity-70 italic mb-6">
                                                    "{review.comment}"
                                                </p>
                                                
                                                {review.images && review.images.length > 0 && (
                                                    <div className="flex flex-wrap gap-3 mt-6">
                                                        {review.images.map((img: any) => (
                                                            <div key={img.id} className="w-20 h-20 rounded-lg overflow-hidden border border-gray-100 group/img relative">
                                                                <img src={img.url} alt="Review" className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                                                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors pointer-events-none"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-2 py-32 text-center bg-gray-50/50 rounded-md border border-dashed border-gray-200">
                                            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.4em] italic leading-tight">Henüz bu şaheser için bir yorum yapılmamış.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'specs' && (
                            <div className="animate-fadeIn max-w-[900px] mx-auto">
                                <div className="bg-white border border-gray-100 rounded-md overflow-hidden">
                                    <div className="p-10 border-b border-gray-50 bg-gray-50/30">
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">TEKNİK ÖZELLİKLER</h3>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {product.variants && product.variants.length > 0 ? product.variants.map((v, i) => (
                                            <div key={i} className="flex flex-col md:flex-row p-6 hover:bg-gray-50/50 transition-colors">
                                                <div className="w-full md:w-1/3 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-0 italic">{v.name}</div>
                                                <div className="w-full md:w-2/3 text-sm font-bold text-gray-900 italic leading-relaxed">{v.value}</div>
                                            </div>
                                        )) : (
                                            <div className="p-20 text-center text-gray-300 font-bold italic uppercase tracking-widest text-[10px]">
                                                ÖZELLİK BİLGİSİ BULUNMUYOR
                                            </div>
                                        )}
                                        {/* Basic Specs Fallback */}
                                        <div className="flex flex-col md:flex-row p-6 hover:bg-gray-50/50 transition-colors">
                                            <div className="w-full md:w-1/3 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-0 italic">MARKA</div>
                                            <div className="w-full md:w-2/3 text-sm font-bold text-gray-900 italic leading-relaxed">{product.merchant?.companyName || 'BİLİNMİYOR'}</div>
                                        </div>
                                        <div className="flex flex-col md:flex-row p-6 hover:bg-gray-50/50 transition-colors">
                                            <div className="w-full md:w-1/3 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-0 italic">GARANTİ</div>
                                            <div className="w-full md:w-2/3 text-sm font-bold text-gray-900 italic leading-relaxed">2 Yıl Distribütör Garantili</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Suggested Products Section */}
                {suggestedProducts.length > 0 && (
                    <div className="pt-20 border-t border-gray-50">
                        <h2 className="text-2xl font-black text-gray-900 mb-12 uppercase tracking-[0.2em] italic text-center animate-in fade-in duration-700">İlginizi Çekebilir</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
                            {suggestedProducts.map((p) => (
                                <Link 
                                    to={`/product/${p.id}`} 
                                    key={p.id} 
                                    className="group animate-in fade-in slide-in-from-bottom-4 duration-700"
                                    onClick={() => window.scrollTo(0, 0)}
                                >
                                    <div className="aspect-square bg-[#fdfaf5] rounded-md border border-gray-50 group-hover:shadow-2xl group-hover:shadow-gray-100 transition-all overflow-hidden p-8 relative flex items-center justify-center">
                                        <img 
                                            src={getSizedImageUrl(p.images?.[0]?.url, 'medium')} 
                                            alt={p.name} 
                                            className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-700" 
                                        />
                                        {p.discountPrice && (
                                            <div className="absolute top-4 right-4 px-3 py-1 bg-brand-pink text-white text-[9px] font-black uppercase tracking-widest rounded-full italic shadow-lg shadow-brand-pink/20">
                                                İNDİRİM
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-6 space-y-2 text-center">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{p.merchant?.companyName}</h3>
                                        <h4 className="text-sm font-black text-gray-900 uppercase italic tracking-tight group-hover:text-brand-pink transition-colors line-clamp-1">{p.name}</h4>
                                        <div className="flex items-center justify-center gap-3">
                                            {p.discountPrice ? (
                                                <>
                                                    <span className="text-[10px] font-bold text-gray-300 line-through italic">{p.price.toLocaleString()} ₺</span>
                                                    <span className="text-base font-black text-gray-900 italic tracking-tighter">{p.discountPrice.toLocaleString()} ₺</span>
                                                </>
                                            ) : (
                                                <span className="text-base font-black text-gray-900 italic tracking-tighter">{p.price.toLocaleString()} ₺</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DescriptionRenderer: React.FC<{ content: string; mainImage: string }> = ({ content, mainImage }) => {
    let blocks: any[] = [];
    let isRich = false;

    try {
        if (content && (content.startsWith('[') || content.startsWith('{'))) {
            blocks = JSON.parse(content);
            isRich = true;
        }
    } catch (e) {
        isRich = false;
    }

    if (!isRich) {
        return (
            <div className="space-y-10">
                {mainImage && <img src={getSizedImageUrl(mainImage, 'large')} alt="" width="800" height="800" className="w-full aspect-square object-contain rounded-md bg-gray-50 p-10 border border-gray-100 shadow-sm" fetchPriority="high" />}
                <div className="leading-relaxed text-gray-600 font-bold italic text-lg whitespace-pre-line">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {blocks.map((block: any, idx: number) => {
                switch (block.type) {
                    case 'HEADING':
                        return <h2 key={idx} className="text-3xl font-black text-gray-900 tracking-tight italic uppercase mb-6">{block.content}</h2>;
                    case 'TEXT':
                        return <p key={idx} className="text-gray-600 text-lg font-bold leading-[1.8] italic whitespace-pre-line">{block.content}</p>;
                    case 'IMAGE':
                        const imageUrl = typeof block.content === 'string' ? block.content : block.content?.url;
                        return (
                            <div key={idx} className="my-10 w-full aspect-video relative rounded-md overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                                <img src={getSizedImageUrl(imageUrl, 'original')} alt="Product Detail" width="1200" height="675" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                            </div>
                        );
                    case 'FEATURES':
                        return (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
                                {block.content.map((feat: string, fIdx: number) => (
                                    <div key={fIdx} className="flex items-start gap-4">
                                        <div className="w-2 h-2 mt-2 bg-brand-pink rounded-full flex-shrink-0"></div>
                                        <span className="text-sm font-black text-gray-800 uppercase italic tracking-tight leading-tight">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    case 'SPLIT':
                        return (
                            <div key={idx} className={`flex flex-col md:flex-row gap-12 items-center py-10 ${block.content.reverse ? 'md:flex-row-reverse' : ''}`}>
                                <div className="flex-1">
                                    <p className="text-gray-600 text-lg font-bold leading-relaxed italic whitespace-pre-line">{block.content.text}</p>
                                </div>
                                <div className="flex-1 w-full aspect-[4/3] relative rounded-md overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                                    <img src={getSizedImageUrl(block.content.image, 'large')} alt="Feature Element" width="800" height="600" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                                </div>
                            </div>
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
};

export default ProductDetailPage;
