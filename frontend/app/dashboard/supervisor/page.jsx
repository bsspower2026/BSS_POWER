'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flag, MapPin, ChevronRight, Fuel, Clock, CheckCircle,
  AlertTriangle, Car, Users, Timer, Gauge, Receipt, Phone
} from 'lucide-react';

const statusConfig = {
  assigned:    { label: 'Assigned',    color: 'bg-blue-100 text-blue-800',   bar: 'bg-indigo-400' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-400' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-800',  bar: 'bg-green-400' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-800',     bar: 'bg-red-400' },
};

function msToHM(ms) {
  if (!ms || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

function DurationBadge({ trip }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (trip.status !== 'in_progress') return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [trip.status]);

  if (trip.status === 'in_progress' && trip.startedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
        <Timer size={11} /> {msToHM(now - new Date(trip.startedAt).getTime())}
      </span>
    );
  }
  if (trip.status === 'completed' && trip.startedAt && trip.completedAt) {
    const dur = new Date(trip.completedAt).getTime() - new Date(trip.startedAt).getTime();
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <Timer size={11} /> {msToHM(dur)}
      </span>
    );
  }
  return null;
}

export default function SupervisorDashboard() {
  const [trips, setTrips]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser]       = useState(null);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('');

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    if (u?.id) fetchTrips(u.id);
  }, []);

  const fetchTrips = async (staffId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/my?staffId=${staffId}&staffType=supervisor`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      setTrips(result.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const stats = {
    total:      trips.length,
    active:     trips.filter(t => t.status === 'in_progress').length,
    assigned:   trips.filter(t => t.status === 'assigned').length,
    completed:  trips.filter(t => t.status === 'completed').length,
  };

  const filtered = trips.filter(t => {
    const q = search.toLowerCase();
    const matchSearch =
      t.tripNumber?.toLowerCase().includes(q) ||
      t.fromLocation?.toLowerCase().includes(q) ||
      t.toLocation?.toLowerCase().includes(q) ||
      t.customerName?.toLowerCase().includes(q) ||
      t.vehicle?.registrationNumber?.toLowerCase().includes(q);
    const matchStatus = filter ? t.status === filter : true;
    return matchSearch && matchStatus;
  });

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const isOverdue = (t) => t.deadline && t.status !== 'completed' && new Date(t.deadline) < new Date();

  return (
    <div className="container-main">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome{user?.name ? `, ${user.name}` : ''}. All trips assigned to you are listed below.
        </p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Assigned',  value: stats.total,     color: 'bg-indigo-100', ic: 'text-indigo-600' },
            { label: 'Assigned',        value: stats.assigned,  color: 'bg-blue-100',   ic: 'text-blue-600' },
            { label: 'In Progress',     value: stats.active,    color: 'bg-yellow-100', ic: 'text-yellow-600' },
            { label: 'Completed',       value: stats.completed, color: 'bg-green-100',  ic: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <div className={`text-3xl font-bold ${s.ic} mb-1`}>{s.value}</div>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search by trip no., vehicle, customer, route..."
          value={search} onChange={e => setSearch(e.target.value)} className="input-field flex-1" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field sm:w-44">
          <option value="">All Status</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Trip List */}
      {loading ? (
        <div className="card p-10 text-center text-gray-500">Loading trips...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Flag size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">{search || filter ? 'No trips match your filters.' : 'No trips assigned to you yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(trip => {
            const sc         = statusConfig[trip.status] || statusConfig.assigned;
            const overdue    = isOverdue(trip);
            const photo      = trip.vehicle?.photos?.[0]?.url;
            const totalFuel  = trip.fuelLogs?.reduce((s, l) => s + (l.litresFilled || 0), 0) || 0;
            const allDrivers = [...(trip.drivers || []), ...(trip.helpers || [])];

            return (
              <div key={trip._id} className="card overflow-hidden flex flex-col">
                <div className={`h-1 ${sc.bar}`} />

                <div className="p-4 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{trip.tripNumber}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${sc.color}`}>{sc.label}</span>
                        {overdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                            <AlertTriangle size={11} /> Overdue
                          </span>
                        )}
                      </div>
                      {trip.purpose && <p className="text-xs text-gray-500 mt-0.5 truncate">{trip.purpose}</p>}
                    </div>
                    <DurationBadge trip={trip} />
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-center gap-3 mb-3 p-2 bg-gray-50 rounded-lg">
                    {photo ? (
                      <img src={photo} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Car size={18} className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{trip.vehicle?.make} {trip.vehicle?.model}</p>
                      <p className="text-xs text-gray-500">{trip.vehicle?.registrationNumber}</p>
                    </div>
                  </div>

                  {/* Drivers/Helpers assigned */}
                  {allDrivers.length > 0 && (
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      <Users size={12} className="text-gray-400" />
                      {allDrivers.slice(0, 2).map((d, i) => (
                        <span key={i} className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                          {d.firstName} {d.lastName}
                        </span>
                      ))}
                      {allDrivers.length > 2 && <span className="text-xs text-gray-400">+{allDrivers.length - 2}</span>}
                    </div>
                  )}

                  {/* Customer */}
                  {trip.customerName && (
                    <p className="text-xs text-gray-500 mb-2">
                      Customer: <span className="font-medium text-gray-700">{trip.customerName}</span>
                      {trip.customerPhone && <span> · {trip.customerPhone}</span>}
                    </p>
                  )}

                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{trip.fromLocation || '—'}</span>
                    <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{trip.toLocation || '—'}</span>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                    {trip.estimatedDistance && <span><Gauge size={11} className="inline mr-1" />{trip.estimatedDistance} km</span>}
                    {trip.deadline && <span className={overdue ? 'text-red-600 font-medium' : ''}>Due: {fmt(trip.deadline)}</span>}
                    {totalFuel > 0 && <span className="flex items-center gap-1"><Fuel size={11} />{totalFuel}L filled</span>}
                    {trip.issueReports?.length > 0 && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <AlertTriangle size={11} /> {trip.issueReports.length} issue{trip.issueReports.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Fuel log quick summary for supervisors */}
                  {trip.fuelLogs?.length > 0 && (
                    <div className="mt-auto mb-3 p-2 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-yellow-700">
                        <Fuel size={11} className="inline mr-1" />
                        {totalFuel}L filled in {trip.fuelLogs.length} log{trip.fuelLogs.length > 1 ? 's' : ''}
                        {trip.estimatedFuelLitres > 0 && ` / ${trip.estimatedFuelLitres}L cap`}
                      </p>
                    </div>
                  )}

                  {/* View link — read-only for supervisors */}
                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <Link href={`/dashboard/driver/trip/${trip._id}`}>
                      <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                        View Trip Details
                      </button>
                    </Link>
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