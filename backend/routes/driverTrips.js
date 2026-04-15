// backend/routes/driverTrips.js
import express from 'express';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

const VEHICLE_FIELDS = 'registrationNumber make model fuelType photos color currentFuelQty licensePlate year';
const DRIVER_FIELDS  = 'firstName lastName phone profilePhoto status';
const HELPER_FIELDS  = 'firstName lastName phone profilePhoto status';
const SUPER_FIELDS   = 'firstName lastName phone profilePhoto status';

const populateTrip = (query) =>
  query
    .populate('vehicle', VEHICLE_FIELDS)
    .populate('drivers', DRIVER_FIELDS)
    .populate('helpers', HELPER_FIELDS)
    .populate('supervisors', SUPER_FIELDS);

const formatTrip = (trip) => ({
  _id: trip._id,
  tripNumber: trip.tripNumber,
  vehicle: trip.vehicle,
  drivers: trip.drivers || [],
  helpers: trip.helpers || [],
  supervisors: trip.supervisors || [],
  customerName: trip.customerName,
  customerPhone: trip.customerPhone,
  customerEmail: trip.customerEmail,
  customerAddress: trip.customerAddress,
  orderReference: trip.orderReference,
  fromLocation: trip.fromLocation,
  toLocation: trip.toLocation,
  estimatedDistance: trip.estimatedDistance,
  purpose: trip.purpose,
  fuelType: trip.fuelType,
  estimatedFuelLitres: trip.estimatedFuelLitres || 0,
  fuelAssignments: trip.fuelAssignments || [],
  deadline: trip.deadline ? trip.deadline.toISOString() : null,
  status: trip.status,
  startedAt: trip.startedAt ? trip.startedAt.toISOString() : null,
  completedAt: trip.completedAt ? trip.completedAt.toISOString() : null,
  officiallyClosedAt: trip.officiallyClosedAt ? trip.officiallyClosedAt.toISOString() : null,
  fuelLogs: trip.fuelLogs || [],
  issueReports: trip.issueReports || [],
  notes: trip.notes,
  createdAt: trip.createdAt,
  updatedAt: trip.updatedAt,
});

// Build the MongoDB filter based on staffType
const buildStaffFilter = (staffId, staffType) => {
  if (staffType === 'helper')     return { helpers: staffId };
  if (staffType === 'supervisor') return { supervisors: staffId };
  return { drivers: staffId }; // default: driver
};

// ── GET /api/driver-trips/my — all trips for a staff member ───────────────────
// Query: staffId, staffType ('driver' | 'helper' | 'supervisor')
router.get('/my', async (req, res) => {
  try {
    const { staffId, staffType = 'driver' } = req.query;
    if (!staffId) return res.status(400).json({ success: false, message: 'staffId is required' });

    const trips = await populateTrip(
      Trip.find(buildStaffFilter(staffId, staffType)).sort({ createdAt: -1 })
    );
    res.status(200).json({ success: true, data: trips.map(formatTrip) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trips', error: error.message });
  }
});

// ── GET /api/driver-trips/my/active — latest active trip ──────────────────────
router.get('/my/active', async (req, res) => {
  try {
    const { staffId, staffType = 'driver' } = req.query;
    if (!staffId) return res.status(400).json({ success: false, message: 'staffId is required' });

    const baseFilter = buildStaffFilter(staffId, staffType);

    // Priority: in_progress → assigned
    let trip = await populateTrip(
      Trip.findOne({ ...baseFilter, status: 'in_progress' })
    );

    if (!trip) {
      trip = await populateTrip(
        Trip.findOne({ ...baseFilter, status: 'assigned' }).sort({ createdAt: -1 })
      );
    }

    res.status(200).json({ success: true, data: trip ? formatTrip(trip) : null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch active trip', error: error.message });
  }
});

// ── PATCH /api/driver-trips/:id/start ─────────────────────────────────────────
// Only drivers and helpers can start (not supervisors — they're viewers)
router.patch('/:id/start', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Trip is not in assigned status' });
    }

    trip.status = 'in_progress';
    trip.startedAt = new Date();
    trip.updatedAt = new Date();
    await trip.save();

    const updated = await populateTrip(Trip.findById(trip._id));
    res.status(200).json({ success: true, message: 'Trip started', data: formatTrip(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to start trip', error: error.message });
  }
});

// ── PATCH /api/driver-trips/:id/end ───────────────────────────────────────────
router.patch('/:id/end', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Trip is not in progress' });
    }

    trip.status = 'completed';
    trip.completedAt = new Date();
    trip.updatedAt = new Date();
    await trip.save();

    const updated = await populateTrip(Trip.findById(trip._id));
    res.status(200).json({ success: true, message: 'Trip completed', data: formatTrip(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to end trip', error: error.message });
  }
});

// ── POST /api/driver-trips/:id/fuel — log a fuel fill ─────────────────────────
// Enforces: total filled + new <= estimatedFuelLitres (if cap > 0)
router.post('/:id/fuel', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('vehicle');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!['assigned', 'in_progress'].includes(trip.status)) {
      return res.status(400).json({ success: false, message: 'Cannot add fuel log to this trip' });
    }

    const { litresFilled, receiptBills, note, filledBy } = req.body;
    if (!litresFilled || Number(litresFilled) <= 0) {
      return res.status(400).json({ success: false, message: 'litresFilled must be a positive number' });
    }

    const newLitres = Number(litresFilled);
    const alreadyFilled = (trip.fuelLogs || []).reduce((s, l) => s + (l.litresFilled || 0), 0);
    const cap = trip.estimatedFuelLitres || 0;

    // Enforce cap only when admin has set an allocation
    if (cap > 0 && alreadyFilled + newLitres > cap) {
      const remaining = cap - alreadyFilled;
      return res.status(400).json({
        success: false,
        message: `Fuel cap exceeded. You can fill at most ${remaining.toFixed(1)} L more (cap: ${cap} L, already filled: ${alreadyFilled} L).`
      });
    }

    trip.fuelLogs.push({
      litresFilled: newLitres,
      receiptBills: receiptBills || [],
      note: note || '',
      filledBy: filledBy || '',
      filledAt: new Date()
    });
    trip.updatedAt = new Date();
    await trip.save();

    // Update vehicle's currentFuelQty
    if (trip.vehicle) {
      await Vehicle.findByIdAndUpdate(
        trip.vehicle._id || trip.vehicle,
        { $inc: { currentFuelQty: newLitres }, updatedAt: new Date() }
      );
    }

    const updated = await populateTrip(Trip.findById(trip._id));
    res.status(200).json({ success: true, message: 'Fuel log added', data: formatTrip(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add fuel log', error: error.message });
  }
});

// ── POST /api/driver-trips/:id/report — report an issue ───────────────────────
router.post('/:id/report', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (!['assigned', 'in_progress'].includes(trip.status)) {
      return res.status(400).json({ success: false, message: 'Cannot report issue for this trip' });
    }

    const { description, severity, reportedBy } = req.body;
    if (!description?.trim()) {
      return res.status(400).json({ success: false, message: 'Issue description is required' });
    }

    trip.issueReports.push({
      description: description.trim(),
      severity: severity || 'medium',
      reportedBy: reportedBy || '',
      reportedAt: new Date()
    });
    trip.updatedAt = new Date();
    await trip.save();

    const updated = await populateTrip(Trip.findById(trip._id));
    res.status(200).json({ success: true, message: 'Issue reported', data: formatTrip(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to report issue', error: error.message });
  }
});

export default router;