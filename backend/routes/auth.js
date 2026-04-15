import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Helper from '../models/Helper.js';
import SiteSupervisor from '../models/SiteSupervisor.js';

const router = express.Router();

const generateToken = userData =>
  jwt.sign(
    { id: userData.id, email: userData.email, role: userData.role, name: userData.name,
      isDriver: userData.role === 'driver', isHelper: userData.role === 'helper',
      isSiteSupervisor: userData.role === 'site_supervisor' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['employee', 'supervisor']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

  try {
    const { name, email, password, role, phone, address, city, state, zipCode } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'User already exists' });

    const user = new User({ name, email, password, role: role||'employee', phone, address, city, state, zipCode, isActive: true });
    await user.save();
    const userData = { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone };
    res.status(201).json({ success: true, message: 'User registered', user: userData, token: generateToken(userData) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    // ── 1. User collection (employee / supervisor / admin) ──
    const user = await User.findOne({ email }).select('+password');
    if (user) {
      const ok = await user.comparePassword(password);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid email or password' });
      if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is inactive' });
      const userData = { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone };
      return res.status(200).json({ success: true, message: 'Login successful', user: userData, token: generateToken(userData), isDriver: false, isHelper: false, isSiteSupervisor: false });
    }

    // ── 2. Driver ──
    const driver = await Driver.findOne({ email }).select('+password');
    if (driver) {
      if (!(await driver.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid email or password' });
      if (driver.status !== 'Active') return res.status(403).json({ success: false, message: 'Driver account is not active' });
      const userData = { id: driver._id, name: `${driver.firstName} ${driver.lastName}`, email: driver.email, role: 'driver', phone: driver.phone, profilePhoto: driver.profilePhoto?.url||null };
      return res.status(200).json({ success: true, message: 'Login successful', user: userData, token: generateToken(userData), isDriver: true, isHelper: false, isSiteSupervisor: false });
    }

    // ── 3. Helper ──
    const helper = await Helper.findOne({ email }).select('+password');
    if (helper) {
      if (!(await helper.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid email or password' });
      if (helper.status !== 'Active') return res.status(403).json({ success: false, message: 'Helper account is not active' });
      const userData = { id: helper._id, name: `${helper.firstName} ${helper.lastName}`, email: helper.email, role: 'helper', phone: helper.phone, profilePhoto: helper.profilePhoto?.url||null };
      return res.status(200).json({ success: true, message: 'Login successful', user: userData, token: generateToken(userData), isDriver: false, isHelper: true, isSiteSupervisor: false });
    }

    // ── 4. SiteSupervisor ──
    const supervisor = await SiteSupervisor.findOne({ email }).select('+password');
    if (supervisor) {
      if (!(await supervisor.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid email or password' });
      if (supervisor.status !== 'Active') return res.status(403).json({ success: false, message: 'Supervisor account is not active' });
      const userData = { id: supervisor._id, name: `${supervisor.firstName} ${supervisor.lastName}`, email: supervisor.email, role: 'site_supervisor', phone: supervisor.phone, profilePhoto: supervisor.profilePhoto?.url||null };
      return res.status(200).json({ success: true, message: 'Login successful', user: userData, token: generateToken(userData), isDriver: false, isHelper: false, isSiteSupervisor: true });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user;
    if (decoded.isDriver) {
      const d = await Driver.findById(decoded.id).select('-password');
      if (d) user = { id: d._id, name: `${d.firstName} ${d.lastName}`, email: d.email, role: 'driver', phone: d.phone, profilePhoto: d.profilePhoto?.url };
    } else if (decoded.isHelper) {
      const h = await Helper.findById(decoded.id).select('-password');
      if (h) user = { id: h._id, name: `${h.firstName} ${h.lastName}`, email: h.email, role: 'helper', phone: h.phone, profilePhoto: h.profilePhoto?.url };
    } else if (decoded.isSiteSupervisor) {
      const s = await SiteSupervisor.findById(decoded.id).select('-password');
      if (s) user = { id: s._id, name: `${s.firstName} ${s.lastName}`, email: s.email, role: 'site_supervisor', phone: s.phone, profilePhoto: s.profilePhoto?.url };
    } else {
      user = await User.findById(decoded.id).select('-password');
    }
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// ── PUT /api/auth/me ──────────────────────────────────────────────────────────
router.put('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const upd = { ...req.body, updatedAt: new Date() };
    delete upd.role; delete upd.email; delete upd.password;
    let user;
    if (decoded.isDriver)          user = await Driver.findByIdAndUpdate(decoded.id, upd, {new:true,runValidators:true}).select('-password');
    else if (decoded.isHelper)     user = await Helper.findByIdAndUpdate(decoded.id, upd, {new:true,runValidators:true}).select('-password');
    else if (decoded.isSiteSupervisor) user = await SiteSupervisor.findByIdAndUpdate(decoded.id, upd, {new:true,runValidators:true}).select('-password');
    else                           user = await User.findByIdAndUpdate(decoded.id, upd, {new:true,runValidators:true}).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'Updated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed', error: err.message });
  }
});

export default router;