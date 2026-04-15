import express from 'express';
import IssueAction from '../models/IssueAction.js';
import Trip       from '../models/Trip.js';
import Payment    from '../models/Payment.js';   // ← NEW

const router = express.Router();

const fmt = a => ({
  _id:              a._id,
  trip:             a.trip,
  issueIndex:       a.issueIndex,
  issueDescription: a.issueDescription,
  poNumber:         a.poNumber,
  title:            a.title,
  description:      a.description,
  hasPartChanges:   a.hasPartChanges,
  parts:            a.parts          || [],
  additionalCosts:  a.additionalCosts || [],
  totalAmount:      a.totalAmount     || 0,
  signature:        a.signature,
  status:           a.status,
  generatedAt:      a.generatedAt,
  proofFiles:       a.proofFiles      || [],
  createdByName:    a.createdByName,
  createdAt:        a.createdAt,
  updatedAt:        a.updatedAt,
});

// ── GET /api/issue-actions/trip/:tripId ───────────────────────────────────────
router.get('/trip/:tripId', async (req, res) => {
  try {
    const actions = await IssueAction.find({ trip: req.params.tripId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: actions.map(fmt) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch issue actions', error: err.message });
  }
});

// ── GET /api/issue-actions/:id ────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const action = await IssueAction.findById(req.params.id);
    if (!action) return res.status(404).json({ success: false, message: 'Issue action not found' });
    res.status(200).json({ success: true, data: fmt(action) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch issue action', error: err.message });
  }
});

// ── POST /api/issue-actions — create a draft PO ───────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      tripId, issueIndex, issueDescription,
      title, description,
      hasPartChanges, parts, additionalCosts,
      createdByName,
    } = req.body;

    if (!tripId || issueIndex === undefined || issueIndex === null || !title?.trim()) {
      return res.status(400).json({ success: false, message: 'tripId, issueIndex and title are required' });
    }

    const computedParts = (parts || []).map(p => ({
      partId:     p.partId    || null,
      partName:   p.partName,
      partNumber: p.partNumber || '',
      qty:        Number(p.qty)       || 1,
      costPrice:  Number(p.costPrice) || 0,
      unitPrice:  Number(p.unitPrice) || 0,
      totalPrice: (Number(p.qty) || 1) * (Number(p.unitPrice) || 0),
    }));

    const partsTotal  = computedParts.reduce((s, p) => s + p.totalPrice, 0);
    const costsTotal  = (additionalCosts || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const totalAmount = partsTotal + costsTotal;

    const action = new IssueAction({
      trip:             tripId,
      issueIndex,
      issueDescription,
      title:            title.trim(),
      description,
      hasPartChanges:   Boolean(hasPartChanges),
      parts:            computedParts,
      additionalCosts:  (additionalCosts || [])
        .filter(c => c.reason?.trim() && Number(c.amount) > 0)
        .map(c => ({ reason: c.reason.trim(), amount: Number(c.amount) })),
      totalAmount,
      status:           'draft',
      createdByName,
    });

    await action.save();
    res.status(201).json({ success: true, message: 'Issue action created', data: fmt(action) });
  } catch (err) {
    console.error('Error creating issue action:', err);
    res.status(500).json({ success: false, message: 'Failed to create issue action', error: err.message });
  }
});

// ── PATCH /api/issue-actions/:id/generate — attach signature, set generated ───
router.patch('/:id/generate', async (req, res) => {
  try {
    const { signature } = req.body;
    const action = await IssueAction.findById(req.params.id);
    if (!action) return res.status(404).json({ success: false, message: 'Issue action not found' });
    if (action.status !== 'draft') return res.status(400).json({ success: false, message: 'PO is already generated or closed' });

    action.status      = 'generated';
    action.generatedAt = new Date();
    if (signature) action.signature = signature;
    action.updatedAt   = new Date();
    await action.save();

    res.status(200).json({ success: true, message: 'PO generated', data: fmt(action) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate PO', error: err.message });
  }
});

// ── POST /api/issue-actions/:id/proof ─────────────────────────────────────────
// After the first proof is uploaded the status becomes 'proof_uploaded'.
// At that point we auto-create a pending Payment record for the admin.
router.post('/:id/proof', async (req, res) => {
  try {
    const { url, publicId, note, uploadedBy, uploadedByRole } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'File URL is required' });

    const action = await IssueAction.findById(req.params.id);
    if (!action) return res.status(404).json({ success: false, message: 'PO not found' });
    if (!['generated', 'proof_uploaded'].includes(action.status)) {
      return res.status(400).json({ success: false, message: 'PO must be generated before uploading proof' });
    }

    const wasFirstProof = action.status === 'generated'; // first upload triggers payment creation

    action.proofFiles.push({ url, publicId, note, uploadedBy, uploadedByRole, uploadedAt: new Date() });
    action.status    = 'proof_uploaded';
    action.updatedAt = new Date();
    await action.save();

    // ── AUTO-CREATE bill payment request for admin (only on first proof) ───
    if (wasFirstProof) {
      try {
        // Fetch the trip to get its tripNumber
        const trip = await Trip.findById(action.trip).select('tripNumber');

        const already = await Payment.findOne({ type: 'bill', issueAction: action._id });
        if (!already) {
          await new Payment({
            type:         'bill',
            trip:          action.trip,
            tripNumber:    trip?.tripNumber || '',
            issueAction:   action._id,
            poNumber:      action.poNumber,
            poTitle:       action.title,
            poAmount:      action.totalAmount,
            status:        'pending',
            seenByAdmin:   false,
          }).save();
        }
      } catch (payErr) {
        // Payment record failure must NOT break the proof-upload response
        console.error('Auto-payment creation failed (bill):', payErr.message);
      }
    }

    res.status(200).json({ success: true, message: 'Proof uploaded', data: fmt(action) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to upload proof', error: err.message });
  }
});

// ── PATCH /api/issue-actions/:id/close ────────────────────────────────────────
router.patch('/:id/close', async (req, res) => {
  try {
    const action = await IssueAction.findById(req.params.id);
    if (!action) return res.status(404).json({ success: false, message: 'Not found' });
    action.status    = 'closed';
    action.updatedAt = new Date();
    await action.save();
    res.status(200).json({ success: true, message: 'PO closed', data: fmt(action) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to close PO', error: err.message });
  }
});

export default router;