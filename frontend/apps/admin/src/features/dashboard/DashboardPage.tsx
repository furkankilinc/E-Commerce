import React, { useEffect, useState } from 'react';
import { apiClient } from '../../shared/api/apiClient';
import DashboardMap from './components/DashboardMap';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtext: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, subtext }) => (
    <div className={`bg-gradient-to-br ${color} border rounded-[2.5rem] p-8 shadow-sm transition-all hover: hover:-translate-y-1 duration-300`}>
        <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md animate-float">
                {icon}
            </div>
        </div>
        <div className="text-4xl font-semibold text-admin-dark mb-2 ">{value}</div>
        <div className="text-sm font-semibold text-slate-500  ">{label}</div>
        <div className="text-xs text-slate-400 mt-2 font-medium">{subtext}</div>
    </div>
);

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState({
        totalMerchants: 0,
        totalProducts: 0,
        onlineUsers: 0,
        totalUsers: 0,
        lowStock: [] as any[]
    });
    const [mapData, setMapData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Barrel Roll Exploit States
    const [isExploited, setIsExploited] = useState(false);
    const [exploitLogs, setExploitLogs] = useState<string[]>([]);
    const [logIndex, setLogIndex] = useState(0);

    const logsList = [
        "💡 INITIALIZING BARREL ROLL EXPLOIT V1.3.3.7...",
        "🔒 SCANNING MICROSERVICE NETWORK PORTS...",
        "🟢 [AUTH-SERVICE] PORT 5001 - OPEN & VULNERABLE",
        "🟢 [PRODUCT-SERVICE] PORT 5002 - OPEN & VULNERABLE",
        "🟢 [ORDER-SERVICE] PORT 5003 - OPEN & VULNERABLE",
        "🔥 BYPASSING JWT VERIFICATION GATEWAY...",
        "💣 FLOODING RABBITMQ BROKER STOK KUYRUKLARI...",
        "⚡ EXPLOITING CENTRAL-DASHBOARD IN NGINX LOOPBACK...",
        "💀 INJECTING rotate(360deg) CSS INSTRUCTION...",
        "💥 EXPLOIT SUCCESSFUL! DO A BARREL ROLL!"
    ];

    useEffect(() => {
        let buffer: string[] = [];
        const handleKeyDown = (e: KeyboardEvent) => {
            const char = e.key.toLowerCase();
            buffer = [...buffer, char].slice(-6);
            if (buffer.join('') === 'barrel') {
                triggerBarrelExploit();
                buffer = [];
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const triggerBarrelExploit = () => {
        setIsExploited(true);
        setExploitLogs([]);
        setLogIndex(0);

        // Apply 3D barrel roll effect to body/main viewport
        const main = document.querySelector('main') || document.body;
        main.classList.add('barrel-roll-effect');
        setTimeout(() => {
            main.classList.remove('barrel-roll-effect');
        }, 3000);
    };

    useEffect(() => {
        if (!isExploited) return;
        if (logIndex < logsList.length) {
            const timer = setTimeout(() => {
                setExploitLogs(prev => [...prev, logsList[logIndex]]);
                setLogIndex(logIndex + 1);
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [isExploited, logIndex]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [statsRes, mapRes] = await Promise.all([
                    apiClient.get('/api/admin/stats/dashboard'),
                    apiClient.get('/api/admin/stats/map')
                ]);

                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data.stats);
                }
                if (mapRes.ok) {
                    const data = await mapRes.json();
                    setMapData(data.data.merchants.concat(data.data.users));
                }
            } catch (e) {
                console.error('Dashboard data load failed', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();

        // Refresh online users every minute
        const poll = setInterval(async () => {
            const statsRes = await apiClient.get('/api/admin/stats/dashboard');
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
            }
        }, 60000);

        return () => clearInterval(poll);
    }, []);

    return (
        <div className="p-10 font-['Inter'] relative">
            {/* Global Loader Indicator */}
            {isLoading && (
                <div className="fixed top-0 left-0 right-0 h-1 bg-indigo-500/20 z-[9999]">
                    <div className="h-full bg-indigo-500 animate-progress origin-left"></div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-admin-navy rounded-2xl flex items-center justify-center  shadow-admin-navy/20">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-semibold text-admin-dark ">Kontrol Paneli</h1>
                    </div>
                    <p className="text-slate-500 font-medium text-lg ml-1">Platformdaki tüm aktiviteleri canlı olarak izleyin.</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-6">
                <StatCard
                    label="Toplam Satıcı"
                    value={stats.totalMerchants}
                    subtext="Aktif mağaza sayısı"
                    color="from-indigo-500/10 to-indigo-500/5 border-indigo-500/10"
                    icon={<svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                />
                <StatCard
                    label="Toplam Ürün"
                    value={stats.totalProducts}
                    subtext="Sitedeki yayında ürünler"
                    color="from-blue-500/10 to-blue-500/5 border-blue-500/10"
                    icon={<svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" /></svg>}
                />
                <StatCard
                    label="Çevrimiçi"
                    value={stats.onlineUsers}
                    subtext="Son 15 dk aktif kullanıcı"
                    color="from-emerald-500/10 to-emerald-500/5 border-emerald-500/10"
                    icon={<svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                />
                <StatCard
                    label="Toplam Hesap"
                    value={stats.totalUsers}
                    subtext="Kayıtlı kullanıcı profili"
                    color="from-rose-500/10 to-rose-500/5 border-rose-500/10"
                    icon={<svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
            </div>

            <div className="grid grid-cols-1 gap-8 mb-6">
                {/* Sales Activity Preview */}
                <div className="bg-white rounded-xl p-10 border border-slate-50 shadow-sm overflow-hidden flex flex-col group">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-semibold text-admin-navy    flex items-center gap-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            Son 30 Günlük Aktivite
                        </h3>
                        <a href="/analytics" className="text-10px font-semibold text-slate-400   hover:text-indigo-500 transition-colors ">DETAYLI ANALİZ</a>
                    </div>
                    <div className="flex-1 min-h-[300px] flex items-end justify-between px-4 pb-4">
                        {/* Simplistic bar chart preview with brand-pink */}
                        {[...Array(24)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-4 flex-1">
                                <div className="w-2.5 bg-slate-100 rounded-full h-[200px] relative overflow-hidden flex items-end">
                                    <div
                                        className="w-full bg-brand-pink transition-all duration-1000 rounded-full"
                                        style={{ height: `${Math.random() * 80 + 20}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Map Section */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-50 mb-6">
                <div className="p-8 pb-4">
                    <h2 className="text-2xl font-semibold text-slate-800  mb-2  ">Platform Aktivite Haritası</h2>
                    <p className="text-slate-400 font-medium text-sm text-left">Satıcıların ve aktif kullanıcıların konumlarını anlık olarak takip edin.</p>
                </div>
                <DashboardMap points={mapData} />
            </div>

            {/* Barrel Exploit Easter Egg Interface */}
            {isExploited && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-md font-mono text-emerald-400 p-4 select-none animate-in fade-in duration-300">
                    {/* Matrix Digital Rain Animation */}
                    <div className="absolute inset-0 opacity-15 overflow-hidden pointer-events-none">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute text-[10px] sm:text-xs text-emerald-500 font-extrabold whitespace-nowrap animate-matrix"
                                style={{
                                    left: `${i * 5}%`,
                                    animationDuration: `${2 + Math.random() * 3}s`,
                                    animationDelay: `${Math.random() * 2}s`
                                }}
                            >
                                {Array.from({ length: 45 }).map(() => String.fromCharCode(33 + Math.floor(Math.random() * 93))).join(' ')}
                            </div>
                        ))}
                    </div>

                    <div className="bg-neutral-950 border-2 border-emerald-500 rounded-3xl p-6 sm:p-10 max-w-2xl w-full relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-pulse-slow">
                        {/* Terminal Header */}
                        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4 mb-6">
                            <div className="flex items-center gap-3">
                                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
                                <span className="text-[10px] sm:text-xs font-black tracking-widest text-emerald-500 uppercase">🚨 BARREL ROLL SECURITY DECRYPTOR 🚨</span>
                            </div>
                            <span className="text-[9px] sm:text-10px font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full uppercase">ROOT@FUIRA:~$</span>
                        </div>

                        {/* Shell Area */}
                        <div className="bg-black/90 rounded-2xl p-6 h-[250px] overflow-y-auto mb-6 border border-emerald-500/10 space-y-2 select-text custom-scrollbar text-xs leading-relaxed">
                            {exploitLogs.map((log, idx) => (
                                <div key={idx} className={log.includes('💥') || log.includes('🚨') || log.includes('💣') ? 'text-rose-500 font-black' : 'text-emerald-400'}>
                                    {log}
                                </div>
                            ))}
                            {logIndex < logsList.length && (
                                <div className="flex items-center gap-1.5 text-emerald-500">
                                    <span>[~] Securing tunnel access...</span>
                                    <span className="w-1.5 h-3 bg-emerald-500 animate-pulse"></span>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={triggerBarrelExploit}
                                className="py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                🔄 RE-RUN ROLL
                            </button>
                            <button
                                onClick={() => setIsExploited(false)}
                                className="py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                🛑 PATCH SYSTEM
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Embedded CSS for Easter Egg animations */}
            <style>{`
                @keyframes barrelRoll {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(0.9); }
                    100% { transform: rotate(360deg) scale(1); }
                }
                .barrel-roll-effect {
                    animation: barrelRoll 3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                    transform-origin: center center;
                }
                @keyframes matrix {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                .animate-matrix {
                    animation: matrix 6s linear infinite;
                    writing-mode: vertical-rl;
                    text-orientation: uppercase;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(16, 185, 129, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(16, 185, 129, 0.4);
                }
            `}</style>
        </div>
    );
};

export default DashboardPage;
