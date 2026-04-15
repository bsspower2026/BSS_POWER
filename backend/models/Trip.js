import mongoose from 'mongoose';

const fuelLogSchema = new mongoose.Schema({
  litresFilled: { type: Number, required: true },
  receiptBills: [{
    url: String,
    publicId: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  filledAt: { type: Date, default: Date.now },
  note: { type: String },
  filledBy: { type: String, trim: true }  // name of who filled (driver/helper)
});

const issueReportSchema = new mongoose.Schema({
  description: { type: String, required: true },
  reportedAt: { type: Date, default: Date.now },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  reportedBy: { type: String, trim: true }
});

// Admin-side fuel allocation log
const fuelAssignmentSchema = new mongoose.Schema({
  litres: { type: Number, required: true },
  note: { type: String, trim: true },
  assignedAt: { type: Date, default: Date.now },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const tripSchema = new mongoose.Schema({
  // Trip reference
  tripNumber: { type: String, unique: true, trim: true },

  // Vehicle
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },

  // ── Assigned Staff (multiple of each) ──────────────────────────────────────
  drivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  }],
  helpers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Helper'
  }],
  supervisors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SiteSupervisor'
  }],

  // ── Customer / Order Info ──────────────────────────────────────────────────
  customerName: { type: String, trim: true },
  customerPhone: { type: String, trim: true },
  customerEmail: { type: String, trim: true },
  customerAddress: { type: String, trim: true },
  orderReference: { type: String, trim: true },  // PO / order number

  // ── Route ─────────────────────────────────────────────────────────────────
  fromLocation: { type: String, trim: true },
  toLocation: { type: String, trim: true },
  estimatedDistance: { type: Number },
  purpose: { type: String, trim: true },

  // ── Fuel ──────────────────────────────────────────────────────────────────
  fuelType: { type: String, trim: true },         // copied from vehicle
  estimatedFuelLitres: { type: Number, default: 0 }, // cap for driver fills (sum of fuelAssignments)
  fuelAssignments: [fuelAssignmentSchema],         // admin-side allocation log

  // ── Deadline ──────────────────────────────────────────────────────────────
  deadline: { type: Date },

  // ── Trip lifecycle ─────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'assigned'
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  officiallyClosedAt: { type: Date },

  // ── Staff actions ──────────────────────────────────────────────────────────
  fuelLogs: [fuelLogSchema],
  issueReports: [issueReportSchema],

  // ── Notes ─────────────────────────────────────────────────────────────────
  notes: { type: String },

  // ── Audit ─────────────────────────────────────────────────────────────────
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate trip number
tripSchema.pre('save', async function (next) {
  if (!this.tripNumber) {
    const count = await mongoose.model('Trip').countDocuments();
    this.tripNumber = `TRP-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Virtual: total litres filled
tripSchema.virtual('totalFuelFilled').get(function () {
  return (this.fuelLogs || []).reduce((s, l) => s + (l.litresFilled || 0), 0);
});

export default mongoose.model('Trip', tripSchema);