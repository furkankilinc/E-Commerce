import React from 'react';

export interface SavedAddress {
    id: string;
    title: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    neighborhood: string;
    zipCode: string;
}

interface SavedAddressesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectAddress: (address: SavedAddress) => void;
    activeAddress?: {
        address: string;
        city: string;
    };
    savedAddresses: SavedAddress[];
    setSavedAddresses: React.Dispatch<React.SetStateAction<SavedAddress[]>>;
}

export const SavedAddressesModal: React.FC<SavedAddressesModalProps> = ({
    isOpen,
    onClose,
    onSelectAddress,
    activeAddress,
    savedAddresses,
    setSavedAddresses
}) => {

    const [showMap, setShowMap] = React.useState(false);
    const [editingAddressId, setEditingAddressId] = React.useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [newAddressForm, setNewAddressForm] = React.useState({
        title: '',
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        neighborhood: '',
        zipCode: ''
    });

    // Initializer for map
    const mapRef = React.useRef<any>(null);
    const markerRef = React.useRef<any>(null);

    const initMap = () => {
        const L = (window as any).L;
        if (!L) return;

        if (mapRef.current) {
            mapRef.current.remove();
        }

        const lat = 41.0256;
        const lng = 28.9742;

        const map = L.map('address-picker-map').setView([lat, lng], 14);
        mapRef.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current = marker;

        const resolveAddress = async (lat: number, lng: number) => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=tr`);
                if (res.ok) {
                    const data = await res.json();

                    const province = data.address?.province || data.address?.city || data.address?.state || '';
                    const district = data.address?.town || data.address?.city_district || data.address?.district || data.address?.county || '';
                    const neighborhood = data.address?.neighbourhood || data.address?.suburb || data.address?.quarter || '';
                    const road = data.address?.road || '';
                    const houseNum = data.address?.house_number ? `No: ${data.address.house_number}` : '';
                    const zipStr = data.address?.postcode || '';

                    const cleanAddressDetail = [road, houseNum].filter(Boolean).join(', ');

                    setNewAddressForm(prev => ({
                        ...prev,
                        city: province.toUpperCase(),
                        district: district,
                        neighborhood: neighborhood,
                        address: cleanAddressDetail,
                        zipCode: zipStr
                    }));
                }
            } catch (e) {
                console.error('Geocoding failed:', e);
            }
        };

        resolveAddress(lat, lng);

        marker.on('dragend', () => {
            const position = marker.getLatLng();
            resolveAddress(position.lat, position.lng);
        });

        map.on('click', (e: any) => {
            marker.setLatLng(e.latlng);
            resolveAddress(e.latlng.lat, e.latlng.lng);
        });
    };

    React.useEffect(() => {
        if (showMap && isOpen) {
            if (!document.getElementById('leaflet-css')) {
                const css = document.createElement('link');
                css.id = 'leaflet-css';
                css.rel = 'stylesheet';
                css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(css);
            }

            const scriptId = 'leaflet-js';
            if (!document.getElementById(scriptId)) {
                const js = document.createElement('script');
                js.id = scriptId;
                js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                js.onload = initMap;
                document.body.appendChild(js);
            } else {
                setTimeout(initMap, 150);
            }
        }
    }, [showMap, isOpen]);

    const handleSaveAddress = () => {
        const { title, fullName, email, phone, address, city, district, neighborhood, zipCode } = newAddressForm;
        if (!title || !fullName || !email || !phone || !address || !city || !district || !neighborhood || !zipCode) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }

        let updated: SavedAddress[];
        if (editingAddressId) {
            updated = savedAddresses.map(addr => addr.id === editingAddressId ? { ...newAddressForm, id: editingAddressId } : addr);
            setEditingAddressId(null);
        } else {
            const newAddr = { ...newAddressForm, id: Date.now().toString() };
            updated = [...savedAddresses, newAddr];
        }

        setSavedAddresses(updated);
        localStorage.setItem('storefront_saved_addresses', JSON.stringify(updated));

        // Reset form
        setNewAddressForm({
            title: '',
            fullName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            district: '',
            neighborhood: '',
            zipCode: ''
        });
        setShowMap(false);
        setIsFormOpen(false);
    };

    const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedAddresses.filter(addr => addr.id !== id);
        setSavedAddresses(updated);
        localStorage.setItem('storefront_saved_addresses', JSON.stringify(updated));
        if (editingAddressId === id) {
            setEditingAddressId(null);
            setNewAddressForm({
                title: '',
                fullName: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                district: '',
                neighborhood: '',
                zipCode: ''
            });
            setShowMap(false);
            setIsFormOpen(false);
        }
    };

    const handleStartEdit = (addr: SavedAddress, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingAddressId(addr.id);
        setNewAddressForm({
            title: addr.title,
            fullName: addr.fullName,
            email: addr.email,
            phone: addr.phone,
            address: addr.address,
            city: addr.city,
            district: addr.district,
            neighborhood: addr.neighborhood,
            zipCode: addr.zipCode
        });
        setShowMap(false);
        setIsFormOpen(true);
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
        >
            <div className={`bg-white rounded-lg shadow-xl border border-gray-100 overflow-y-hidden w-full ${isFormOpen ? 'max-w-7xl' : 'max-w-xl'} h-[85vh] flex flex-col relative overflow-hidden transition-all duration-300 ease-in-out animate-in zoom-in-95`}>
                {/* Modal Header */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">📖</span>
                        <h3 className="text-xl font-[1000] text-gray-900  ">ADRES <span className="text-brand-pink">DEFTERİM</span></h3>
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                            setShowMap(false);
                            setEditingAddressId(null);
                            setNewAddressForm({ title: '', fullName: '', email: '', phone: '', address: '', city: '', district: '', neighborhood: '', zipCode: '' });
                            setIsFormOpen(false);
                        }}
                        className="w-8 h-8 rounded-full border border-gray-100 hover:border-gray-200 text-gray-400 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer font-semibold text-sm"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div className={`flex-1 grid grid-cols-1 ${isFormOpen ? 'lg:grid-cols-5' : 'lg:grid-cols-1'} overflow-hidden text-slate-800`}>
                    {/* Left Section: Saved Addresses List */}
                    <div className={`${isFormOpen ? 'lg:col-span-2 border-r border-slate-100 bg-slate-50/20' : 'lg:col-span-1 border-r-0 bg-white'} overflow-y-auto p-8 flex flex-col justify-between transition-all duration-300`}>
                        <div className="space-y-4">
                            <span className="text-nano font-semibold text-gray-400  block mb-4 ">KAYITLI ADRESLERİNİZ</span>

                            {savedAddresses.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-xs font-bold ">
                                    Kayıtlı adres bulunamadı.
                                </div>
                            ) : (
                                <div className="space-y-4 w-full">
                                    {savedAddresses.map((addr) => {
                                        const isSelected = activeAddress && activeAddress.address === addr.address && activeAddress.city === addr.city;
                                        return (
                                            <div
                                                key={addr.id}
                                                onClick={() => onSelectAddress(addr)}
                                                className={`p-4 rounded-md border text-left cursor-pointer transition-all flex items-center justify-between gap-4 group ${isSelected ? 'border-brand-pink bg-rose-500/5 shadow-xs' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-nano font-semibold  text-brand-pink uppercase ">{addr.title}</span>
                                                    </div>
                                                    <h4 className="text-caption font-semibold text-gray-900 mb-0.5 truncate">{addr.fullName}</h4>
                                                    <p className="text-10px font-bold text-gray-400 leading-relaxed  truncate">{addr.district ? `${addr.district}` : ''} {addr.neighborhood} {addr.address} </p>
                                                    <p className="text-nano font-extrabold text-slate-500 r mt-1">{addr.city}, {addr.zipCode}</p>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-100 pl-3">
                                                    <button
                                                        onClick={(e) => handleStartEdit(addr, e)}
                                                        className="w-7 h-7 rounded-md bg-white border border-gray-100 hover:border-gray-200 shadow-xs flex items-center justify-center text-xs transition-colors hover:bg-slate-50 cursor-pointer"
                                                        title="Düzenle"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteAddress(addr.id, e)}
                                                        className="w-7 h-7 rounded-md bg-rose-50 border border-rose-100 hover:border-rose-200 shadow-xs flex items-center justify-center text-xs transition-colors hover:bg-rose-100 cursor-pointer"
                                                        title="Sil"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setEditingAddressId(null);
                                setNewAddressForm({ title: '', fullName: '', email: '', phone: '', address: '', city: '', district: '', neighborhood: '', zipCode: '' });
                                setShowMap(false);
                                setIsFormOpen(true);
                            }}
                            className={`w-full ${isFormOpen ? 'mt-0' : 'mt-12 max-w-md mx-auto'} py-4 border border-dashed border-gray-200 hover:border-brand-pink text-gray-400 hover:text-brand-pink rounded-md text-10px font-semibold  transition-all  flex items-center justify-center gap-2 cursor-pointer bg-white shadow-xs`}
                        >
                            ＋ YENİ ADRES FORMU AÇ
                        </button>
                    </div>

                    {/* Right Section: Add/Edit Form */}
                    {isFormOpen && (
                        <div className="lg:col-span-3 overflow-y-auto p-8 flex flex-col justify-between bg-slate-50/10 border-l border-slate-100 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-6">
                                <span className="text-nano font-semibold text-gray-400  block  mb-2">
                                    {editingAddressId ? 'ADRESİ DÜZENLE' : 'YENİ ADRES EKLE'}
                                </span>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-nano font-semibold text-gray-400  ml-2 ">ADRES BAŞLIĞI (Örn: Evim, Ofis) <span className="text-brand-pink">*</span></label>
                                        <input
                                            type="text"
                                            value={newAddressForm.title}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, title: e.target.value })}
                                            className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                            placeholder="Örn: Evim"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-nano font-semibold text-gray-400  ml-2 ">ALICI AD SOYAD <span className="text-brand-pink">*</span></label>
                                            <input
                                                type="text"
                                                value={newAddressForm.fullName}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                                                className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                                placeholder="Örn: Furkan Kılınç"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-nano font-semibold text-gray-400  ml-2 ">TELEFON NUMARASI <span className="text-brand-pink">*</span></label>
                                            <input
                                                type="text"
                                                value={newAddressForm.phone}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                                                className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                                placeholder="+90 5XX XXX XX XX"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-nano font-semibold text-gray-400  ml-2 ">E-POSTA ADRESİ <span className="text-brand-pink">*</span></label>
                                            <input
                                                type="email"
                                                value={newAddressForm.email}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, email: e.target.value })}
                                                className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                                placeholder="alici@email.com"
                                            />
                                        </div>
                                        <div className="space-y-1.5 flex flex-col justify-end">
                                            <button
                                                onClick={() => setShowMap(!showMap)}
                                                className="w-full h-10 border border-brand-pink/20 hover:border-brand-pink bg-rose-500/5 hover:bg-rose-500/10 text-brand-pink rounded-md text-10px font-semibold  transition-all  flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                📍 {showMap ? 'HARİTAYI KAPAT' : 'HARİTA ÜZERİNDEN SEÇ'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Leaflet Map container */}
                                    {showMap && (
                                        <div className="w-full rounded-md border border-gray-100 overflow-hidden relative shadow-inner animate-in slide-in-from-top-4 duration-300">
                                            <div id="address-picker-map" className="w-full h-[320px] rounded-md min-h-[320px] z-10"></div>
                                            <div className="absolute bottom-4 right-4 z-20 bg-white/90 backdrop-blur-md px-4 py-2 rounded-md shadow-xs border border-gray-100">
                                                <span className="text-micro font-semibold text-gray-400   block leading-none">HARİTA İPUCU</span>
                                                <span className="text-nano font-semibold text-gray-600 ">İşaretçiyi sürükleyin veya haritada bir yere tıklayın.</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-nano font-semibold text-gray-400  ml-2 ">ŞEHİR (İL) <span className="text-brand-pink">*</span></label>
                                            <input
                                                type="text"
                                                value={newAddressForm.city}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value.toUpperCase() })}
                                                className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                                placeholder="İSTANBUL"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-nano font-semibold text-gray-400  ml-2 ">İLÇE <span className="text-brand-pink">*</span></label>
                                            <input
                                                type="text"
                                                value={newAddressForm.district}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, district: e.target.value })}
                                                className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                                placeholder="Beşiktaş"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-nano font-semibold text-gray-400  ml-2 ">MAHALLE <span className="text-brand-pink">*</span></label>
                                            <input
                                                type="text"
                                                value={newAddressForm.neighborhood}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, neighborhood: e.target.value })}
                                                className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                                placeholder="Sinanpaşa Mh."
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-nano font-semibold text-gray-400  ml-2 ">POSTA KODU <span className="text-brand-pink">*</span></label>
                                            <input
                                                type="text"
                                                value={newAddressForm.zipCode}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, zipCode: e.target.value })}
                                                className="w-full h-10 bg-gray-50 border border-gray-100 rounded-md px-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800"
                                                placeholder="34XXX"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-nano font-semibold text-gray-400  ml-2 ">AÇIK ADRES (Sokak, Bina No, Daire No) <span className="text-brand-pink">*</span></label>
                                        <textarea
                                            value={newAddressForm.address}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-md p-6 text-xs font-bold focus:outline-none focus:border-brand-pink focus:bg-white transition-all  text-slate-800 resize-none"
                                            placeholder="Şehit Asım Cad. No: 12 D: 4"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button
                                    onClick={() => {
                                        setIsFormOpen(false);
                                        setShowMap(false);
                                        setEditingAddressId(null);
                                    }}
                                    className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-md text-10px font-semibold  cursor-pointer flex items-center justify-center gap-2 transition-colors "
                                >
                                    ✕ VAZGEÇ
                                </button>
                                <button
                                    onClick={handleSaveAddress}
                                    className="w-full py-4 bg-brand-pink text-white rounded-md text-10px font-semibold  shadow-xs cursor-pointer flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors "
                                >
                                    💾 {editingAddressId ? 'GÜNCELLE' : 'KAYDET'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
