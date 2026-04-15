// backend/routes/trips.js
import express from 'express';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Helper from '../models/Helper.js';
import SiteSupervisor from '../models/SiteSupervisor.js';

const router = express.Router();

// ── Populate fields ────────────────────────────────────────────────────────────
const VEHICLE_FIELDS = 'registrationNumber make model fuelType photos color status currentFuelQty licensePlate year';
const DRIVER_FIELDS  = 'firstName lastName phone profilePhoto status email';
const HELPER_FIELDS  = 'firstName lastName phone profilePhoto status email';
const SUPER_FIELDS   = 'firstName lastName phone profilePhoto status email';

const populateTrip = (query) =>
  query
    .populate('vehicle', VEHICLE_FIELDS)
    .populate('drivers', DRIVER_FIELDS)
    .populate('helpers', HELPER_FIELDS)
    .populate('supervisors', SUPER_FIELDS);

// ── Format trip for frontend ───────────────────────────────────────────────────
const formatTrip = (trip) => ({
  _id: trip._id,
  tripNumber: trip.tripNumber,
  vehicle: trip.vehicle,
  // staff
  drivers: trip.drivers || [],
  helpers: trip.helpers || [],
  supervisors: trip.supervisors || [],
  // customer
  customerName: trip.customerName,
  customerPhone: trip.customerPhone,
  customerEmail: trip.customerEmail,
  customerAddress: trip.customerAddress,
  orderReference: trip.orderReference,
  // route
  fromLocation: trip.fromLocation,
  toLocation: trip.toLocation,
  estimatedDistance: trip.estimatedDistance,
  purpose: trip.purpose,
  // fuel
  fuelType: trip.fuelType,
  estimatedFuelLitres: trip.estimatedFuelLitres || 0,
  fuelAssignments: trip.fuelAssignments || [],
  // lifecycle
  deadline: trip.deadline ? trip.deadline.toISOString() : null,
  status: trip.status,
  startedAt: trip.startedAt ? trip.startedAt.toISOString() : null,
  completedAt: trip.completedAt ? trip.completedAt.toISOString() : null,
  officiallyClosedAt: trip.officiallyClosedAt ? trip.officiallyClosedAt.toISOString() : null,
  // actions
  fuelLogs: trip.fuelLogs || [],
  issueReports: trip.issueReports || [],
  notes: trip.notes,
  createdAt: trip.createdAt,
  updatedAt: trip.updatedAt,
});

// ── GET /api/trips ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)    filter.status = req.query.status;
    if (req.query.vehicleId) filter.vehicle = req.query.vehicleId;

    const trips = await populateTrip(Trip.find(filter).sort({ createdAt: -1 }));
    res.status(200).json({ success: true, data: trips.map(formatTrip), total: trips.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trips', error: error.message });
  }
});

// ── GET /api/trips/stats/overview ─────────────────────────────────────────────
router.get('/stats/overview', async (req, res) => {
  try {
    const [total, assigned, inProgress, completed, cancelled] = await Promise.all([
      Trip.countDocuments(),
      Trip.countDocuments({ status: 'assigned' }),
      Trip.countDocuments({ status: 'in_progress' }),
      Trip.countDocuments({ status: 'completed' }),
      Trip.countDocuments({ status: 'cancelled' }),
    ]);
    res.status(200).json({ success: true, stats: { total, assigned, inProgress, completed, cancelled } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
});

// ── GET /api/trips/:id ─────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const trip = await populateTrip(Trip.findById(req.params.id));
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.status(200).json({ success: true, data: formatTrip(trip) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trip', error: error.message });
  }
});

// ── POST /api/trips — create ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      vehicleId,
      driverIds = [],
      helperIds = [],
      supervisorIds = [],
      // customer
      customerName, customerPhone, customerEmail, customerAddress, orderReference,
      // route
      fromLocation, toLocation, estimatedDistance, purpose,
      // fuel
      estimatedFuelLitres,
      fuelAssignmentNote,
      // misc
      deadline, notes,
    } = req.body;

    if (!vehicleId) return res.status(400).json({ success: false, message: 'Vehicle is required' });
    if (!driverIds.length && !helperIds.length && !supervisorIds.length) {
      return res.status(400).json({ success: false, message: 'At least one staff member must be assigned' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    // Build initial fuel assignment log if estimatedFuelLitres provided
    const fuelAssignments = [];
    const fuelQty = estimatedFuelLitres ? Number(estimatedFuelLitres) : 0;
    if (fuelQty > 0) {
      fuelAssignments.push({
        litres: fuelQty,
        note: fuelAssignmentNote || 'Initial fuel allocation',
        assignedAt: new Date(),
      });
    }

    const trip = new Trip({
      vehicle: vehicleId,
      drivers: driverIds,
      helpers: helperIds,
      supervisors: supervisorIds,
      customerName, customerPhone, customerEmail, customerAddress, orderReference,
      fromLocation, toLocation,
      estimatedDistance,
      purpose,
      fuelType: vehicle.fuelType,
      estimatedFuelLitres: fuelQty,
      fuelAssignments,
      deadline: deadline || undefined,
      notes,
      status: 'assigned',
    });

    await trip.save();

    const savedTrip = await populateTrip(Trip.findById(trip._id));
    res.status(201).json({ success: true, message: 'Trip created successfully', data: formatTrip(savedTrip) });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ success: false, message: 'Failed to create trip', error: error.message });
  }
});

// ── PATCH /api/trips/:id/add-fuel — admin adds more fuel allocation ────────────
router.patch('/:id/add-fuel', async (req, res) => {
  try {
    const { litres, note } = req.body;
    if (!litres || Number(litres) <= 0) {
      return res.status(400).json({ success: false, message: 'Litres must be a positive number' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (trip.status === 'completed' || trip.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot add fuel to a completed or cancelled trip' });
    }

    trip.fuelAssignments.push({
      litres: Number(litres),
      note: note || '',
      assignedAt: new Date(),
    });

    // Recompute estimated total
    trip.estimatedFuelLitres = trip.fuelAssignments.reduce((s, fa) => s + (fa.litres || 0), 0);
    trip.updatedAt = new Date();
    await trip.save();

    const updatedTrip = await populateTrip(Trip.findById(trip._id));
    res.status(200).json({ success: true, message: 'Fuel allocation updated', data: formatTrip(updatedTrip) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add fuel allocation', error: error.message });
  }
});

// ── DELETE /api/trips/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Cannot delete a trip that has already started' });
    }
    await Trip.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete trip', error: error.message });
  }
});

// ── PATCH /api/trips/:id/close — officially close ─────────────────────────────
router.patch('/:id/close', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Trip must be completed before it can be officially closed' });
    }
    trip.officiallyClosedAt = new Date();
    trip.updatedAt = new Date();
    await trip.save();

    const updatedTrip = await populateTrip(Trip.findById(trip._id));
    res.status(200).json({ success: true, message: 'Trip officially closed', data: formatTrip(updatedTrip) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to close trip', error: error.message });
  }
});

export default router;