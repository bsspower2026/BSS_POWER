import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const helperSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String
  },
  bloodGroup: {
    type: String
  },
  nationality: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    default: 'helper'
  },

  // Contact Information
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },

  // Authentication
  password: {
    type: String,
    select: false
  },

  // Employment Information
  employeeId: {
    type: String,
    sparse: true,
    trim: true
  },
  joiningDate: {
    type: Date
  },
  department: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  experience: {
    type: Number
  },
  salary: {
    type: Number
  },

  // Emergency Contact
  emergencyContactName: {
    type: String,
    trim: true
  },
  emergencyContactRelation: {
    type: String,
    trim: true
  },
  emergencyContactPhone: {
    type: String,
    trim: true
  },

  // Additional Information
  aadharNumber: {
    type: String,
    sparse: true,
    trim: true
  },
  panNumber: {
    type: String,
    sparse: true,
    trim: true
  },
  bankAccountNumber: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },

  // Profile Photo
  profilePhoto: {
    url: String,
    publicId: String
  },

  // Documents
  documents: [{
    name: String,
    url: String,
    publicId: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Status
  status: {
    type: String,
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true
  },

  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
helperSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return next();
  }
  console.log('Hashing password for helper:', this.email);
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

helperSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    console.log('No password stored for this helper');
    return false;
  }
  const isValid = await bcrypt.compare(candidatePassword, this.password);
  console.log('Password comparison result:', isValid);
  return isValid;
};

export default mongoose.model('Helper', helperSchema);