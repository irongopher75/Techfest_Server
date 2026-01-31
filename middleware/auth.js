const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    let token = req.header('x-auth-token');

    // If no header, check cookies (for httpOnly flow)
    if (!token && req.cookies) {
        token = req.cookies.token; // We might want to set 'token' in cookie too for seamless transition
    }

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
