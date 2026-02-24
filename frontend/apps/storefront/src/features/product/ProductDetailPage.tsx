import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    category: { name: string; slug: string };
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
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedColor, setSelectedColor] = useState('midnight');
    const [activeTab, setActiveTab] = useState('description');
    const [mainImage, setMainImage] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data);
                    const mainImg = data.images.find((img: any) => img.isMain) || data.images[0];
                    if (mainImg) setMainImage(mainImg.url);
                }
            } catch (err) {
                console.error('Failed to fetch product:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-black text-gray-900 mb-4">Ürün bulunamadı</h2>
                <Link to="/" className="text-brand-pink font-bold hover:underline">Ana sayfaya dön</Link>
            </div>
        );
    }

    const sizes = product.variants.filter(v => v.name.toLowerCase() === 'size').map(v => v.value) || [];
    const colors = product.variants.filter(v => v.name.toLowerCase() === 'color') || [];

    return (
        <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumbs */}
                <nav className="flex text-[10px] font-black uppercase tracking-widest text-gray-400 mb-12 gap-2 overflow-x-auto whitespace-nowrap">
                    <Link to="/" className="hover:text-gray-900">Home</Link>
                    <span>/</span>
                    <Link to="/shop" className="hover:text-gray-900">{product.category?.name || 'Category'}</Link>
                    <span>/</span>
                    <span className="text-gray-900">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
                    {/* Image Gallery */}
                    <div className="lg:col-span-1 hidden lg:flex flex-col gap-4">
                        {product.images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setMainImage(img.url)}
                                className={`aspect-square w-full rounded-2xl overflow-hidden border-2 transition-all ${mainImage === img.url ? 'border-brand-pink shrink-0' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            >
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>

                    <div className="lg:col-span-6 relative">
                        <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gray-50">
                            <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <button className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-brand-pink transition-all shadow-xl">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </button>
                    </div>

                    {/* Product Info */}
                    <div className="lg:col-span-5 flex flex-col pt-4">
                        <div className="flex items-center justify-between mb-6">
                            <span className="bg-rose-100 text-rose-600 text-[10px] font-black tracking-widest px-4 py-2 rounded-full uppercase">Merchant: {product.merchant?.companyName || 'Unknown'}</span>
                            <div className="flex items-center gap-2">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{product.rating || 0} ({product.reviewCount || 0} reviews)</span>
                            </div>
                        </div>

                        <h1 className="text-5xl font-black text-gray-900 leading-[0.9] tracking-tighter mb-8 uppercase">{product.name}</h1>

                        <p className="text-gray-500 text-sm font-medium leading-relaxed mb-10 max-w-sm">
                            {product.description}
                        </p>

                        <div className="flex items-baseline gap-4 mb-10">
                            <span className="text-4xl font-black text-brand-pink tracking-tighter">${product.price.toLocaleString()}</span>
                        </div>

                        {colors.length > 0 && (
                            <div className="mb-10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-4">Color</span>
                                <div className="flex gap-4">
                                    {colors.map(color => (
                                        <button
                                            key={color.id}
                                            onClick={() => setSelectedColor(color.value)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center p-1 border-2 transition-all ${selectedColor === color.value ? 'border-brand-pink' : 'border-transparent'}`}
                                        >
                                            <div className={`w-full h-full rounded-full bg-gray-200 shadow-inner`} title={color.value}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Size</span>
                                <button className="text-[10px] font-black text-brand-pink underline tracking-widest italic">SizeGuide</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {sizes.length > 0 ? sizes.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`flex-1 h-12 rounded-xl text-xs font-black transition-all ${selectedSize === size ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        {size}
                                    </button>
                                )) : ['S', 'M', 'L', 'XL'].map(size => (
                                    <button key={size} className="flex-1 h-12 rounded-xl text-xs font-black bg-gray-50 text-gray-400">{size}</button>
                                ))}
                            </div>
                        </div>

                        <button className="w-full h-16 bg-brand-pink text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-brand-pink-hover transition-all transform hover:-translate-y-1 shadow-2xl shadow-brand-pink/30 mb-6">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            Add to Cart
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-24">
                    <div className="flex border-b border-gray-100 gap-16 mb-16 overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {['DESCRIPTION', 'SPECIFICATIONS', 'REVIEWS'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`pb-4 text-xs font-black tracking-[0.2em] transition-all relative ${activeTab === tab.toLowerCase() ? 'text-brand-pink' : 'text-gray-300 hover:text-gray-600'}`}
                            >
                                {tab}
                                {activeTab === tab.toLowerCase() && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-pink rounded-full"></div>}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'description' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div className="max-w-xl">
                                <h2 className="text-4xl font-black text-gray-900 leading-none tracking-tighter mb-8 uppercase">Product Details</h2>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed mb-10">
                                    {product.description}
                                </p>
                            </div>
                            <div className="relative">
                                <div className="aspect-square rounded-[3rem] overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-700">
                                    <img src={mainImage} alt="Detail" className="w-full h-full object-cover scale-110" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div>
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Customer Reviews</h2>
                                    <div className="flex items-center gap-3">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            ))}
                                        </div>
                                        <span className="text-sm font-black text-gray-900">{product.rating || 0} out of 5</span>
                                    </div>
                                </div>
                                <button className="bg-rose-50 text-brand-pink px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100">Write a Review</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {(product.reviews && product.reviews.length > 0) ? product.reviews.map(review => (
                                    <div key={review.id} className="bg-white p-10 rounded-[2.5rem] border border-gray-50 hover:shadow-xl hover:shadow-gray-100 transition-all">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-50 flex items-center justify-center font-bold text-brand-pink">
                                                    {review.user?.name ? review.user.name[0] : 'U'}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 text-sm">{review.user?.name || 'User'}</h4>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest leading-none">Verified Buyer</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex text-yellow-400">
                                                {[...Array(review.rating || 5)].map((_, i) => (
                                                    <svg key={i} className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                ))}
                                            </div>
                                        </div>
                                        <h5 className="text-sm font-black text-gray-900 mb-4 uppercase leading-tight italic">{review.title}</h5>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                            {review.comment}
                                        </p>
                                    </div>
                                )) : (
                                    <p className="text-gray-400 text-center py-10 col-span-2">Henüz yorum yapılmamış.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
