import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { apiClient } from '../../shared/api/apiClient';

interface Message {
    sender: 'user' | 'admin';
    text: string;
    createdAt: string;
}

interface Session {
    id: string;
    userName: string;
    email: string;
    status: 'active' | 'closed';
    unreadAdminCount?: number;
    unreadUserCount?: number;
    createdAt: string;
    messages: Message[];
}

const SupportPage: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('active');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [blockedList, setBlockedList] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch support sessions
    const fetchSessions = async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        try {
            const res = await apiClient.get('/api/admin/products/support/sessions');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setSessions(data.sessions);
                    // Update active message thread if selected
                    if (selectedSessionId) {
                        const activeSess = data.sessions.find((s: Session) => s.id === selectedSessionId);
                        if (activeSess) {
                            setMessages(activeSess.messages);
                            // If selected session has unread messages, mark it as read immediately
                            if (activeSess.unreadAdminCount && activeSess.unreadAdminCount > 0) {
                                handleMarkRead(selectedSessionId);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Destek oturumları yüklenemedi:', err);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    // Fetch blocked users
    const fetchBlockedList = async () => {
        try {
            const res = await apiClient.get('/api/admin/products/support/sessions/blocked');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setBlockedList(data.blocked || []);
                }
            }
        } catch (err) {
            console.error('Engellenenler listesi alınamadı:', err);
        }
    };

    // Initial load and periodic polling for real-time responsiveness
    useEffect(() => {
        fetchSessions(true);
        fetchBlockedList();
        const interval = setInterval(() => {
            fetchSessions(false);
            fetchBlockedList();
        }, 3000); // Live poll every 3 seconds for instant chat!
        return () => clearInterval(interval);
    }, [selectedSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle Session Select
    const handleSelectSession = (session: Session) => {
        setSelectedSessionId(session.id);
        setMessages(session.messages);
        if (session.unreadAdminCount && session.unreadAdminCount > 0) {
            handleMarkRead(session.id);
        }
    };

    // Mark active session as read
    const handleMarkRead = async (id: string) => {
        try {
            await apiClient.put(`/api/admin/products/support/sessions/${id}/read-admin`, {});
            // Local count reset
            setSessions(prev => prev.map(s => s.id === id ? { ...s, unreadAdminCount: 0 } : s));
        } catch (err) {}
    };

    // Close/Resolve Session
    const handleCloseSession = async (id: string) => {
        try {
            const res = await apiClient.put(`/api/admin/products/support/sessions/${id}/close`, {});
            if (res.ok) {
                toast.success('Destek oturumu başarıyla kapatıldı.');
                fetchSessions();
            } else {
                toast.error('Oturum kapatılamadı.');
            }
        } catch (err) {
            toast.error('Bir sistem hatası oluştu.');
        }
    };

    // Delete Session Completely
    const handleDeleteSession = async (id: string) => {
        if (!window.confirm('Bu konuşmayı ve tüm geçmişini silmek istediğinize emin misiniz?')) return;
        try {
            const res = await apiClient.delete(`/api/admin/products/support/sessions/${id}`);
            if (res.ok) {
                toast.success('Konuşma geçmişi başarıyla silindi.');
                setSelectedSessionId(null);
                setMessages([]);
                fetchSessions();
            } else {
                toast.error('Konuşma silinemedi.');
            }
        } catch (err) {
            toast.error('Bir sistem hatası oluştu.');
        }
    };

    // Block/Unblock User
    const handleBlockToggle = async (email: string) => {
        const isBlocked = blockedList.includes(email);
        const actionText = isBlocked ? 'yasaklamasını kaldırmak' : 'engellemek';
        if (!window.confirm(`Bu kullanıcıyı ${actionText} istediğinize emin misiniz?`)) return;

        const endpoint = isBlocked ? '/api/admin/products/support/sessions/unblock' : '/api/admin/products/support/sessions/block';
        try {
            const res = await apiClient.post(endpoint, { email });
            if (res.ok) {
                toast.success(isBlocked ? 'Kullanıcı yasağı kaldırıldı.' : 'Kullanıcı engellendi. Destek talepleri sonlandırıldı.');
                fetchBlockedList();
                if (!isBlocked && selectedSessionId) {
                    const currentSess = sessions.find(s => s.id === selectedSessionId);
                    if (currentSess && currentSess.email === email) {
                        handleCloseSession(selectedSessionId);
                    }
                }
            } else {
                toast.error('İşlem başarısız oldu.');
            }
        } catch (err) {
            toast.error('Sistem hatası oluştu.');
        }
    };

    // Send Admin Reply
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedSessionId || isSending) return;

        const text = inputText;
        setInputText('');
        setIsSending(true);

        // Optimistically render
        const tempMsg: Message = { sender: 'admin', text, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, tempMsg]);

        try {
            const res = await apiClient.post(`/api/admin/products/support/sessions/${selectedSessionId}/messages`, {
                text,
                sender: 'admin'
            });

            if (res.ok) {
                fetchSessions();
            } else {
                toast.error('Mesaj gönderilemedi.');
            }
        } catch (err) {
            toast.error('Ağ hatası oluştu.');
        } finally {
            setIsSending(false);
        }
    };

    // Filtering
    const filteredSessions = sessions.filter(s => {
        const matchesSearch = s.userName.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const activeSession = sessions.find(s => s.id === selectedSessionId);
    const isUserBlocked = activeSession ? blockedList.includes(activeSession.email) : false;

    return (
        <div className="p-8 max-w-[1650px] mx-auto h-[calc(100vh-64px)] flex flex-col font-['Inter']">
            {/* Page Title Header */}
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight italic">CANLI DESTEK MERKEZİ</h1>
                    <p className="text-xs font-bold text-slate-400 mt-1 italic">Müşterilerden gelen canlı yardım taleplerini anında yanıtlayın ve yönetin.</p>
                </div>
            </div>

            {/* Chat Body Grid */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex min-h-[500px]">
                {/* Left Panel - Session Lists */}
                <div className="w-[380px] border-r border-slate-50 flex flex-col flex-shrink-0">
                    {/* Search & Filters */}
                    <div className="p-5 border-b border-slate-50 space-y-4">
                        <input
                            type="text"
                            placeholder="Müşteri adı veya e-posta..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-pink transition-all italic"
                        />
                        <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                            {(['active', 'closed', 'all'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setStatusFilter(tab)}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all italic ${statusFilter === tab ? 'bg-white text-brand-pink shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                                >
                                    {tab === 'active' ? 'AKTİF' : tab === 'closed' ? 'KAPALI' : 'TÜMÜ'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Session Scroll List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50/50">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : filteredSessions.length > 0 ? (
                            filteredSessions.map(session => {
                                const lastMsg = session.messages[session.messages.length - 1];
                                const isSelected = session.id === selectedSessionId;
                                const isBlocked = blockedList.includes(session.email);
                                return (
                                    <button
                                        key={session.id}
                                        onClick={() => handleSelectSession(session)}
                                        className={`w-full p-5 text-left transition-all hover:bg-slate-50/30 flex items-center gap-4 ${isSelected ? 'bg-slate-50/60 border-l-4 border-brand-pink' : ''}`}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-base italic flex-shrink-0 relative">
                                            {session.userName[0].toUpperCase()}
                                            {isBlocked && (
                                                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-bold border-2 border-white">
                                                    🚫
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black text-slate-800 truncate italic">{session.userName}</h4>
                                                <div className="flex items-center gap-2">
                                                    {session.unreadAdminCount && session.unreadAdminCount > 0 ? (
                                                        <span className="bg-rose-500 text-white font-black text-[9px] rounded-full h-5 px-1.5 flex items-center justify-center animate-bounce shadow-md">
                                                            {session.unreadAdminCount}
                                                        </span>
                                                    ) : null}
                                                    <span className="text-[9px] font-bold text-slate-400 italic">
                                                        {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 truncate italic mt-1 font-semibold">{lastMsg?.text || 'Yeni konuşma başlatıldı'}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${session.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                <span className="text-[8px] font-black text-slate-400 italic tracking-wider uppercase">
                                                    {session.status === 'active' ? 'Aktif Chat' : 'Çözüldü'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="py-20 text-center text-slate-300 font-bold text-[10px] italic">
                                HİÇ DESTEK TALEBİ BULUNAMADI
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Active Chat Console */}
                <div className="flex-grow flex flex-col bg-slate-50/20">
                    {activeSession ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 bg-white border-b border-slate-50 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-brand-pink/10 text-brand-pink flex items-center justify-center font-bold text-sm italic relative">
                                        {activeSession.userName[0].toUpperCase()}
                                        {isUserBlocked && (
                                            <span className="absolute -top-1 -right-1 text-xs">🚫</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xs font-black text-slate-800 italic">{activeSession.userName}</h3>
                                            {isUserBlocked && (
                                                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black tracking-wide rounded italic uppercase">YASAKLI</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 italic">{activeSession.email}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Sil/Temizle Butonu */}
                                    <button
                                        onClick={() => handleDeleteSession(activeSession.id)}
                                        title="Konuşmayı Tamamen Sil"
                                        className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-sm"
                                    >
                                        🗑️
                                    </button>
                                    
                                    {/* Yasakla/Engelle Butonu */}
                                    <button
                                        onClick={() => handleBlockToggle(activeSession.email)}
                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-wide italic active:scale-95 transition-all shadow-sm ${
                                            isUserBlocked 
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                        }`}
                                    >
                                        {isUserBlocked ? '🚫 YASAĞI KALDIR' : '🚫 KULLANICIYI YASAKLA'}
                                    </button>

                                    {activeSession.status === 'active' ? (
                                        <button
                                            onClick={() => handleCloseSession(activeSession.id)}
                                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold tracking-wide italic active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                                        >
                                            ✔️ TALEBİ KAPAT
                                        </button>
                                    ) : (
                                        <span className="px-4 py-2 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-xl italic">TALEB KAPALI</span>
                                    )}
                                </div>
                            </div>

                            {/* Messages Scroll Area */}
                            <div className="flex-grow p-6 overflow-y-auto space-y-4">
                                {messages.map((msg, idx) => {
                                    const isAdmin = msg.sender === 'admin';
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] px-4 py-3 rounded-2xl text-xs font-bold shadow-sm ${
                                                    isAdmin
                                                        ? 'bg-slate-950 text-white rounded-tr-none'
                                                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                                }`}
                                            >
                                                {msg.text}
                                            </div>
                                            <span className="text-[8px] font-semibold text-slate-400 italic mt-1 px-1">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input Form */}
                            {activeSession.status === 'active' && !isUserBlocked && (
                                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2 flex-shrink-0">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Müşteriye yanıt yazın..."
                                        className="flex-grow bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-pink focus:bg-white transition-all italic"
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 bg-brand-pink text-white rounded-xl text-[10px] font-bold tracking-wide shadow-lg shadow-brand-pink/20 hover:scale-105 active:scale-95 transition-all italic"
                                    >
                                        GÖNDER
                                    </button>
                                </form>
                            )}

                            {isUserBlocked && (
                                <div className="p-4 bg-rose-50 border-t border-rose-100 text-rose-700 text-center text-xs font-bold italic">
                                    Kullanıcı yasaklandığı için mesaj gönderilemez. Mesajlaşmayı başlatmak için yasağı kaldırınız.
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty State */
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 border border-slate-200 shadow-inner">
                                <span className="text-4xl">💬</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 italic">Destek Talebi Seçilmedi</h3>
                            <p className="text-xs font-semibold text-slate-400 mt-2 max-w-sm leading-relaxed italic">
                                Sol taraftaki listeden aktif bir müşteri oturumu seçerek görüşmeyi anlık sürdürebilirsiniz.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
