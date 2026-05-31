import React from 'react';

interface IyzicoThreeDSecureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerifySuccess: () => void;
    onVerifyFailure: (error: string) => void;
    amount: number;
    cardNumber: string;
    phoneNumber: string;
}

export const IyzicoThreeDSecureModal: React.FC<IyzicoThreeDSecureModalProps> = ({
    isOpen,
    onClose,
    onVerifySuccess,
    onVerifyFailure,
    amount,
    cardNumber,
    phoneNumber
}) => {
    const [otp, setOtp] = React.useState('');
    const [timer, setTimer] = React.useState(180); // 3 minutes
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [shouldShake, setShouldShake] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');

    const last4 = React.useMemo(() => {
        const clean = cardNumber.replace(/\D/g, '');
        return clean.slice(-4) || '4242';
    }, [cardNumber]);

    const maskedPhone = React.useMemo(() => {
        if (!phoneNumber) return '+90 532 *** ** 00';
        const clean = phoneNumber.replace(/\s+/g, '');
        if (clean.length >= 10) {
            return `${clean.substring(0, 3)} ${clean.substring(3, 6)} *** ** ${clean.slice(-2)}`;
        }
        return phoneNumber;
    }, [phoneNumber]);

    // Timer effect
    React.useEffect(() => {
        if (!isOpen) return;
        setTimer(180);
        setOtp('');
        setErrorMessage('');
        setIsVerifying(false);
        setShouldShake(false);

        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen]);

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (timer === 0) {
            setErrorMessage('Süre doldu. Lütfen kodu tekrar isteyin.');
            onVerifyFailure('Doğrulama süresi doldu.');
            return;
        }

        if (otp.length < 6) {
            setErrorMessage('Lütfen 6 haneli doğrulama kodunu giriniz.');
            return;
        }

        setIsVerifying(true);
        setErrorMessage('');

        // Simulate banking authorization delay
        setTimeout(() => {
            if (otp === '123456') {
                setIsVerifying(false);
                onVerifySuccess();
            } else {
                setIsVerifying(false);
                setShouldShake(true);
                setErrorMessage('Hatalı SMS doğrulama kodu. Lütfen tekrar deneyiniz.');
                setTimeout(() => setShouldShake(false), 500);
            }
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className={`relative w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 ${shouldShake ? 'animate-shake' : ''
                    }`}
            >
                {/* Official iyzico Blue Header */}
                <div className="bg-[#193264] px-6 py-4 flex items-center justify-between border-b border-sky-950/20">
                    <div className="flex items-center gap-2">
                        {/* Custom simulated iyzico SVG logo */}
                        <div className="flex items-center select-none font-[1000] text-lg italic text-white tracking-wider">
                            <span className="text-[#F39200]">iyzi</span>co
                        </div>
                        <span className="text-[10px] font-semibold bg-[#F39200] text-white px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">
                            SANDBOX TEST
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors"
                        aria-label="Kapat"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 3D Secure Header Panel */}
                <div className="bg-sky-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-sky-500/10 rounded-full flex items-center justify-center text-sky-600 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-[13px] font-extrabold text-slate-800 leading-none">3D SECURE GÜVENLİK DOĞRULAMASI</h3>
                        <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Kredi Kartı Güvenlik Katmanı</p>
                    </div>
                </div>

                {/* Details Table */}
                <div className="p-6 pb-4 border-b border-slate-50 text-[11px] font-semibold text-slate-600 space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-50/50">
                        <span className="text-slate-400 font-semibold">ÜYE İŞYERİ:</span>
                        <span className="text-slate-800 font-extrabold">FUI & RA STOREFRONT</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50/50">
                        <span className="text-slate-400 font-semibold">İŞLEM TUTARI:</span>
                        <span className="text-slate-900 font-[1000] text-sm text-brand-pink leading-none">{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ₺</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50/50">
                        <span className="text-slate-400 font-semibold">KART NUMARASI:</span>
                        <span className="text-slate-800 font-extrabold">**** **** **** {last4}</span>
                    </div>
                </div>

                {/* Main Action Block */}
                <form onSubmit={handleVerify} className="p-6 space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                            Lütfen bankanızda kayıtlı <strong className="text-slate-800 font-semibold">{maskedPhone}</strong> nolu cep telefonunuza gönderilen tek kullanımlık şifreyi giriniz.
                        </p>
                    </div>

                    {/* Helper Banner for Sandbox */}
                    <div className="bg-[#F39200]/5 border border-[#F39200]/20 rounded-xl p-3.5 flex items-start gap-3">
                        <div className="w-5 h-5 bg-[#F39200]/10 rounded-full flex items-center justify-center text-[#F39200] flex-shrink-0 mt-0.5 text-xs font-semibold font-serif">!</div>
                        <div className="text-left">
                            <span className="text-[10px] font-extrabold text-[#F39200] uppercase block tracking-wider mb-0.5">Sandbox Test Şifresi</span>
                            <span className="text-[11px] font-extrabold text-slate-600">Ödemeyi onaylamak için şifre kısmına <strong className="text-brand-pink font-extrabold">123456</strong> yazabilirsiniz.</span>
                        </div>
                    </div>

                    {/* Input Field */}
                    <div className="space-y-2 relative">
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setOtp(val);
                                setErrorMessage('');
                            }}
                            disabled={isVerifying}
                            placeholder="• • • • • •"
                            className="w-full h-16 bg-slate-50 border-2 border-slate-100 rounded-xl text-center text-xl font-extrabold tracking-[0.6em] text-slate-800 focus:outline-none focus:border-[#193264] focus:bg-white transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-300"
                        />
                        {errorMessage && (
                            <p className="text-[10px] font-semibold text-red-500 text-center animate-pulse">{errorMessage}</p>
                        )}
                    </div>

                    {/* Countdown and Resend Link */}
                    <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-400">KALAN SÜRE:</span>
                        <div className="flex items-center gap-1.5 text-slate-800 font-extrabold">
                            <svg className="w-4 h-4 text-[#F39200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className={timer < 60 ? 'text-red-500 animate-pulse' : ''}>
                                {formatTimer(timer)}
                            </span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isVerifying}
                            className="w-full h-12 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-500 transition-all cursor-pointer"
                        >
                            İPTAL ET
                        </button>
                        <button
                            type="submit"
                            disabled={isVerifying || otp.length < 6}
                            className="w-full h-12 bg-[#193264] hover:bg-[#122449] disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-sky-950/10"
                        >
                            {isVerifying ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ONAYLANIYOR...
                                </>
                            ) : (
                                'ONAYLA VE ÖDE'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
