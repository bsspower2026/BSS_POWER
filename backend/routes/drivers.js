import express from 'express';
import mongoose from 'mongoose';
import Driver from '../models/Driver.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Generate temporary password
const generateTemporaryPassword = (firstName, lastName) => {
  const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit random number
  const companyName = 'BSS-Power';
  const namePart = (firstName + lastName).slice(0, 5).toLowerCase();
  return `${namePart}@${companyName}${randomNum}`;
};

// Create driver - Let the schema hash the password via pre-save hook
router.post('/', async (req, res) => {
  try {
    const driverData = req.body;
    
    // Generate temporary password
    const tempPassword = generateTemporaryPassword(driverData.firstName, driverData.lastName);
    
    console.log('Creating driver with email:', driverData.email);
    console.log('Generated temp password:', tempPassword);
    
    // Create new driver - DO NOT HASH HERE, let the schema's pre-save hook handle it
    const newDriver = new Driver({
      firstName: driverData.firstName,
      lastName: driverData.lastName,
      dateOfBirth: driverData.dateOfBirth,
      gender: driverData.gender,
      email: driverData.email,
      phone: driverData.phone,
      address: driverData.address,
      city: driverData.city,
      state: driverData.state,
      zipCode: driverData.zipCode,
      
      licenseNumber: driverData.licenseNumber,
      licenseCategory: driverData.licenseType ? [driverData.licenseType] : [],
      licenseIssueDate: driverData.licenseIssueDate,
      licenseExpiryDate: driverData.licenseExpiryDate,
      licenseIssueAuthority: driverData.licenseIssueState,
      
      joiningDate: driverData.employmentStartDate,
      department: driverData.department,
      experience: driverData.yearsOfExperience,
      status: driverData.employmentStatus === 'active' ? 'Active' : 
              driverData.employmentStatus === 'inactive' ? 'Inactive' : 'On Leave',
      
      emergencyContactName: driverData.emergencyContactName,
      emergencyContactPhone: driverData.emergencyContactPhone,
      
      // Password - will be hashed by pre-save hook
      password: tempPassword,
      
      profilePhoto: driverData.profilePhoto,
      documents: driverData.documents || [],
      notes: driverData.notes
    });

    await newDriver.save();
    
    console.log('Driver created successfully with ID:', newDriver._id);
    
    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: {
        driver: {
          _id: newDriver._id,
          firstName: newDriver.firstName,
          lastName: newDriver.lastName,
          email: newDriver.email
        },
        tempPassword: tempPassword
      }
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create driver',
      error: error.message
    });
  }
});

// Get all drivers
router.get('/', async (req, res) => {
  try {
    const drivers = await Driver.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    const formattedDrivers = drivers.map(driver => ({
      _id: driver._id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      status: driver.status,
      profilePhoto: driver.profilePhoto,
      documents: driver.documents
    }));
    
    res.status(200).json({
      success: true,
      data: formattedDrivers
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers',
      error: error.message
    });
  }
});

// Get driver by ID
router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).select('-password');
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Map backend fields to frontend format
    const formattedDriver = {
      _id: driver._id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      dateOfBirth: driver.dateOfBirth ? driver.dateOfBirth.toISOString().split('T')[0] : '',
      gender: driver.gender,
      email: driver.email,
      phone: driver.phone,
      address: driver.address,
      city: driver.city,
      state: driver.state,
      zipCode: driver.zipCode,
      
      licenseNumber: driver.licenseNumber,
      licenseType: driver.licenseCategory && driver.licenseCategory.length > 0 ? driver.licenseCategory[0] : '',
      licenseExpiryDate: driver.licenseExpiryDate ? driver.licenseExpiryDate.toISOString().split('T')[0] : '',
      licenseIssueDate: driver.licenseIssueDate ? driver.licenseIssueDate.toISOString().split('T')[0] : '',
      licenseIssueState: driver.licenseIssueAuthority,
      
      employmentStartDate: driver.joiningDate ? driver.joiningDate.toISOString().split('T')[0] : '',
      employmentStatus: driver.status === 'Active' ? 'active' : 
                        driver.status === 'Inactive' ? 'inactive' : 'onLeave',
      yearsOfExperience: driver.experience,
      department: driver.department,
      
      emergencyContactName: driver.emergencyContactName,
      emergencyContactPhone: driver.emergencyContactPhone,
      
      profilePhoto: driver.profilePhoto,
      documents: driver.documents || [],
      
      notes: driver.notes
    };
    
    res.status(200).json({
      success: true,
      data: formattedDriver
    });
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver',
      error: error.message
    });
  }
});

// Update driver
router.put('/:id', async (req, res) => {
  try {
    const driverData = req.body;
    
    // Map frontend fields to backend schema
    const updateData = {
      firstName: driverData.firstName,
      lastName: driverData.lastName,
      dateOfBirth: driverData.dateOfBirth,
      gender: driverData.gender,
      email: driverData.email,
      phone: driverData.phone,
      address: driverData.address,
      city: driverData.city,
      state: driverData.state,
      zipCode: driverData.zipCode,
      
      licenseNumber: driverData.licenseNumber,
      licenseCategory: driverData.licenseType ? [driverData.licenseType] : [],
      licenseIssueDate: driverData.licenseIssueDate,
      licenseExpiryDate: driverData.licenseExpiryDate,
      licenseIssueAuthority: driverData.licenseIssueState,
      
      joiningDate: driverData.employmentStartDate,
      department: driverData.department,
      experience: driverData.yearsOfExperience,
      status: driverData.employmentStatus === 'active' ? 'Active' : 
              driverData.employmentStatus === 'inactive' ? 'Inactive' : 'On Leave',
      
      emergencyContactName: driverData.emergencyContactName,
      emergencyContactPhone: driverData.emergencyContactPhone,
      
      profilePhoto: driverData.profilePhoto,
      documents: driverData.documents || [],
      
      notes: driverData.notes,
      updatedAt: new Date()
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });
    
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      data: driver
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver',
      error: error.message
    });
  }
});

// Delete driver
router.delete('/:id', async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Driver deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete driver',
      error: error.message
    });
  }
});

// Reset driver password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Set the new password - let the pre-save hook hash it
    driver.password = password;
    driver.updatedAt = new Date();
    await driver.save();
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

export default router;