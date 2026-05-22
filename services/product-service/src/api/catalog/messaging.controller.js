const fs = require('fs');
const path = require('path');

const sessionsJsonPath = path.join(__dirname, 'support-sessions.json');
const questionsJsonPath = path.join(__dirname, 'product-questions.json');
const blockedJsonPath = path.join(__dirname, 'blocked-users.json');

const getSessions = () => {
    if (!fs.existsSync(sessionsJsonPath)) {
        // Seed default support sessions
        const defaults = [
            {
                id: 'sess-1',
                userName: 'Furkan Kılınç',
                email: 'furkan@example.com',
                status: 'active',
                unreadAdminCount: 0,
                unreadUserCount: 0,
                createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                messages: [
                    { sender: 'user', text: 'Merhaba, siparişimi iptal etmek istiyorum.', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
                    { sender: 'admin', text: 'Tabii, yardımcı olayım. Sipariş numaranızı iletebilir misiniz?', createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString() },
                    { sender: 'user', text: 'Sipariş No: OR-5832', createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() }
                ]
            },
            {
                id: 'sess-2',
                userName: 'Gamze Demir',
                email: 'gamze@example.com',
                status: 'active',
                unreadAdminCount: 1,
                unreadUserCount: 0,
                createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                messages: [
                    { sender: 'user', text: 'Kargo ne zaman ulaşır?', createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() }
                ]
            }
        ];
        fs.writeFileSync(sessionsJsonPath, JSON.stringify(defaults, null, 2));
        return defaults;
    }
    try { return JSON.parse(fs.readFileSync(sessionsJsonPath, 'utf8')); } catch (e) { return []; }
};

const saveSessions = (data) => {
    fs.writeFileSync(sessionsJsonPath, JSON.stringify(data, null, 2));
};

const getBlockedUsers = () => {
    if (!fs.existsSync(blockedJsonPath)) {
        fs.writeFileSync(blockedJsonPath, JSON.stringify([], null, 2));
        return [];
    }
    try { return JSON.parse(fs.readFileSync(blockedJsonPath, 'utf8')); } catch (e) { return []; }
};

const saveBlockedUsers = (data) => {
    fs.writeFileSync(blockedJsonPath, JSON.stringify(data, null, 2));
};

const getQuestions = () => {
    if (!fs.existsSync(questionsJsonPath)) {
        // Seed default product questions
        const defaults = [
            {
                id: 'q-1',
                productId: 'prod-1',
                merchantId: 'merch-1',
                userName: 'Alperen Şen',
                productName: 'iPhone 15 Pro Max',
                questionText: 'Bu ürünün Türkiye garantisi var mı, kutu açılmamış mı geliyor?',
                answerText: 'Merhaba Alperen Bey, evet ürünümüz 2 yıl Apple Türkiye garantilidir ve orijinal koruma bandı açılmamış kutusunda sevk edilir.',
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                answeredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'q-2',
                productId: 'prod-1',
                merchantId: 'merch-1',
                userName: 'Buse Kaya',
                productName: 'iPhone 15 Pro Max',
                questionText: 'Yanında şarj adaptörü gönderiyor musunuz?',
                answerText: null,
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                answeredAt: null
            }
        ];
        fs.writeFileSync(questionsJsonPath, JSON.stringify(defaults, null, 2));
        return defaults;
    }
    try { return JSON.parse(fs.readFileSync(questionsJsonPath, 'utf8')); } catch (e) { return []; }
};

const saveQuestions = (data) => {
    fs.writeFileSync(questionsJsonPath, JSON.stringify(data, null, 2));
};

// --- SUPPORT CHAT ---

const startSupportSession = async (req, res) => {
    try {
        const { userName, email } = req.body;
        const blockedUsers = getBlockedUsers();
        if (blockedUsers.includes(email)) {
            return res.status(403).json({ success: false, blocked: true, message: 'Destek erişiminiz yasaklanmıştır.' });
        }

        const sessions = getSessions();
        const newSession = {
            id: 'sess-' + Date.now(),
            userName: userName || 'Ziyaretçi',
            email: email || 'visitor@example.com',
            status: 'active',
            unreadAdminCount: 0,
            unreadUserCount: 0,
            createdAt: new Date().toISOString(),
            messages: [
                { sender: 'admin', text: `Merhaba ${userName || 'Ziyaretçi'}, size nasıl yardımcı olabilirim?`, createdAt: new Date().toISOString() }
            ]
        };
        sessions.push(newSession);
        saveSessions(sessions);
        return res.status(201).json({ success: true, session: newSession });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Destek oturumu başlatılamadı.' });
    }
};

const sendSupportMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, sender } = req.body; // sender: 'user' or 'admin'
        if (!text) return res.status(400).json({ success: false, message: 'Mesaj boş olamaz.' });

        const sessions = getSessions();
        const index = sessions.findIndex(s => s.id === id);
        if (index === -1) return res.status(404).json({ success: false, message: 'Destek oturumu bulunamadı.' });

        // Yasaklama kontrolü
        const blockedUsers = getBlockedUsers();
        if (blockedUsers.includes(sessions[index].email)) {
            return res.status(403).json({ success: false, blocked: true, message: 'Destek erişiminiz yasaklanmıştır.' });
        }

        const newMessage = {
            sender: sender || 'user',
            text,
            createdAt: new Date().toISOString()
        };

        sessions[index].messages.push(newMessage);
        
        // Update unread count
        if (sender === 'admin') {
            sessions[index].unreadUserCount = (sessions[index].unreadUserCount || 0) + 1;
        } else {
            sessions[index].unreadAdminCount = (sessions[index].unreadAdminCount || 0) + 1;
        }

        saveSessions(sessions);

        return res.status(201).json({ success: true, message: newMessage });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Mesaj gönderilemedi.' });
    }
};

const getSupportMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const sessions = getSessions();
        const session = sessions.find(s => s.id === id);
        if (!session) return res.status(404).json({ success: false, message: 'Destek oturumu bulunamadı.' });
        return res.json({ success: true, messages: session.messages, session });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Mesajlar alınamadı.' });
    }
};

const getAllSupportSessions = async (req, res) => {
    try {
        const sessions = getSessions();
        return res.json({ success: true, sessions });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Destek oturumları alınamadı.' });
    }
};

const closeSupportSession = async (req, res) => {
    try {
        const { id } = req.params;
        const sessions = getSessions();
        const index = sessions.findIndex(s => s.id === id);
        if (index === -1) return res.status(404).json({ success: false, message: 'Destek oturumu bulunamadı.' });

        sessions[index].status = 'closed';
        saveSessions(sessions);
        return res.json({ success: true, message: 'Destek oturumu kapatıldı.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Destek oturumu kapatılamadı.' });
    }
};

const markReadByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const sessions = getSessions();
        const index = sessions.findIndex(s => s.id === id);
        if (index === -1) return res.status(404).json({ success: false, message: 'Oturum bulunamadı.' });

        sessions[index].unreadAdminCount = 0;
        saveSessions(sessions);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
};

const markReadByUser = async (req, res) => {
    try {
        const { id } = req.params;
        const sessions = getSessions();
        const index = sessions.findIndex(s => s.id === id);
        if (index === -1) return res.status(404).json({ success: false, message: 'Oturum bulunamadı.' });

        sessions[index].unreadUserCount = 0;
        saveSessions(sessions);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
};

const blockUser = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'E-posta zorunludur.' });
        const blocked = getBlockedUsers();
        if (!blocked.includes(email)) {
            blocked.push(email);
            saveBlockedUsers(blocked);
        }
        return res.json({ success: true, message: 'Kullanıcı başarıyla yasaklandı.' });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
};

const unblockUser = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'E-posta zorunludur.' });
        let blocked = getBlockedUsers();
        blocked = blocked.filter(e => e !== email);
        saveBlockedUsers(blocked);
        return res.json({ success: true, message: 'Kullanıcı yasağı kaldırıldı.' });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
};

const getBlockedUsersList = async (req, res) => {
    try {
        const blocked = getBlockedUsers();
        return res.json({ success: true, blocked });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
};

const deleteSupportSession = async (req, res) => {
    try {
        const { id } = req.params;
        let sessions = getSessions();
        sessions = sessions.filter(s => s.id !== id);
        saveSessions(sessions);
        return res.json({ success: true, message: 'Konuşma geçmişi temizlendi.' });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
};

// --- PRODUCT Q&A ---

const askProductQuestion = async (req, res) => {
    try {
        const { productId } = req.params;
        const { questionText, userName, merchantId, productName } = req.body;
        if (!questionText) return res.status(400).json({ success: false, message: 'Soru boş olamaz.' });

        const questions = getQuestions();
        const newQuestion = {
            id: 'q-' + Date.now(),
            productId,
            merchantId: merchantId || 'default',
            userName: userName || 'Ziyaretçi',
            productName: productName || 'Ürün',
            questionText,
            answerText: null,
            createdAt: new Date().toISOString(),
            answeredAt: null
        };

        questions.push(newQuestion);
        saveQuestions(questions);

        return res.status(201).json({ success: true, data: newQuestion });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Soru gönderilemedi.' });
    }
};

const getProductQuestions = async (req, res) => {
    try {
        const { productId } = req.params;
        const questions = getQuestions();
        const filtered = questions.filter(q => q.productId === productId);
        return res.json({ success: true, data: filtered });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Sorular alınamadı.' });
    }
};

const getMerchantQuestions = async (req, res) => {
    try {
        const merchantId = req.user?.sub || req.user?.id || req.query.merchantId || 'default';
        const questions = getQuestions();
        const filtered = questions.filter(q => q.merchantId === merchantId || merchantId === 'default' || q.merchantId === 'default');
        return res.json({ success: true, data: filtered });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Sorular alınamadı.' });
    }
};

const answerProductQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { answerText } = req.body;
        if (!answerText) return res.status(400).json({ success: false, message: 'Cevap alanı zorunludur.' });

        const questions = getQuestions();
        const index = questions.findIndex(q => q.id === id);
        if (index === -1) return res.status(404).json({ success: false, message: 'Soru bulunamadı.' });

        questions[index].answerText = answerText;
        questions[index].answeredAt = new Date().toISOString();
        saveQuestions(questions);

        return res.json({ success: true, data: questions[index] });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Cevap kaydedilemedi.' });
    }
};

module.exports = {
    startSupportSession,
    sendSupportMessage,
    getSupportMessages,
    getAllSupportSessions,
    closeSupportSession,
    markReadByAdmin,
    markReadByUser,
    blockUser,
    unblockUser,
    getBlockedUsersList,
    deleteSupportSession,
    askProductQuestion,
    getProductQuestions,
    getMerchantQuestions,
    answerProductQuestion
};
