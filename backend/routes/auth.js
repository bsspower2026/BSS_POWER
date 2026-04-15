import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Helper from '../models/Helper.js';
import SiteSupervisor from '../models/SiteSupervisor.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Generate token helper function
const generateToken = (userData) => {
  return jwt.sign(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.name,
      isDriver: userData.role === 'driver',
      isHelper: userData.role === 'helper',
      isSiteSupervisor: userData.role === 'site_supervisor'
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register (for employee/supervisor admin users)
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['employee', 'supervisor']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role, phone, address, city, state, zipCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'employee',
      phone,
      address,
      city,
      state,
      zipCode,
      isActive: true
    });

    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    const token = generateToken(userData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
});

// Login - checks User, Driver, Helper, and SiteSupervisor collections
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // ── 1. Check User collection (employee / admin supervisor) ──
    let user = await User.findOne({ email }).select('+password');

    if (user) {
      console.log('User found in User collection, role:', user.role);

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'User account is inactive' });
      }

      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      };

      const token = generateToken(userData);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userData,
        token,
        isDriver: false,
        isHelper: false,
        isSiteSupervisor: false
      });
    }

    // ── 2. Check Driver collection ──
    const driver = await Driver.findOne({ email }).select('+password');

    if (driver) {
      console.log('Driver found:', driver.firstName, driver.lastName);

      const isPasswordValid = await driver.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (driver.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Driver account is not active. Please contact administrator.'
        });
      }

      const userData = {
        id: driver._id,
        name: `${driver.firstName} ${driver.lastName}`,
        email: driver.email,
        role: 'driver',
        phone: driver.phone,
        profilePhoto: driver.profilePhoto?.url || null
      };

      const token = generateToken(userData);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userData,
        token,
        isDriver: true,
        isHelper: false,
        isSiteSupervisor: false
      });
    }

    // ── 3. Check Helper collection ──
    const helper = await Helper.findOne({ email }).select('+password');

    if (helper) {
      console.log('Helper found:', helper.firstName, helper.lastName);

      const isPasswordValid = await helper.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (helper.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Helper account is not active. Please contact administrator.'
        });
      }

      const userData = {
        id: helper._id,
        name: `${helper.firstName} ${helper.lastName}`,
        email: helper.email,
        role: 'helper',
        phone: helper.phone,
        profilePhoto: helper.profilePhoto?.url || null
      };

      const token = generateToken(userData);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userData,
        token,
        isDriver: false,
        isHelper: true,
        isSiteSupervisor: false
      });
    }

    // ── 4. Check SiteSupervisor collection ──
    const siteSupervisor = await SiteSupervisor.findOne({ email }).select('+password');

    if (siteSupervisor) {
      console.log('Site Supervisor found:', siteSupervisor.firstName, siteSupervisor.lastName);

      const isPasswordValid = await siteSupervisor.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (siteSupervisor.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Site Supervisor account is not active. Please contact administrator.'
        });
      }

      const userData = {
        id: siteSupervisor._id,
        name: `${siteSupervisor.firstName} ${siteSupervisor.lastName}`,
        email: siteSupervisor.email,
        role: 'site_supervisor',
        phone: siteSupervisor.phone,
        profilePhoto: siteSupervisor.profilePhoto?.url || null
      };

      const token = generateToken(userData);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userData,
        token,
        isDriver: false,
        isHelper: false,
        isSiteSupervisor: true
      });
    }

    // ── Nothing matched ──
    console.log('No user/driver/helper/supervisor found with email:', email);
    return res.status(401).json({ success: false, message: 'Invalid email or password' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
});

// Get current user - handles all four entity types
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;

    if (decoded.isDriver) {
      const driver = await Driver.findById(decoded.id).select('-password');
      if (driver) {
        user = {
          id: driver._id,
          name: `${driver.firstName} ${driver.lastName}`,
          email: driver.email,
          role: 'driver',
          phone: driver.phone,
          profilePhoto: driver.profilePhoto?.url
        };
      }
    } else if (decoded.isHelper) {
      const helper = await Helper.findById(decoded.id).select('-password');
      if (helper) {
        user = {
          id: helper._id,
          name: `${helper.firstName} ${helper.lastName}`,
          email: helper.email,
          role: 'helper',
          phone: helper.phone,
          profilePhoto: helper.profilePhoto?.url
        };
      }
    } else if (decoded.isSiteSupervisor) {
      const supervisor = await SiteSupervisor.findById(decoded.id).select('-password');
      if (supervisor) {
        user = {
          id: supervisor._id,
          name: `${supervisor.firstName} ${supervisor.lastName}`,
          email: supervisor.email,
          role: 'site_supervisor',
          phone: supervisor.phone,
          profilePhoto: supervisor.profilePhoto?.url
        };
      }
    } else {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Update user profile - handles all four entity types
router.put('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const updateData = { ...req.body, updatedAt: new Date() };

    // Don't allow role or password change via this endpoint
    delete updateData.role;
    delete updateData.email;
    delete updateData.password;

    let user;

    if (decoded.isDriver) {
      user = await Driver.findByIdAndUpdate(decoded.id, updateData, {
        new: true, runValidators: true
      }).select('-password');
    } else if (decoded.isHelper) {
      user = await Helper.findByIdAndUpdate(decoded.id, updateData, {
        new: true, runValidators: true
      }).select('-password');
    } else if (decoded.isSiteSupervisor) {
      user = await SiteSupervisor.findByIdAndUpdate(decoded.id, updateData, {
        new: true, runValidators: true
      }).select('-password');
    } else {
      user = await User.findByIdAndUpdate(decoded.id, updateData, {
        new: true, runValidators: true
      }).select('-password');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

export default router;