'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Car, Users, Search, X, Check, Fuel, MapPin,
  Gauge, AlertCircle, CheckCircle, Wrench, UserCircle, Phone, Mail, Building2
} from 'lucide-react';

// ─── Vehicle Selector Modal ────────────────────────────────────────────────────
function VehicleModal({ onSelect, onClose }) {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setVehicles(result.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = vehicles.filter(v =>
    v.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.make?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s) => s === 'active' ? 'text-green-600' : s === 'maintenance' ? 'text-yellow-600' : 'text-red-500';
  const statusIcon  = (s) => s === 'active' ? <CheckCircle size={13} /> : s === 'maintenance' ? <Wrench size={13} /> : <AlertCircle size={13} />;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900">Select Vehicle</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={22} /></button>
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by reg. no., make or model..." value={search}
              onChange={e => setSearch(e.target.value)} className="input-field pl-9" autoFocus />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loading ? <p className="col-span-2 text-center text-gray-500 py-8">Loading...</p>
          : filtered.length === 0 ? <p className="col-span-2 text-center text-gray-500 py-8">No vehicles found</p>
          : filtered.map(v => (
            <button key={v._id} onClick={() => onSelect(v)}
              className="text-left border border-gray-200 rounded-xl p-3 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all">
              <div className="flex gap-3">
                {v.photos?.[0]?.url ? (
                  <img src={v.photos[0].url} alt="" className="w-16 h-14 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-16 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Car size={24} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{v.make} {v.model}</p>
                  <p className="text-xs text-gray-500 mb-1">{v.registrationNumber}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`flex items-center gap-1 ${statusColor(v.status)}`}>{statusIcon(v.status)} {v.status}</span>
                    {v.fuelType && <span className="flex items-center gap-1 text-gray-500"><Fuel size={11} />{v.fuelType}</span>}
                    {v.currentFuelQty !== undefined && <span className="flex items-center gap-1 text-gray-500"><Gauge size={11} />{v.currentFuelQty}L</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Staff Multi-Select Section ────────────────────────────────────────────────
function StaffPicker({ label, items, loading, selectedIds, onToggle, searchPlaceholder }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    return `${item.firstName} ${item.lastName}`.toLowerCase().includes(q) ||
      item.phone?.includes(q) || item.email?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {selectedIds.length > 0 && (
          <span className="text-xs text-indigo-600 font-medium">{selectedIds.length} selected</span>
        )}
      </div>
      <div className="relative mb-2">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder={searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-9 py-2 text-sm" />
      </div>
      {loading ? <p className="text-xs text-gray-400 py-2">Loading...</p>
      : filtered.length === 0 ? <p className="text-xs text-gray-400 py-2">No {label.toLowerCase()} found</p>
      : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {filtered.map(item => {
            const selected = selectedIds.includes(item._id);
            return (
              <label key={item._id}
                className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer transition-all ${
                  selected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}>
                <input type="checkbox" checked={selected} onChange={() => onToggle(item._id)} className="hidden" />
                {item.profilePhoto?.url ? (
                  <img src={item.profilePhoto.url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.firstName} {item.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{item.phone}</p>
                </div>
                <span className={`text-xs flex-shrink-0 font-medium ${item.status === 'Active' ? 'text-green-600' : 'text-gray-400'}`}>
                  {item.status}
                </span>
                {selected && <Check size={15} className="text-indigo-600 flex-shrink-0" />}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Create Trip Page ─────────────────────────────────────────────────────
export default function CreateTripPage() {
  const router = useRouter();

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [drivers,     setDrivers]     = useState([]);
  const [helpers,     setHelpers]     = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [selectedDriverIds,     setSelectedDriverIds]     = useState([]);
  const [selectedHelperIds,     setSelectedHelperIds]     = useState([]);
  const [selectedSupervisorIds, setSelectedSupervisorIds] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    // customer
    customerName: '', customerPhone: '', customerEmail: '', customerAddress: '', orderReference: '',
    // route
    fromLocation: '', toLocation: '', estimatedDistance: '', purpose: '',
    // fuel
    estimatedFuelLitres: '', fuelAssignmentNote: '',
    // misc
    deadline: '', notes: '',
  });

  useEffect(() => {
    const fetchStaff = async () => {
      setStaffLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const base = process.env.NEXT_PUBLIC_API_URL;
      try {
        const [dRes, hRes, sRes] = await Promise.all([
          fetch(`${base}/api/drivers`,           { headers }),
          fetch(`${base}/api/helpers`,           { headers }),
          fetch(`${base}/api/site-supervisors`,  { headers }),
        ]);
        const [dData, hData, sData] = await Promise.all([dRes.json(), hRes.json(), sRes.json()]);
        setDrivers(dData.data || []);
        setHelpers(hData.data || []);
        setSupervisors(sData.data || []);
      } catch (e) { console.error(e); }
      finally { setStaffLoading(false); }
    };
    fetchStaff();
  }, []);

  const toggleId = (setter) => (id) =>
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const totalSelected = selectedDriverIds.length + selectedHelperIds.length + selectedSupervisorIds.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) { alert('Please select a vehicle'); return; }
    if (totalSelected === 0) { alert('Please assign at least one staff member'); return; }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          vehicleId: selectedVehicle._id,
          driverIds:     selectedDriverIds,
          helperIds:     selectedHelperIds,
          supervisorIds: selectedSupervisorIds,
          customerName:     form.customerName,
          customerPhone:    form.customerPhone,
          customerEmail:    form.customerEmail,
          customerAddress:  form.customerAddress,
          orderReference:   form.orderReference,
          fromLocation:     form.fromLocation,
          toLocation:       form.toLocation,
          estimatedDistance: form.estimatedDistance ? Number(form.estimatedDistance) : undefined,
          purpose:          form.purpose,
          estimatedFuelLitres: form.estimatedFuelLitres ? Number(form.estimatedFuelLitres) : undefined,
          fuelAssignmentNote:  form.fuelAssignmentNote,
          deadline: form.deadline || undefined,
          notes:    form.notes,
        }),
      });
      const result = await res.json();
      if (!res.ok) { alert(result.message || 'Failed to create trip'); return; }
      router.push('/dashboard/employee/trips');
    } catch (err) {
      alert('Failed to create trip');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-main">
      <Link href="/dashboard/employee/trips">
        <button className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 mb-6 text-sm">
          <ChevronLeft size={18} /> Back to Trips
        </button>
      </Link>

      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Trip</h1>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Vehicle ─────────────────────────────────────────────────────── */}
          <section>
            <h2 className="section-title">Vehicle</h2>
            {selectedVehicle ? (
              <div className="flex items-center gap-4 p-3 border border-indigo-300 bg-indigo-50 rounded-xl">
                {selectedVehicle.photos?.[0]?.url ? (
                  <img src={selectedVehicle.photos[0].url} alt="" className="w-14 h-12 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-14 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Car size={22} className="text-indigo-500" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{selectedVehicle.make} {selectedVehicle.model}</p>
                  <p className="text-sm text-gray-500">{selectedVehicle.registrationNumber}</p>
                  <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                    {selectedVehicle.fuelType && <span className="flex items-center gap-1"><Fuel size={10} />{selectedVehicle.fuelType}</span>}
                    {selectedVehicle.currentFuelQty !== undefined && <span><Gauge size={10} className="inline mr-0.5" />{selectedVehicle.currentFuelQty}L current</span>}
                  </div>
                </div>
                <button type="button" onClick={() => setShowVehicleModal(true)} className="text-xs text-indigo-600 hover:underline">
                  Change
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowVehicleModal(true)}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                <Car size={20} /> Click to select a vehicle
              </button>
            )}
          </section>

          {/* ── Customer / Order Info ─────────────────────────────────────── */}
          <section>
            <h2 className="section-title">Customer / Order Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label"><UserCircle size={14} className="inline mr-1" />Customer Name</label>
                <input name="customerName" value={form.customerName} onChange={handleChange} className="input-field" placeholder="e.g. Ramesh Enterprises" />
              </div>
              <div className="form-group">
                <label className="form-label"><Phone size={14} className="inline mr-1" />Customer Phone</label>
                <input name="customerPhone" value={form.customerPhone} onChange={handleChange} className="input-field" placeholder="e.g. +91 98765 43210" />
              </div>
              <div className="form-group">
                <label className="form-label"><Mail size={14} className="inline mr-1" />Customer Email</label>
                <input type="email" name="customerEmail" value={form.customerEmail} onChange={handleChange} className="input-field" placeholder="customer@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label"><Building2 size={14} className="inline mr-1" />Order / PO Reference</label>
                <input name="orderReference" value={form.orderReference} onChange={handleChange} className="input-field" placeholder="e.g. PO-2024-001" />
              </div>
              <div className="form-group sm:col-span-2">
                <label className="form-label"><MapPin size={14} className="inline mr-1" />Customer Address / Delivery Point</label>
                <input name="customerAddress" value={form.customerAddress} onChange={handleChange} className="input-field" placeholder="Full delivery address" />
              </div>
            </div>
          </section>

          {/* ── Trip Details ─────────────────────────────────────────────── */}
          <section>
            <h2 className="section-title">Trip Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">From Location</label>
                <input name="fromLocation" value={form.fromLocation} onChange={handleChange} className="input-field" placeholder="e.g. Warehouse, Jajpur" />
              </div>
              <div className="form-group">
                <label className="form-label">To Location</label>
                <input name="toLocation" value={form.toLocation} onChange={handleChange} className="input-field" placeholder="e.g. Client Site, Bhubaneswar" />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Distance (km)</label>
                <input type="number" name="estimatedDistance" value={form.estimatedDistance} onChange={handleChange} className="input-field" min="0" placeholder="e.g. 120" />
              </div>
              <div className="form-group">
                <label className="form-label">Trip Deadline</label>
                <input type="date" name="deadline" value={form.deadline} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group sm:col-span-2">
                <label className="form-label">Purpose / Description</label>
                <input name="purpose" value={form.purpose} onChange={handleChange} className="input-field" placeholder="e.g. Goods delivery — steel pipes" />
              </div>
            </div>
          </section>

          {/* ── Fuel Allocation ──────────────────────────────────────────── */}
          <section>
            <h2 className="section-title">Fuel Allocation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Fuel Type</label>
                <input value={selectedVehicle?.fuelType || '—'} readOnly className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Auto-filled from vehicle</p>
              </div>
              <div className="form-group">
                <label className="form-label">Allocated Fuel (litres) <span className="text-xs text-gray-400">— max cap for staff</span></label>
                <input type="number" name="estimatedFuelLitres" value={form.estimatedFuelLitres}
                  onChange={handleChange} className="input-field" min="0" step="0.5" placeholder="e.g. 40" />
              </div>
              <div className="form-group sm:col-span-2">
                <label className="form-label">Fuel Allocation Note</label>
                <input name="fuelAssignmentNote" value={form.fuelAssignmentNote} onChange={handleChange}
                  className="input-field" placeholder="e.g. Initial allocation for Bhubaneswar trip" />
              </div>
            </div>
          </section>

          {/* ── Assign Staff ──────────────────────────────────────────────── */}
          <section>
            <h2 className="section-title">
              Assign Staff
              {totalSelected > 0 && (
                <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {totalSelected} selected
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Select one or more drivers, helpers, and/or supervisors. All selected staff will have access to this trip.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <StaffPicker label="Drivers" items={drivers} loading={staffLoading}
                selectedIds={selectedDriverIds} onToggle={toggleId(setSelectedDriverIds)}
                searchPlaceholder="Search drivers..." />
              <StaffPicker label="Helpers" items={helpers} loading={staffLoading}
                selectedIds={selectedHelperIds} onToggle={toggleId(setSelectedHelperIds)}
                searchPlaceholder="Search helpers..." />
              <StaffPicker label="Site Supervisors" items={supervisors} loading={staffLoading}
                selectedIds={selectedSupervisorIds} onToggle={toggleId(setSelectedSupervisorIds)}
                searchPlaceholder="Search supervisors..." />
            </div>
          </section>

          {/* ── Notes ────────────────────────────────────────────────────── */}
          <section>
            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field" rows={3} />
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Create Trip'}
            </button>
            <Link href="/dashboard/employee/trips">
              <button type="button" className="btn-secondary">Cancel</button>
            </Link>
          </div>
        </form>
      </div>

      {showVehicleModal && (
        <VehicleModal onSelect={v => { setSelectedVehicle(v); setShowVehicleModal(false); }} onClose={() => setShowVehicleModal(false)} />
      )}

      <style jsx>{`
        .section-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #374151;
          padding-bottom: 0.5rem;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}