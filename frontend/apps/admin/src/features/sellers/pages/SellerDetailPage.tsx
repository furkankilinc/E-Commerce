import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../../shared/api/apiClient';

interface Merchant {
    id: string;
    email: string;
    companyName: string;
    contactPerson?: string;
    phone?: string;
    taxId?: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count: { products: number };
}

interface SystemLog {
    id: string;
    level: string;
    action: string;
    message: string;
    createdAt: string;
    meta?: any;
}

interface MerchantSession {
    id: string;
    createdAt: string;
    updatedAt: string;
    revoked: boolean;
    ipAddress: string;
    userAgent: string;
}

const SellerDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [sessions, setSessions] = useState<MerchantSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/api/admin/merchants/${id}`);
            const data = await res.json();
            if (data.success) {
                setMerchant(data.merchant);
                setLogs(data.logs);
                setSessions(data.sessions || []);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const handleUpdateStatus = async (isActive?: boolean, isVerified?: boolean) => {
        setIsUpdating(true);
        try {
            const res = await apiClient.fetch(`/api/admin/merchants/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive, isVerified })
            });
            const data = await res.json();
            if (data.success) {
                setMerchant(data.merchant);
                load();
            }
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!merchant) return (
        <div className="p-10 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-slate-700">Merchant bulunamadı.</h1>
            <button onClick={() => navigate('/sellers')} className="mt-4 text-indigo-500 font-bold hover:underline">Geri Dön</button>
        </div>
    );

    // Aktif süre hesaplama (Basit format: HH:mm:ss)
    const calculateDuration = (start: string, end: string, isRevoked: boolean) => {
        if (!isRevoked) return <span className="text-emerald-500 font-semibold animate-pulse">Devam Ediyor</span>;

        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        const diff = Math.abs(e - s);

        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);

        if (hours > 0) return `${hours}sa ${mins}dk`;
        if (mins > 0) return `${mins}dk ${secs}sn`;
        return `${secs}sn`;
    };

    return (
        <div className="p-10 font-['Inter'] bg-slate-50/20 min-h-screen">
            {/* Nav Back */}
            <Link to="/sellers" className="inline-flex items-center gap-2 mb-4 text-slate-400 hover:text-indigo-600 font-bold transition-all group">
                <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Satıcı Listesine Dön
            </Link>

            {/* Main Header */}
            <div className="bg-white p-10 rounded-xl border-2 border-slate-50 shadow-xl shadow-slate-200/50 mb-5 flex flex-col lg:flex-row justify-between gap-10 sticky top-4 z-10 backdrop-blur-xl bg-white/90 translate-y-0">
                <div className="flex items-center gap-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl flex items-center justify-center text-3xl font-semibold shadow-xl shadow-indigo-500/30  ring-8 ring-indigo-500/10">
                        {merchant.companyName.substring(0, 2)}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-semibold text-admin-dark ">{merchant.companyName}</h1>
                            <span className={`px-4 py-1 rounded-xl text-10px font-semibold   border ${merchant.isVerified ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {merchant.isVerified ? '✓ DOGRULANMIS' : '⚠ DOGRULAMA BEKLIYOR'}
                            </span>
                        </div>
                        <div className="flex items-center gap-6 text-slate-400 font-bold text-sm ">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth={2} /></svg>
                                {merchant.email}
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} /></svg>
                                Kayıt: {new Date(merchant.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 self-center lg:self-auto">
                    {!merchant.isVerified && (
                        <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(undefined, true)}
                            className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-semibold text-sm   hover:bg-emerald-600 transition-all  shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        >
                            Satıcıyı Onayla
                        </button>
                    )}
                    <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(!merchant.isActive)}
                        className={`px-8 py-4 ${merchant.isActive ? 'bg-red-50 text-red-600 border-2 border-red-100' : 'bg-indigo-500 text-white'} rounded-2xl font-semibold text-sm   hover:bg-opacity-80 transition-all active:scale-95 disabled:opacity-50`}
                    >
                        {merchant.isActive ? 'Hesabı Askıya Al' : 'Hesabı Aktifleştir'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-5">
                {/* Details Card */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100  shadow-slate-100 h-full">
                    <h3 className="text-xl font-semibold text-admin-dark mb-4 flex items-center gap-3">
                        <span className="w-2 h-16 bg-indigo-500 rounded-full"></span>
                        Firma Detayları
                    </h3>
                    <div className="space-y-6">
                        <DetailRow label="Şirket Adı" value={merchant.companyName} />
                        <DetailRow label="Vergi No / TCKN" value={merchant.taxId || 'Belirtilmemiş'} />
                        <DetailRow label="Yetkili Kişi" value={merchant.contactPerson || 'Belirtilmemiş'} />
                        <DetailRow label="Telefon" value={merchant.phone || 'Belirtilmemiş'} />
                        <DetailRow label="Platform Rolü" value="SATICI (MERCHANT)" isBold />
                    </div>
                </section>

                {/* Session DataGrid */}
                <section className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-100  shadow-slate-100 h-full overflow-hidden flex flex-col">
                    <h3 className="text-xl font-semibold text-admin-dark mb-4 flex items-center gap-3">
                        <span className="w-2 h-16 bg-emerald-500 rounded-full"></span>
                        Oturum Geçmişi (DataGrid)
                    </h3>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="py-4 px-6 text-10px font-semibold text-slate-400  ">Giriş Zamanı</th>
                                    <th className="py-4 px-6 text-10px font-semibold text-slate-400  ">Çıkış Zamanı</th>
                                    <th className="py-4 px-6 text-10px font-semibold text-slate-400  ">Aktif Süre</th>
                                    <th className="py-4 px-6 text-10px font-semibold text-slate-400  ">IP Adresi</th>
                                    <th className="py-4 px-6 text-10px font-semibold text-slate-400   text-right">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-300 font-bold    text-xs">Oturum verisi bulunamadı</td>
                                    </tr>
                                ) : (
                                    sessions.map(session => (
                                        <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5 px-6 font-bold text-slate-700 text-sm">
                                                {new Date(session.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-5 px-6 font-semibold text-slate-500 text-sm">
                                                {session.revoked
                                                    ? new Date(session.updatedAt).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                                                    : '-'}
                                            </td>
                                            <td className="py-5 px-6 font-semibold text-indigo-600 text-sm">
                                                {calculateDuration(session.createdAt, session.updatedAt, session.revoked)}
                                            </td>
                                            <td className="py-5 px-6 font-mono text-xs text-slate-400">
                                                {session.ipAddress || '127.0.0.1'}
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${session.revoked ? 'bg-slate-300' : 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse'}`}></span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {/* Right Column - Logs */}
                <section className="bg-white p-10 rounded-xl border border-slate-100  shadow-slate-100 min-h-[600px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-admin-dark flex items-center gap-3">
                            <span className="w-2 h-16 bg-amber-500 rounded-full"></span>
                            Aktivite Logları
                        </h3>
                        <div className="px-5 py-2 bg-slate-50 rounded-xl text-10px font-semibold text-slate-400  ">
                            Son 100 Kayıt
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                                <div className="text-6xl mb-6">📜</div>
                                <div className="text-slate-500 font-bold   text-sm">Henüz aktivite kaydı bulunmuyor.</div>
                            </div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-50 group hover:shadow-lg transition-all border-l-4 border-l-slate-200 hover:border-l-indigo-500">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-lg text-10px font-semibold   ${log.level === 'error' ? 'bg-red-50 text-red-500' :
                                                log.level === 'warn' ? 'bg-amber-50 text-amber-500' :
                                                    'bg-indigo-50 text-indigo-500'
                                                }`}>
                                                {log.level}
                                            </span>
                                            <span className="font-semibold text-slate-800 ">{log.action}</span>
                                        </div>
                                        <span className="text-10px font-bold text-slate-400  ">
                                            {new Date(log.createdAt).toLocaleString('tr-TR')}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 font-medium leading-relaxed">{log.message}</p>
                                    {log.meta && Object.keys(log.meta).length > 0 && (
                                        <div className="mt-3 p-3 bg-white rounded-xl border border-slate-100 text-10px font-mono text-slate-400 overflow-hidden text-ellipsis">
                                            {JSON.stringify(log.meta)}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-8 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-center">
                        <p className="text-xs text-slate-400 font-bold   leading-loose">
                            Log kayıtları sistem güvenliği için 2 yıl boyunca saklanır. <br />
                            Şüpheli bir işlem olması durumunda "Audit Team" ile iletişime geçin.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};

const DetailRow: React.FC<{ label: string; value: string; isBold?: boolean }> = ({ label, value, isBold }) => (
    <div className="space-y-1">
        <div className="text-10px  font-semibold text-slate-400 ">{label}</div>
        <div className={`${isBold ? 'text-indigo-600 font-semibold' : 'text-slate-700 font-bold'} text-lg `}>{value}</div>
    </div>
);

export default SellerDetailPage;
