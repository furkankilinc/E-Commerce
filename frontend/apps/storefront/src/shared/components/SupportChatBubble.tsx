import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../features/auth/useAuth';

interface Message {
    sender: 'user' | 'admin';
    text: string;
    createdAt: string;
}

const SupportChatBubble: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    // Dynamically generate the storage key based on authentication state
    const getStorageKey = React.useCallback(() => {
        if (isAuthenticated && user?.id) {
            return `support_session_id_${user.id}`;
        }
        return 'support_session_id_guest';
    }, [isAuthenticated, user?.id]);

    const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem(getStorageKey()));
    const [email, setEmail] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // When authentication state changes, load the corresponding isolated session
    useEffect(() => {
        const key = getStorageKey();
        const storedId = localStorage.getItem(key);
        setSessionId(storedId);

        // Reset chat state for the new session context
        setMessages([]);
        setIsBlocked(false);
        setUnreadCount(0);
    }, [getStorageKey]);

    // Scroll to bottom on new messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load active session messages or poll for new replies
    useEffect(() => {
        if (!sessionId) return;

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/products/support/sessions/${sessionId}/messages`);
                if (res.status === 403) {
                    setIsBlocked(true);
                    return;
                }
                if (res.status === 404) {
                    // Session was deleted on admin panel! Reset instantly!
                    localStorage.removeItem(getStorageKey());
                    setSessionId(null);
                    setMessages([]);
                    setIsBlocked(false);
                    setUnreadCount(0);
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setMessages(data.messages);
                        setIsBlocked(false);

                        // Set unread count when bubble is closed
                        if (!isOpen) {
                            setUnreadCount(data.session?.unreadUserCount || 0);
                        } else {
                            // If open and has unread user messages, mark as read on backend
                            if (data.session?.unreadUserCount && data.session.unreadUserCount > 0) {
                                fetch(`/api/products/support/sessions/${sessionId}/read-user`, { method: 'PUT' })
                                    .catch(() => { });
                                setUnreadCount(0);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Destek mesajları alınamadı:', err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Live poll every 3 seconds for instant replies!

        return () => clearInterval(interval);
    }, [sessionId, isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Handle session startup
    const handleStartSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsConnecting(true);

        const name = isAuthenticated && user ? user.name : 'Misafir';
        const mail = isAuthenticated && user ? user.email : email || 'misafir@example.com';

        try {
            const res = await fetch('/api/products/support/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName: name, email: mail })
            });

            if (res.status === 403) {
                setIsBlocked(true);
                return;
            }

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setSessionId(data.session.id);
                    setMessages(data.session.messages);
                    localStorage.setItem(getStorageKey(), data.session.id);
                    setIsBlocked(false);
                }
            }
        } catch (err) {
            console.error('Destek oturumu başlatılamadı:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    // Auto-start for logged in users when they open chat first time
    const handleBubbleClick = () => {
        setIsOpen(!isOpen);
        if (isOpen) return; // Closing

        // Opening - clear unread badge
        setUnreadCount(0);
        if (sessionId) {
            fetch(`/api/products/support/sessions/${sessionId}/read-user`, { method: 'PUT' })
                .catch(() => { });
        }

        if (!sessionId && isAuthenticated && user) {
            // Trigger automatic connection
            setIsConnecting(true);
            fetch('/api/products/support/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName: user.name, email: user.email })
            })
                .then(res => {
                    if (res.status === 403) {
                        setIsBlocked(true);
                        throw new Error('Blocked');
                    }
                    return res.json();
                })
                .then(data => {
                    if (data.success) {
                        setSessionId(data.session.id);
                        setMessages(data.session.messages);
                        localStorage.setItem(getStorageKey(), data.session.id);
                        setIsBlocked(false);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setIsConnecting(false));
        }
    };

    // Send Message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !sessionId || isBlocked) return;

        const text = inputText;
        setInputText('');

        // Optimistically render
        const tempMsg: Message = { sender: 'user', text, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, tempMsg]);

        try {
            const res = await fetch(`/api/products/support/sessions/${sessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, sender: 'user' })
            });

            if (res.status === 403) {
                setIsBlocked(true);
                // Remove optimistic message if blocked
                setMessages(prev => prev.filter(m => m !== tempMsg));
                return;
            }

            if (!res.ok) {
                console.error('Mesaj gönderilirken sunucu hatası oluştu.');
            }
        } catch (err) {
            console.error('Mesaj gönderilemedi:', err);
        }
    };

    const handleNewChat = () => {
        localStorage.removeItem(getStorageKey());
        setSessionId(null);
        setMessages([]);
        setIsBlocked(false);
        setUnreadCount(0);
    };

    return (
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9999] font-['Inter']">
            {/* Expanded Chat Box */}
            {isOpen && (
                <div className="fixed bottom-24 right-4 left-4 sm:absolute sm:bottom-20 sm:right-0 sm:left-auto sm:w-[360px] h-[500px] max-h-[calc(100vh-130px)] bg-white rounded-3xl border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
                    {/* Header */}
                    <div className="bg-brand-pink p-6 text-white flex items-center justify-between shadow-md relative">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">👩‍💼</span>
                            <div>
                                <h4 className="text-xs font-black   leading-none mb-1">FUIRA CANLI DESTEK</h4>
                                <span className="text-[9px] font-bold text-rose-100  flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                                    {isBlocked ? 'Erişim Askıya Alındı' : 'Müşteri Temsilcisi Çevrimiçi'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {sessionId && !isBlocked && (
                                <button
                                    onClick={handleNewChat}
                                    title="Yeni Destek Oturumu Başlat"
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-all text-xs font-bold"
                                >
                                    🔄
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-all"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 flex flex-col space-y-4">
                        {isBlocked ? (
                            /* Blocked User Warning */
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                                <span className="text-5xl mb-4 animate-bounce">🚫</span>
                                <h4 className="text-xs font-black text-rose-600   uppercase mb-2">Destek Erişiminiz Engellendi</h4>
                                <p className="text-[10px] font-bold text-slate-400 max-w-[220px] leading-relaxed ">
                                    Destek sistemini kötüye kullandığınız tespit edildiği için canlı yardım erişiminiz askıya alınmıştır.
                                </p>
                            </div>
                        ) : !sessionId ? (
                            /* Entry Form */
                            <form onSubmit={handleStartSession} className="flex flex-col justify-center h-full px-2 py-4 gap-5">
                                {/* Icon + Welcome text */}
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-pink/10 flex items-center justify-center">
                                        <span className="text-3xl">💬</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-800   mb-1">Canlı Destek'e Hoş Geldiniz</h4>
                                        <p className="text-[10px] font-semibold text-slate-400  leading-relaxed max-w-[220px] mx-auto">
                                            Destek temsilcimiz sizinle gerçek zamanlı ilgilenecek.
                                        </p>
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] font-black text-slate-400  ml-1 st uppercase">E-Posta Adresiniz *</label>
                                        <div className="relative">
                                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="ornek@email.com"
                                                className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/10 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isConnecting}
                                    className="w-full py-3.5 bg-brand-pink text-white rounded-xl text-[10px] font-black st uppercase shadow-lg shadow-brand-pink/25 flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all  disabled:opacity-60"
                                >
                                    {isConnecting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Desteği Başlat
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            /* Messages List */
                            <>
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs font-bold shadow-sm ${msg.sender === 'user'
                                                ? 'bg-brand-pink text-white rounded-tr-none'
                                                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                        <span className="text-[8px] font-semibold text-slate-400  mt-1 px-1">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Footer Form */}
                    {sessionId && !isBlocked && (
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Mesajınızı buraya yazın..."
                                className="flex-grow bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-pink focus:bg-white transition-all "
                            />
                            <button
                                type="submit"
                                className="w-10 h-10 bg-brand-pink text-white rounded-xl flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                            >
                                ✈️
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* Support Bubble Button */}
            <button
                onClick={handleBubbleClick}
                className="w-14 h-14 bg-brand-pink text-white rounded-full flex items-center justify-center shadow-xl shadow-brand-pink/35 cursor-pointer relative hover:scale-105 active:scale-95 transition-all group"
            >
                {/* Ping/Ripple Ring */}
                <span className="absolute -inset-1 rounded-full border-2 border-brand-pink/30 animate-pulse pointer-events-none"></span>
                <span className="text-2xl transition-transform group-hover:rotate-12 duration-200">💬</span>

                {/* Unread Message Notification Badge */}
                {unreadCount > 0 && !isOpen && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9px] rounded-full w-5 h-5 flex items-center justify-center animate-bounce shadow-md border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default SupportChatBubble;
