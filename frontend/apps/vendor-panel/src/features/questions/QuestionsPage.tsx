import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Question {
    id: string;
    productId: string;
    merchantId: string;
    userName: string;
    productName: string;
    questionText: string;
    answerText: string | null;
    createdAt: string;
    answeredAt: string | null;
}

const QuestionsPage: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'unanswered' | 'answered'>('unanswered');
    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch merchant questions
    const fetchQuestions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/merchant/products/questions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setQuestions(data.data);
                }
            }
        } catch (err) {
            console.error('Müşteri soruları alınamadı:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    // Handle Answering a Question
    const handleAnswerSubmit = async (e: React.FormEvent, questionId: string) => {
        e.preventDefault();
        if (!answerText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/merchant/products/questions/${questionId}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answerText })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    toast.success('Cevabınız müşteriye başarıyla iletildi!');
                    setAnsweringId(null);
                    setAnswerText('');
                    fetchQuestions();
                }
            } else {
                toast.error('Cevap gönderilemedi.');
            }
        } catch (err) {
            toast.error('Bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter Logic
    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.productName.toLowerCase().includes(searchQuery.toLowerCase()) || q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all'
            ? true
            : filterStatus === 'answered'
                ? q.answerText !== null
                : q.answerText === null;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="max-w-[1650px] mx-auto font-sans">
            {/* Top Dashboard Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black text-slate-800  ">MÜŞTERİ SORULARI</h1>
                    <p className="text-xs font-bold text-slate-400 mt-1 ">Ürünleriniz hakkında müşterilerin sorduğu soruları anında cevaplayın.</p>
                </div>
            </div>

            {/* Main Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-4 sm:p-6 lg:p-8">
                {/* Search & Tabs */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-50">
                    <input
                        type="text"
                        placeholder="Ürün adı veya soru içeriğinde ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-96 h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-pink transition-all  animate-in fade-in duration-500"
                    />

                    {/* Filter Tabs */}
                    <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto whitespace-nowrap scrollbar-none">
                        {(['unanswered', 'answered', 'all'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilterStatus(tab)}
                                className={`px-4 sm:px-6 py-2.5 text-[10px] font-black rounded-xl transition-all cursor-pointer  ${filterStatus === tab ? 'bg-white text-brand-pink shadow-md' : 'text-slate-400 hover:text-slate-700'}`}
                            >
                                {tab === 'unanswered' ? 'CEVAP BEKLEYENLER' : tab === 'answered' ? 'CEVAPLANANLAR' : 'TÜMÜ'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Questions Lists */}
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredQuestions.length > 0 ? (
                        filteredQuestions.map(q => (
                            <div
                                key={q.id}
                                className="border border-slate-100 rounded-3xl p-4 sm:p-6 hover:shadow-lg hover:shadow-slate-100/50 transition-all space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500 bg-slate-50/10"
                            >
                                {/* Card Header */}
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-pink/5 text-brand-pink flex items-center justify-center font-bold text-base  flex-shrink-0 shadow-sm border border-brand-pink/10">
                                            {q.userName ? q.userName[0].toUpperCase() : 'Z'}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                <h4 className="text-xs font-black text-slate-800  leading-none">{q.userName}</h4>
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-full ">{q.productName}</span>
                                            </div>
                                            <span className="text-[9px] font-semibold text-slate-400  block mt-1">Soru Tarihi: {new Date(q.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Status Indicator */}
                                    <div>
                                        {q.answerText ? (
                                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full  flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                Cevaplandı
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded-full  flex items-center gap-1.5 animate-pulse">
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                                Cevap Bekliyor
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Question & Answer Body */}
                                <div className="space-y-4">
                                    <div className="bg-slate-100/40 p-4 sm:p-5 rounded-2xl border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400  block mb-1">MÜŞTERI SORUSU:</span>
                                        <p className="text-xs font-bold text-slate-700 ">{q.questionText}</p>
                                    </div>

                                    {q.answerText ? (
                                        <div className="bg-emerald-50/10 p-4 sm:p-5 rounded-2xl border border-emerald-50/30 ml-4 sm:ml-8">
                                            <span className="text-[9px] font-black text-emerald-600  block mb-1">MAĞAZA CEVABINIZ:</span>
                                            <p className="text-xs font-bold text-slate-800 ">{q.answerText}</p>
                                            <span className="text-[8px] font-semibold text-slate-400  mt-2 block">Cevap Tarihi: {new Date(q.answeredAt || q.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ) : answeringId === q.id ? (
                                        <form onSubmit={(e) => handleAnswerSubmit(e, q.id)} className="ml-4 sm:ml-8 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                            <textarea
                                                required
                                                rows={3}
                                                value={answerText}
                                                onChange={(e) => setAnswerText(e.target.value)}
                                                placeholder="Müşterinizin sorusuna detaylı, profesyonel bir cevap yazın..."
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-pink focus:bg-white transition-all resize-none "
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAnsweringId(null);
                                                        setAnswerText('');
                                                    }}
                                                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-bold  transition-all  active:scale-95"
                                                >
                                                    VAZGEÇ
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="px-6 py-3 bg-brand-pink text-white rounded-xl text-[10px] font-bold  shadow-md shadow-brand-pink/20 hover:scale-105 active:scale-95 transition-all "
                                                >
                                                    {isSubmitting ? 'GÖNDERİLİYOR...' : 'CEVABI GÖNDER'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="ml-4 sm:ml-8">
                                            <button
                                                onClick={() => {
                                                    setAnsweringId(q.id);
                                                    setAnswerText('');
                                                }}
                                                className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold  hover:bg-brand-pink active:scale-95 shadow-md hover:shadow-brand-pink/25 transition-all "
                                            >
                                                ✍️ SORUYU CEVAPLA
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-24 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-black text-xs ">MAĞAZANIZA AİT HİÇBİR SORU BULUNAMADI</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionsPage;
