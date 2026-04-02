import React from 'react';
import { useCheckout, Address } from './checkout.store';
import { useCart } from '../cart/cart.store';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const CheckoutPage: React.FC = () => {
    const checkout = useCheckout();
    const { items, total, clearCart } = useCart();

    const validateStep = () => {
        if (checkout.step === 'address') {
            const { fullName, email, phone, address, city, zipCode } = checkout.shippingAddress;
            if (!fullName || !email || !phone || !address || !city || !zipCode) {
                toast.error('Lütfen tüm zorunlu alanları doldurun.');
                return false;
            }
            if (!email.includes('@')) {
                toast.error('Lütfen geçerli bir e-posta adresi girin.');
                return false;
            }
        } else if (checkout.step === 'payment') {
            const { number, holder, expiry, cvv } = checkout.cardDetails;
            if (!number || !holder || !expiry || !cvv) {
                toast.error('Lütfen tüm kart bilgilerini doldurun.');
                return false;
            }
            if (number.length < 16) {
                toast.error('Geçerli bir kart numarası girin.');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep()) return;

        if (checkout.step === 'review') {
            handlePlaceOrder();
        } else {
            checkout.nextStep();
        }
    };

    const handlePlaceOrder = async () => {
        const result = await checkout.placeOrder(items);
        if (result.success) {
            clearCart();
            toast.success('Siparişiniz başarıyla alındı!');
        } else {
            toast.error(result.message || 'Sipariş oluşturulurken bir hata oluştu.');
        }
    };

    if (checkout.step === 'success') {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 animate-in fade-in duration-700">
                <div className="w-24 h-24 bg-emerald-50 rounded-md flex items-center justify-center mb-10 border border-emerald-100 shadow-sm animate-bounce">
                    <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-4xl font-[1000] text-gray-900 uppercase italic tracking-tighter mb-4 leading-none">SİPARİŞ <span className="text-emerald-500">TAMAMLANDI!</span></h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-12 italic text-center leading-relaxed">Sipariş numaranız: <span className="text-gray-900">{checkout.orderSuccess?.orderNumber}</span><br />Onay e-postası tarafınıza gönderilmiştir.</p>
                <div className="flex gap-4">
                    <Link to="/" className="px-10 py-5 bg-gray-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-brand-pink transition-all shadow-xl shadow-gray-200 italic">ANA SAYFAYA DÖN</Link>
                    <Link to="/profile/orders" className="px-10 py-5 bg-white text-gray-900 border border-gray-100 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all italic">SİPARİŞLERİM</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-20 py-20 pb-40">
            <div className="mb-20">
                <span className="text-brand-pink text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">GÜVENLİ ÖDEME</span>
                <h1 className="text-[40px] font-[1000] text-gray-900 uppercase italic tracking-tighter leading-none mb-4">ÖDEME <span className="text-brand-pink">SAYFASI</span></h1>
                <div className="flex items-center gap-6 mt-8">
                    {['address', 'shipping', 'payment', 'review'].map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-3 ${checkout.step === s ? 'text-brand-pink' : i < ['address', 'shipping', 'payment', 'review'].indexOf(checkout.step) ? 'text-emerald-500' : 'text-gray-300'}`}>
                                <span className="text-xs font-black italic uppercase tracking-widest">{s === 'address' ? 'ADRES' : s === 'shipping' ? 'KARGO' : s === 'payment' ? 'ÖDEME' : 'KONTROL'}</span>
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
                                <h3 className="text-2xl font-[1000] text-gray-900 uppercase italic tracking-tighter mb-8 leading-none">TESLİMAT <span className="text-brand-pink">ADRESİ</span></h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 italic">AD SOYAD <span className="text-brand-pink">*</span></label>
                                        <input type="text" value={checkout.shippingAddress.fullName} onChange={(e) => checkout.updateShippingAddress({ fullName: e.target.value })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="FURKAN" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 italic">E-POSTA <span className="text-brand-pink">*</span></label>
                                        <input type="email" value={checkout.shippingAddress.email} onChange={(e) => checkout.updateShippingAddress({ email: e.target.value })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="furkan@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 italic">TELEFON <span className="text-brand-pink">*</span></label>
                                        <input type="text" value={checkout.shippingAddress.phone} onChange={(e) => checkout.updateShippingAddress({ phone: e.target.value })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="+90 5XX XXX XX XX" />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 italic">AÇIK ADRES <span className="text-brand-pink">*</span></label>
                                        <textarea value={checkout.shippingAddress.address} onChange={(e) => checkout.updateShippingAddress({ address: e.target.value })} className="w-full h-32 bg-gray-50 border border-gray-100 rounded-md p-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="Mahalle, Cadde, Sokak..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 italic">ŞEHİR <span className="text-brand-pink">*</span></label>
                                        <input type="text" value={checkout.shippingAddress.city} onChange={(e) => checkout.updateShippingAddress({ city: e.target.value })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="İSTANBUL" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 italic">POSTA KODU <span className="text-brand-pink">*</span></label>
                                        <input type="text" value={checkout.shippingAddress.zipCode} onChange={(e) => checkout.updateShippingAddress({ zipCode: e.target.value })} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-md px-8 text-sm font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic" placeholder="34XXX" />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-3 mt-4 ml-2">
                                        <input 
                                            type="checkbox" 
                                            id="billingSame" 
                                            checked={checkout.isBillingSameAsShipping} 
                                            onChange={checkout.toggleBillingSame}
                                            className="w-5 h-5 accent-brand-pink"
                                        />
                                        <label htmlFor="billingSame" className="text-[10px] font-black text-gray-900 uppercase tracking-widest italic cursor-pointer">Fatura adresim teslimat adresiyle aynı olsun</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {checkout.step === 'shipping' && (
                        <div className="space-y-12 animate-in slide-in-from-left-4 duration-500">
                             <h3 className="text-2xl font-[1000] text-gray-900 uppercase italic tracking-tighter mb-8 leading-none">KARGO <span className="text-brand-pink">SEÇENEĞİ</span></h3>
                             <div className="space-y-6">
                                {[
                                    { id: 'standard', name: 'Standart Teslimat', price: 'ÜCRETSİZ', time: '3-5 İş Günü', icon: '🚚' },
                                    { id: 'express', name: 'Hızlı Teslimat', price: '15.00 ₺', time: '1-2 İş Günü', icon: '⚡' },
                                ].map(method => (
                                    <div 
                                        key={method.id} 
                                        onClick={() => checkout.setShippingMethod(method.id)}
                                        className={`p-8 rounded-md border-2 cursor-pointer transition-all flex items-center justify-between ${checkout.shippingMethod === method.id ? 'border-brand-pink bg-rose-50/20' : 'border-gray-50 bg-white hover:border-gray-100'}`}
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className="text-3xl">{method.icon}</div>
                                            <div>
                                                <h4 className="text-[14px] font-[1000] text-gray-900 uppercase italic mb-1">{method.name}</h4>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{method.time}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-gray-900 italic">{method.price}</span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {checkout.step === 'payment' && (
                        <div className="space-y-12 animate-in slide-in-from-left-4 duration-500">
                             <h3 className="text-2xl font-[1000] text-gray-900 uppercase italic tracking-tighter mb-8 leading-none">ÖDEME <span className="text-brand-pink">BİLGİLERİ</span></h3>
                             <div className="bg-gradient-to-br from-slate-50 to-rose-50/40 rounded-md p-12 text-gray-900 relative overflow-hidden shadow-sm border border-rose-100/50">
                                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-brand-pink/5 rounded-full blur-3xl"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-16">
                                        <div className="w-16 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center shadow-sm italic font-black text-[10px]">CHIP</div>
                                        <div className="text-[10px] font-black tracking-[0.3em] text-gray-400">CREDIT CARD</div>
                                    </div>
                                    <div className="space-y-8">
                                        <input 
                                            type="text" 
                                            className="w-full bg-transparent border-none text-2xl font-[1000] tracking-[0.2em] focus:outline-none placeholder:text-gray-300 italic" 
                                            placeholder="XXXX XXXX XXXX XXXX" 
                                            maxLength={19}
                                            value={checkout.cardDetails.number}
                                            onChange={(e) => checkout.updateCardDetails({ number: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim() })}
                                        />
                                        <div className="flex justify-between items-end">
                                            <div className="flex-1 mr-10">
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 block">CARD HOLDER <span className="text-brand-pink">* (ZORUNLU)</span></label>
                                                <input 
                                                    type="text" 
                                                    className="w-full bg-transparent border-none text-sm font-black focus:outline-none placeholder:text-gray-300 uppercase italic" 
                                                    placeholder="NAME SURNAME" 
                                                    value={checkout.cardDetails.holder}
                                                    onChange={(e) => checkout.updateCardDetails({ holder: e.target.value })}
                                                />
                                            </div>
                                            <div className="w-24">
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 block">EXPIRES <span className="text-brand-pink">* (ZORUNLU)</span></label>
                                                <input 
                                                    type="text" 
                                                    className="w-full bg-transparent border-none text-sm font-black focus:outline-none placeholder:text-gray-300 italic text-center" 
                                                    placeholder="MM/YY" 
                                                    maxLength={5} 
                                                    value={checkout.cardDetails.expiry}
                                                    onChange={(e) => checkout.updateCardDetails({ expiry: e.target.value })}
                                                />
                                            </div>
                                            <div className="w-20 ml-6">
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 block">CVV <span className="text-brand-pink">* (ZORUNLU)</span></label>
                                                <input 
                                                    type="password"  
                                                    className="w-full bg-transparent border-none text-sm font-black focus:outline-none placeholder:text-gray-300 italic text-center" 
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
                             <div className="p-8 rounded-md bg-gray-50 border border-gray-100 flex items-center gap-6">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-md flex items-center justify-center text-emerald-500">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed italic">Ödemeleriniz <span className="text-gray-900 leading-none">256-Bit SSL</span> şifreleme alt yapısıyla güvence altındadır.</p>
                             </div>
                        </div>
                    )}

                    {checkout.step === 'review' && (
                        <div className="space-y-12 animate-in slide-in-from-left-4 duration-500">
                             <h3 className="text-2xl font-[1000] text-gray-900 uppercase italic tracking-tighter mb-8 leading-none">SON <span className="text-brand-pink">KONTROLLER</span></h3>
                             <div className="grid grid-cols-2 gap-8">
                                <div className="p-10 rounded-md bg-gray-50 border border-gray-100">
                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-4 block italic">TESLİMAT ADRESİ</span>
                                    <h4 className="text-sm font-black text-gray-900 mb-2 italic uppercase">{checkout.shippingAddress.fullName}</h4>
                                    <p className="text-xs font-bold text-gray-400 leading-relaxed italic uppercase">{checkout.shippingAddress.address}<br />{checkout.shippingAddress.city}, {checkout.shippingAddress.zipCode}</p>
                                </div>
                                <div className="p-10 rounded-md bg-gray-50 border border-gray-100">
                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-4 block italic">ÖDEME YÖNTEMİ</span>
                                    <h4 className="text-sm font-black text-gray-900 mb-2 italic uppercase">{checkout.cardDetails.holder || 'Kredi Kartı'}</h4>
                                    <p className="text-xs font-bold text-gray-400 leading-relaxed italic uppercase">
                                        {checkout.cardDetails.number ? `**** **** **** ${checkout.cardDetails.number.slice(-4)}` : '**** **** **** 4242'}
                                    </p>
                                </div>
                             </div>
                             <div className="p-10 rounded-md bg-gray-50 border border-gray-100">
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-6 block italic">SEPET ÖZETİ</span>
                                <div className="space-y-6">
                                    {items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-black text-gray-900 italic uppercase truncate max-w-[200px]">{item.name}</span>
                                                <span className="text-[10px] font-black text-gray-300 italic">x{item.quantity}</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-900 italic">{(item.price * item.quantity).toLocaleString()} ₺</span>
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
                                className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-all italic flex items-center gap-4"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16l-4-4m0 0l4-4m-4 4h18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                GERİ DÖN
                            </button>
                        )}
                        <button 
                            onClick={handleNext}
                            disabled={checkout.isProcessing}
                            className={`ml-auto px-12 py-6 bg-gray-900 text-white rounded-md text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 hover:scale-105 hover:bg-brand-pink transition-all italic flex items-center justify-center gap-4 disabled:opacity-50`}
                        >
                            {checkout.isProcessing ? 'SİPARİŞ VERİLİYOR...' : checkout.step === 'review' ? 'SİPARİŞİ TAMAMLA' : 'SONRAKİ ADIM'}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4-4 4M3 12h18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                    </div>
                </div>

                {/* Right Summary Column */}
                <div className="col-span-1">
                    <div className="bg-gray-50/50 p-12 rounded-md border border-gray-100 sticky top-32">
                         <h2 className="text-2xl font-[1000] text-gray-900 uppercase italic tracking-tighter mb-10 leading-none">ÖDEME <span className="text-brand-pink">ÖZETİ</span></h2>
                         <div className="space-y-6 pb-10 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ARA TOPLAM</span>
                                <span className="text-sm font-black text-gray-900 italic">{total.toLocaleString()} ₺</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KARGO</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">{checkout.shippingMethod === 'express' ? '15.00 ₺' : 'ÜCRETSİZ'}</span>
                            </div>
                        </div>
                        <div className="pt-10 mb-8">
                            <span className="text-[10px] font-[1000] text-gray-400 uppercase tracking-widest mb-1 block italic">TOPLAM ÖDENECEK</span>
                            <span className="text-4xl font-[1000] text-gray-900 leading-none tracking-tighter italic whitespace-nowrap">{((total + (checkout.shippingMethod === 'express' ? 15 : 0)) * 1.2).toLocaleString()} ₺</span>
                        </div>
                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest leading-relaxed italic">Siparişi tamamlayarak Kullanım Koşulları ve İptal/İade Politikalarını kabul etmiş sayılırsınız.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
