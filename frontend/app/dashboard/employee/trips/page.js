'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Eye, Trash2, Car, Users, MapPin, Fuel, Clock,
  CheckCircle, AlertTriangle, Loader, XCircle, ChevronRight, Flag, Timer
} from 'lucide-react';

const statusConfig = {
  assigned:    { label: 'Assigned',    color: 'bg-blue-100 text-blue-800',   barColor: 'bg-indigo-400' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', barColor: 'bg-yellow-400' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-800',  barColor: 'bg-green-400' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-800',     barColor: 'bg-red-400' },
};

// ── Duration helpers ───────────────────────────────────────────────────────────
function msToHM(ms) {
  if (!ms || ms < 0) return '—';
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function TripDuration({ trip }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (trip.status !== 'in_progress') return;
    const interval = setInterval(() => setNow(Date.now()), 30000); // refresh every 30s on list
    return () => clearInterval(interval);
  }, [trip.status]);

  if (trip.status === 'in_progress' && trip.startedAt) {
    const elapsed = now - new Date(trip.startedAt).getTime();
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
        <Timer size={11} /> {msToHM(elapsed)}
      </span>
    );
  }
  if (trip.status === 'completed' && trip.startedAt && trip.completedAt) {
    const duration = new Date(trip.completedAt).getTime() - new Date(trip.startedAt).getTime();
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <Timer size={11} /> {msToHM(duration)}
      </span>
    );
  }
  return null;
}

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [closingId, setClosingId] = useState(null);

  const stats = {
    total:      trips.length,
    assigned:   trips.filter(t => t.status === 'assigned').length,
    inProgress: trips.filter(t => t.status === 'in_progress').length,
    completed:  trips.filter(t => t.status === 'completed').length,
  };

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setTrips(result.data || []);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (trip) => {
    if (!confirm(`Delete trip ${trip.tripNumber}? This cannot be undone.`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${trip._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) { alert(result.message); return; }
      setTrips(prev => prev.filter(t => t._id !== trip._id));
    } catch { alert('Failed to delete trip'); }
  };

  const handleClose = async (trip) => {
    if (!confirm(`Officially close trip ${trip.tripNumber}?`)) return;
    setClosingId(trip._id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${trip._id}/close`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) { alert(result.message); return; }
      setTrips(prev => prev.map(t => t._id === trip._id ? result.data : t));
    } catch { alert('Failed to close trip'); }
    finally { setClosingId(null); }
  };

  const filtered = trips.filter(trip => {
    const q = search.toLowerCase();
    const allNames = [
      ...(trip.drivers || []).map(d => `${d.firstName} ${d.lastName}`),
      ...(trip.helpers || []).map(h => `${h.firstName} ${h.lastName}`),
      ...(trip.supervisors || []).map(s => `${s.firstName} ${s.lastName}`),
    ].join(' ').toLowerCase();
    const matchSearch =
      trip.tripNumber?.toLowerCase().includes(q) ||
      trip.fromLocation?.toLowerCase().includes(q) ||
      trip.toLocation?.toLowerCase().includes(q) ||
      trip.vehicle?.registrationNumber?.toLowerCase().includes(q) ||
      trip.customerName?.toLowerCase().includes(q) ||
      allNames.includes(q);
    const matchStatus = filterStatus ? trip.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const isOverdue  = (trip) => trip.deadline && trip.status !== 'completed' && new Date(trip.deadline) < new Date();

  return (
    <div className="container-main">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage and track all vehicle trips</p>
        </div>
        <Link href="/dashboard/employee/trips/create">
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Create New Trip
          </button>
        </Link>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Trips',  value: stats.total,      color: 'bg-indigo-100', ic: 'text-indigo-600', icon: <Flag size={22} /> },
            { label: 'Assigned',     value: stats.assigned,   color: 'bg-blue-100',   ic: 'text-blue-600',   icon: <Clock size={22} /> },
            { label: 'In Progress',  value: stats.inProgress, color: 'bg-yellow-100', ic: 'text-yellow-600', icon: <Loader size={22} /> },
            { label: 'Completed',    value: stats.completed,  color: 'bg-green-100',  ic: 'text-green-600',  icon: <CheckCircle size={22} /> },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.color}`}>
                  <span className={s.ic}>{s.icon}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by trip no., vehicle, staff, customer, route..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field sm:w-44">
          <option value="">All Status</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Trip Cards */}
      {loading ? (
        <div className="card p-10 text-center text-gray-500">Loading trips...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          {search || filterStatus ? 'No trips match your filters.' : 'No trips yet. Click "Create New Trip" to get started.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(trip => {
            const sc       = statusConfig[trip.status] || statusConfig.assigned;
            const overdue  = isOverdue(trip);
            const photo    = trip.vehicle?.photos?.[0]?.url;
            const totalFuel = trip.fuelLogs?.reduce((s, l) => s + (l.litresFilled || 0), 0) || 0;
            const allStaff = [
              ...(trip.drivers || []).map(d => ({ name: `${d.firstName} ${d.lastName}`, type: 'Driver' })),
              ...(trip.helpers || []).map(h => ({ name: `${h.firstName} ${h.lastName}`, type: 'Helper' })),
              ...(trip.supervisors || []).map(s => ({ name: `${s.firstName} ${s.lastName}`, type: 'Supervisor' })),
            ];

            return (
              <div key={trip._id} className="card overflow-hidden flex flex-col">
                <div className={`h-1 ${sc.barColor}`} />

                <div className="p-4 flex flex-col flex-1">
                  {/* Header row: trip number + status + timeline */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{trip.tripNumber}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sc.color}`}>
                          {sc.label}
                        </span>
                        {overdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            <AlertTriangle size={11} /> Overdue
                          </span>
                        )}
                      </div>
                      {trip.purpose && <p className="text-xs text-gray-500 mt-0.5 truncate">{trip.purpose}</p>}
                    </div>
                    {/* Timeline badge — right corner */}
                    <div className="flex-shrink-0">
                      <TripDuration trip={trip} />
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-center gap-3 mb-3 p-2 bg-gray-50 rounded-lg">
                    {photo ? (
                      <img src={photo} alt="vehicle" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Car size={18} className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{trip.vehicle?.make} {trip.vehicle?.model}</p>
                      <p className="text-xs text-gray-500">{trip.vehicle?.registrationNumber}</p>
                    </div>
                    {trip.fuelType && (
                      <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                        <Fuel size={11} /> {trip.fuelType}
                      </span>
                    )}
                  </div>

                  {/* Assigned staff */}
                  {allStaff.length > 0 && (
                    <div className="flex items-center gap-1 mb-3 flex-wrap">
                      <Users size={13} className="text-gray-400 flex-shrink-0" />
                      {allStaff.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                          {s.name}
                        </span>
                      ))}
                      {allStaff.length > 3 && (
                        <span className="text-xs text-gray-500">+{allStaff.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Customer */}
                  {trip.customerName && (
                    <p className="text-xs text-gray-500 mb-2">
                      Customer: <span className="font-medium text-gray-700">{trip.customerName}</span>
                    </p>
                  )}

                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{trip.fromLocation || '—'}</span>
                    <ChevronRight size={13} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">{trip.toLocation || '—'}</span>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                    {trip.estimatedDistance && <span>{trip.estimatedDistance} km est.</span>}
                    {trip.deadline && <span className={overdue ? 'text-red-600 font-medium' : ''}>Due: {formatDate(trip.deadline)}</span>}
                    {totalFuel > 0 && (
                      <span className="flex items-center gap-1">
                        <Fuel size={11} /> {totalFuel}/{trip.estimatedFuelLitres || '?'}L
                      </span>
                    )}
                    {trip.issueReports?.length > 0 && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <AlertTriangle size={11} /> {trip.issueReports.length} issue{trip.issueReports.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100">
                    <Link href={`/dashboard/employee/trips/${trip._id}`} className="flex-1">
                      <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                        <Eye size={15} /> View
                      </button>
                    </Link>
                    {trip.status === 'completed' && !trip.officiallyClosedAt && (
                      <button
                        onClick={() => handleClose(trip)}
                        disabled={closingId === trip._id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <CheckCircle size={15} /> {closingId === trip._id ? 'Closing...' : 'Finish Trip'}
                      </button>
                    )}
                    {trip.status === 'assigned' && (
                      <button
                        onClick={() => handleDelete(trip)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}