import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // ── What kind of payment ───────────────────────────────────────────────────
  type: {
    type: String,
    enum: ['fuel', 'bill'],
    required: true,
    index: true
  },

  // ── Trip reference (always present) ───────────────────────────────────────
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  tripNumber: { type: String, trim: true },          // snapshot

  // ── For fuel payments: which fuel log ─────────────────────────────────────
  fuelLogIndex: { type: Number },                    // index in trip.fuelLogs[]
  fuelLitres:   { type: Number },
  fuelFilledBy: { type: String, trim: true },

  // ── For bill payments: which PO ───────────────────────────────────────────
  issueAction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IssueAction'
  },
  poNumber:    { type: String, trim: true },         // snapshot
  poTitle:     { type: String, trim: true },
  poAmount:    { type: Number, default: 0 },         // PO total amount

  // ── Payment details (filled when "Make Payment" is submitted) ─────────────
  amount:       { type: Number, default: 0 },
  description:  { type: String, trim: true },        // reason / notes
  paymentMode:  { type: String, trim: true },        // cash / NEFT / cheque etc.

  // ── Status ─────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
    index: true
  },
  paidAt:      { type: Date },
  paidByName:  { type: String, trim: true },         // admin name who marked paid

  // ── Seen / notification flag ───────────────────────────────────────────────
  seenByAdmin: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Payment', paymentSchema);