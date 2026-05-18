import React from 'react';
import { Link } from 'react-router-dom';
import { useCheckoutFlow } from './hooks/useCheckoutFlow';
import { SavedCardsModal, SavedCard } from './components/SavedCardsModal';
import { SavedAddressesModal, SavedAddress } from './components/SavedAddressesModal';
interface CardInfo {
    brand: 'Visa' | 'MasterCard' | 'Amex' | 'Troy' | 'Maestro' | 'Discover' | 'Diners' | 'JCB' | null;
    bank: string | null;
    country: string | null;
    flag: string | null;
    type: 'Credit' | 'Debit' | 'Prepaid' | null;
}








const renderBrandLogo = (brand: CardInfo['brand']) => {
    switch (brand) {
        case 'Visa':
            return (
                <span className="text-[#1434CB] font-[1000] italic text-[14px] tracking-tighter leading-none flex items-center select-none">
                    VISA
                </span>
            );
        case 'MasterCard':
            return (
                <svg className="w-9 h-6" viewBox="0 0 30 20">
                    <circle cx="10" cy="10" r="8" fill="#EB001B" />
                    <circle cx="20" cy="10" r="8" fill="#F79E1B" fillOpacity="0.85" />
                </svg>
            );
        case 'Amex':
            return (
                <div className="px-2 py-0.5 bg-[#007BC1] rounded text-9px font-semibold text-white tracking-widest leading-none flex items-center justify-center h-5">
                    AMEX
                </div>
            );
        case 'Troy':
            return (
                <div className="px-2 py-0.5 bg-[#002C6C] rounded text-9px font-semibold text-white italic tracking-tighter leading-none flex items-center justify-center gap-0.5 h-5">
                    <span className="text-[#FF5C39]">tr</span><span>oy</span>
                </div>
            );
        default:
            return brand ? (
                <span className="text-slate-800 font-[1000] italic text-[11px] uppercase tracking-wider select-none">
                    {brand}
                </span>
            ) : null;
    }
};

const getLocalBrand = (number: string): CardInfo['brand'] => {
    const clean = number.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MasterCard';
    if (/^3[47]/.test(clean)) return 'Amex';
    if (/^(9792|68|5437|65)/.test(clean)) return 'Troy';
    if (/^(50|5[6-9]|6)/.test(clean)) return 'Maestro';
    return null;
};

const CheckoutPage: React.FC = () => {
    const { checkout, items, total, handleNext } = useCheckoutFlow();

    // State for Binlist-fetched card information
    const [cardInfo, setCardInfo] = React.useState<CardInfo>({
        brand: null,
        bank: null,
        country: null,
        flag: null,
        type: null
    });

    const lastBinRef = React.useRef('');
    const activeBrand = cardInfo.brand || getLocalBrand(checkout.cardDetails.number);

    const [showAddressModal, setShowAddressModal] = React.useState(false);

    const [savedAddresses, setSavedAddresses] = React.useState<SavedAddress[]>(() => {
        const stored = localStorage.getItem('storefront_saved_addresses');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }
        }
        const defaults: SavedAddress[] = [
            {
                id: '1',
                title: 'Ev',
                fullName: 'FURKAN KILINÇ',
                email: 'furkan@example.com',
                phone: '+90 532 123 45 67',
                address: 'Rıhtım Cd. No:3 Karaköy',
                city: 'İSTANBUL',
                district: 'Beyoğlu',
                neighborhood: 'Kemankeş Karamustafa Paşa Mh.',
                zipCode: '34425'
            },
            {
                id: '2',
                title: 'İş',
                fullName: 'FURKAN KILINÇ',
                email: 'furkan@work.com',
                phone: '+90 532 987 65 43',
                address: 'Büyükdere Cd. No:240 Spine Tower Maslak',
                city: 'İSTANBUL',
                district: 'Sarıyer',
                neighborhood: 'Maslak Mh.',
                zipCode: '34485'
            }
        ];
        localStorage.setItem('storefront_saved_addresses', JSON.stringify(defaults));
        return defaults;
    });

    const [showCardModal, setShowCardModal] = React.useState(false);
    const [saveCardOnSubmit, setSaveCardOnSubmit] = React.useState(false);

    const handleSelectCard = (card: SavedCard) => {
        checkout.updateCardDetails({
            number: card.number,
            holder: card.holder,
            expiry: card.expiry,
            cvv: card.cvv
        });
        setCardInfo({
            brand: card.brand,
            bank: card.bank,
            country: 'Türkiye',
            flag: '🇹🇷',
            type: 'Credit'
        });
        setShowCardModal(false);
    };

    const handleNextClick = () => {
        if (checkout.step === 'payment' && saveCardOnSubmit) {
            const { number, holder, expiry, cvv } = checkout.cardDetails;
            if (number && holder && expiry && cvv) {
                const cleanNum = number.replace(/\D/g, '');

                // Read current saved cards from localStorage
                let currentSavedCards: any[] = [];
                const stored = localStorage.getItem('storefront_saved_cards');
                if (stored) {
                    try {
                        currentSavedCards = JSON.parse(stored);
                    } catch (e) {
                        console.error(e);
                    }
                }

                const isAlreadySaved = currentSavedCards.some(c => c.number.replace(/\D/g, '') === cleanNum);

                if (!isAlreadySaved) {
                    const brand = getLocalBrand(number);
                    const bank = cardInfo.bank || 'Akbank';
                    const newCard = {
                        id: Date.now().toString(),
                        title: `Kaydedilen Kart (*${cleanNum.slice(-4)})`,
                        number,
                        holder,
                        expiry,
                        cvv,
                        brand,
                        bank
                    };
                    const updated = [...currentSavedCards, newCard];
                    localStorage.setItem('storefront_saved_cards', JSON.stringify(updated));
                    setSaveCardOnSubmit(false);
                }
            }
        }
        handleNext();
    };

    const handleSelectAddress = (addr: SavedAddress) => {
        checkout.updateShippingAddress({
            fullName: addr.fullName,
            email: addr.email,
            phone: addr.phone,
            address: addr.address,
            city: addr.city,
            district: addr.district,
            neighborhood: addr.neighborhood,
            zipCode: addr.zipCode
        });
        setShowAddressModal(false);
    };

    const [shippingCompanies, setShippingCompanies] = React.useState<any[]>([]);
    const [cartProducts, setCartProducts] = React.useState<any[]>([]);

    React.useEffect(() => {
        fetch('/api/products/shipping-companies')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setShippingCompanies(data.data);
                    if (data.data.length > 0 && (checkout.shippingMethod === 'standard' || checkout.shippingMethod === 'express')) {
                        checkout.setShippingMethod(data.data[0].id);
                    }
                }
            })
            .catch(err => console.error(err));

        if (items.length > 0) {
            Promise.all(
                items.map(item =>
                    fetch(`/api/products/${item.id}`)
                        .then(res => res.ok ? res.json() : null)
                        .catch(() => null)
                )
            )
                .then(products => {
                    setCartProducts(products.filter(Boolean));
                });
        }
    }, [items]);

    const calculateShippingCost = (company: any) => {
        if (!company) return 0;
        let cost = company.basePrice;
        items.forEach(item => {
            const fullProduct = cartProducts.find(p => p.id === item.id);
            if (!fullProduct) return;

            const productCompanies = fullProduct.metadata?.shippingCompanies || [];

            if (productCompanies.length > 0) {
                // Product explicitly lists supported companies
                const matched = productCompanies.find((sc: any) => sc.companyId === company.id);
                if (matched) {
                    cost += (parseFloat(matched.extraFee) || 0) * item.quantity;
                }
            } else {
                // Fallback to legacy single preferred company metadata
                const legacyId = fullProduct.metadata?.shippingCompanyId;
                if (legacyId === company.id || !legacyId) {
                    const extraFee = parseFloat(fullProduct.metadata?.shippingCompanyExtraFee) || 0;
                    cost += extraFee * item.quantity;
                }
            }
        });
        return cost;
    };

    React.useEffect(() => {
        const cleanNumber = checkout.cardDetails.number.replace(/\D/g, '');
        const bin = cleanNumber.substring(0, 6);

        if (bin.length < 6) {
            if (lastBinRef.current !== '') {
                lastBinRef.current = '';
                setCardInfo({ brand: null, bank: null, country: null, flag: null, type: null });
            }
            return;
        }

        if (lastBinRef.current === bin) return;
        lastBinRef.current = bin;

        const fetchCardInfo = async () => {
            try {
                // Sadece ilk 6 hanesini binlist'e atıyoruz, güvenlik için tüm kartı asla göndermiyoruz!
                const res = await fetch(`/binlist/${bin}`);
                if (!res.ok) return;
                const data = await res.json();

                let brandName: CardInfo['brand'] = null;
                if (data.scheme) {
                    const schemeLower = data.scheme.toLowerCase();
                    if (schemeLower === 'visa') brandName = 'Visa';
                    else if (schemeLower === 'mastercard') brandName = 'MasterCard';
                    else if (schemeLower === 'amex') brandName = 'Amex';
                    else if (schemeLower === 'troy') brandName = 'Troy';
                    else if (schemeLower === 'maestro') brandName = 'Maestro';
                    else if (schemeLower === 'discover') brandName = 'Discover';
                    else if (schemeLower === 'diners') brandName = 'Diners';
                    else if (schemeLower === 'jcb') brandName = 'JCB';
                }

                setCardInfo({
                    brand: brandName,
                    bank: data.bank?.name || 'Diğer Banka',
                    country: data.country?.name || 'Türkiye',
                    flag: data.country?.emoji || '🇹🇷',
                    type: data.type ? (data.type.charAt(0).toUpperCase() + data.type.slice(1)) as any : 'Credit'
                });
            } catch (err) {
                console.error('Binlist API lookup failed:', err);
            }
        };

        fetchCardInfo();
    }, [checkout.cardDetails.number]);

    const selectedCompany = shippingCompanies.find(c => c.id === checkout.shippingMethod);
    const shippingCost = selectedCompany ? calculateShippingCost(selectedCompany) : 0;

    if (checkout.step === 'success') {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 animate-in fade-in duration-700">
                <div className="w-24 h-24 bg-emerald-50 rounded-md flex items-center justify-center mb-5 border border-emerald-100 shadow-sm animate-bounce">
                    <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-4xl font-[1000] text-gray-900  italic tracking-tighter mb-4 leading-none">SİPARİŞ <span className="text-emerald-500">TAMAMLANDI!</span></h1>
                <p className="text-gray-400 font-bold  tracking-widest text-10px mb-6 italic text-center leading-relaxed">Sipariş numaranız: <span className="text-gray-900">{checkout.orderSuccess?.orderNumber}</span><br />Onay e-postası tarafınıza gönderilmiştir.</p>
                <div className="flex gap-4">
                    <Link to="/" className="px-10 py-5 bg-gray-900 text-white rounded-md text-10px font-semibold  tracking-widest hover:bg-brand-pink transition-all  shadow-gray-200 italic">ANA SAYFAYA DÖN</Link>
                    <Link to="/profile/orders" className="px-10 py-5 bg-white text-gray-900 border border-gray-100 rounded-md text-10px font-semibold  tracking-widest hover:bg-gray-50 transition-all italic">SİPARİŞLERİM</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-20 py-10 pb-40">
            <div className="mb-8">
                <span className="text-brand-pink text-10px font-semibold  tracking-widest mb-4 block">GÜVENLİ ÖDEME</span>
                <h1 className="text-[40px] font-[1000] text-gray-900  italic tracking-tighter leading-none mb-4">ÖDEME <span className="text-brand-pink">SAYFASI</span></h1>
                <div className="flex items-center gap-6 mt-8">
                    {['address', 'shipping', 'payment', 'review'].map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-3 ${checkout.step === s ? 'text-brand-pink' : i < ['address', 'shipping', 'payment', 'review'].indexOf(checkout.step) ? 'text-emerald-500' : 'text-gray-300'}`}>
                                <span className="text-xs font-semibold italic  tracking-widest">{s === 'address' ? 'ADRES' : s === 'shipping' ? 'KARGO' : s === 'payment' ? 'ÖDEME' : 'KONTROL'}</span>
                            </div>
                            {i < 3 && <div className="h-[2px] w-12 bg-gray-100 rounded-full" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-20">
                {/* Main Content Area */}
                <div className="xl:col-span-2">
                    {checkout.step === 'address' && (
                        <div className="space-y-12 animate-in slide-in-from-left-4 duration-500">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-[1000] text-gray-900  italic tracking-tighter leading-none">TESLİMAT <span className="text-brand-pink">ADRESİ</span></h3>
                                    <button
                                        onClick={() => setShowAddressModal(true)}
                                        className="px-6 py-3 border border-brand-pink text-brand-pink hover:bg-brand-pink hover:text-white rounded-md text-10px font-semibold tracking-widest transition-all italic flex items-center gap-2 cursor-pointer"
                                    >
                                        📖 ADRES DEFTERİM
                                    </button>
                                </div>

                                {savedAddresses.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                                        {savedAddresses.map((addr) => {
                                            const isSelected =
                                                checkout.shippingAddress.address === addr.address &&
                                                checkout.shippingAddress.city === addr.city;
                                            return (
                                                <div
                                                    key={addr.id}
                                                    onClick={() => {
                                                        checkout.updateShippingAddress({
                                                            fullName: addr.fullName,
                                                            email: addr.email,
                                                            phone: addr.phone,
                                                            address: addr.address,
                                                            city: addr.city,
                                                            district: addr.district,
                                                            neighborhood: addr.neighborhood,
                                                            zipCode: addr.zipCode
                                                        });
                                                    }}
                                                    className={`p-6 rounded-md border text-left cursor-pointer transition-all ${isSelected ? 'border-brand-pink bg-rose-500/5 shadow-xs' : 'border-gray-100 bg-gray-50 hover:bg-gray-100/50'}`}
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className={`text-10px font-semibold tracking-widest italic ${isSelected ? 'text-brand-pink' : 'text-gray-400'}`}>{addr.title.toUpperCase()}</span>
                                                        {isSelected && <span className="text-brand-pink text-10px font-semibold italic tracking-widest">✓ SEÇİLDİ</span>}
                                                    </div>
                                                    <h4 className="text-xs font-semibold text-gray-900 mb-1 italic truncate">{addr.fullName}</h4>
                                                    <p className="text-10px font-bold text-gray-400 leading-relaxed italic truncate">{addr.neighborhood} {addr.district ? `${addr.district}` : ''}</p>
                                                    <p className="text-9px font-extrabold text-gray-400 tracking-wider mt-1.5">{addr.city}, {addr.zipCode}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-9px font-semibold text-gray-400  tracking-widest ml-4 italic">AD SOYAD <span className="text-brand-pink">*</span></label>
                                        <input type="text" value={checkout.shippingAddress.fullName} onChange={(e) => checkout.updateShippingAddress({ fullName: e.target.value })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="FURKAN" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-9px font-semibold text-gray-400  tracking-widest ml-4 italic">E-POSTA <span className="text-brand-pink">*</span></label>
                                        <input type="email" value={checkout.shippingAddress.email} onChange={(e) => checkout.updateShippingAddress({ email: e.target.value })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="furkan@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-9px font-semibold text-gray-400  tracking-widest ml-4 italic">TELEFON <span className="text-brand-pink">*</span></label>
                                        <input type="text" value={checkout.shippingAddress.phone} onChange={(e) => checkout.updateShippingAddress({ phone: e.target.value })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="+90 5XX XXX XX XX" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-9px font-semibold text-gray-400  tracking-widest ml-4 italic">ŞEHİR (İL) <span className="text-brand-pink">*</span></label>
                                        <input type="text" value={checkout.shippingAddress.city} onChange={(e) => checkout.updateShippingAddress({ city: e.target.value.toUpperCase() })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="İSTANBUL" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-9px font-semibold text-gray-400  tracking-widest ml-4 italic">İLÇE <span className="text-brand-pink">*</span></label>
                                        <input type="text" value={checkout.shippingAddress.district} onChange={(e) => checkout.updateShippingAddress({ district: e.target.value })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="Beşiktaş" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-9px font-semibold text-gray-400  tracking-widest ml-4 italic">MAHALLE <span className="text-brand-pink">*</span></label>
                                        <input type="text" value={checkout.shippingAddress.neighborhood} onChange={(e) => checkout.updateShippingAddress({ neighborhood: e.target.value })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="Sinanpaşa Mh." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-9px font-semibold text-gray-400  tracking-widest ml-4 italic">POSTA KODU <span className="text-brand-pink">*</span></label>
                                        <input type="text" value={checkout.shippingAddress.zipCode} onChange={(e) => checkout.updateShippingAddress({ zipCode: e.target.value })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="34XXX" />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-9px font-semibold text-gray-400  tracking-widest ml-4 italic">AÇIK ADRES (Sokak, Bina No, Daire No) <span className="text-brand-pink">*</span></label>
                                        <textarea value={checkout.shippingAddress.address} onChange={(e) => checkout.updateShippingAddress({ address: e.target.value })} className="w-full h-24 bg-gray-50 border border-gray-100 rounded-md p-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic resize-none" placeholder="Şehit Asım Cad. No: 12 D: 4" />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-3 mt-4 ml-2">
                                        <input
                                            type="checkbox"
                                            id="billingSame"
                                            checked={checkout.isBillingSameAsShipping}
                                            onChange={checkout.toggleBillingSame}
                                            className="w-5 h-5 accent-brand-pink"
                                        />
                                        <label htmlFor="billingSame" className="text-10px font-semibold text-gray-900  tracking-widest italic cursor-pointer">Fatura adresim teslimat adresiyle aynı olsun</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {checkout.step === 'shipping' && (
                        <div className="space-y-12 animate-in slide-in-from-left-4 duration-500">
                            <h3 className="text-2xl font-[1000] text-gray-900  italic tracking-tighter mb-4 leading-none">KARGO <span className="text-brand-pink">SEÇENEĞİ</span></h3>
                            <div className="space-y-6">
                                {shippingCompanies.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 font-bold italic tracking-widest bg-gray-50 rounded-md border border-gray-100">
                                        Aktif kargo firması bulunamadı.
                                    </div>
                                ) : (
                                    shippingCompanies.map(company => {
                                        const cost = calculateShippingCost(company);
                                        return (
                                            <div
                                                key={company.id}
                                                onClick={() => checkout.setShippingMethod(company.id)}
                                                className={`p-8 rounded-md border-2 cursor-pointer transition-all flex items-center justify-between ${checkout.shippingMethod === company.id ? 'border-brand-pink bg-rose-50/20' : 'border-gray-50 bg-white hover:border-gray-100'}`}
                                            >
                                                <div className="flex items-center gap-8">
                                                    <div className="text-3xl">{company.logo}</div>
                                                    <div>
                                                        <h4 className="text-[14px] font-[1000] text-gray-900  italic mb-1">{company.name}</h4>
                                                        <p className="text-10px font-semibold text-gray-400  tracking-widest italic">{company.deliveryTime}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 italic">
                                                    {cost > 0 ? `${cost.toFixed(2)} ₺` : 'ÜCRETSİZ'}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {checkout.step === 'payment' && (
                        <div className="space-y-12 animate-in slide-in-from-left-4 duration-500 max-w-[400px]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-[1000] text-gray-900 italic tracking-tighter leading-none mb-0">ÖDEME <span className="text-brand-pink">BİLGİLERİ</span></h3>
                                <button
                                    onClick={() => setShowCardModal(true)}
                                    className="px-4 py-2 border border-gray-100 hover:border-brand-pink bg-gray-50 hover:bg-rose-500/5 text-gray-700 hover:text-brand-pink rounded-md text-9px font-semibold tracking-widest transition-all italic flex items-center gap-2 cursor-pointer"
                                >
                                    💳 KARTLARIM
                                </button>
                            </div>
                            <div className="bg-gradient-to-br from-slate-50 to-rose-50/40 rounded-md p-6 text-gray-900 relative overflow-hidden shadow-sm border border-rose-100/50 transition-all duration-300">
                                {/* Elegant diagonal glass reflection wave / sheen tilted at 30 degrees */}
                                <div className="absolute top-[-30%] left-[-20%] w-[50%] h-[160%] bg-gradient-to-r from-transparent via-white/80 to-transparent transform rotate-[30deg] pointer-events-none"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex items-center gap-4">
                                            {/* Beautiful physical EMV Gold Chip */}
                                            <div className="w-10 h-7 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-200 rounded border border-amber-400/40 shadow-inner relative overflow-hidden flex flex-col justify-between p-1 shrink-0">
                                                <div className="h-[1px] bg-amber-600/20 w-full"></div>
                                                <div className="h-[1px] bg-amber-600/20 w-full"></div>
                                                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-amber-600/20"></div>
                                            </div>
                                            {cardInfo.bank && (
                                                <div className="flex flex-col animate-in fade-in duration-300 leading-none">
                                                    <span className="text-10px font-semibold tracking-[0.05em] uppercase italic leading-none text-brand-pink">{cardInfo.bank}</span>
                                                    <span className="text-[7px] font-extrabold text-slate-400/80 tracking-widest uppercase mt-1">{cardInfo.country} {cardInfo.flag}</span>
                                                </div>
                                            )}
                                        </div>
                                        {activeBrand ? (
                                            <div className="flex flex-col items-end gap-1 animate-in slide-in-from-right-4 duration-300">
                                                <div className="px-2.5 py-1 bg-white/95 rounded border border-gray-100 shadow-xs flex items-center justify-center min-h-[26px] min-w-[42px]">
                                                    {renderBrandLogo(activeBrand)}
                                                </div>
                                                <span className="text-[7px] font-semibold tracking-[0.2em] text-slate-400/80 uppercase leading-none">{cardInfo.type} CARD</span>
                                            </div>
                                        ) : (
                                            <div className="text-8px font-semibold tracking-widest text-gray-400">CREDIT CARD</div>
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-none text-xl font-[1000] tracking-[0.2em] focus:outline-none placeholder:text-slate-400/40 italic text-current"
                                            placeholder="XXXX XXXX XXXX XXXX"
                                            maxLength={19}
                                            value={checkout.cardDetails.number}
                                            onChange={(e) => checkout.updateCardDetails({ number: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim() })}
                                        />
                                        <div className="flex justify-between items-end">
                                            <div className="flex-1 mr-6">
                                                <label className="text-[7px] font-semibold text-slate-400/80  tracking-widest mb-2 block">CARD HOLDER <span className="text-brand-pink">*</span></label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent border-none text-xs font-semibold focus:outline-none placeholder:text-slate-400/40 italic text-current"
                                                    placeholder="NAME SURNAME"
                                                    value={checkout.cardDetails.holder}
                                                    onChange={(e) => checkout.updateCardDetails({ holder: e.target.value })}
                                                />
                                            </div>
                                            <div className="w-16 shrink-0">
                                                <label className="text-[7px] font-semibold text-slate-400/80  tracking-widest mb-2 block">EXPIRES <span className="text-brand-pink">*</span></label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent border-none text-xs font-semibold focus:outline-none placeholder:text-slate-400/40 italic text-center text-current"
                                                    placeholder="MM/YY"
                                                    maxLength={5}
                                                    value={checkout.cardDetails.expiry}
                                                    onChange={(e) => checkout.updateCardDetails({ expiry: e.target.value })}
                                                />
                                            </div>
                                            <div className="w-14 ml-4 shrink-0">
                                                <label className="text-[7px] font-semibold text-slate-400/80  tracking-widest mb-2 block">CVV <span className="text-brand-pink">*</span></label>
                                                <input
                                                    type="password"
                                                    className="w-full bg-transparent border-none text-xs font-semibold focus:outline-none placeholder:text-slate-400/40 italic text-center text-current"
                                                    placeholder="***"
                                                    maxLength={3}
                                                    value={checkout.cardDetails.cvv}
                                                    onChange={(e) => checkout.updateCardDetails({ cvv: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2 pl-2">
                                <input
                                    type="checkbox"
                                    id="saveCardCheckbox"
                                    checked={saveCardOnSubmit}
                                    onChange={(e) => setSaveCardOnSubmit(e.target.checked)}
                                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                                />
                                <label htmlFor="saveCardCheckbox" className="text-10px font-bold text-slate-400 cursor-pointer select-none italic tracking-wider">
                                    Bu kartı sonraki alışverişlerim için güvenle kaydet.
                                </label>
                            </div>

                            <div className="p-4 rounded-md bg-gray-50 border border-gray-100 flex items-center gap-6">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-md flex items-center justify-center text-emerald-500">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <p className="text-10px font-semibold text-gray-400  tracking-widest leading-relaxed italic">Ödemeleriniz <span className="text-gray-900 leading-none">256-Bit SSL</span> şifreleme alt yapısıyla güvence altındadır.</p>
                            </div>
                        </div>
                    )}

                    {checkout.step === 'review' && (
                        <div className="space-y-12 animate-in slide-in-from-left-4 duration-500">
                            <h3 className="text-2xl font-[1000] text-gray-900  italic tracking-tighter mb-4 leading-none">SON <span className="text-brand-pink">KONTROLLER</span></h3>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="p-10 rounded-md bg-gray-50 border border-gray-100">
                                    <span className="text-9px font-semibold text-gray-300  tracking-widest mb-4 block italic">TESLİMAT ADRESİ</span>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 italic ">{checkout.shippingAddress.fullName}</h4>
                                    <p className="text-xs font-bold text-gray-400 leading-relaxed italic ">
                                        {checkout.shippingAddress.neighborhood} {checkout.shippingAddress.district ? `${checkout.shippingAddress.district}` : ''}<br />
                                        {checkout.shippingAddress.address}<br />
                                        {checkout.shippingAddress.city}, {checkout.shippingAddress.zipCode}
                                    </p>
                                </div>
                                <div className="p-10 rounded-md bg-gray-50 border border-gray-100">
                                    <span className="text-9px font-semibold text-gray-300  tracking-widest mb-4 block italic">ÖDEME YÖNTEMİ</span>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 italic ">{checkout.cardDetails.holder || 'Kredi Kartı'}</h4>
                                    <p className="text-xs font-bold text-gray-400 leading-relaxed italic ">
                                        {checkout.cardDetails.number ? `**** **** **** ${checkout.cardDetails.number.slice(-4)}` : '**** **** **** 4242'}
                                    </p>
                                </div>
                            </div>
                            <div className="p-10 rounded-md bg-gray-50 border border-gray-100">
                                <span className="text-9px font-semibold text-gray-300  tracking-widest mb-6 block italic">SEPET ÖZETİ</span>
                                <div className="space-y-6">
                                    {items.map((item, idx) => (
                                        <div key={`${item.id}-${item.variant ?? idx}`} className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-semibold text-gray-900 italic  truncate max-w-[200px]">{item.name}</span>
                                                <span className="text-10px font-semibold text-gray-300 italic">x{item.quantity}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-900 italic">{(item.price * item.quantity).toLocaleString()} ₺</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-16 flex justify-between items-center">
                        {checkout.step !== 'address' && (
                            <button
                                onClick={checkout.prevStep}
                                className="px-10 py-5 text-10px font-semibold text-gray-400  tracking-widest hover:text-gray-900 transition-all italic flex items-center gap-4"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16l-4-4m0 0l4-4m-4 4h18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                GERİ DÖN
                            </button>
                        )}
                        <button
                            onClick={handleNextClick}
                            disabled={checkout.isProcessing}
                            className={`ml-auto p-3 bg-brand-pink text-white rounded-md text-[11px] font-semibold  tracking-widest shadow-xs cursor-pointer flex items-center justify-center gap-4 disabled:opacity-50`}
                        >
                            {checkout.isProcessing ? 'SİPARİŞ VERİLİYOR...' : checkout.step === 'review' ? 'SİPARİŞİ TAMAMLA' : 'SONRAKİ ADIM'}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4-4 4M3 12h18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                    </div>
                </div>

                {/* Right Summary Column */}
                <div className="col-span-1">
                    <div className="bg-gray-50/50 p-12 rounded-md border border-gray-100 sticky top-32">
                        <h2 className="text-2xl font-[1000] text-gray-900  italic tracking-tighter mb-5 leading-none">ÖDEME <span className="text-brand-pink">ÖZETİ</span></h2>
                        <div className="space-y-6 pb-10 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-10px font-semibold text-gray-400  tracking-widest">ARA TOPLAM</span>
                                <span className="text-sm font-semibold text-gray-900 italic">{total.toLocaleString()} ₺</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-10px font-semibold text-gray-400  tracking-widest">KARGO ({selectedCompany?.name || 'Seçilmedi'})</span>
                                <span className="text-10px font-semibold text-brand-pink tracking-widest italic">
                                    {shippingCost > 0 ? `${shippingCost.toFixed(2)} ₺` : 'ÜCRETSİZ'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-10px font-semibold text-gray-400  tracking-widest">KDV (%20)</span>
                                <span className="text-sm font-semibold text-gray-900 italic">{(total * 0.2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                            </div>
                        </div>
                        <div className="pt-10 mb-4">
                            <span className="text-10px font-[1000] text-gray-400  tracking-widest mb-1 block italic">TOPLAM ÖDENECEK</span>
                            <span className="text-4xl font-[1000] text-gray-900 leading-none tracking-tighter italic whitespace-nowrap">
                                {(total + shippingCost + (total * 0.2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                            </span>
                        </div>
                        <p className="text-9px font-bold text-gray-300  tracking-widest leading-relaxed italic">Siparişi tamamlayarak Kullanım Koşulları ve İptal/İade Politikalarını kabul etmiş sayılırsınız.</p>
                    </div>
                </div>
            </div>

            {/* Address Management Glassmorphic Modal */}
            <SavedAddressesModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onSelectAddress={handleSelectAddress}
                activeAddress={{
                    address: checkout.shippingAddress.address,
                    city: checkout.shippingAddress.city
                }}
                savedAddresses={savedAddresses}
                setSavedAddresses={setSavedAddresses}
            />

            {/* Reusable Saved Cards Modal component */}
            <SavedCardsModal
                isOpen={showCardModal}
                onClose={() => setShowCardModal(false)}
                onSelectCard={handleSelectCard}
                activeCardNumber={checkout.cardDetails.number}
            />
        </div>
    );
};

export default CheckoutPage;
