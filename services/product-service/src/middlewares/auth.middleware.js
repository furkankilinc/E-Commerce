const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] 
                   || req.cookies?.admin_accessToken 
                   || req.cookies?.user_accessToken 
                   || req.cookies?.merchant_accessToken;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'auth_secret_key');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Geçersiz veya süresi dolmuş token.' });
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Önce giriş yapmalısınız.' });
    }

    if (roles.length > 0 && !roles.includes(req.user.audience)) {
        return res.status(403).json({ success: false, message: 'Bu alan için yetkiniz yok.' });
    }

    next();
};

module.exports = { authMiddleware, authorize, authenticate: (role) => [authMiddleware, authorize(role)] };
