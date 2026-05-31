import React from 'react';
import { useParams, Link } from 'react-router-dom';
import AddToCollectionModal from '../collections/components/AddToCollectionModal';
import { getSizedImageUrl } from '../../shared/utils/image.util';
import { useProductDetail } from './hooks/useProductDetail';
import { useToast } from '../../shared/components/Toast';

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
    const toast = useToast();
    const {
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
        isFetchingNewProduct
    } = useProductDetail(id);

    const [questions, setQuestions] = React.useState<any[]>([]);
    const [showQuestionForm, setShowQuestionForm] = React.useState(false);
    const [questionName, setQuestionName] = React.useState('');
    const [questionText, setQuestionText] = React.useState('');
    const [isSubmittingQuestion, setIsSubmittingQuestion] = React.useState(false);
    const [questionsLoading, setQuestionsLoading] = React.useState(false);

    // Lightbox Modal for Product Image Zoom/Fullscreen
    const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
    const currentImageIndex = product?.images?.findIndex(img => img.url === mainImage) ?? -1;

    const handlePrevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!product?.images || product.images.length <= 1) return;
        const newIndex = (currentImageIndex - 1 + product.images.length) % product.images.length;
        setMainImage(product.images[newIndex].url);
    };

    const handleNextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!product?.images || product.images.length <= 1) return;
        const newIndex = (currentImageIndex + 1) % product.images.length;
        setMainImage(product.images[newIndex].url);
    };

    React.useEffect(() => {
        if (!isLightboxOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsLightboxOpen(false);
            } else if (e.key === 'ArrowLeft') {
                handlePrevImage();
            } else if (e.key === 'ArrowRight') {
                handleNextImage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isLightboxOpen, currentImageIndex, product?.images]);

    React.useEffect(() => {
        if (activeTab === 'qa' && product?.id) {
            const fetchQuestions = async () => {
                setQuestionsLoading(true);
                try {
                    const res = await fetch(`/api/products/${product.id}/questions`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success) {
                            setQuestions(data.data);
                        }
                    }
                } catch (err) {
                    console.error('Sorular alınamadı:', err);
                } finally {
                    setQuestionsLoading(false);
                }
            };
            fetchQuestions();
        }
    }, [activeTab, product?.id]);

    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionText.trim()) return;

        setIsSubmittingQuestion(true);
        try {
            const res = await fetch(`/api/products/${product.id}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionText,
                    userName: questionName || 'Ziyaretçi',
                    merchantId: product.merchantId || 'default',
                    productName: product.name
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    toast.success('Sorunuz satıcıya iletildi. Cevaplandığında burada görünecektir!');
                    setQuestionText('');
                    setShowQuestionForm(false);
                    // Reload
                    const req = await fetch(`/api/products/${product.id}/questions`);
                    const resJson = await req.json();
                    if (resJson.success) setQuestions(resJson.data);
                }
            } else {
                toast.error('Soru gönderilemedi.');
            }
        } catch (err) {
            toast.error('Bir hata oluştu.');
        } finally {
            setIsSubmittingQuestion(false);
        }
    };

    if (isLoading || isFetchingNewProduct) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                <p className="font-semibold text-10px   text-gray-400 ">Ürün Detayları Yükleniyor...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-16 bg-gray-50 rounded-md flex items-center justify-center mb-6 border border-gray-100 shadow-inner rotate-3">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4   ">Ürün Bulunamadı</h2>
                <Link to="/" className="px-8 py-3 bg-brand-pink text-white rounded-md text-10px font-semibold   shadow-lg shadow-brand-pink/20 hover:bg-brand-pink-hover transition-all">Ana Sayfaya Dön</Link>
            </div>
        );
    }

    return (
        <div className="bg-white">
            <div className="max-w-[1650px] mx-auto px-4 sm:px-10 lg:px-20 py-10">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-10px font-semibold text-gray-400   mb-16 ">
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 mb-32">
                    {/* Image Gallery Thumbnails */}
                    <div className="lg:col-span-1 flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide shrink-0 order-2 lg:order-1">
                        {product.images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setMainImage(img.url)}
                                className={`aspect-square w-16 sm:w-20 lg:w-full rounded-md overflow-hidden border-2 transition-all bg-[#fdfaf5] shrink-0 ${mainImage === img.url ? 'border-brand-pink shadow-lg shadow-brand-pink/10' : 'border-transparent opacity-50 hover:opacity-100 hover:border-gray-200'}`}
                            >
                                {img.url && <img src={getSizedImageUrl(img.url, 'small')} alt="" className="w-full h-full object-contain" width="200" height="200" loading="lazy" />}
                            </button>
                        ))}
                    </div>

                    {/* Main Image View */}
                    <div className="lg:col-span-4 relative group flex flex-col items-start order-1 lg:order-2">
                        <div 
                            onClick={() => setIsLightboxOpen(true)}
                            className="w-full aspect-square relative rounded-md overflow-hidden bg-white border border-gray-100 flex items-center justify-center shadow-sm transition-all duration-700 cursor-zoom-in group"
                        >
                            {mainImage && (
                                <img
                                    src={getSizedImageUrl(mainImage, 'large')}
                                    alt={product.name}
                                    width="800"
                                    height="800"
                                    fetchPriority="high"
                                    loading="eager"
                                    className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                />
                            )}
                            {/* Magnifying Glass Premium Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors flex items-center justify-center pointer-events-none">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur shadow-md px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-gray-700 select-none">
                                    <svg className="w-4 h-4 text-brand-pink animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                    </svg>
                                    Büyütmek İçin Tıkla
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-4 left-4 flex flex-col gap-3">
                            <span className="px-4 py-2 bg-white/90 backdrop-blur shadow-sm border border-gray-100 text-nano font-semibold  text-gray-900   rounded-lg">
                                {product.category?.name || 'CORETECH'}
                            </span>
                        </div>
                        <button
                            onClick={handleWishlist}
                            className={`absolute top-4 right-4 w-12 h-12 rounded-full shadow-md flex items-center justify-center transition-all transform  border ${isInWishlist(product.id) ? 'bg-brand-pink border-brand-pink text-white' : 'bg-white border-gray-100 text-gray-400 hover:text-brand-pink'}`}
                        >
                            <svg className="w-5 h-5" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </button>
                    </div>

                    {/* Product Info Panel */}
                    <div className="lg:col-span-7 flex flex-col pt-2 order-3 lg:order-3">
                        <div className="mb-6 flex items-center gap-4">
                            <span className="text-10px font-semibold text-brand-pink   bg-brand-pink/5 px-4 py-2 rounded-md">{product.merchant?.companyName || 'FUIRA STORE'}</span>
                            <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                <span className="text-caption font-semibold text-gray-900 border-b border-gray-900 leading-none pb-0.5">{product.rating?.toFixed(2) || '0.00'}</span>
                                <span className="text-caption font-semibold text-gray-400">({product.reviewCount || 0} Değerlendirme)</span>
                            </div>
                        </div>

                        <h1 className="text-2xl font-semibold text-gray-800 leading-[1.3] mb-4">{product.name}</h1>


                        {cartCount > 0 && product.stock > 0 && cartCount >= (product.stock * 0.8) && (
                            <div className="mb-4 flex items-center gap-3 p-1 bg-orange-50 border border-orange-100 rounded-md animate-pulse">
                                <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <p className="text-caption font-[900] text-orange-900  ">
                                    DİKKAT! <span className="text-orange-600 text-sm mx-0.5">{cartCount}</span> kişi bu ürünü sepetinde tutuyor ve stoklar tükenmek üzere!
                                </p>
                            </div>
                        )}
                        {/* Price & Badge */}
                        <div className="flex items-center gap-6 mb-5">
                            <div className="flex flex-col">
                                {product.discountPrice && (
                                    <span className="text-10px font-semibold text-slate-400   mb-1 ">İNDİRİMLİ FİYAT</span>
                                )}
                                <div className="flex items-center gap-4">
                                    {product.discountPrice ? (
                                        <>
                                            <span className="text-xl font-semibold text-slate-400 line-through opacity-60 ">
                                                {(product.price + Object.keys(selectedVariants).reduce((acc, key) => {
                                                    const val = selectedVariants[key];
                                                    const variant = product.variants.find(v => v.name === key && v.value === val);
                                                    return acc + (variant?.price || 0);
                                                }, 0)).toLocaleString()}&nbsp;₺
                                            </span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-4xl lg:text-5xl font-[1000] text-slate-900  ">
                                                    {(product.discountPrice + Object.keys(selectedVariants).reduce((acc, key) => {
                                                        const val = selectedVariants[key];
                                                        const variant = product.variants.find(v => v.name === key && v.value === val);
                                                        return acc + (variant?.price || 0);
                                                    }, 0)).toLocaleString()}&nbsp;₺
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-4xl lg:text-5xl font-[1000] text-slate-900  ">
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
                        <p className="text-slate-500 font-semibold leading-loose mb-5 text-sm whitespace-pre-wrap ">
                            {product.shortDescription || 'Bu ürün için henüz kısa açıklama girilmemiş.'}
                        </p>

                        {/* Dynamic Variants Section */}
                        <div className="mb-5 space-y-10">
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
                                                <span className="text-10px font-semibold   text-slate-400 ">
                                                    {groupName ? groupName.toUpperCase() : ''} SEÇİN
                                                </span>
                                                {groupName?.toUpperCase() === 'BEDEN' && (
                                                    <button className="text-10px font-semibold text-brand-pink   underline underline-offset-4 decoration-2">Beden Rehberi</button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                                {groupValues.map(val => {
                                                    const varInfo = product.variants.find(v => v.name === groupName && v.value === val);
                                                    const isSelected = selectedVariants[groupName] === val;
                                                    const priceDiff = varInfo?.price || 0;

                                                    return (
                                                        <button
                                                            key={val}
                                                            onClick={() => setSelectedVariants(prev => ({ ...prev, [groupName]: val }))}
                                                            className={`h-16 rounded-md text-xs font-semibold transition-all border-2 flex flex-col items-center justify-center gap-1 ${isSelected ? 'bg-slate-900 text-white border-slate-900  shadow-slate-900/20 scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-900 hover:text-slate-900'}`}
                                                        >
                                                            <span>{val}</span>
                                                            {priceDiff !== 0 && (
                                                                <span className={`text-nano ${isSelected ? 'text-indigo-400' : 'text-indigo-500'} font-semibold`}>
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
                                    className={`flex-grow h-16 rounded-md font-semibold text-caption   flex items-center justify-center gap-4 transition-all transform hover:-translate-y-1 shadow-xl  ${isAdding ? 'bg-green-500 shadow-green-500/40' : 'bg-brand-pink hover:bg-brand-pink-hover shadow-brand-pink/40 text-white'}`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={isAdding ? "M5 13l4 4L19 7" : "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"} /></svg>
                                    {isAdding ? 'EKLENDİ!' : 'SEPETE EKLE'}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="flex-grow h-16 bg-gray-100 text-gray-400 rounded-md font-semibold text-caption   flex items-center justify-center gap-4  border border-gray-100 cursor-not-allowed"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                    STOKTA YOK
                                </button>
                            )}
                            <button
                                onClick={handleWishlist}
                                aria-label={product && isInWishlist(product.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                                className={`w-20 h-16 border rounded-md flex items-center justify-center transition-all shadow-sm ${product && isInWishlist(product.id)
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
                                        toast.error('Koleksiyon oluşturmak için lütfen giriş yapın.');
                                        return;
                                    }
                                    setShowCollectionModal(true);
                                }}
                                aria-label="Koleksiyona Ekle"
                                className="w-20 h-16 bg-gray-50 text-gray-900 border border-gray-100 rounded-md flex items-center justify-center hover:bg-white hover:border-gray-300 transition-all shadow-sm"
                            >
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </button>
                        </div>

                        {showCollectionModal && product && (
                            <AddToCollectionModal product={product} onClose={() => setShowCollectionModal(false)} />
                        )}

                        <div className="mt-8 flex items-center justify-center gap-6 text-nano font-semibold text-gray-300   ">
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

                        {(() => {
                            const stored = localStorage.getItem('vendor_saved_addresses');
                            let defaultAddr = null;
                            if (stored) {
                                try {
                                    const addrs = JSON.parse(stored);
                                    defaultAddr = addrs.find((a: any) => a.isDefault) || addrs[0];
                                } catch (e) { }
                            }
                            if (!defaultAddr) {
                                defaultAddr = {
                                    title: "Merkez Depo",
                                    city: "İSTANBUL",
                                    district: "Levent",
                                    neighborhood: "Levent Mh.",
                                    address: "Büyükdere Cad. Kristal Plaza Kat:22"
                                };
                            }
                            return (
                                <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4 text-left animate-in fade-in duration-500">
                                    <div className="w-10 h-10 bg-brand-pink/10 rounded-xl flex items-center justify-center text-brand-pink shrink-0 font-semibold">
                                        📦
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-slate-400 block mb-0.5 ">GÖNDERİM NOKTASI (TESLİMAT ÇIKIŞI)</span>
                                        <span className="text-xs font-semibold text-slate-700 ">
                                            Bu ürün satıcının <span className="text-brand-pink font-extrabold">{defaultAddr.district.toUpperCase()}, {defaultAddr.city.toUpperCase()}</span> ({defaultAddr.title}) adresindeki deposundan kargolanacaktır.
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Detailed Tabs */}
                <div className="mb-32">
                    <div className="flex border-b border-gray-50 gap-16 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {['AÇIKLAMA', 'ÖZELLİKLER', 'DEĞERLENDİRMELER', 'SORU & CEVAP'].map(tab => {
                            const key = tab === 'AÇIKLAMA' ? 'description' : (tab === 'ÖZELLİKLER' ? 'specs' : (tab === 'DEĞERLENDİRMELER' ? 'reviews' : 'qa'));
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`pb-8 text-caption font-semibold  transition-all relative ${activeTab === key ? 'text-gray-900 ' : 'text-gray-300 hover:text-gray-500'}`}
                                >
                                    {tab}
                                    {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-brand-pink rounded-full shadow-[0_0_10px_rgba(255,51,102,0.5)]"></div>}
                                </button>
                            )
                        })}
                    </div>

                    <div className="min-h-[400px]">
                        {activeTab === 'description' && (
                            <div className="animate-fadeIn  mx-auto py-10">
                                <DescriptionRenderer content={product.description} mainImage={mainImage} />
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="animate-fadeIn">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-8">
                                    <div>
                                        <h2 className="text-4xl font-semibold text-gray-900 mb-4   ">Müşteri Yorumları</h2>
                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-5 h-5 ${i < Math.round(product.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                ))}
                                            </div>
                                            <span className="text-lg font-semibold text-gray-900 border-b-2 border-brand-pink leading-none pb-1">{product.rating?.toFixed(2) || '0.00'} Skor</span>
                                            <span className="text-gray-400 font-semibold  text-10px ">{product.reviewCount || 0} DEĞERLENDİRME</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                toast.error('Yorum yapmak için lütfen giriş yapın.');
                                                return;
                                            }
                                            if (!canReview) {
                                                if (reviewReason === 'already_reviewed') {
                                                    toast.info('Bu ürün için zaten bir değerlendirme yaptınız.');
                                                } else {
                                                    toast.warning('Yalnızca teslim edilen siparişlerdeki ürünlere yorum yapabilirsiniz.');
                                                }
                                                return;
                                            }
                                            setShowReviewForm(true);
                                        }}
                                        className="bg-gray-900 text-white px-12 py-5 rounded-md text-10px font-semibold   hover:bg-brand-pink transition-all  shadow-gray-900/10 "
                                    >
                                        Yorum Yaz
                                    </button>
                                </div>

                                {/* Review Form */}
                                {showReviewForm && (
                                    <div className="bg-white border border-gray-100 rounded-md p-8 mb-6 shadow-lg">
                                        <h3 className="text-xl font-semibold text-gray-900    mb-6">Değerlendirmeniz</h3>

                                        {/* Star Rating Selector */}
                                        <div className="mb-6">
                                            <label className="text-10px font-semibold text-gray-400   mb-3 block">PUAN VERİN</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                                        className="transition-transform "
                                                    >
                                                        <svg className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </button>
                                                ))}
                                                <span className="ml-3 text-sm font-semibold text-gray-900 self-center">{reviewForm.rating}/5</span>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <div className="mb-4">
                                            <label className="text-10px font-semibold text-gray-400   mb-2 block">BAŞLIK (OPSİYONEL)</label>
                                            <input
                                                type="text"
                                                value={reviewForm.title}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                                                placeholder="Kısa bir başlık yazın..."
                                                className="w-full h-16 px-6 rounded-md bg-gray-50 border border-gray-200 text-sm font-semibold outline-none focus:border-brand-pink transition-all"
                                            />
                                        </div>

                                        {/* Comment */}
                                        <div className="mb-6">
                                            <label className="text-10px font-semibold text-gray-400   mb-2 block">YORUMUNUZ</label>
                                            <textarea
                                                value={reviewForm.comment}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                                placeholder="Ürün hakkındaki deneyiminizi paylaşın..."
                                                rows={4}
                                                className="w-full px-6 py-4 rounded-md bg-gray-50 border border-gray-200 text-sm font-semibold outline-none focus:border-brand-pink transition-all resize-none"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowReviewForm(false)}
                                                className="px-6 py-3 bg-gray-100 text-gray-500 rounded-md text-10px font-semibold   hover:bg-gray-200 transition-all"
                                            >
                                                İPTAL
                                            </button>
                                            <button
                                                onClick={submitReview}
                                                disabled={isSubmittingReview}
                                                className="px-8 py-3 bg-brand-pink text-white rounded-md text-10px font-semibold   hover:bg-brand-pink-hover transition-all flex items-center gap-2 shadow-lg shadow-brand-pink/20"
                                            >
                                                {isSubmittingReview && <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                                                GÖNDER
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {(product.reviews && product.reviews.length > 0) ? product.reviews.map(review => (
                                        <div key={review.id} className="bg-white p-12 rounded-md border border-gray-100 hover:shadow-xl hover:shadow-gray-100 transition-all group overflow-hidden relative">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-md -translate-x-12 -translate-y-12 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                                            <div className="flex items-start justify-between mb-5 relative z-10">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-md bg-[#fdfaf5] border border-gray-100 flex items-center justify-center font-semibold text-brand-pink text-xl shadow-inner ">
                                                        {review.user?.name ? review.user.name[0] : 'U'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-[900] text-gray-900 text-base   ">{review.user?.name || 'Kullanıcı'}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                            <span className="text-nano font-semibold text-green-600   leading-none">Doğrulanmış Alıcı</span>
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
                                                <h5 className="text-base font-semibold text-gray-900 mb-4  leading-tight  ">{review.title}</h5>
                                                <p className="text-sm text-gray-500 font-semibold leading-relaxed opacity-70  mb-6">
                                                    "{review.comment}"
                                                </p>

                                                {review.images && review.images.length > 0 && (
                                                    <div className="flex flex-wrap gap-3 mt-6">
                                                        {review.images.map((img: any) => (
                                                            <div key={img.id} className="w-20 h-16 rounded-lg overflow-hidden border border-gray-100 group/img relative">
                                                                <img src={img.url} alt="Review" className="w-full h-full object-contain transition-transform group-hover/img:scale-110" />
                                                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors pointer-events-none"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-2 py-32 text-center bg-gray-50/50 rounded-md border border-dashed border-gray-200">
                                            <p className="text-gray-400 font-semibold text-10px    leading-tight">Henüz bu şaheser için bir yorum yapılmamış.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'specs' && (
                            <div className="animate-fadeIn max-w-[900px] mx-auto">
                                <div className="bg-white border border-gray-100 rounded-md overflow-hidden">
                                    <div className="p-10 border-b border-gray-50 bg-gray-50/30">
                                        <h3 className="text-xl font-semibold text-gray-900   ">TEKNİK ÖZELLİKLER</h3>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {product.variants && product.variants.length > 0 ? product.variants.map((v, i) => (
                                            <div key={i} className="flex flex-col md:flex-row p-6 hover:bg-gray-50/50 transition-colors">
                                                <div className="w-full md:w-1/3 text-caption font-semibold text-gray-400   mb-2 md:mb-0 ">{v.name}</div>
                                                <div className="w-full md:w-2/3 text-sm font-semibold text-gray-900  leading-relaxed">{v.value}</div>
                                            </div>
                                        )) : (
                                            <div className="p-20 text-center text-gray-300 font-semibold    text-10px">
                                                ÖZELLİK BİLGİSİ BULUNMUYOR
                                            </div>
                                        )}
                                        {/* Basic Specs Fallback */}
                                        <div className="flex flex-col md:flex-row p-6 hover:bg-gray-50/50 transition-colors">
                                            <div className="w-full md:w-1/3 text-caption font-semibold text-gray-400   mb-2 md:mb-0 ">MARKA</div>
                                            <div className="w-full md:w-2/3 text-sm font-semibold text-gray-900  leading-relaxed">{product.merchant?.companyName || 'BİLİNMİYOR'}</div>
                                        </div>
                                        <div className="flex flex-col md:flex-row p-6 hover:bg-gray-50/50 transition-colors">
                                            <div className="w-full md:w-1/3 text-caption font-semibold text-gray-400   mb-2 md:mb-0 ">GARANTİ</div>
                                            <div className="w-full md:w-2/3 text-sm font-semibold text-gray-900  leading-relaxed">2 Yıl Distribütör Garantili</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'qa' && (
                            <div className="animate-fadeIn max-w-[900px] mx-auto">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-8">
                                    <div>
                                        <h2 className="text-4xl font-semibold text-gray-900 mb-4 ">Satıcıya Sorular</h2>
                                        <p className="text-sm font-semibold text-gray-400 ">Bu ürün ve teslimat detayları hakkında satıcıya merak ettiklerinizi sorun.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowQuestionForm(!showQuestionForm)}
                                        className="bg-brand-pink text-white px-12 py-5 rounded-md text-10px font-semibold hover:bg-brand-pink-hover transition-all shadow-lg shadow-brand-pink/20 "
                                    >
                                        {showQuestionForm ? 'Formu Kapat' : 'Satıcıya Soru Sor'}
                                    </button>
                                </div>

                                {/* Question Form */}
                                {showQuestionForm && (
                                    <form onSubmit={handleAskQuestion} className="bg-white border border-gray-100 rounded-md p-8 mb-6 shadow-lg space-y-6">
                                        <h3 className="text-xl font-semibold text-gray-900 ">Sorunuzu Gönderin</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-10px font-semibold text-gray-400 mb-2 block">ADINIZ SOYADINIZ</label>
                                                <input
                                                    type="text"
                                                    value={questionName}
                                                    onChange={(e) => setQuestionName(e.target.value)}
                                                    placeholder="Örn: Furkan Kılınç"
                                                    className="w-full h-14 px-6 rounded-md bg-gray-50 border border-gray-200 text-sm font-semibold outline-none focus:border-brand-pink transition-all "
                                                />
                                            </div>
                                            <div>
                                                <label className="text-10px font-semibold text-gray-400 mb-2 block font-mono">SATICI MAĞAZA</label>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={product.merchant?.companyName || 'Resmi Mağaza'}
                                                    className="w-full h-14 px-6 rounded-md bg-gray-100 border border-gray-200 text-sm font-semibold outline-none text-gray-400  cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-10px font-semibold text-gray-400 mb-2 block">SORUNUZ</label>
                                            <textarea
                                                required
                                                value={questionText}
                                                onChange={(e) => setQuestionText(e.target.value)}
                                                placeholder="Ürünün özellikleri, kargo süresi vb. konularda sorunuzu detaylandırın..."
                                                rows={4}
                                                className="w-full px-6 py-4 rounded-md bg-gray-50 border border-gray-200 text-sm font-semibold outline-none focus:border-brand-pink transition-all resize-none "
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowQuestionForm(false)}
                                                className="px-6 py-3 bg-gray-100 text-gray-500 rounded-md text-10px font-semibold hover:bg-gray-200 transition-all "
                                            >
                                                İPTAL
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmittingQuestion}
                                                className="px-8 py-3 bg-brand-pink text-white rounded-md text-10px font-semibold hover:bg-brand-pink-hover transition-all flex items-center gap-2 shadow-lg shadow-brand-pink/20 "
                                            >
                                                {isSubmittingQuestion && <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                                                SORUYU GÖNDER
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Questions List */}
                                <div className="space-y-6">
                                    {questionsLoading ? (
                                        <div className="flex justify-center py-20">
                                            <div className="w-8 h-8 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : questions.length > 0 ? (
                                        questions.map((q) => (
                                            <div key={q.id} className="bg-white p-8 rounded-md border border-gray-100 shadow-sm space-y-4">
                                                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-500 text-xs ">
                                                            {q.userName ? q.userName[0].toUpperCase() : 'Z'}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-gray-800  leading-none">{q.userName}</h4>
                                                            <span className="text-[9px] font-semibold text-slate-400 ">Soru Tarihi: {new Date(q.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    {q.answerText ? (
                                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-semibold rounded-full ">Cevaplandı</span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-semibold rounded-full ">Cevap Bekliyor</span>
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                                        <span className="text-[9px] font-black text-slate-400  block mb-1">SORU:</span>
                                                        <p className="text-xs font-semibold text-gray-700 ">{q.questionText}</p>
                                                    </div>
                                                    {q.answerText && (
                                                        <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-50/50 ml-6">
                                                            <span className="text-[9px] font-black text-emerald-600  block mb-1">SATICI CEVABI:</span>
                                                            <p className="text-xs font-semibold text-gray-800 ">{q.answerText}</p>
                                                            <span className="text-[8px] font-semibold text-slate-400  mt-2 block">Cevap Tarihi: {new Date(q.answeredAt || q.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center bg-gray-50/50 rounded-md border border-dashed border-gray-200">
                                            <p className="text-gray-400 font-semibold text-10px  leading-tight">Bu ürün için henüz soru sorulmamış. İlk soruyu siz sorun!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Suggested Products Section */}
                {suggestedProducts.length > 0 && (
                    <div className="pt-20 border-t border-gray-50">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6    text-center animate-in fade-in duration-700">İlginizi Çekebilir</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
                            {suggestedProducts.map((p) => (
                                <Link
                                    to={`/product/${p.id}`}
                                    key={p.id}
                                    className="group animate-in fade-in slide-in-from-bottom-4 duration-700"
                                    onClick={() => window.scrollTo(0, 0)}
                                >
                                    <div className="aspect-square bg-[#fdfaf5] rounded-md border border-gray-50 group-hover:shadow-xl group-hover:shadow-gray-100 transition-all overflow-hidden p-8 relative flex items-center justify-center">
                                        <img
                                            src={getSizedImageUrl(p.images?.[0]?.url, 'medium')}
                                            alt={p.name}
                                            className="w-full h-full object-contain transform group- transition-transform duration-700"
                                        />
                                        {p.discountPrice && (
                                            <div className="absolute top-4 right-4 px-3 py-1 bg-brand-pink text-white text-nano font-semibold   rounded-full  shadow-lg shadow-brand-pink/20">
                                                İNDİRİM
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-6 space-y-2 text-center">
                                        <h3 className="text-10px font-semibold text-gray-400   ">{p.merchant?.companyName}</h3>
                                        <h4 className="text-sm font-semibold text-gray-900    group-hover:text-brand-pink transition-colors line-clamp-1">{p.name}</h4>
                                        <div className="flex items-center justify-center gap-3">
                                            {p.discountPrice ? (
                                                <>
                                                    <span className="text-10px font-semibold text-gray-300 line-through ">{p.price.toLocaleString()} ₺</span>
                                                    <span className="text-base font-semibold text-gray-900  ">{p.discountPrice.toLocaleString()} ₺</span>
                                                </>
                                            ) : (
                                                <span className="text-base font-semibold text-gray-900  ">{p.price.toLocaleString()} ₺</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* GORGEOUS FULLSCREEN LIGHTBOX MODAL */}
            {isLightboxOpen && (
                <div 
                    onClick={() => setIsLightboxOpen(false)}
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-10 select-none animate-in fade-in duration-300"
                >
                    {/* Header Controls */}
                    <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                        {product.images && product.images.length > 0 && (
                            <span className="text-white/60 font-semibold text-caption bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
                                {currentImageIndex + 1} / {product.images.length}
                            </span>
                        )}
                        
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 text-white flex items-center justify-center hover:bg-brand-pink hover:border-brand-pink transition-all shadow-md transform hover:scale-105 active:scale-95 cursor-pointer"
                            aria-label="Kapat"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Image Viewer Area */}
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="relative max-w-5xl max-h-[80vh] w-full flex items-center justify-center px-4"
                    >
                        {/* Left Control Arrow */}
                        {product.images && product.images.length > 1 && (
                            <button
                                onClick={handlePrevImage}
                                className="absolute left-2 md:-left-16 z-20 w-14 h-14 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center hover:bg-brand-pink hover:border-brand-pink hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                                aria-label="Önceki Görsel"
                            >
                                <svg className="w-6 h-6 -translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        {/* Large Sized/Original Rendered Image */}
                        <div className="relative aspect-square md:aspect-auto max-w-full max-h-[75vh] bg-[#fafafa]/5 rounded-2xl overflow-hidden border border-white/5 p-4 flex items-center justify-center animate-in zoom-in-95 duration-300 shadow-2xl">
                            {mainImage && (
                                <img
                                    src={getSizedImageUrl(mainImage, 'original')}
                                    alt={product.name}
                                    className="max-w-full max-h-[70vh] object-contain rounded-xl select-none"
                                />
                            )}
                        </div>

                        {/* Right Control Arrow */}
                        {product.images && product.images.length > 1 && (
                            <button
                                onClick={handleNextImage}
                                className="absolute right-2 md:-right-16 z-20 w-14 h-14 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center hover:bg-brand-pink hover:border-brand-pink hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                                aria-label="Sonraki Görsel"
                            >
                                <svg className="w-6 h-6 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Bottom Micro-Thumbnails for navigation */}
                    {product.images && product.images.length > 1 && (
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-6 flex gap-3 overflow-x-auto max-w-md px-4 py-2 scrollbar-hide bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md"
                        >
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setMainImage(img.url)}
                                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                        mainImage === img.url 
                                            ? 'border-brand-pink scale-110 shadow-lg shadow-brand-pink/20' 
                                            : 'border-transparent opacity-40 hover:opacity-100'
                                    }`}
                                >
                                    <img src={getSizedImageUrl(img.url, 'small')} alt="" className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
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
                <div className="leading-relaxed text-gray-600 font-semibold  text-lg whitespace-pre-line">
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
                        return <h2 key={idx} className="text-3xl font-semibold text-gray-900    mb-6">{block.content}</h2>;
                    case 'TEXT':
                        return <p key={idx} className="text-gray-600 text-lg font-semibold leading-[1.8]  whitespace-pre-line">{block.content}</p>;
                    case 'IMAGE':
                        const imageUrl = typeof block.content === 'string' ? block.content : block.content?.url;
                        return (
                            <div key={idx} className="my-10 w-full aspect-video relative rounded-md overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                                <img src={getSizedImageUrl(imageUrl, 'original')} alt="Product Detail" width="1200" height="675" className="absolute inset-0 w-full h-full object-contain" loading="lazy" />
                            </div>
                        );
                    case 'FEATURES':
                        return (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
                                {block.content.map((feat: string, fIdx: number) => (
                                    <div key={fIdx} className="flex items-start gap-4">
                                        <div className="w-2 h-2 mt-2 bg-brand-pink rounded-full flex-shrink-0"></div>
                                        <span className="text-sm font-semibold text-gray-800    leading-tight">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    case 'SPLIT':
                        return (
                            <div key={idx} className={`flex flex-col md:flex-row gap-12 items-center py-10 ${block.content.reverse ? 'md:flex-row-reverse' : ''}`}>
                                <div className="flex-1">
                                    <p className="text-gray-600 text-lg font-semibold leading-relaxed  whitespace-pre-line">{block.content.text}</p>
                                </div>
                                <div className="flex-1 w-full aspect-[4/3] relative rounded-md overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                                    <img src={getSizedImageUrl(block.content.image, 'large')} alt="Feature Element" width="800" height="600" className="absolute inset-0 w-full h-full object-contain" loading="lazy" />
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
