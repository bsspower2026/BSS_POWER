import express from 'express';
import SiteSupervisor from '../models/SiteSupervisor.js';

const router = express.Router();

// Generate temporary password
const generateTemporaryPassword = (firstName, lastName) => {
  const randomNum = Math.floor(100 + Math.random() * 900);
  const companyName = 'BSS-Power';
  const namePart = (firstName + lastName).slice(0, 5).toLowerCase();
  return `${namePart}@${companyName}${randomNum}`;
};

// Create site supervisor
router.post('/', async (req, res) => {
  try {
    const supervisorData = req.body;

    const tempPassword = generateTemporaryPassword(supervisorData.firstName, supervisorData.lastName);

    console.log('Creating site supervisor with email:', supervisorData.email);
    console.log('Generated temp password:', tempPassword);

    const newSupervisor = new SiteSupervisor({
      firstName: supervisorData.firstName,
      lastName: supervisorData.lastName,
      dateOfBirth: supervisorData.dateOfBirth,
      gender: supervisorData.gender,
      bloodGroup: supervisorData.bloodGroup,
      nationality: supervisorData.nationality,
      email: supervisorData.email,
      phone: supervisorData.phone,
      alternatePhone: supervisorData.alternatePhone,
      address: supervisorData.address,
      city: supervisorData.city,
      state: supervisorData.state,
      zipCode: supervisorData.zipCode,

      employeeId: supervisorData.employeeId,
      joiningDate: supervisorData.employmentStartDate,
      department: supervisorData.department,
      designation: supervisorData.designation,
      experience: supervisorData.yearsOfExperience,
      salary: supervisorData.salary,

      emergencyContactName: supervisorData.emergencyContactName,
      emergencyContactRelation: supervisorData.emergencyContactRelation,
      emergencyContactPhone: supervisorData.emergencyContactPhone,

      aadharNumber: supervisorData.aadharNumber,
      panNumber: supervisorData.panNumber,
      bankAccountNumber: supervisorData.bankAccountNumber,
      ifscCode: supervisorData.ifscCode,

      status: supervisorData.employmentStatus === 'active' ? 'Active' :
              supervisorData.employmentStatus === 'inactive' ? 'Inactive' : 'On Leave',

      profilePhoto: supervisorData.profilePhoto,
      documents: supervisorData.documents || [],
      notes: supervisorData.notes,

      // Password - will be hashed by pre-save hook
      password: tempPassword
    });

    await newSupervisor.save();

    console.log('Site supervisor created successfully with ID:', newSupervisor._id);

    res.status(201).json({
      success: true,
      message: 'Site Supervisor created successfully',
      data: {
        supervisor: {
          _id: newSupervisor._id,
          firstName: newSupervisor.firstName,
          lastName: newSupervisor.lastName,
          email: newSupervisor.email
        },
        tempPassword: tempPassword
      }
    });
  } catch (error) {
    console.error('Error creating site supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create site supervisor',
      error: error.message
    });
  }
});

// Get all site supervisors
router.get('/', async (req, res) => {
  try {
    const supervisors = await SiteSupervisor.find()
      .select('-password')
      .sort({ createdAt: -1 });

    const formattedSupervisors = supervisors.map(supervisor => ({
      _id: supervisor._id,
      firstName: supervisor.firstName,
      lastName: supervisor.lastName,
      email: supervisor.email,
      phone: supervisor.phone,
      designation: supervisor.designation,
      department: supervisor.department,
      status: supervisor.status,
      profilePhoto: supervisor.profilePhoto,
      documents: supervisor.documents
    }));

    res.status(200).json({
      success: true,
      data: formattedSupervisors
    });
  } catch (error) {
    console.error('Error fetching site supervisors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site supervisors',
      error: error.message
    });
  }
});

// Get site supervisor by ID
router.get('/:id', async (req, res) => {
  try {
    const supervisor = await SiteSupervisor.findById(req.params.id).select('-password');

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Site Supervisor not found'
      });
    }

    const formattedSupervisor = {
      _id: supervisor._id,
      firstName: supervisor.firstName,
      lastName: supervisor.lastName,
      dateOfBirth: supervisor.dateOfBirth ? supervisor.dateOfBirth.toISOString().split('T')[0] : '',
      gender: supervisor.gender,
      bloodGroup: supervisor.bloodGroup,
      nationality: supervisor.nationality,
      email: supervisor.email,
      phone: supervisor.phone,
      alternatePhone: supervisor.alternatePhone,
      address: supervisor.address,
      city: supervisor.city,
      state: supervisor.state,
      zipCode: supervisor.zipCode,

      employeeId: supervisor.employeeId,
      employmentStartDate: supervisor.joiningDate ? supervisor.joiningDate.toISOString().split('T')[0] : '',
      department: supervisor.department,
      designation: supervisor.designation,
      yearsOfExperience: supervisor.experience,
      salary: supervisor.salary,
      employmentStatus: supervisor.status === 'Active' ? 'active' :
                        supervisor.status === 'Inactive' ? 'inactive' : 'onLeave',

      emergencyContactName: supervisor.emergencyContactName,
      emergencyContactRelation: supervisor.emergencyContactRelation,
      emergencyContactPhone: supervisor.emergencyContactPhone,

      aadharNumber: supervisor.aadharNumber,
      panNumber: supervisor.panNumber,
      bankAccountNumber: supervisor.bankAccountNumber,
      ifscCode: supervisor.ifscCode,

      profilePhoto: supervisor.profilePhoto,
      documents: supervisor.documents || [],
      notes: supervisor.notes
    };

    res.status(200).json({
      success: true,
      data: formattedSupervisor
    });
  } catch (error) {
    console.error('Error fetching site supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site supervisor',
      error: error.message
    });
  }
});

// Update site supervisor
router.put('/:id', async (req, res) => {
  try {
    const supervisorData = req.body;

    const updateData = {
      firstName: supervisorData.firstName,
      lastName: supervisorData.lastName,
      dateOfBirth: supervisorData.dateOfBirth,
      gender: supervisorData.gender,
      bloodGroup: supervisorData.bloodGroup,
      nationality: supervisorData.nationality,
      email: supervisorData.email,
      phone: supervisorData.phone,
      alternatePhone: supervisorData.alternatePhone,
      address: supervisorData.address,
      city: supervisorData.city,
      state: supervisorData.state,
      zipCode: supervisorData.zipCode,

      employeeId: supervisorData.employeeId,
      joiningDate: supervisorData.employmentStartDate,
      department: supervisorData.department,
      designation: supervisorData.designation,
      experience: supervisorData.yearsOfExperience,
      salary: supervisorData.salary,
      status: supervisorData.employmentStatus === 'active' ? 'Active' :
              supervisorData.employmentStatus === 'inactive' ? 'Inactive' : 'On Leave',

      emergencyContactName: supervisorData.emergencyContactName,
      emergencyContactRelation: supervisorData.emergencyContactRelation,
      emergencyContactPhone: supervisorData.emergencyContactPhone,

      aadharNumber: supervisorData.aadharNumber,
      panNumber: supervisorData.panNumber,
      bankAccountNumber: supervisorData.bankAccountNumber,
      ifscCode: supervisorData.ifscCode,

      profilePhoto: supervisorData.profilePhoto,
      documents: supervisorData.documents || [],
      notes: supervisorData.notes,
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });

    const supervisor = await SiteSupervisor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Site Supervisor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Site Supervisor updated successfully',
      data: supervisor
    });
  } catch (error) {
    console.error('Error updating site supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update site supervisor',
      error: error.message
    });
  }
});

// Delete site supervisor
router.delete('/:id', async (req, res) => {
  try {
    const supervisor = await SiteSupervisor.findByIdAndDelete(req.params.id);

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Site Supervisor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Site Supervisor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting site supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete site supervisor',
      error: error.message
    });
  }
});

// Reset site supervisor password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const supervisor = await SiteSupervisor.findById(req.params.id);

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Site Supervisor not found'
      });
    }

    supervisor.password = password;
    supervisor.updatedAt = new Date();
    await supervisor.save();

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