import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  // Basic Information
  registrationNumber: { type: String, trim: true },
  licensePlate: { type: String, trim: true },
  make: { type: String, trim: true },
  model: { type: String, trim: true },
  year: { type: Number },
  color: { type: String, trim: true },
  vin: { type: String, trim: true },

  // Vehicle Tracking Information
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'],
    trim: true
  },
  avgMileage: { type: String, trim: true },
  gpsDeviceId: { type: String, trim: true },
  trackingDeviceModel: { type: String, trim: true },
  simCardNumber: { type: String, trim: true },

  // Fuel tracking — updated by driver fuel fill actions
  currentFuelQty: { type: Number, default: 0 }, // in litres (or kWh for electric)

  // Insurance & Documents
  insuranceProvider: { type: String, trim: true },
  insurancePolicyNumber: { type: String, trim: true },
  insuranceExpiryDate: { type: Date },
  registrationExpiryDate: { type: Date },

  // Maintenance
  lastServiceDate: { type: Date },
  nextServiceDate: { type: Date },
  lastServiceMileage: { type: String, trim: true },
  maintenanceNotes: { type: String },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },

  // Additional
  purchaseDate: { type: Date },
  purchasePrice: { type: Number },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  notes: { type: String },

  // Photos
  photos: [{
    url: String,
    publicId: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Vehicle', vehicleSchema);