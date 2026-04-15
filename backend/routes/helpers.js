import express from 'express';
import Helper from '../models/Helper.js';

const router = express.Router();

// Generate temporary password
const generateTemporaryPassword = (firstName, lastName) => {
  const randomNum = Math.floor(100 + Math.random() * 900);
  const companyName = 'BSS-Power';
  const namePart = (firstName + lastName).slice(0, 5).toLowerCase();
  return `${namePart}@${companyName}${randomNum}`;
};

// Create helper
router.post('/', async (req, res) => {
  try {
    const helperData = req.body;

    const tempPassword = generateTemporaryPassword(helperData.firstName, helperData.lastName);

    console.log('Creating helper with email:', helperData.email);
    console.log('Generated temp password:', tempPassword);

    const newHelper = new Helper({
      firstName: helperData.firstName,
      lastName: helperData.lastName,
      dateOfBirth: helperData.dateOfBirth,
      gender: helperData.gender,
      bloodGroup: helperData.bloodGroup,
      nationality: helperData.nationality,
      email: helperData.email,
      phone: helperData.phone,
      alternatePhone: helperData.alternatePhone,
      address: helperData.address,
      city: helperData.city,
      state: helperData.state,
      zipCode: helperData.zipCode,

      employeeId: helperData.employeeId,
      joiningDate: helperData.employmentStartDate,
      department: helperData.department,
      designation: helperData.designation,
      experience: helperData.yearsOfExperience,
      salary: helperData.salary,

      emergencyContactName: helperData.emergencyContactName,
      emergencyContactRelation: helperData.emergencyContactRelation,
      emergencyContactPhone: helperData.emergencyContactPhone,

      aadharNumber: helperData.aadharNumber,
      panNumber: helperData.panNumber,
      bankAccountNumber: helperData.bankAccountNumber,
      ifscCode: helperData.ifscCode,

      status: helperData.employmentStatus === 'active' ? 'Active' :
              helperData.employmentStatus === 'inactive' ? 'Inactive' : 'On Leave',

      profilePhoto: helperData.profilePhoto,
      documents: helperData.documents || [],
      notes: helperData.notes,

      // Password - will be hashed by pre-save hook
      password: tempPassword
    });

    await newHelper.save();

    console.log('Helper created successfully with ID:', newHelper._id);

    res.status(201).json({
      success: true,
      message: 'Helper created successfully',
      data: {
        helper: {
          _id: newHelper._id,
          firstName: newHelper.firstName,
          lastName: newHelper.lastName,
          email: newHelper.email
        },
        tempPassword: tempPassword
      }
    });
  } catch (error) {
    console.error('Error creating helper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create helper',
      error: error.message
    });
  }
});

// Get all helpers
router.get('/', async (req, res) => {
  try {
    const helpers = await Helper.find()
      .select('-password')
      .sort({ createdAt: -1 });

    const formattedHelpers = helpers.map(helper => ({
      _id: helper._id,
      firstName: helper.firstName,
      lastName: helper.lastName,
      email: helper.email,
      phone: helper.phone,
      designation: helper.designation,
      department: helper.department,
      status: helper.status,
      profilePhoto: helper.profilePhoto,
      documents: helper.documents
    }));

    res.status(200).json({
      success: true,
      data: formattedHelpers
    });
  } catch (error) {
    console.error('Error fetching helpers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch helpers',
      error: error.message
    });
  }
});

// Get helper by ID
router.get('/:id', async (req, res) => {
  try {
    const helper = await Helper.findById(req.params.id).select('-password');

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper not found'
      });
    }

    const formattedHelper = {
      _id: helper._id,
      firstName: helper.firstName,
      lastName: helper.lastName,
      dateOfBirth: helper.dateOfBirth ? helper.dateOfBirth.toISOString().split('T')[0] : '',
      gender: helper.gender,
      bloodGroup: helper.bloodGroup,
      nationality: helper.nationality,
      email: helper.email,
      phone: helper.phone,
      alternatePhone: helper.alternatePhone,
      address: helper.address,
      city: helper.city,
      state: helper.state,
      zipCode: helper.zipCode,

      employeeId: helper.employeeId,
      employmentStartDate: helper.joiningDate ? helper.joiningDate.toISOString().split('T')[0] : '',
      department: helper.department,
      designation: helper.designation,
      yearsOfExperience: helper.experience,
      salary: helper.salary,
      employmentStatus: helper.status === 'Active' ? 'active' :
                        helper.status === 'Inactive' ? 'inactive' : 'onLeave',

      emergencyContactName: helper.emergencyContactName,
      emergencyContactRelation: helper.emergencyContactRelation,
      emergencyContactPhone: helper.emergencyContactPhone,

      aadharNumber: helper.aadharNumber,
      panNumber: helper.panNumber,
      bankAccountNumber: helper.bankAccountNumber,
      ifscCode: helper.ifscCode,

      profilePhoto: helper.profilePhoto,
      documents: helper.documents || [],
      notes: helper.notes
    };

    res.status(200).json({
      success: true,
      data: formattedHelper
    });
  } catch (error) {
    console.error('Error fetching helper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch helper',
      error: error.message
    });
  }
});

// Update helper
router.put('/:id', async (req, res) => {
  try {
    const helperData = req.body;

    const updateData = {
      firstName: helperData.firstName,
      lastName: helperData.lastName,
      dateOfBirth: helperData.dateOfBirth,
      gender: helperData.gender,
      bloodGroup: helperData.bloodGroup,
      nationality: helperData.nationality,
      email: helperData.email,
      phone: helperData.phone,
      alternatePhone: helperData.alternatePhone,
      address: helperData.address,
      city: helperData.city,
      state: helperData.state,
      zipCode: helperData.zipCode,

      employeeId: helperData.employeeId,
      joiningDate: helperData.employmentStartDate,
      department: helperData.department,
      designation: helperData.designation,
      experience: helperData.yearsOfExperience,
      salary: helperData.salary,
      status: helperData.employmentStatus === 'active' ? 'Active' :
              helperData.employmentStatus === 'inactive' ? 'Inactive' : 'On Leave',

      emergencyContactName: helperData.emergencyContactName,
      emergencyContactRelation: helperData.emergencyContactRelation,
      emergencyContactPhone: helperData.emergencyContactPhone,

      aadharNumber: helperData.aadharNumber,
      panNumber: helperData.panNumber,
      bankAccountNumber: helperData.bankAccountNumber,
      ifscCode: helperData.ifscCode,

      profilePhoto: helperData.profilePhoto,
      documents: helperData.documents || [],
      notes: helperData.notes,
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });

    const helper = await Helper.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Helper updated successfully',
      data: helper
    });
  } catch (error) {
    console.error('Error updating helper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update helper',
      error: error.message
    });
  }
});

// Delete helper
router.delete('/:id', async (req, res) => {
  try {
    const helper = await Helper.findByIdAndDelete(req.params.id);

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Helper deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting helper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete helper',
      error: error.message
    });
  }
});

// Reset helper password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const helper = await Helper.findById(req.params.id);

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper not found'
      });
    }

    helper.password = password;
    helper.updatedAt = new Date();
    await helper.save();

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