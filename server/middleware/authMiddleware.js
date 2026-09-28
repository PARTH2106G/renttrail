const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || (!header.startsWith('Bearer ') && !header.startsWith('Token '))) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};
