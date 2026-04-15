import express from 'express';
import Trip from '../models/Trip.js';
import Payment from '../models/Payment.js';
import IssueAction from '../models/IssueAction.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';

const router = express.Router();

// ── GET /api/admin/overview ───────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    // Stats
    const [
      totalTrips, activeTrips, completedTrips,
      pendingFuel, pendingBill, paidFuel, paidBill,
      totalVehicles, totalDrivers,
    ] = await Promise.all([
      Trip.countDocuments(),
      Trip.countDocuments({ status: 'in_progress' }),
      Trip.countDocuments({ status: 'completed' }),
      Payment.countDocuments({ type: 'fuel', status: 'pending' }),
      Payment.countDocuments({ type: 'bill', status: 'pending' }),
      Payment.countDocuments({ type: 'fuel', status: 'paid' }),
      Payment.countDocuments({ type: 'bill', status: 'paid' }),
      Vehicle.countDocuments(),
      Driver.countDocuments(),
    ]);

    // Total paid amounts
    const fuelPaidAgg = await Payment.aggregate([
      { $match: { type: 'fuel', status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const billPaidAgg = await Payment.aggregate([
      { $match: { type: 'bill', status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Recent activity feed — last 20 events across trips
    const recentTrips = await Trip.find()
      .populate('vehicle', 'registrationNumber make model')
      .populate('drivers', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(15);

    const recentPOs = await IssueAction.find({ status: { $in: ['generated', 'proof_uploaded', 'closed'] } })
      .populate('trip', 'tripNumber')
      .sort({ updatedAt: -1 })
      .limit(10);

    const recentPayments = await Payment.find({ status: 'paid' })
      .populate('trip', 'tripNumber')
      .sort({ paidAt: -1 })
      .limit(10);

    // Build unified activity list
    const activity = [];

    recentTrips.forEach(t => {
      if (t.startedAt) activity.push({ time: t.startedAt, type: 'trip_start', trip: t.tripNumber, vehicle: `${t.vehicle?.make||''} ${t.vehicle?.model||''}`.trim(), regNo: t.vehicle?.registrationNumber, driver: (t.drivers||[])[0] ? `${t.drivers[0].firstName} ${t.drivers[0].lastName}` : null });
      if (t.completedAt) activity.push({ time: t.completedAt, type: 'trip_end', trip: t.tripNumber, vehicle: `${t.vehicle?.make||''} ${t.vehicle?.model||''}`.trim(), regNo: t.vehicle?.registrationNumber });
      (t.fuelLogs||[]).forEach(l => activity.push({ time: l.filledAt, type: 'fuel_fill', trip: t.tripNumber, litres: l.litresFilled, by: l.filledBy, hasBills: (l.receiptBills||[]).length > 0 }));
      (t.issueReports||[]).forEach(r => activity.push({ time: r.reportedAt, type: 'issue', trip: t.tripNumber, severity: r.severity, desc: r.description?.slice(0, 60) }));
    });

    recentPOs.forEach(a => activity.push({ time: a.generatedAt || a.createdAt, type: 'po_generated', trip: a.trip?.tripNumber, poNumber: a.poNumber, title: a.title, amount: a.totalAmount }));
    recentPOs.filter(a => a.status === 'proof_uploaded').forEach(a => activity.push({ time: a.updatedAt, type: 'proof_uploaded', trip: a.trip?.tripNumber, poNumber: a.poNumber }));
    recentPayments.forEach(p => activity.push({ time: p.paidAt, type: 'payment', payType: p.type, trip: p.trip?.tripNumber, amount: p.amount, by: p.paidByName }));

    activity.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalTrips, activeTrips, completedTrips,
          pendingFuel, pendingBill, paidFuel, paidBill,
          totalVehicles, totalDrivers,
          totalFuelPaid: fuelPaidAgg[0]?.total || 0,
          totalBillPaid: billPaidAgg[0]?.total || 0,
        },
        activity: activity.slice(0, 25),
      },
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ success: false, message: 'Failed to load overview', error: err.message });
  }
});

export default router;