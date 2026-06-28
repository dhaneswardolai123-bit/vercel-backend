const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.register = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const cleanPhone = phoneNumber?.trim();
    
    console.log('Registering user:', cleanPhone);
    const existingUser = await User.findOne({ phoneNumber: cleanPhone });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ phoneNumber: cleanPhone, password });
    await user.save();
    
    console.log('User saved successfully');
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, phoneNumber: user.phoneNumber } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const cleanPhone = phoneNumber?.trim();
    
    console.log('Login attempt:', cleanPhone);
    const user = await User.findOne({ phoneNumber: cleanPhone });
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, phoneNumber: user.phoneNumber } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
};
