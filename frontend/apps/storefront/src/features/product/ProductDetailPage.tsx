import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../cart/cart.store';

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
        user: { name: string };
        createdAt: string;
    }[];
    rating: number;
    reviewCount: number;
}

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { addItem } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState('M');
    const [activeTab, setActiveTab] = useState('description');
    const [mainImage, setMainImage] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = () => {
        if (product) {
            setIsAdding(true);
            addItem(product, selectedSize);
            setTimeout(() => setIsAdding(false), 1000);
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/${id}`, { signal: controller.signal });
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data);
                    const mainImg = data.images.find((img: any) => img.isMain) || data.images[0];
                    if (mainImg) setMainImage(mainImg.url);
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-300 italic">Ürün Detayları Yükleniyor...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-gray-100 shadow-inner rotate-3">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-6 uppercase tracking-tighter italic">Ürün Bulunamadı</h2>
                <Link to="/" className="px-10 py-4 bg-brand-pink text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-pink/20 hover:bg-brand-pink-hover transition-all">Ana Sayfaya Dön</Link>
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
                                className={`aspect-square w-full rounded-2xl overflow-hidden border-2 transition-all p-2 bg-[#fdfaf5] ${mainImage === img.url ? 'border-brand-pink shadow-lg shadow-brand-pink/10' : 'border-transparent opacity-50 hover:opacity-100 hover:border-gray-200'}`}
                            >
                                <img src={img.url} alt="" className="w-full h-full object-contain" />
                            </button>
                        ))}
                    </div>

                    {/* Main Image View */}
                    <div className="lg:col-span-6 relative group">
                        <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-[#fdfaf5] border border-gray-50 flex items-center justify-center p-12 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                            <img src={mainImage} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-1000" />
                        </div>
                        <div className="absolute top-10 left-10 flex flex-col gap-3">
                            <span className="px-5 py-2.5 bg-white shadow-xl text-[10px] font-black tracking-widest text-gray-900 uppercase italic rounded-xl">
                                {product.category?.name || 'CORETECH'}
                            </span>
                        </div>
                        <button className="absolute top-10 right-10 w-14 h-14 rounded-full bg-white shadow-2xl flex items-center justify-center text-gray-200 hover:text-brand-pink transition-all transform hover:scale-110 border border-gray-50">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                        </button>
                    </div>

                    {/* Product Info Panel */}
                    <div className="lg:col-span-5 flex flex-col pt-4">
                        <div className="mb-10 flex items-center gap-4">
                            <span className="text-[10px] font-black text-brand-pink tracking-[0.2em] uppercase bg-brand-pink/5 px-4 py-2 rounded-lg">{product.merchant?.companyName || 'FUIRA STORE'}</span>
                            <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                <span className="text-[11px] font-black text-gray-900 border-b border-gray-900 leading-none pb-0.5">{product.rating || '4.5'}</span>
                                <span className="text-[11px] font-bold text-gray-400">({product.reviewCount || 0} Değerlendirme)</span>
                            </div>
                        </div>

                        <h1 className="text-6xl font-[900] text-gray-900 leading-[1] tracking-tighter mb-8 italic uppercase">{product.name}</h1>

                        <div className="mb-12 p-8 bg-gray-50/50 border border-gray-100 rounded-[2.5rem] shadow-inner">
                            <div className="flex flex-col gap-1 mb-6">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PERAKENDE SATIŞ FİYATI</span>
                                <span className="text-5xl font-black text-gray-900 tracking-tighter italic">
                                    {(product.metadata as any)?.currency || '₺'}{product.price.toLocaleString()}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm font-bold leading-relaxed opacity-70 italic max-w-sm">
                                {product.description.length > 150 ? product.description.substring(0, 150) + '...' : product.description}
                            </p>
                        </div>

                        {/* Variants Placeholder Section */}
                        <div className="mb-10 space-y-10">
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">BEDEN SEÇİN</span>
                                    <button className="text-[10px] font-black text-brand-pink uppercase tracking-widest underline underline-offset-4 decoration-2">Beden Rehberi</button>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    {['S', 'M', 'L', 'XL'].map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`h-14 rounded-2xl text-xs font-black transition-all border-2 ${selectedSize === size ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-900/20 scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-900 hover:text-gray-900'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={isAdding}
                                className={`flex-grow h-20 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all transform hover:-translate-y-1 shadow-2xl italic ${isAdding ? 'bg-green-500 shadow-green-500/40' : 'bg-brand-pink hover:bg-brand-pink-hover shadow-brand-pink/40 text-white'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={isAdding ? "M5 13l4 4L19 7" : "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"} /></svg>
                                {isAdding ? 'EKLENDİ!' : 'SEPETE EKLE'}
                            </button>
                            <Link to="/wishlist" className="w-20 h-20 bg-gray-50 text-gray-900 border border-gray-100 rounded-[2rem] flex items-center justify-center hover:bg-white hover:border-brand-pink hover:text-brand-pink transition-all shadow-sm">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </Link>
                        </div>

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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center animate-fadeIn">
                                <div className="max-w-xl">
                                    <h2 className="text-4xl font-black text-gray-900 leading-[1.1] tracking-tighter mb-10 italic uppercase">Ürün Detayları & Tasarım</h2>
                                    <p className="text-gray-500 text-base font-bold leading-[1.8] mb-12 opacity-80 italic">
                                        {product.description}
                                    </p>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="p-6 bg-[#fdfaf5] rounded-3xl border border-gray-50">
                                            <span className="text-[9px] font-black text-brand-pink uppercase tracking-widest mb-2 block">MALZEME</span>
                                            <span className="text-sm font-black text-gray-900 italic uppercase tracking-tight">Premium Kalite</span>
                                        </div>
                                        <div className="p-6 bg-[#fdfaf5] rounded-3xl border border-gray-50">
                                            <span className="text-[9px] font-black text-brand-pink uppercase tracking-widest mb-2 block">ÜRETİM</span>
                                            <span className="text-sm font-black text-gray-900 italic uppercase tracking-tight">Özel Seri</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <div className="aspect-square rounded-[4rem] overflow-hidden bg-[#fdfaf5] rotate-3 group-hover:rotate-0 transition-transform duration-1000 p-16 shadow-inner border border-gray-50">
                                        <img src={mainImage} alt="Detail" className="w-full h-full object-contain scale-110 group-hover:scale-100 transition-transform duration-1000" />
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-pink/5 rounded-full blur-3xl"></div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="animate-fadeIn">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
                                    <div>
                                        <h2 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter italic uppercase">Müşteri Yorumları</h2>
                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                ))}
                                            </div>
                                            <span className="text-lg font-black text-gray-900 border-b-2 border-brand-pink leading-none pb-1">{product.rating || '4.5'} Skor</span>
                                            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{product.reviewCount || 0} DEĞERLENDİRME</span>
                                        </div>
                                    </div>
                                    <button className="bg-gray-900 text-white px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-pink transition-all shadow-xl shadow-gray-900/10 italic">Yorum Yaz</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {(product.reviews && product.reviews.length > 0) ? product.reviews.map(review => (
                                        <div key={review.id} className="bg-white p-12 rounded-[3.5rem] border border-gray-50 hover:shadow-2xl hover:shadow-gray-100 transition-all group overflow-hidden relative">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-[4rem] -translate-x-12 -translate-y-12 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                                            <div className="flex items-start justify-between mb-10 relative z-10">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 rounded-[1.5rem] bg-[#fdfaf5] border border-gray-100 flex items-center justify-center font-black text-brand-pink text-xl shadow-inner italic">
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
                                                <p className="text-sm text-gray-500 font-bold leading-relaxed opacity-70 italic">
                                                    "{review.comment}"
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-2 py-32 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                                            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.4em] italic leading-tight">Henüz bu şaheser için bir yorum yapılmamış.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'specs' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12 animate-fadeIn">
                                {[
                                    { label: 'MALZEME', value: 'Premium Karbon Çelik & Deri' },
                                    { label: 'AĞIRLIK', value: '1.2 kg' },
                                    { label: 'BOYUTLAR', value: '45cm x 30cm x 15cm' },
                                    { label: 'GARANTİ', value: '2 YIL SINIRSIZ' },
                                    { label: 'MENŞEİ', value: 'EUROPEAN CRAFT' },
                                    { label: 'BAKIM', value: 'SADECE KURU TEMİZLEME' }
                                ].map((spec, i) => (
                                    <div key={i} className="flex justify-between items-center py-6 border-b border-gray-50 group cursor-default">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-brand-pink transition-colors italic">{spec.label}</span>
                                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight italic group-hover:translate-x-[-10px] transition-transform">{spec.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recently Viewed or Suggested (Optional UI Polish) */}
                <div className="pt-20 border-t border-gray-50">
                    <h2 className="text-2xl font-black text-gray-900 mb-12 uppercase tracking-[0.2em] italic text-center">İlginizi Çekebilir</h2>
                    <div className="grid grid-cols-4 gap-10">
                        {/* This would ideally be a real recommendation engine results */}
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-[#fdfaf5] rounded-[2rem] border border-gray-50 group cursor-pointer overflow-hidden p-8 shadow-sm">
                                <div className="w-full h-full bg-white/20 rounded-xl animate-pulse group-hover:animate-none transition-all"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
