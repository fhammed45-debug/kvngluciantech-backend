const jwt = require('jsonwebtoken');
require('dotenv').config();


module.exports = function authenticateToken(req, res, next) {
const authHeader = req.headers['authorization'] || req.headers['Authorization'];
const token = authHeader && authHeader.split(' ')[1];
if (!token) return res.status(401).json({ message: 'Missing token' });


try {
const payload = jwt.verify(token, process.env.JWT_SECRET);
req.user = { id: payload.id, email: payload.email };
next();
} catch (err) {
return res.status(401).json({ message: 'Invalid or expired token' });
}
};