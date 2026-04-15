'use client';

import { useState, useEffect } from 'react';
import {
  Flag, MapPin, ChevronRight, Fuel, Clock, CheckCircle,
  AlertTriangle, Loader, XCircle, Receipt, AlertCircle
} from 'lucide-react';

const statusConfig = {
  assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

export default function DriverTripHistoryPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      fetchTrips(u.id);
    }
  }, []);

  const fetchTrips = async (driverId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/my?driverId=${driverId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      setTrips(result.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const filtered = trips.filter(t => {
    const q = search.toLowerCase();
    return (
      t.tripNumber?.toLowerCase().includes(q) ||
      t.fromLocation?.toLowerCase().includes(q) ||
      t.toLocation?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container-main">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Trip History</h1>
        <p className="text-gray-500 mt-1 text-sm">All trips assigned to you</p>
      </div>

      <div className="card p-4 mb-6">
        <input
          type="text"
          placeholder="Search by trip number or route..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
        />
      </div>

      {loading ? (
        <div className="card p-10 text-center text-gray-500">Loading trip history...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Flag size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{search ? 'No trips match your search.' : 'No trip history yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(trip => {
            const sc = statusConfig[trip.status] || statusConfig.assigned;
            const totalFuel = trip.fuelLogs?.reduce((s, l) => s + (l.litresFilled || 0), 0) || 0;
            return (
              <div key={trip._id} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-gray-900">{trip.tripNumber}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sc.color}`}>{sc.label}</span>
                    {trip.officiallyClosedAt && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        <Flag size={10} /> Closed
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{fmt(trip.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <MapPin size={13} className="text-gray-400" />
                  {trip.fromLocation || '—'} <ChevronRight size={13} className="text-gray-400" /> {trip.toLocation || '—'}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                  {trip.purpose && <span>{trip.purpose}</span>}
                  {trip.estimatedDistance && <span>{trip.estimatedDistance} km</span>}
                  {totalFuel > 0 && <span className="flex items-center gap-1"><Fuel size={11} /> {totalFuel}L filled</span>}
                  {trip.fuelLogs?.length > 0 && <span className="flex items-center gap-1"><Receipt size={11} /> {trip.fuelLogs.length} fuel log{trip.fuelLogs.length > 1 ? 's' : ''}</span>}
                  {trip.issueReports?.length > 0 && (
                    <span className="flex items-center gap-1 text-orange-600">
                      <AlertTriangle size={11} /> {trip.issueReports.length} issue{trip.issueReports.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {trip.startedAt && <span>Started: {fmt(trip.startedAt)}</span>}
                  {trip.completedAt && <span>Completed: {fmt(trip.completedAt)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}