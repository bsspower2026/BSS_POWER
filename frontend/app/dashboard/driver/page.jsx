'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Car, MapPin, Fuel, Clock, CheckCircle, AlertTriangle,
  PlayCircle, StopCircle, Upload, X, ChevronRight, Receipt,
  AlertCircle, Gauge, Flag, Timer, Users, Phone
} from 'lucide-react';
import { uploadMultipleToCloudinary } from '../../../lib/upload';

// ─── Live Timer Component ──────────────────────────────────────────────────────
function LiveTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () => setElapsed(Date.now() - new Date(startedAt).getTime());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const totalSec  = Math.floor(elapsed / 1000);
  const hours     = Math.floor(totalSec / 3600);
  const minutes   = Math.floor((totalSec % 3600) / 60);
  const seconds   = totalSec % 60;
  const pad       = (n) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl">
      <Timer size={22} className="text-yellow-600 flex-shrink-0" />
      <div>
        <p className="text-xs font-medium text-yellow-600">Trip Running</p>
        <p className="text-2xl font-mono font-bold text-yellow-700 leading-tight tracking-wider">
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </p>
      </div>
    </div>
  );
}

// ─── Fill Fuel Modal ───────────────────────────────────────────────────────────
function FuelModal({ tripId, maxRemaining, onClose, onSuccess }) {
  const [litresFilled, setLitresFilled] = useState('');
  const [note, setNote]     = useState('');
  const [bills, setBills]   = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (bills.length + files.length > 5) { alert('Max 5 bills'); return; }
    setUploading(true);
    try {
      const results = await uploadMultipleToCloudinary(files);
      setBills(prev => [...prev, ...results.map(r => ({ url: r.url, publicId: r.publicId }))]);
    } catch { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!litresFilled || Number(litresFilled) <= 0) { alert('Enter litres filled'); return; }
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/${tripId}/fuel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ litresFilled: Number(litresFilled), receiptBills: bills, note, filledBy: user.name }),
      });
      const result = await res.json();
      if (!res.ok) { alert(result.message); return; }
      onSuccess(result.data);
      onClose();
    } catch { alert('Failed to log fuel'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Fuel size={18} /> Fill Fuel</h3>
          <button onClick={onClose}><X size={22} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-5 space-y-4">
          {maxRemaining !== null && maxRemaining !== undefined && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <Fuel size={14} className="inline mr-1" />
              You can fill up to <strong>{maxRemaining.toFixed(1)}L</strong> more (allocated cap).
            </div>
          )}
          <div>
            <label className="form-label">Litres Filled *</label>
            <input type="number" value={litresFilled} onChange={e => setLitresFilled(e.target.value)}
              className="input-field" min="0.1" step="0.5"
              max={maxRemaining > 0 ? maxRemaining : undefined}
              placeholder={maxRemaining > 0 ? `Max ${maxRemaining.toFixed(1)}L` : 'e.g. 25'} autoFocus />
          </div>
          <div>
            <label className="form-label">Note (optional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} className="input-field"
              placeholder="e.g. Filled at HP Pump, NH-55" />
          </div>
          <div>
            <label className="form-label">Receipt Bills (max 5)</label>
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm w-fit">
              <Upload size={15} /> {uploading ? 'Uploading...' : 'Choose Files'}
              <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple onChange={handleFileChange} disabled={uploading} className="hidden" />
            </label>
            {bills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {bills.map((b, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded">
                    <Receipt size={11} /> Bill {i+1}
                    <button onClick={() => setBills(prev => prev.filter((_, j) => j !== i))} className="ml-1 text-red-400">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={handleSubmit} disabled={submitting || uploading} className="btn-primary flex-1">
            {submitting ? 'Saving...' : 'Upload & Save'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Report Issue Modal ────────────────────────────────────────────────────────
function IssueModal({ tripId, onClose, onSuccess }) {
  const [description, setDescription] = useState('');
  const [severity, setSeverity]       = useState('medium');
  const [submitting, setSubmitting]   = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSubmit = async () => {
    if (!description.trim()) { alert('Describe the issue'); return; }
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/${tripId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description, severity, reportedBy: user.name }),
      });
      const result = await res.json();
      if (!res.ok) { alert(result.message); return; }
      onSuccess(result.data);
      onClose();
    } catch { alert('Failed to report issue'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><AlertCircle size={18} /> Report Issue</h3>
          <button onClick={onClose}><X size={22} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="form-label">Severity</label>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map(s => (
                <label key={s} className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm font-medium capitalize transition-all ${
                  severity === s
                    ? s === 'high' ? 'bg-red-100 border-red-400 text-red-700'
                    : s === 'medium' ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                    : 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'border-gray-200 text-gray-600'}`}>
                  <input type="radio" name="severity" value={s} checked={severity === s} onChange={() => setSeverity(s)} className="hidden" />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Issue Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" rows={4}
              placeholder="Describe the issue..." autoFocus />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 bg-orange-600 hover:bg-orange-700">
            {submitting ? 'Reporting...' : 'Submit Report'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Driver Overview ──────────────────────────────────────────────────────
export default function DriverOverviewPage() {
  const [trip, setTrip]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [user, setUser]             = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      fetchActiveTrip(u.id, u.role);
    }
  }, []);

  const fetchActiveTrip = async (staffId, role) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const staffType = role === 'helper' ? 'helper' : role === 'site_supervisor' ? 'supervisor' : 'driver';
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/my/active?staffId=${staffId}&staffType=${staffType}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      setTrip(result.data || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleStart = async () => {
    if (!confirm('Start this trip?')) return;
    setActionLoading('start');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/${trip._id}/start`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) { alert(result.message); return; }
      setTrip(result.data);
    } catch { alert('Failed'); }
    finally { setActionLoading(''); }
  };

  const handleEnd = async () => {
    if (!confirm('End and complete this trip?')) return;
    setActionLoading('end');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/${trip._id}/end`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) { alert(result.message); return; }
      setTrip(result.data);
    } catch { alert('Failed'); }
    finally { setActionLoading(''); }
  };

  const fmt      = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const totalFuelFilled = trip?.fuelLogs?.reduce((s, l) => s + (l.litresFilled || 0), 0) || 0;
  const fuelRemaining   = trip?.estimatedFuelLitres > 0
    ? Math.max(0, trip.estimatedFuelLitres - totalFuelFilled)
    : null;
  const isOverdue = trip?.deadline && trip.status !== 'completed' && new Date(trip.deadline) < new Date();
  const isSupervisor = user?.role === 'site_supervisor';

  // Completed trip duration
  const completedDurationMs = trip?.startedAt && trip?.completedAt
    ? new Date(trip.completedAt).getTime() - new Date(trip.startedAt).getTime()
    : null;
  const msToHM = (ms) => {
    const mins = Math.floor(ms / 60000);
    const h = Math.floor(mins / 60), m = mins % 60;
    return h === 0 ? `${m}m` : `${h}h ${m}m`;
  };

  return (
    <div className="container-main">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Trip Overview</h1>
        <p className="text-gray-500 mt-1 text-sm">Your current or upcoming assigned trip</p>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-gray-500">Loading your trip...</div>
      ) : !trip ? (
        <div className="card p-10 text-center">
          <Flag size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No active or assigned trip right now.</p>
          <p className="text-gray-400 text-sm mt-1">Your trip will appear here once it's assigned to you.</p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          {/* Trip Header */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl font-bold text-gray-900">{trip.tripNumber}</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${
                    trip.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    trip.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {trip.status === 'assigned' ? 'Assigned' : trip.status === 'in_progress' ? 'In Progress' : 'Completed'}
                  </span>
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                      <AlertTriangle size={11} /> Overdue
                    </span>
                  )}
                </div>
                {trip.purpose && <p className="text-sm text-gray-500 mt-0.5">{trip.purpose}</p>}
              </div>

              {/* Timer — top right of the card */}
              {trip.status === 'in_progress' && trip.startedAt && (
                <LiveTimer startedAt={trip.startedAt} />
              )}
              {completedDurationMs !== null && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl flex-shrink-0">
                  <Timer size={16} className="text-green-600" />
                  <div>
                    <p className="text-xs text-green-600">Duration</p>
                    <p className="font-bold text-green-700">{msToHM(completedDurationMs)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Route */}
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium mb-3">
              <MapPin size={15} className="text-indigo-500 flex-shrink-0" />
              <span>{trip.fromLocation || '—'}</span>
              <ChevronRight size={14} className="text-gray-400" />
              <span>{trip.toLocation || '—'}</span>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {trip.estimatedDistance && <span><Gauge size={11} className="inline mr-1" />{trip.estimatedDistance} km</span>}
              {trip.deadline && <span className={isOverdue ? 'text-red-600 font-medium' : ''}><Clock size={11} className="inline mr-1" />Due: {fmtDate(trip.deadline)}</span>}
              {trip.fuelType && <span><Fuel size={11} className="inline mr-1" />{trip.fuelType}</span>}
              {trip.estimatedFuelLitres > 0 && (
                <span className={fuelRemaining !== null && fuelRemaining <= 0 ? 'text-red-600 font-medium' : ''}>
                  Fuel: {totalFuelFilled}/{trip.estimatedFuelLitres}L
                  {fuelRemaining !== null && ` (${fuelRemaining.toFixed(1)}L left)`}
                </span>
              )}
              {trip.startedAt && <span>Started: {fmt(trip.startedAt)}</span>}
            </div>
          </div>

          {/* Customer Info */}
          {trip.customerName && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Customer</h2>
              <p className="text-sm font-medium text-gray-900">{trip.customerName}</p>
              <div className="flex gap-4 text-xs text-gray-500 mt-1">
                {trip.customerPhone && <span className="flex items-center gap-1"><Phone size={11} />{trip.customerPhone}</span>}
                {trip.orderReference && <span>Ref: {trip.orderReference}</span>}
              </div>
              {trip.customerAddress && <p className="text-xs text-gray-500 mt-1"><MapPin size={11} className="inline mr-1" />{trip.customerAddress}</p>}
            </div>
          )}

          {/* Vehicle */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Car size={15} /> Vehicle</h2>
            <div className="flex items-center gap-3">
              {trip.vehicle?.photos?.[0]?.url ? (
                <img src={trip.vehicle.photos[0].url} alt="" className="w-14 h-12 object-cover rounded-lg" />
              ) : (
                <div className="w-14 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Car size={22} className="text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{trip.vehicle?.make} {trip.vehicle?.model}</p>
                <p className="text-sm text-gray-500">{trip.vehicle?.registrationNumber}</p>
                {trip.vehicle?.currentFuelQty !== undefined && (
                  <p className="text-xs text-gray-400 mt-0.5"><Gauge size={10} className="inline mr-0.5" />Current: {trip.vehicle.currentFuelQty}L</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons (not for supervisors) */}
          {!isSupervisor && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {trip.status === 'assigned' && (
                  <button onClick={handleStart} disabled={!!actionLoading}
                    className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    <PlayCircle size={20} /> {actionLoading === 'start' ? 'Starting...' : 'Start Trip'}
                  </button>
                )}
                {trip.status === 'in_progress' && (
                  <>
                    <button onClick={() => setShowFuelModal(true)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-yellow-400 text-yellow-700 font-semibold hover:bg-yellow-50">
                      <Fuel size={18} /> Fill Fuel
                    </button>
                    <button onClick={() => setShowIssueModal(true)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-orange-400 text-orange-700 font-semibold hover:bg-orange-50">
                      <AlertCircle size={18} /> Report Issue
                    </button>
                    <button onClick={handleEnd} disabled={!!actionLoading}
                      className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50">
                      <StopCircle size={20} /> {actionLoading === 'end' ? 'Ending...' : 'End Trip'}
                    </button>
                  </>
                )}
                {trip.status === 'completed' && (
                  <div className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-600">
                    <CheckCircle size={20} className="text-green-500" /> Trip Completed — Awaiting official close
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Supervisor view-only notice */}
          {isSupervisor && trip.status !== 'completed' && (
            <div className="card p-4 border-l-4 border-indigo-400 bg-indigo-50">
              <p className="text-sm text-indigo-700"><Users size={14} className="inline mr-1" />You are assigned as supervisor on this trip — view only.</p>
            </div>
          )}

          {/* Fuel log summary */}
          {trip.fuelLogs?.length > 0 && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Receipt size={15} /> Fuel Logs — {totalFuelFilled}L filled
                {trip.estimatedFuelLitres > 0 && ` / ${trip.estimatedFuelLitres}L cap`}
              </h2>
              <div className="space-y-2">
                {trip.fuelLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700 font-medium">{log.litresFilled} L</span>
                    <div className="flex items-center gap-2">
                      {log.receiptBills?.map((b, j) => (
                        <a key={j} href={b.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
                          <Receipt size={11} /> Bill {j+1}
                        </a>
                      ))}
                      <span className="text-xs text-gray-400">{fmt(log.filledAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issue reports summary */}
          {trip.issueReports?.length > 0 && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><AlertTriangle size={15} /> Issue Reports</h2>
              <div className="space-y-2">
                {trip.issueReports.map((issue, i) => (
                  <div key={i} className="p-2.5 bg-orange-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                        issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                        issue.severity === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs text-gray-400">{fmt(issue.reportedAt)}</span>
                    </div>
                    <p className="text-gray-800">{issue.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showFuelModal && trip && (
        <FuelModal tripId={trip._id} maxRemaining={fuelRemaining}
          onClose={() => setShowFuelModal(false)} onSuccess={setTrip} />
      )}
      {showIssueModal && trip && (
        <IssueModal tripId={trip._id}
          onClose={() => setShowIssueModal(false)} onSuccess={setTrip} />
      )}
    </div>
  );
}