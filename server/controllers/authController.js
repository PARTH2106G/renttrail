const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (role && role !== 'landlord') {
      return res.status(403).json({ message: 'Privileged role assignment is not allowed' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, phone, password, role: 'landlord' });
    res
      .status(201)
      .json({ token: signToken(user), user: { id: user._id, name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};
