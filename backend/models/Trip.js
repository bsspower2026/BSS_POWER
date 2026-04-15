import mongoose from 'mongoose';

const fuelLogSchema = new mongoose.Schema({
  litresFilled:  { type: Number, required: true },
  receiptBills: [{
    url:        String,
    publicId:   String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  filledAt:     { type: Date, default: Date.now },
  note:         { type: String },
  filledBy:     { type: String, trim: true },      // name
  filledByRole: { type: String, trim: true },      // 'driver'|'helper'|'employee_bypass'
  bypass:       { type: Boolean, default: false }  // true = employee acted on behalf of staff
});

const issueReportSchema = new mongoose.Schema({
  description:    { type: String, required: true },
  reportedAt:     { type: Date, default: Date.now },
  severity:       { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  reportedBy:     { type: String, trim: true },
  reportedByRole: { type: String, trim: true },
  bypass:         { type: Boolean, default: false }
});

const fuelAssignmentSchema = new mongoose.Schema({
  litres:     { type: Number, required: true },
  note:       { type: String, trim: true },
  assignedAt: { type: Date, default: Date.now },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const tripSchema = new mongoose.Schema({
  tripNumber: { type: String, unique: true, trim: true },

  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },

  // ── Assigned Staff ─────────────────────────────────────────────────────────
  drivers:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }],
  helpers:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Helper' }],
  supervisors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SiteSupervisor' }],

  // ── Customer / Order ───────────────────────────────────────────────────────
  customerName:    { type: String, trim: true },
  customerPhone:   { type: String, trim: true },
  customerEmail:   { type: String, trim: true },
  customerAddress: { type: String, trim: true },
  orderReference:  { type: String, trim: true },

  // ── Route ──────────────────────────────────────────────────────────────────
  fromLocation:      { type: String, trim: true },
  toLocation:        { type: String, trim: true },
  estimatedDistance: { type: Number },
  purpose:           { type: String, trim: true },

  // ── Fuel ───────────────────────────────────────────────────────────────────
  fuelType:            { type: String, trim: true },
  estimatedFuelLitres: { type: Number, default: 0 },
  fuelAssignments:     [fuelAssignmentSchema],

  // ── Deadline ───────────────────────────────────────────────────────────────
  deadline: { type: Date },

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'assigned'
  },
  startedAt:          { type: Date },
  startedBy:          { type: String, trim: true },   // name
  startedByRole:      { type: String, trim: true },   // 'driver'|'helper'|'employee_bypass'
  completedAt:        { type: Date },
  completedBy:        { type: String, trim: true },
  completedByRole:    { type: String, trim: true },
  officiallyClosedAt: { type: Date },

  // ── Staff actions ──────────────────────────────────────────────────────────
  fuelLogs:     [fuelLogSchema],
  issueReports: [issueReportSchema],

  notes: { type: String },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

tripSchema.pre('save', async function (next) {
  if (!this.tripNumber) {
    const count = await mongoose.model('Trip').countDocuments();
    this.tripNumber = `TRP-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Trip', tripSchema);