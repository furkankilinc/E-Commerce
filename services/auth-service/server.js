require('./src/utils/logger');
const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser());

// Auth Routes
const userAuthRoutes = require('./src/api/auth/user.auth.routes');
const adminRoutes = require('./src/api/admin/admin.routes');
app.use('/api/auth', userAuthRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Auth Service', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[GLOBAL_ERROR]', err.message, err.stack);
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
    }
    res.status(500).json({ success: false, message: 'Sunucu hatası: ' + err.message });
});

app.listen(PORT, () => {
    console.log(`✅ Auth Service is running on port ${PORT}`);
});
