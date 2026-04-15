import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Generate token helper function
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name || `${user.firstName} ${user.lastName}`,
      isDriver: user.role === 'driver'
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register (for employee/supervisor - admin users)
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      phone,
      address,
      city,
      state,
      zipCode,
      isActive: true
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
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

// Login (supports both User and Driver)
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

    // First try to find in User collection (employee/supervisor)
    let user = await User.findOne({ email }).select('+password');
    let isDriver = false;
    let userData = null;

    if (user) {
      // Check password for User
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'User account is inactive'
        });
      }

      userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      };
    } else {
      // If not found in User, try Driver collection
      const driver = await Driver.findOne({ email }).select('+password');
      
      if (!driver) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check password for Driver
      const isPasswordValid = await bcrypt.compare(password, driver.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if driver is active
      if (driver.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Driver account is not active. Please contact administrator.'
        });
      }

      isDriver = true;
      userData = {
        id: driver._id,
        name: `${driver.firstName} ${driver.lastName}`,
        email: driver.email,
        role: 'driver',
        phone: driver.phone,
        profilePhoto: driver.profilePhoto?.url || null
      };
      user = driver;
    }

    // Generate token
    const token = generateToken({ ...userData, _id: userData.id });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userData,
      token,
      isDriver
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (decoded.isDriver) {
      user = await Driver.findById(decoded.id).select('-password');
      if (user) {
        user = {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: 'driver',
          phone: user.phone,
          profilePhoto: user.profilePhoto?.url
        };
      }
    } else {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Update user profile
router.put('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const updateData = { ...req.body, updatedAt: new Date() };
    
    // Don't allow role or email change
    delete updateData.role;
    delete updateData.email;
    delete updateData.password;

    let user;
    if (decoded.isDriver) {
      user = await Driver.findByIdAndUpdate(
        decoded.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
    } else {
      user = await User.findByIdAndUpdate(
        decoded.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
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