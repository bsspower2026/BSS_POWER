'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Car, MapPin, Fuel, Clock, CheckCircle, AlertTriangle,
  PlayCircle, StopCircle, Upload, X, ChevronRight, Receipt,
  AlertCircle, Gauge, Flag, Timer, Users, Phone,
  FileCheck, ChevronDown, ChevronUp, Package, DollarSign
} from 'lucide-react';
import { uploadMultipleToCloudinary, uploadToCloudinary } from '../../../lib/upload';

// ── Helpers ───────────────────────────────────────────────────────────────────
const msToHM = ms => { const m = Math.floor(ms/60000), h = Math.floor(m/60); return h===0?`${m}m`:`${h}h ${m%60}m`; };
const INR    = n  => `₹${(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtT   = d  => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
const fmtD   = d  => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

const ISSUE_TYPES = ['Tyre Problem', 'Engine Problem', 'Vehicle Breakdown', 'Other'];

// ── Live HH:MM:SS timer ───────────────────────────────────────────────────────
function LiveTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () => setElapsed(Date.now() - new Date(startedAt).getTime());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const s = Math.floor(elapsed / 1000);
  const pad = n => String(n).padStart(2,'0');
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded">
      <Timer size={16} className="text-amber-600 flex-shrink-0" />
      <div>
        <p className="text-xs text-amber-600">Running</p>
        <p className="text-lg font-mono font-semibold text-amber-700 leading-tight">
          {pad(Math.floor(s/3600))}:{pad(Math.floor((s%3600)/60))}:{pad(s%60)}
        </p>
      </div>
    </div>
  );
}

// ── Fill Fuel Modal ───────────────────────────────────────────────────────────
function FuelModal({ tripId, maxRemaining, onClose, onSuccess }) {
  const [litresFilled, setLitresFilled] = useState('');
  const [note,      setNote]      = useState('');
  const [bills,     setBills]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleFiles = async e => {
    const files = Array.from(e.target.files);
    if (bills.length + files.length > 5) { alert('Max 5 bills'); return; }
    setUploading(true);
    try { const rs = await uploadMultipleToCloudinary(files); setBills(p => [...p, ...rs.map(r => ({url:r.url,publicId:r.publicId}))]); }
    catch { alert('Upload failed'); } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!litresFilled || Number(litresFilled) <= 0) { alert('Enter litres filled'); return; }
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/${tripId}/fuel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ litresFilled: Number(litresFilled), receiptBills: bills, note, filledBy: user.name, filledByRole: user.role || 'driver' }),
      });
      const r = await res.json();
      if (!res.ok) { alert(r.message); return; }
      onSuccess(r.data); onClose();
    } catch { alert('Failed to log fuel'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Fill Fuel</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {maxRemaining != null && (
            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
              Max you can fill: <strong>{maxRemaining.toFixed(1)}L</strong> (allocated cap)
            </p>
          )}
          <div>
            <label className="form-label">Litres Filled *</label>
            <input type="number" value={litresFilled} onChange={e=>setLitresFilled(e.target.value)}
              className="input-field" min="0.1" step="0.5"
              max={maxRemaining > 0 ? maxRemaining : undefined}
              placeholder="e.g. 25" autoFocus />
          </div>
          <div>
            <label className="form-label">Note</label>
            <input value={note} onChange={e=>setNote(e.target.value)} className="input-field"
              placeholder="Pump name, location…" />
          </div>
          <div>
            <label className="form-label">Receipt Bills (max 5)</label>
            <div className="flex gap-2 flex-wrap">
              {/* Primary: camera */}
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded text-sm cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                {uploading ? 'Uploading…' : 'Take Photo'}
                <input type="file" accept="image/*" capture="environment" multiple onChange={handleFiles} disabled={uploading} className="hidden"/>
              </label>
              {/* Secondary: gallery / PDF */}
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm cursor-pointer transition-colors text-gray-700">
                <Upload size={14}/> From Gallery
                <input type="file" accept="image/*,application/pdf" multiple onChange={handleFiles} disabled={uploading} className="hidden"/>
              </label>
            </div>
            {bills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {bills.map((b,i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-300 px-2 py-0.5 rounded">
                    <Receipt size={11}/> Bill {i+1}
                    <button onClick={()=>setBills(p=>p.filter((_,j)=>j!==i))} className="ml-1 text-gray-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={submit} disabled={saving||uploading} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Fuel Fill'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Report Issue Modal ────────────────────────────────────────────────────────
// Issue Type dropdown · optional photo · no severity clutter
function IssueModal({ tripId, onClose, onSuccess }) {
  const [issueType,    setIssueType]    = useState('');
  const [customDesc,   setCustomDesc]   = useState('');
  const [photo,        setPhoto]        = useState(null);   // { url, publicId }
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const fileRef = useRef();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handlePhoto = async e => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    setPhotoPreview(URL.createObjectURL(file));
    try {
      const up = await uploadToCloudinary(file);
      setPhoto({ url: up.url, publicId: up.publicId });
    } catch { alert('Photo upload failed'); setPhotoPreview(null); }
    finally { setUploading(false); }
  };

  const removePhoto = () => { setPhoto(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ''; };

  const submit = async () => {
    if (!issueType) { alert('Select an issue type'); return; }
    if (issueType === 'Other' && !customDesc.trim()) { alert('Describe the issue'); return; }
    setSaving(true);
    const token = localStorage.getItem('token');
    const description = issueType === 'Other' ? customDesc.trim() : issueType;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/${tripId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          description,
          issueType,
          issuePhoto: photo || undefined,
          reportedBy:     user.name,
          reportedByRole: user.role || 'driver',
        }),
      });
      const r = await res.json();
      if (!res.ok) { alert(r.message); return; }
      onSuccess(r.data); onClose();
    } catch { alert('Failed to report issue'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Report Issue</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Issue Type dropdown */}
          <div>
            <label className="form-label">Issue Type *</label>
            <select value={issueType} onChange={e => setIssueType(e.target.value)} className="input-field" autoFocus>
              <option value="">Select issue type…</option>
              {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Custom description — only shown when "Other" */}
          {issueType === 'Other' && (
            <div>
              <label className="form-label">Describe the Issue *</label>
              <textarea value={customDesc} onChange={e => setCustomDesc(e.target.value)}
                className="input-field" rows={3}
                placeholder="Explain what happened in detail…" />
            </div>
          )}

          {/* Photo upload */}
          <div>
            <label className="form-label">Photo of Issue (optional)</label>
            {photoPreview ? (
              <div className="relative w-full">
                <img src={photoPreview} alt="Issue photo" className="w-full h-40 object-cover rounded border border-gray-200" />
                {uploading && (
                  <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded">
                    <p className="text-xs text-gray-600">Uploading…</p>
                  </div>
                )}
                {!uploading && (
                  <button onClick={removePhoto}
                    className="absolute top-2 right-2 bg-white border border-gray-300 rounded p-1 hover:bg-red-50 hover:border-red-300 transition-colors">
                    <X size={14} className="text-gray-500"/>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded text-sm cursor-pointer transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  Take Photo
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden"/>
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm cursor-pointer transition-colors text-gray-700">
                  <Upload size={14}/> From Gallery
                  <input type="file" accept="image/*" onChange={handlePhoto} className="hidden"/>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={submit} disabled={saving || uploading} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Submitting…' : 'Submit Report'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Proof Upload Modal ────────────────────────────────────────────────────────
function ProofModal({ po, onClose, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleFile = async e => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const up    = await uploadToCloudinary(file);
      const token = localStorage.getItem('token');
      const res   = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/issue-actions/${po._id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: up.url, publicId: up.publicId, uploadedBy: user.name, uploadedByRole: user.role || 'driver' }),
      });
      const r = await res.json();
      if (!res.ok) { alert(r.message); return; }
      onSuccess(r.data); onClose();
    } catch { alert('Upload failed'); } finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-900">Upload Proof</p>
            <p className="text-xs text-gray-500 mt-0.5">{po.poNumber} · {INR(po.totalAmount)}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-600">Upload a photo or document as proof of payment/completion for this purchase order.</p>
          {po.proofFiles?.length > 0 && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              {po.proofFiles.length} file{po.proofFiles.length > 1 ? 's' : ''} already uploaded
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            <label className={`flex items-center gap-2 px-4 py-2.5 rounded text-sm cursor-pointer transition-colors ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              {uploading ? 'Uploading…' : 'Take Photo'}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} disabled={uploading} className="hidden"/>
            </label>
            <label className={`flex items-center gap-2 px-4 py-2.5 rounded text-sm cursor-pointer transition-colors ${uploading ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              <Upload size={14}/> From Gallery / PDF
              <input type="file" accept="image/*,application/pdf" onChange={handleFile} disabled={uploading} className="hidden"/>
            </label>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── PO Card — expandable quotation details ─────────────────────────────────────
function POCard({ po, onProofClick }) {
  const [open, setOpen] = useState(false);

  const partsTotal = (po.parts || []).reduce((s, p) => s + (p.totalPrice || 0), 0);
  const costsTotal = (po.additionalCosts || []).reduce((s, c) => s + (c.amount || 0), 0);
  const isPaid     = po.status === 'proof_uploaded';

  return (
    <div className={`border rounded overflow-hidden ${isPaid ? 'border-gray-200' : 'border-indigo-200 bg-indigo-50'}`}>
      {/* Collapsed header — always visible */}
      <div className={`flex items-center justify-between px-4 py-3 ${isPaid ? 'bg-white' : 'bg-indigo-50'}`}>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-sm font-semibold text-gray-900">{po.poNumber}</span>
          <span className="text-xs text-gray-500 truncate">{po.title}</span>
          {isPaid ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-medium flex-shrink-0">
              Proof Uploaded
            </span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium flex-shrink-0">
              Awaiting Proof
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span className="text-sm font-semibold text-gray-900">{INR(po.totalAmount)}</span>
          <button onClick={() => setOpen(v => !v)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        </div>
      </div>

      {/* Expanded quotation detail */}
      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4 bg-gray-50">
          {po.description && (
            <p className="text-xs text-gray-600 italic">{po.description}</p>
          )}

          {/* Parts table */}
          {po.hasPartChanges && po.parts?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Package size={11}/> Parts
              </p>
              <div className="border border-gray-200 rounded overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Part</th>
                      <th className="text-center px-2 py-2 font-medium text-gray-500 w-12">Qty</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500 w-20">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {po.parts.map((p, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-800">
                          {p.partName}
                          {p.partNumber && <span className="text-gray-400 ml-1">({p.partNumber})</span>}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-600">{p.qty}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-800">{INR(p.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {partsTotal > 0 && (
                    <tfoot>
                      <tr className="border-t border-gray-200 bg-gray-50">
                        <td colSpan={2} className="px-3 py-2 text-right text-gray-500">Parts subtotal</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-800">{INR(partsTotal)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Additional costs */}
          {po.additionalCosts?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <DollarSign size={11}/> Other Costs
              </p>
              <div className="border border-gray-200 rounded overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-gray-50">
                    {po.additionalCosts.map((c, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-700">{c.reason}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-800">{INR(c.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grand total */}
          <div className="flex justify-between text-sm font-semibold text-gray-900 border-t border-gray-200 pt-3">
            <span>Total Amount</span>
            <span>{INR(po.totalAmount)}</span>
          </div>

          {/* Proof file count + upload button */}
          <div className="flex items-center justify-between pt-1">
            {po.proofFiles?.length > 0 ? (
              <p className="text-xs text-green-700">{po.proofFiles.length} proof file{po.proofFiles.length>1?'s':''} uploaded</p>
            ) : (
              <p className="text-xs text-gray-400">No proof uploaded yet</p>
            )}
            <button onClick={() => onProofClick(po)}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 border border-indigo-300 px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors">
              <Upload size={12}/> Upload Proof
            </button>
          </div>

          <p className="text-xs text-gray-400">Raised {fmtD(po.createdAt)}{po.createdByName ? ` · ${po.createdByName}` : ''}</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DriverOverviewPage() {
  const [trip,          setTrip]         = useState(null);
  const [loading,       setLoading]      = useState(true);
  const [actLoad,       setActLoad]      = useState('');
  const [showFuel,      setShowFuel]     = useState(false);
  const [showIssue,     setShowIssue]    = useState(false);
  const [issueActions,  setIssueActions] = useState([]);
  const [proofPO,       setProofPO]      = useState(null);
  const [user,          setUser]         = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    if (u?.id) fetchActiveTrip(u.id, u.role);
  }, []);

  const staffType = role => role === 'helper' ? 'helper' : role === 'site_supervisor' ? 'supervisor' : 'driver';

  const fetchActiveTrip = async (staffId, role) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/my/active?staffId=${staffId}&staffType=${staffType(role)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const r = await res.json();
      if (r.data) { setTrip(r.data); fetchIssueActions(r.data._id); }
    } catch { } finally { setLoading(false); }
  };

  const fetchIssueActions = async tripId => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/issue-actions/trip/${tripId}`, { headers: { Authorization: `Bearer ${token}` } });
      const r   = await res.json();
      setIssueActions((r.data||[]).filter(a => ['generated','proof_uploaded'].includes(a.status)));
    } catch { }
  };

  const upsertAction = updated => setIssueActions(prev => {
    const idx = prev.findIndex(a => a._id === updated._id);
    if (['generated','proof_uploaded'].includes(updated.status)) {
      return idx >= 0 ? prev.map((a,i) => i===idx ? updated : a) : [...prev, updated];
    }
    return prev.filter(a => a._id !== updated._id);
  });

  const handleStart = async () => {
    if (!confirm('Start this trip?')) return;
    setActLoad('start');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/${trip._id}/start`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ performedBy: user?.name||'', performedByRole: user?.role||'driver' }),
      });
      const r = await res.json();
      if (!r.success) { alert(r.message); return; }
      setTrip(r.data);
    } catch { alert('Failed'); } finally { setActLoad(''); }
  };

  const handleEnd = async () => {
    if (!confirm('End and complete this trip?')) return;
    setActLoad('end');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/${trip._id}/end`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ performedBy: user?.name||'', performedByRole: user?.role||'driver' }),
      });
      const r = await res.json();
      if (!r.success) { alert(r.message); return; }
      setTrip(r.data);
    } catch { alert('Failed'); } finally { setActLoad(''); }
  };

  const totalFuelFilled = trip?.fuelLogs?.reduce((s,l) => s+(l.litresFilled||0), 0) || 0;
  const fuelRemaining   = trip?.estimatedFuelLitres > 0 ? Math.max(0, trip.estimatedFuelLitres - totalFuelFilled) : null;
  const isOverdue       = trip?.deadline && trip.status !== 'completed' && new Date(trip.deadline) < new Date();
  const isSupervisor    = user?.role === 'site_supervisor';
  const durMs           = trip?.startedAt && trip?.completedAt
    ? new Date(trip.completedAt).getTime() - new Date(trip.startedAt).getTime() : null;

  return (
    <div className="container-main">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">My Trip</h1>
        <p className="text-sm text-gray-500 mt-0.5">Current or upcoming assigned trip</p>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-gray-500">Loading…</div>
      ) : !trip ? (
        <div className="card p-10 text-center">
          <Flag size={32} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-600">No active trip assigned.</p>
          <p className="text-gray-400 text-sm mt-1">Your trip will appear here once one is assigned.</p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-3">

          {/* Trip summary card */}
          <div className="card p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-lg font-bold text-gray-900">{trip.tripNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${
                    trip.status === 'assigned'    ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    trip.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {trip.status === 'assigned' ? 'Assigned' : trip.status === 'in_progress' ? 'In Progress' : 'Completed'}
                  </span>
                  {isOverdue && <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-medium flex items-center gap-1"><AlertTriangle size={11}/> Overdue</span>}
                </div>
                {trip.purpose && <p className="text-sm text-gray-500">{trip.purpose}</p>}
              </div>
              {trip.status === 'in_progress' && trip.startedAt && <LiveTimer startedAt={trip.startedAt}/>}
              {durMs !== null && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="text-base font-semibold text-green-600">{msToHM(durMs)}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <MapPin size={13} className="text-gray-400 flex-shrink-0"/>
              <span>{trip.fromLocation || '—'}</span>
              <ChevronRight size={13} className="text-gray-300"/>
              <span>{trip.toLocation || '—'}</span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
              {trip.estimatedDistance && <span><Gauge size={11} className="inline mr-0.5"/>{trip.estimatedDistance} km</span>}
              {trip.deadline && <span className={isOverdue ? 'text-red-600 font-medium' : ''}><Clock size={11} className="inline mr-0.5"/>Due: {fmtD(trip.deadline)}</span>}
              {trip.fuelType && <span><Fuel size={11} className="inline mr-0.5"/>{trip.fuelType}</span>}
              {trip.estimatedFuelLitres > 0 && (
                <span className={fuelRemaining !== null && fuelRemaining <= 0 ? 'text-red-600 font-medium' : ''}>
                  Fuel: {totalFuelFilled}/{trip.estimatedFuelLitres}L{fuelRemaining !== null ? ` (${fuelRemaining.toFixed(1)}L left)` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Customer */}
          {trip.customerName && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</p>
              <p className="text-sm font-medium text-gray-900">{trip.customerName}</p>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-1">
                {trip.customerPhone && <span className="flex items-center gap-1"><Phone size={11}/>{trip.customerPhone}</span>}
                {trip.orderReference && <span>Ref: {trip.orderReference}</span>}
              </div>
              {trip.customerAddress && <p className="text-xs text-gray-400 mt-1"><MapPin size={11} className="inline mr-0.5"/>{trip.customerAddress}</p>}
            </div>
          )}

          {/* Vehicle */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Vehicle</p>
            <div className="flex items-center gap-3">
              {trip.vehicle?.photos?.[0]?.url
                ? <img src={trip.vehicle.photos[0].url} alt="" className="w-14 h-12 object-cover rounded border border-gray-200 flex-shrink-0"/>
                : <div className="w-14 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center flex-shrink-0"><Car size={20} className="text-gray-400"/></div>}
              <div>
                <p className="text-sm font-medium text-gray-900">{trip.vehicle?.make} {trip.vehicle?.model}</p>
                <p className="text-xs text-gray-500">{trip.vehicle?.registrationNumber}</p>
                {trip.vehicle?.currentFuelQty != null && <p className="text-xs text-gray-400 mt-0.5">Current fuel: {trip.vehicle.currentFuelQty}L</p>}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!isSupervisor && (
            <div className="card p-4">
              <div className="space-y-2">
                {trip.status === 'assigned' && (
                  <button onClick={handleStart} disabled={!!actLoad}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-sm transition-colors disabled:opacity-50">
                    <PlayCircle size={18}/> {actLoad === 'start' ? 'Starting…' : 'Start Trip'}
                  </button>
                )}
                {trip.status === 'in_progress' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setShowFuel(true)}
                        className="flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded font-medium text-sm hover:bg-gray-50 transition-colors">
                        <Fuel size={16} className="text-amber-500"/> Fill Fuel
                      </button>
                      <button onClick={() => setShowIssue(true)}
                        className="flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded font-medium text-sm hover:bg-gray-50 transition-colors">
                        <AlertCircle size={16} className="text-orange-500"/> Report Issue
                      </button>
                    </div>
                    <button onClick={handleEnd} disabled={!!actLoad}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-sm transition-colors disabled:opacity-50">
                      <StopCircle size={18}/> {actLoad === 'end' ? 'Ending…' : 'End Trip'}
                    </button>
                  </>
                )}
                {trip.status === 'completed' && (
                  <div className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-500 rounded text-sm">
                    <CheckCircle size={16} className="text-green-500"/> Trip Completed — Awaiting official close
                  </div>
                )}
              </div>
            </div>
          )}

          {isSupervisor && trip.status !== 'completed' && (
            <div className="card p-4 border-l-4 border-l-indigo-300 bg-indigo-50">
              <p className="text-sm text-indigo-700"><Users size={14} className="inline mr-1"/>You are assigned as supervisor — view only.</p>
            </div>
          )}

          {/* Purchase Orders — highlighted so driver notices them */}
          {issueActions.length > 0 && (
            <div className="card p-4 border border-indigo-300" style={{boxShadow:'0 0 0 3px rgba(99,102,241,0.1)'}}>
              <div className="flex items-center gap-2 mb-3">
                <FileCheck size={15} className="text-indigo-600 flex-shrink-0"/>
                <p className="text-sm font-semibold text-indigo-800">
                  Purchase Orders ({issueActions.length}) — Action Required
                </p>
                {issueActions.some(a => a.status !== 'proof_uploaded') && (
                  <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex-shrink-0">
                    Proof pending
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Expand each PO to view the quotation details, then upload the payment receipt as proof.
              </p>
              <div className="space-y-2">
                {issueActions.map(po => (
                  <POCard key={po._id} po={po} onProofClick={setProofPO}/>
                ))}
              </div>
            </div>
          )}

          {/* Fuel logs */}
          {trip.fuelLogs?.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Fuel Fills — {totalFuelFilled}L{trip.estimatedFuelLitres > 0 ? ` / ${trip.estimatedFuelLitres}L` : ''}
              </p>
              <div className="divide-y divide-gray-100">
                {trip.fuelLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium text-gray-900">{log.litresFilled}L</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {log.receiptBills?.map((b, j) => (
                        <a key={j} href={b.url} target="_blank" rel="noopener noreferrer"
                          className="text-indigo-600 underline underline-offset-1 flex items-center gap-0.5">
                          <Receipt size={11}/> Bill {j+1}
                        </a>
                      ))}
                      <span>{fmtT(log.filledAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issue reports */}
          {trip.issueReports?.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Issues Reported ({trip.issueReports.length})
              </p>
              <div className="space-y-2">
                {trip.issueReports.map((issue, i) => (
                  <div key={i} className="border border-gray-200 rounded p-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {issue.issueType && (
                        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {issue.issueType}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{fmtT(issue.reportedAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800">{issue.description}</p>
                    {/* Issue photo */}
                    {issue.issuePhoto?.url && (
                      <img src={issue.issuePhoto.url} alt="Issue"
                        className="mt-2 w-full max-h-40 object-cover rounded border border-gray-200"/>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showFuel && trip && (
        <FuelModal tripId={trip._id} maxRemaining={fuelRemaining}
          onClose={() => setShowFuel(false)} onSuccess={t => setTrip(t)}/>
      )}
      {showIssue && trip && (
        <IssueModal tripId={trip._id}
          onClose={() => setShowIssue(false)} onSuccess={t => setTrip(t)}/>
      )}
      {proofPO && (
        <ProofModal po={proofPO}
          onClose={() => setProofPO(null)}
          onSuccess={updated => { upsertAction(updated); setProofPO(null); }}/>
      )}
    </div>
  );
}