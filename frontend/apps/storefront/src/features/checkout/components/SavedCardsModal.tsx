import React from 'react';

export interface CardInfo {
    brand: 'Visa' | 'MasterCard' | 'Amex' | 'Troy' | 'Maestro' | 'Discover' | 'Diners' | 'JCB' | null;
    bank: string | null;
    country: string | null;
    flag: string | null;
    type: 'Credit' | 'Debit' | 'Prepaid' | null;
}

export interface SavedCard {
    id: string;
    title: string;
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
    brand: CardInfo['brand'];
    bank: string | null;
}

interface SavedCardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCard: (card: SavedCard) => void;
    activeCardNumber?: string;
}

const renderBrandLogo = (brand: CardInfo['brand']) => {
    switch (brand) {
        case 'Visa':
            return (
                <span className="text-[#1434CB] font-[1000] italic text-12px  leading-none flex items-center select-none">
                    VISA
                </span>
            );
        case 'MasterCard':
            return (
                <svg className="w-8 h-5 shrink-0" viewBox="0 0 30 20">
                    <circle cx="10" cy="10" r="8" fill="#EB001B" />
                    <circle cx="20" cy="10" r="8" fill="#F79E1B" fillOpacity="0.85" />
                </svg>
            );
        case 'Amex':
            return (
                <div className="px-1.5 py-0.5 bg-[#007BC1] rounded text-micro font-semibold text-white  leading-none flex items-center justify-center h-4 select-none shrink-0">
                    AMEX
                </div>
            );
        case 'Troy':
            return (
                <div className="px-1.5 py-0.5 bg-[#002C6C] rounded text-micro font-semibold text-white italic  leading-none flex items-center justify-center gap-0.5 h-4 select-none shrink-0">
                    <span className="text-[#FF5C39]">tr</span><span>oy</span>
                </div>
            );
        default:
            return brand ? (
                <span className="text-slate-800 font-[1000] italic text-nano uppercase r select-none shrink-0">
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

export const SavedCardsModal: React.FC<SavedCardsModalProps> = ({
    isOpen,
    onClose,
    onSelectCard,
    activeCardNumber = ''
}) => {
    const [savedCards, setSavedCards] = React.useState<SavedCard[]>(() => {
        const stored = localStorage.getItem('storefront_saved_cards');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }
        }
        const defaults: SavedCard[] = [
            {
                id: '1',
                title: 'Ana Kartım',
                number: '4242 4242 4242 4242',
                holder: 'FURKAN KILINÇ',
                expiry: '12/28',
                cvv: '123',
                brand: 'Visa',
                bank: 'Akbank'
            },
            {
                id: '2',
                title: 'İş Kartı',
                number: '5437 1234 5678 9012',
                holder: 'FURKAN KILINÇ',
                expiry: '09/29',
                cvv: '456',
                brand: 'Troy',
                bank: 'Vakıfbank'
            }
        ];
        localStorage.setItem('storefront_saved_cards', JSON.stringify(defaults));
        return defaults;
    });

    const [editingCardId, setEditingCardId] = React.useState<string | null>(null);
    const [newCardForm, setNewCardForm] = React.useState({
        title: '',
        number: '',
        holder: '',
        expiry: '',
        cvv: ''
    });

    const handleSaveCard = () => {
        if (!newCardForm.title || !newCardForm.number || !newCardForm.holder || !newCardForm.expiry || !newCardForm.cvv) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }

        const brand = getLocalBrand(newCardForm.number);
        const bank = brand === 'Visa' ? 'Akbank' : brand === 'Troy' ? 'Vakıfbank' : 'Garanti BBVA';

        if (editingCardId) {
            const updated = savedCards.map(c =>
                c.id === editingCardId
                    ? { ...c, ...newCardForm, brand, bank }
                    : c
            );
            setSavedCards(updated);
            localStorage.setItem('storefront_saved_cards', JSON.stringify(updated));
            setEditingCardId(null);
        } else {
            const newCard: SavedCard = {
                id: Date.now().toString(),
                ...newCardForm,
                brand,
                bank
            };
            const updated = [...savedCards, newCard];
            setSavedCards(updated);
            localStorage.setItem('storefront_saved_cards', JSON.stringify(updated));
        }

        setNewCardForm({ title: '', number: '', holder: '', expiry: '', cvv: '' });
    };

    const handleDeleteCard = (cardId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedCards.filter(c => c.id !== cardId);
        setSavedCards(updated);
        localStorage.setItem('storefront_saved_cards', JSON.stringify(updated));
        if (editingCardId === cardId) {
            setEditingCardId(null);
            setNewCardForm({ title: '', number: '', holder: '', expiry: '', cvv: '' });
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
        >
            <div className="bg-white rounded-lg shadow-xl border border-gray-100 w-full max-w-7xl h-[75vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">💳</span>
                        <h3 className="text-xl font-[1000] text-gray-900 italic ">KART <span className="text-brand-pink">DEFTERİM</span></h3>
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                            setEditingCardId(null);
                            setNewCardForm({ title: '', number: '', holder: '', expiry: '', cvv: '' });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-100 hover:border-gray-200 text-gray-400 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer font-semibold text-sm"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 overflow-hidden text-slate-800">
                    {/* Left Section: Saved Cards List */}
                    <div className="lg:col-span-2 overflow-y-auto p-6 border-r border-gray-100 bg-gray-50/30 flex flex-col justify-between">
                        <div className="space-y-4">
                            <span className="text-nano font-semibold text-gray-400  block mb-4 italic">KAYITLI KARTLARINIZ</span>

                            {savedCards.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-xs font-bold italic">
                                    Kayıtlı kart bulunamadı.
                                </div>
                            ) : (
                                savedCards.map((card) => {
                                    const isSelected = activeCardNumber.replace(/\D/g, '') === card.number.replace(/\D/g, '');
                                    return (
                                        <div
                                            key={card.id}
                                            onClick={() => onSelectCard(card)}
                                            className={`p-4 rounded-md border text-left cursor-pointer transition-all flex items-center justify-between gap-4 group ${isSelected ? 'border-brand-pink bg-rose-500/5 shadow-xs' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className="text-nano font-semibold  text-brand-pink uppercase italic truncate max-w-[100px]">{card.title}</span>
                                                    <div className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded shrink-0">
                                                        {renderBrandLogo(card.brand)}
                                                    </div>
                                                    <span className="text-10px font-semibold r text-slate-700 italic uppercase truncate max-w-[80px]">{card.bank}</span>
                                                    {isSelected && <span className="text-emerald-500 text-micro font-semibold italic  ml-auto">AKTİF</span>}
                                                </div>

                                                <h4 className="text-caption font-semibold text-gray-900 mb-0.5 r font-mono">
                                                    •••• •••• •••• {card.number.replace(/\D/g, '').slice(-4)}
                                                </h4>
                                                <div className="flex justify-between items-center pr-2 mt-1">
                                                    <p className="text-nano font-bold text-gray-400 italic truncate max-w-[120px]">{card.holder}</p>
                                                    <p className="text-nano font-bold text-slate-500 font-mono shrink-0">{card.expiry}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-100 pl-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingCardId(card.id);
                                                        setNewCardForm({
                                                            title: card.title,
                                                            number: card.number,
                                                            holder: card.holder,
                                                            expiry: card.expiry,
                                                            cvv: card.cvv
                                                        });
                                                    }}
                                                    className="w-7 h-7 rounded-md bg-white border border-gray-100 hover:border-gray-200 shadow-xs flex items-center justify-center text-xs transition-colors hover:bg-slate-50 cursor-pointer"
                                                    title="Düzenle"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteCard(card.id, e)}
                                                    className="w-7 h-7 rounded-md bg-rose-50 border border-rose-100 hover:border-rose-200 shadow-xs flex items-center justify-center text-xs transition-colors hover:bg-rose-100 cursor-pointer"
                                                    title="Sil"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setEditingCardId(null);
                                setNewCardForm({ title: '', number: '', holder: '', expiry: '', cvv: '' });
                            }}
                            className="w-full mt-6 py-4 border border-dashed border-gray-200 hover:border-brand-pink text-gray-400 hover:text-brand-pink rounded-md text-10px font-semibold  transition-all italic flex items-center justify-center gap-2 cursor-pointer bg-white"
                        >
                            ＋ YENİ KART FORMU AÇ
                        </button>
                    </div>

                    {/* Right Section: Add/Edit Form */}
                    <div className="lg:col-span-3 overflow-y-auto p-8 flex flex-col justify-between">
                        <div className="space-y-6">
                            <span className="text-nano font-semibold text-gray-400  block italic mb-2">
                                {editingCardId ? 'KARTI DÜZENLE' : 'YENİ KART EKLE'}
                            </span>

                            <div className="space-y-4 text-slate-800">
                                <div className="space-y-1.5">
                                    <label className="text-nano font-semibold text-gray-400  ml-2 italic">KART ETİKETİ (Örn: Maaş Kartım, Bonus) <span className="text-brand-pink">*</span></label>
                                    <input
                                        type="text"
                                        value={newCardForm.title}
                                        onChange={(e) => setNewCardForm({ ...newCardForm, title: e.target.value })}
                                        className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic text-slate-800"
                                        placeholder="Örn: Benim Kartım"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-nano font-semibold text-gray-400  ml-2 italic">KART NUMARASI <span className="text-brand-pink">*</span></label>
                                    <input
                                        type="text"
                                        maxLength={19}
                                        value={newCardForm.number}
                                        onChange={(e) => setNewCardForm({ ...newCardForm, number: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim() })}
                                        className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic text-slate-800 font-mono r"
                                        placeholder="4242 4242 4242 4242"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-nano font-semibold text-gray-400  ml-2 italic">KART ÜZERİNDEKİ İSİM <span className="text-brand-pink">*</span></label>
                                    <input
                                        type="text"
                                        value={newCardForm.holder}
                                        onChange={(e) => setNewCardForm({ ...newCardForm, holder: e.target.value.toUpperCase() })}
                                        className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic text-slate-800"
                                        placeholder="FURKAN KILINÇ"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-nano font-semibold text-gray-400  ml-2 italic">SON KULLANMA TARİHİ <span className="text-brand-pink">*</span></label>
                                        <input
                                            type="text"
                                            maxLength={5}
                                            value={newCardForm.expiry}
                                            onChange={(e) => setNewCardForm({ ...newCardForm, expiry: e.target.value })}
                                            className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic text-slate-800 text-center"
                                            placeholder="MM/YY"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-nano font-semibold text-gray-400  ml-2 italic">GÜVENLİK KODU (CVV) <span className="text-brand-pink">*</span></label>
                                        <input
                                            type="password"
                                            maxLength={3}
                                            value={newCardForm.cvv}
                                            onChange={(e) => setNewCardForm({ ...newCardForm, cvv: e.target.value.replace(/\D/g, '') })}
                                            className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic text-slate-800 text-center"
                                            placeholder="***"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveCard}
                            className="w-full mt-8 py-5 bg-brand-pink text-white rounded-md text-10px font-semibold  shadow-xs cursor-pointer flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors italic"
                        >
                            💾 {editingCardId ? 'KARTI GÜNCELLE' : 'KARTI DEFTERE KAYDET'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
