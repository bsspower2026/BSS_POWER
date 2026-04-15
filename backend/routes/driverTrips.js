// backend/routes/driverTrips.js
import express from 'express';
import Trip    from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import Payment from '../models/Payment.js';   // ← NEW

const router = express.Router();

const V_FIELDS = 'registrationNumber make model fuelType photos color currentFuelQty licensePlate year';
const S_FIELDS = 'firstName lastName phone profilePhoto status';

const populateTrip = q =>
  q.populate('vehicle',     V_FIELDS)
   .populate('drivers',     S_FIELDS)
   .populate('helpers',     S_FIELDS)
   .populate('supervisors', S_FIELDS);

const formatTrip = trip => ({
  _id:            trip._id,
  tripNumber:     trip.tripNumber,
  vehicle:        trip.vehicle,
  drivers:        trip.drivers     || [],
  helpers:        trip.helpers     || [],
  supervisors:    trip.supervisors || [],
  customerName:    trip.customerName,
  customerPhone:   trip.customerPhone,
  customerEmail:   trip.customerEmail,
  customerAddress: trip.customerAddress,
  orderReference:  trip.orderReference,
  fromLocation:      trip.fromLocation,
  toLocation:        trip.toLocation,
  estimatedDistance: trip.estimatedDistance,
  purpose:           trip.purpose,
  fuelType:            trip.fuelType,
  estimatedFuelLitres: trip.estimatedFuelLitres || 0,
  fuelAssignments:     trip.fuelAssignments || [],
  deadline:    trip.deadline    ? trip.deadline.toISOString()    : null,
  status:      trip.status,
  startedAt:   trip.startedAt  ? trip.startedAt.toISOString()   : null,
  startedBy:   trip.startedBy   || '',
  startedByRole: trip.startedByRole || '',
  completedAt: trip.completedAt ? trip.completedAt.toISOString() : null,
  completedBy: trip.completedBy  || '',
  completedByRole: trip.completedByRole || '',
  officiallyClosedAt: trip.officiallyClosedAt ? trip.officiallyClosedAt.toISOString() : null,
  fuelLogs:     trip.fuelLogs     || [],
  issueReports: trip.issueReports || [],
  notes:        trip.notes,
  createdAt:    trip.createdAt,
  updatedAt:    trip.updatedAt,
});

const buildFilter = (staffId, staffType) => {
  if (staffType === 'helper')     return { helpers: staffId };
  if (staffType === 'supervisor') return { supervisors: staffId };
  return { drivers: staffId };
};

// ── GET /api/driver-trips/my ──────────────────────────────────────────────────
router.get('/my', async (req, res) => {
  try {
    const { staffId, staffType = 'driver' } = req.query;
    if (!staffId) return res.status(400).json({ success: false, message: 'staffId is required' });
    const trips = await populateTrip(Trip.find(buildFilter(staffId, staffType)).sort({ createdAt: -1 }));
    res.status(200).json({ success: true, data: trips.map(formatTrip) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch trips', error: err.message });
  }
});

// ── GET /api/driver-trips/my/active ───────────────────────────────────────────
router.get('/my/active', async (req, res) => {
  try {
    const { staffId, staffType = 'driver' } = req.query;
    if (!staffId) return res.status(400).json({ success: false, message: 'staffId is required' });
    const filter = buildFilter(staffId, staffType);
    let trip = await populateTrip(Trip.findOne({ ...filter, status: 'in_progress' }));
    if (!trip) trip = await populateTrip(Trip.findOne({ ...filter, status: 'assigned' }).sort({ createdAt: -1 }));
    res.status(200).json({ success: true, data: trip ? formatTrip(trip) : null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch active trip', error: err.message });
  }
});

// ── PATCH /api/driver-trips/:id/start ─────────────────────────────────────────
router.patch('/:id/start', async (req, res) => {
  try {
    const { performedBy = '', performedByRole = 'driver' } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'assigned') return res.status(400).json({ success: false, message: 'Trip is not in assigned status' });

    trip.status        = 'in_progress';
    trip.startedAt     = new Date();
    trip.startedBy     = performedBy;
    trip.startedByRole = performedByRole;
    trip.updatedAt     = new Date();
    await trip.save();

    const updated = await populateTrip(Trip.findById(trip._id));
    res.status(200).json({ success: true, message: 'Trip started', data: formatTrip(updated) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to start trip', error: err.message });
  }
});

// ── PATCH /api/driver-trips/:id/end ───────────────────────────────────────────
router.patch('/:id/end', async (req, res) => {
  try {
    const { performedBy = '', performedByRole = 'driver' } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'in_progress') return res.status(400).json({ success: false, message: 'Trip is not in progress' });

    trip.status          = 'completed';
    trip.completedAt     = new Date();
    trip.completedBy     = performedBy;
    trip.completedByRole = performedByRole;
    trip.updatedAt       = new Date();
    await trip.save();

    const updated = await populateTrip(Trip.findById(trip._id));
    res.status(200).json({ success: true, message: 'Trip completed', data: formatTrip(updated) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to end trip', error: err.message });
  }
});

// ── POST /api/driver-trips/:id/fuel ───────────────────────────────────────────
// After saving, automatically creates a pending Payment record for the admin.
router.post('/:id/fuel', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('vehicle');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!['assigned', 'in_progress'].includes(trip.status)) {
      return res.status(400).json({ success: false, message: 'Cannot add fuel log to this trip' });
    }

    const {
      litresFilled, receiptBills = [], note = '',
      filledBy = '', filledByRole = 'driver', bypass = false
    } = req.body;

    if (!litresFilled || Number(litresFilled) <= 0) {
      return res.status(400).json({ success: false, message: 'litresFilled must be a positive number' });
    }

    const newL  = Number(litresFilled);
    const used  = (trip.fuelLogs || []).reduce((s, l) => s + (l.litresFilled || 0), 0);
    const cap   = trip.estimatedFuelLitres || 0;

    if (cap > 0 && used + newL > cap) {
      const rem = cap - used;
      return res.status(400).json({
        success: false,
        message: `Fuel cap exceeded. Max ${rem.toFixed(1)}L remaining (cap ${cap}L, filled ${used}L).`
      });
    }

    trip.fuelLogs.push({
      litresFilled: newL,
      receiptBills,
      note,
      filledBy,
      filledByRole,
      bypass: Boolean(bypass),
      filledAt: new Date(),
    });
    trip.updatedAt = new Date();
    await trip.save();

    // ── AUTO-CREATE fuel payment request for admin ─────────────────────────
    // The new log is always the last element after push+save.
    const newLogIndex = trip.fuelLogs.length - 1;
    try {
      // Avoid duplicate if already exists (e.g. retry)
      const already = await Payment.findOne({ type: 'fuel', trip: trip._id, fuelLogIndex: newLogIndex });
      if (!already) {
        await new Payment({
          type:         'fuel',
          trip:          trip._id,
          tripNumber:    trip.tripNumber,
          fuelLogIndex:  newLogIndex,
          fuelLitres:    newL,
          fuelFilledBy:  filledBy,
          status:        'pending',
          seenByAdmin:   false,
        }).save();
      }
    } catch (payErr) {
      // Payment record failure must NOT break the main fuel-fill response
      console.error('Auto-payment creation failed (fuel):', payErr.message);
    }

    // Update vehicle fuel qty
    if (trip.vehicle) {
      await Vehicle.findByIdAndUpdate(
        trip.vehicle._id || trip.vehicle,
        { $inc: { currentFuelQty: newL }, updatedAt: new Date() }
      );
    }

    const updated = await populateTrip(Trip.findById(trip._id));
    res.status(200).json({ success: true, message: 'Fuel log added', data: formatTrip(updated) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add fuel log', error: err.message });
  }
});

// ── POST /api/driver-trips/:id/report ─────────────────────────────────────────
router.post('/:id/report', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!['assigned', 'in_progress'].includes(trip.status)) {
      return res.status(400).json({ success: false, message: 'Cannot report issue for this trip' });
    }

    const { description, severity = 'medium', reportedBy = '', reportedByRole = 'driver', bypass = false } = req.body;
    if (!description?.trim()) return res.status(400).json({ success: false, message: 'Issue description is required' });

    trip.issueReports.push({
      description: description.trim(),
      severity,
      reportedBy,
      reportedByRole,
      bypass: Boolean(bypass),
      reportedAt: new Date(),
    });
    trip.updatedAt = new Date();
    await trip.save();

    const updated = await populateTrip(Trip.findById(trip._id));
    res.status(200).json({ success: true, message: 'Issue reported', data: formatTrip(updated) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to report issue', error: err.message });
  }
});

export default router;