import express from 'express';
import Payment from '../models/Payment.js';
import Trip from '../models/Trip.js';
import IssueAction from '../models/IssueAction.js';

const router = express.Router();

const fmt = p => ({
  _id:          p._id,
  type:         p.type,
  trip:         p.trip,
  tripNumber:   p.tripNumber,
  fuelLogIndex: p.fuelLogIndex,
  fuelLitres:   p.fuelLitres,
  fuelFilledBy: p.fuelFilledBy,
  issueAction:  p.issueAction,
  poNumber:     p.poNumber,
  poTitle:      p.poTitle,
  poAmount:     p.poAmount,
  amount:       p.amount,
  description:  p.description,
  paymentMode:  p.paymentMode,
  status:       p.status,
  paidAt:       p.paidAt,
  paidByName:   p.paidByName,
  seenByAdmin:  p.seenByAdmin,
  createdAt:    p.createdAt,
});

// ── GET /api/payments  — list with optional filters ───────────────────────────
// ?type=fuel|bill  &status=pending|paid  &limit=50
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.type)   filter.type   = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const payments = await Payment.find(filter)
      .populate('trip',        'tripNumber vehicle fromLocation toLocation status')
      .populate('issueAction', 'poNumber title totalAmount proofFiles parts additionalCosts issueDescription')
      .sort({ createdAt: -1 })
      .limit(req.query.limit ? parseInt(req.query.limit) : 100);

    res.status(200).json({ success: true, data: payments.map(fmt) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments', error: err.message });
  }
});

// ── GET /api/payments/unseen-count ────────────────────────────────────────────
router.get('/unseen-count', async (req, res) => {
  try {
    const fuel = await Payment.countDocuments({ type: 'fuel', seenByAdmin: false });
    const bill = await Payment.countDocuments({ type: 'bill', seenByAdmin: false });
    res.status(200).json({ success: true, data: { fuel, bill, total: fuel + bill } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payments  — create a new payment request (auto-called when
//    a fuel log is added or a PO proof is uploaded) ────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      type, tripId, tripNumber,
      fuelLogIndex, fuelLitres, fuelFilledBy,
      issueActionId, poNumber, poTitle, poAmount,
    } = req.body;

    if (!type || !tripId) {
      return res.status(400).json({ success: false, message: 'type and tripId are required' });
    }

    // Avoid duplicates
    const existingFilter = type === 'fuel'
      ? { type: 'fuel', trip: tripId, fuelLogIndex }
      : { type: 'bill', trip: tripId, issueAction: issueActionId };
    const exists = await Payment.findOne(existingFilter);
    if (exists) {
      return res.status(200).json({ success: true, data: fmt(exists), duplicate: true });
    }

    const payment = new Payment({
      type, trip: tripId, tripNumber,
      fuelLogIndex, fuelLitres, fuelFilledBy,
      issueAction: issueActionId || undefined,
      poNumber, poTitle, poAmount: poAmount || 0,
      status: 'pending',
      seenByAdmin: false,
    });
    await payment.save();
    res.status(201).json({ success: true, data: fmt(payment) });
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ success: false, message: 'Failed to create payment', error: err.message });
  }
});

// ── PATCH /api/payments/:id/pay  — mark as paid ───────────────────────────────
router.patch('/:id/pay', async (req, res) => {
  try {
    const { amount, description, paymentMode, paidByName } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Payment is already marked as paid' });
    }

    payment.amount      = Number(amount);
    payment.description = description || '';
    payment.paymentMode = paymentMode || '';
    payment.paidByName  = paidByName || '';
    payment.status      = 'paid';
    payment.paidAt      = new Date();
    payment.seenByAdmin = true;
    payment.updatedAt   = new Date();
    await payment.save();

    res.status(200).json({ success: true, message: 'Payment recorded', data: fmt(payment) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark payment', error: err.message });
  }
});

// ── PATCH /api/payments/mark-seen  — mark multiple as seen ───────────────────
router.patch('/mark-seen', async (req, res) => {
  try {
    const { type } = req.body;
    const filter = { seenByAdmin: false };
    if (type) filter.type = type;
    await Payment.updateMany(filter, { seenByAdmin: true });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;