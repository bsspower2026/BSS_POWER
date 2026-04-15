'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Car, Users, MapPin, Fuel, Clock, CheckCircle,
  AlertTriangle, ChevronRight, Flag, Gauge, Receipt,
  AlertCircle, Calendar, Timer, Plus, X, Phone, Mail,
  Building2, UserCircle, Layers, ClipboardList
} from 'lucide-react';

const statusConfig = {
  assigned:    { label: 'Assigned',    color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-800' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-800' },
};
const severityColor = { low: 'text-blue-600 bg-blue-50', medium: 'text-yellow-700 bg-yellow-50', high: 'text-red-700 bg-red-50' };

// ── Duration helpers ───────────────────────────────────────────────────────────
function msToHM(ms) {
  if (!ms || ms < 0) return '—';
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

function LiveDuration({ startedAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);
  return <>{msToHM(now - new Date(startedAt).getTime())}</>;
}

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value || <span className="text-gray-400 font-normal">—</span>}</p>
  </div>
);

// ── Admin Add Fuel Modal ───────────────────────────────────────────────────────
function AddFuelModal({ tripId, onClose, onSuccess }) {
  const [litres, setLitres] = useState('');
  const [note, setNote]     = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!litres || Number(litres) <= 0) { alert('Enter a positive litre amount'); return; }
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${tripId}/add-fuel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ litres: Number(litres), note }),
      });
      const result = await res.json();
      if (!res.ok) { alert(result.message); return; }
      onSuccess(result.data);
      onClose();
    } catch { alert('Failed to add fuel allocation'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Fuel size={17} /> Add Fuel Allocation</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">This adds to the existing fuel cap. All additions are logged for record-keeping.</p>
          <div>
            <label className="form-label">Additional Litres *</label>
            <input type="number" value={litres} onChange={e => setLitres(e.target.value)} className="input-field" min="0.1" step="0.5" placeholder="e.g. 20" autoFocus />
          </div>
          <div>
            <label className="form-label">Reason / Note</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} className="input-field" placeholder="e.g. Route extended, extra 20km added" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Add Fuel'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function TripDetailPage() {
  const params = useParams();
  const [trip, setTrip]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showAddFuel, setShowAddFuel] = useState(false);

  useEffect(() => { if (params.id) fetchTrip(); }, [params.id]);

  const fetchTrip = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setTrip(result.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleClose = async () => {
    if (!confirm('Officially close this trip?')) return;
    setClosing(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${trip._id}/close`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) { alert(result.message); return; }
      setTrip(result.data);
    } catch { alert('Failed'); }
    finally { setClosing(false); }
  };

  const fmt      = (d) => d ? new Date(d).toLocaleString('en-IN',  { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const totalFuelFilled = trip?.fuelLogs?.reduce((s, l) => s + (l.litresFilled || 0), 0) || 0;

  if (loading) return <div className="container-main py-12 text-center text-gray-500">Loading trip details...</div>;
  if (!trip)   return (
    <div className="container-main py-12 text-center">
      <p className="text-gray-500 mb-4">Trip not found.</p>
      <Link href="/dashboard/employee/trips"><button className="btn-secondary">Back to Trips</button></Link>
    </div>
  );

  const sc       = statusConfig[trip.status] || statusConfig.assigned;
  const isOverdue = trip.deadline && trip.status !== 'completed' && new Date(trip.deadline) < new Date();
  const tripDurationMs = trip.startedAt && trip.completedAt
    ? new Date(trip.completedAt).getTime() - new Date(trip.startedAt).getTime()
    : null;
  const allStaff = [
    ...(trip.drivers     || []).map(d => ({ ...d, type: 'Driver' })),
    ...(trip.helpers     || []).map(h => ({ ...h, type: 'Helper' })),
    ...(trip.supervisors || []).map(s => ({ ...s, type: 'Supervisor' })),
  ];
  const fuelCapPct = trip.estimatedFuelLitres > 0
    ? Math.min(100, Math.round((totalFuelFilled / trip.estimatedFuelLitres) * 100))
    : 0;

  return (
    <div className="container-main">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link href="/dashboard/employee/trips">
          <button className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm">
            <ChevronLeft size={18} /> Back
          </button>
        </Link>
        <div className="flex gap-2 flex-wrap">
          {trip.status === 'completed' && !trip.officiallyClosedAt && (
            <button onClick={handleClose} disabled={closing}
              className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <CheckCircle size={16} /> {closing ? 'Closing...' : 'Finish Trip (Official)'}
            </button>
          )}
        </div>
      </div>

      {/* Trip identity */}
      <div className="card p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-gray-900">{trip.tripNumber}</h1>
              <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-medium ${sc.color}`}>{sc.label}</span>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                  <AlertTriangle size={12} /> Overdue
                </span>
              )}
              {trip.officiallyClosedAt && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  <Flag size={12} /> Officially Closed
                </span>
              )}
            </div>
            {trip.purpose && <p className="text-sm text-gray-500">{trip.purpose}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1"><MapPin size={13} />{trip.fromLocation || '—'}<ChevronRight size={13} />{trip.toLocation || '—'}</span>
              {trip.estimatedDistance && <span><Gauge size={13} className="inline mr-1" />{trip.estimatedDistance} km</span>}
              {trip.deadline && <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}><Calendar size={13} />{fmtDate(trip.deadline)}</span>}
            </div>
          </div>

          {/* Timeline / Duration — top-right */}
          <div className="flex-shrink-0 text-right">
            {trip.status === 'in_progress' && trip.startedAt && (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
                <Timer size={16} className="text-yellow-600" />
                <div>
                  <p className="text-xs text-yellow-600 font-medium">Elapsed</p>
                  <p className="text-lg font-bold text-yellow-700 leading-tight">
                    <LiveDuration startedAt={trip.startedAt} />
                  </p>
                </div>
              </div>
            )}
            {tripDurationMs !== null && (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                <Timer size={16} className="text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-medium">Total Duration</p>
                  <p className="text-lg font-bold text-green-700 leading-tight">{msToHM(tripDurationMs)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Vehicle */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Car size={15} /> Vehicle</h2>
          <div className="flex gap-3">
            {trip.vehicle?.photos?.[0]?.url ? (
              <img src={trip.vehicle.photos[0].url} alt="" className="w-16 h-14 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-16 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Car size={22} className="text-gray-400" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
              <Field label="Make & Model" value={`${trip.vehicle?.make || ''} ${trip.vehicle?.model || ''}`} />
              <Field label="Reg. No."     value={trip.vehicle?.registrationNumber} />
              <Field label="Fuel Type"    value={trip.fuelType} />
              <Field label="Current Fuel" value={trip.vehicle?.currentFuelQty !== undefined ? `${trip.vehicle.currentFuelQty}L` : null} />
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><UserCircle size={15} /> Customer / Order</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Field label="Customer Name"    value={trip.customerName} />
            <Field label="Phone"            value={trip.customerPhone} />
            <Field label="Email"            value={trip.customerEmail} />
            <Field label="Order Reference"  value={trip.orderReference} />
            {trip.customerAddress && (
              <div className="col-span-2"><Field label="Delivery Address" value={trip.customerAddress} /></div>
            )}
          </div>
        </div>
      </div>

      {/* Assigned Staff */}
      <div className="card p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Users size={15} /> Assigned Staff ({allStaff.length})</h2>
        {allStaff.length === 0 ? (
          <p className="text-sm text-gray-400">No staff assigned.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allStaff.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                {s.profilePhoto?.url ? (
                  <img src={s.profilePhoto.url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Users size={17} className="text-indigo-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.firstName} {s.lastName}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">{s.type}</span>
                    <span className="text-xs text-gray-500">{s.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock size={15} /> Timeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Created"          value={fmt(trip.createdAt)} />
          <Field label="Started"          value={fmt(trip.startedAt)} />
          <Field label="Completed"        value={fmt(trip.completedAt)} />
          <Field label="Officially Closed" value={fmt(trip.officiallyClosedAt)} />
        </div>
        {tripDurationMs !== null && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Total trip duration: <span className="font-semibold text-gray-700">{msToHM(tripDurationMs)}</span></p>
          </div>
        )}
      </div>

      {/* Fuel — Admin Allocation Log + Driver Fill Log */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Fuel size={15} /> Fuel Management
          </h2>
          {['assigned', 'in_progress'].includes(trip.status) && (
            <button onClick={() => setShowAddFuel(true)}
              className="flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50">
              <Plus size={14} /> Add Fuel Allocation
            </button>
          )}
        </div>

        {/* Progress bar */}
        {trip.estimatedFuelLitres > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
              <span>Filled: <strong>{totalFuelFilled}L</strong></span>
              <span>Allocated: <strong>{trip.estimatedFuelLitres}L</strong></span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${fuelCapPct >= 90 ? 'bg-red-500' : fuelCapPct >= 70 ? 'bg-yellow-400' : 'bg-green-500'}`}
                style={{ width: `${fuelCapPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{fuelCapPct}% used · {Math.max(0, trip.estimatedFuelLitres - totalFuelFilled).toFixed(1)}L remaining</p>
          </div>
        )}

        {/* Admin Fuel Assignments */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Admin Allocations</p>
          {!trip.fuelAssignments?.length ? (
            <p className="text-sm text-gray-400">No fuel allocations recorded.</p>
          ) : (
            <div className="space-y-2">
              {trip.fuelAssignments.map((fa, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-indigo-50 rounded-lg text-sm">
                  <div className="w-7 h-7 rounded-full bg-indigo-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-700">
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-indigo-800">{fa.litres}L allocated</span>
                    {fa.note && <span className="text-gray-600"> · {fa.note}</span>}
                  </div>
                  <span className="text-xs text-gray-400">{fmt(fa.assignedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Driver/Staff Fuel Logs */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Staff Fuel Logs {totalFuelFilled > 0 && `— ${totalFuelFilled}L total filled`}
          </p>
          {!trip.fuelLogs?.length ? (
            <p className="text-sm text-gray-400">No fuel fills logged yet.</p>
          ) : (
            <div className="space-y-2">
              {trip.fuelLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <Fuel size={14} className="text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{log.litresFilled}L filled</span>
                      {log.filledBy && <span className="text-xs text-gray-500">by {log.filledBy}</span>}
                      <span className="text-xs text-gray-400">{fmt(log.filledAt)}</span>
                    </div>
                    {log.note && <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>}
                    {log.receiptBills?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {log.receiptBills.map((bill, j) => (
                          <a key={j} href={bill.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline border border-indigo-200 px-2 py-0.5 rounded">
                            <Receipt size={11} /> Bill {j + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Issue Reports */}
      <div className="card p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><AlertCircle size={15} /> Issue Reports</h2>
        {!trip.issueReports?.length ? (
          <p className="text-sm text-gray-400">No issues reported.</p>
        ) : (
          <div className="space-y-3">
            {trip.issueReports.map((issue, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${severityColor[issue.severity] || severityColor.medium}`}>
                      {issue.severity?.toUpperCase()}
                    </span>
                    {issue.reportedBy && <span className="text-xs text-gray-500">by {issue.reportedBy}</span>}
                    <span className="text-xs text-gray-400">{fmt(issue.reportedAt)}</span>
                  </div>
                  <p className="text-sm text-gray-800">{issue.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {trip.notes && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{trip.notes}</p>
        </div>
      )}

      {showAddFuel && (
        <AddFuelModal
          tripId={trip._id}
          onClose={() => setShowAddFuel(false)}
          onSuccess={updatedTrip => { setTrip(updatedTrip); }}
        />
      )}
    </div>
  );
}