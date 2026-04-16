import mongoose from 'mongoose';

// Each part line in the PO — stored separately from the Parts inventory
// so a PO is a self-contained record even if the part is later deleted/renamed.
const partLineSchema = new mongoose.Schema({
  partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', default: null },
  partName: { type: String, trim: true },
  partNumber: { type: String, trim: true },          // partCode from Part model
  qty: { type: Number, default: 1, min: 1 },
  costPrice: { type: Number, default: 0 },          // catalog price snapshot (read-only)
  unitPrice: { type: Number, default: 0 }, // editable for this PO
  totalPrice: { type: Number, default: 0 }           // qty × unitPrice (computed on save)
});

// Miscellaneous costs: challan, fine, labour charge, etc.
const additionalCostSchema = new mongoose.Schema({
  reason: { type: String, trim: true },
  amount: { type: Number, default: 0 }
});

// Proof files uploaded by driver/staff against the PO
const proofFileSchema = new mongoose.Schema({
  url: { type: String },
  publicId: { type: String },
  note: { type: String, trim: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String, trim: true },       // person name
  uploadedByRole: { type: String, trim: true }        // 'driver'|'helper'|'supervisor'|'employee_bypass'
});

const issueActionSchema = new mongoose.Schema({
  // ── References ─────────────────────────────────────────────────────────────
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', index: true },
  issueIndex: { type: Number },   // index into trip.issueReports[]
  issueDescription: { type: String, trim: true },        // snapshot of the issue text at creation

  // ── PO identity ────────────────────────────────────────────────────────────
  poNumber: { type: String, unique: true, trim: true },
  title: { type: String, trim: true },
  description: { type: String, trim: true },             // key-points / scope

  // ── Parts section (optional) ───────────────────────────────────────────────
  hasPartChanges: { type: Boolean, default: false },
  parts: [partLineSchema],

  // ── Miscellaneous costs ───────────────────────────────────────────────────
  additionalCosts: [additionalCostSchema],

  // ── Totals ────────────────────────────────────────────────────────────────
  totalAmount: { type: Number, default: 0 },

  // ── Authorising signature (data-URL stored directly) ──────────────────────
  signature: { type: String },

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['draft', 'generated', 'proof_uploaded', 'closed'],
    default: 'draft'
  },
  generatedAt: { type: Date },

  // ── Proof files uploaded against this PO ──────────────────────────────────
  proofFiles: [proofFileSchema],

  // ── Audit ─────────────────────────────────────────────────────────────────
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate PO number
issueActionSchema.pre('save', async function (next) {
  if (!this.poNumber) {
    const count = await mongoose.model('IssueAction').countDocuments();
    this.poNumber = `PO-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('IssueAction', issueActionSchema);