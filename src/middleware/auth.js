const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requirePermission = (perm) => (req, res, next) => {
  if (!req.user.permissions?.includes(perm) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied' });
  }
  next();
};

module.exports = { authenticate, requirePermission };
