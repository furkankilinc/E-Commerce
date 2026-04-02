const jwt = require('jsonwebtoken');

const authenticate = (role, optional = false) => (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] 
                   || req.cookies?.admin_accessToken 
                   || req.cookies?.user_accessToken;

        if (!token) {
            if (optional) return next();
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'auth_secret_key');
        
        if (role && decoded.audience !== role) {
            return res.status(403).json({ success: false, message: 'Bu alan için yetkiniz yok.' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        if (optional) return next();
        return res.status(401).json({ success: false, message: 'Geçersiz token.' });
    }
};

module.exports = { authenticate };
