'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, X, Eye, FileCheck, Package, DollarSign } from 'lucide-react';

const INR   = n => `₹${(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtDT = d => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const fmtD  = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

// ── Payment Modal ──────────────────────────────────────────────────────────────
function PaymentModal({ payment, onClose, onPaid }) {
  const [amount,      setAmount]      = useState(payment.poAmount ? String(payment.poAmount) : '');
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [saving,      setSaving]      = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) { alert('Enter payment amount'); return; }
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/${payment._id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount), description, paymentMode, paidByName: user.name || 'Admin' }),
      });
      const r = await res.json();
      if (!res.ok) { alert(r.message); return; }
      onPaid(r.data); onClose();
    } catch { alert('Failed to record payment'); } finally { setSaving(false); }
  };

  const po = payment.issueAction;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Record Bill Payment</h3>
            <p className="text-xs text-gray-500 mt-0.5">{payment.poNumber} · Trip {payment.tripNumber}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* PO summary */}
          {po && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm space-y-2">
              <p className="font-medium text-gray-900">{po.title}</p>
              {po.issueDescription && <p className="text-xs text-gray-500">Issue: {po.issueDescription}</p>}
              {po.parts?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Parts:</p>
                  {po.parts.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span>{p.partName} × {p.qty}</span>
                      <span>{INR(p.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              )}
              {po.additionalCosts?.length > 0 && (
                <div>
                  {po.additionalCosts.map((c, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span>{c.reason}</span><span>{INR(c.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-2 mt-1 text-sm">
                <span>PO Total</span><span>{INR(po.totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Proof files */}
          {po?.proofFiles?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Attached Proof Files:</p>
              <div className="flex flex-wrap gap-2">
                {po.proofFiles.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded hover:bg-indigo-50">
                    <Eye size={12} /> Proof {i + 1}{f.uploadedBy ? ` (${f.uploadedBy})` : ''}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Amount to Pay (₹) *</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="input-field" min="0" step="0.01" placeholder={`PO total: ${INR(payment.poAmount)}`} autoFocus />
            <p className="text-xs text-gray-400 mt-1">PO total is pre-filled. You can adjust if the actual payment differs.</p>
          </div>
          <div>
            <label className="form-label">Payment Mode</label>
            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="input-field">
              <option value="">Select mode</option>
              <option value="Cash">Cash</option>
              <option value="NEFT">NEFT</option>
              <option value="IMPS">IMPS</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          <div>
            <label className="form-label">Notes / Reference</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="input-field" rows={2} placeholder="Transaction ref, remarks, etc." />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Mark as Paid'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── PO Detail Row (expanded inline) ──────────────────────────────────────────
function PODetail({ po }) {
  if (!po) return null;
  return (
    <div className="mt-2 text-xs text-gray-600 space-y-1">
      {po.issueDescription && <p className="text-gray-500 italic">Issue: {po.issueDescription}</p>}
      {po.parts?.length > 0 && po.parts.map((p, i) => (
        <div key={i} className="flex justify-between">
          <span><Package size={10} className="inline mr-1 text-gray-400" />{p.partName} × {p.qty}</span>
          <span className="font-medium">{INR(p.totalPrice)}</span>
        </div>
      ))}
      {po.additionalCosts?.length > 0 && po.additionalCosts.map((c, i) => (
        <div key={i} className="flex justify-between">
          <span><DollarSign size={10} className="inline mr-1 text-gray-400" />{c.reason}</span>
          <span className="font-medium">{INR(c.amount)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function BillPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('pending');
  const [modalPmt, setModalPmt] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { fetchPayments(); markSeen(); }, []);

  const fetchPayments = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments?type=bill`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setPayments(data.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const markSeen = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/mark-seen`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'bill' }),
      });
    } catch { /* silent */ }
  };

  const handlePaid  = u => setPayments(prev => prev.map(p => p._id === u._id ? u : p));
  const toggleRow   = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered     = payments.filter(p => filter === 'all' ? true : p.status === filter);
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const paidCount    = payments.filter(p => p.status === 'paid').length;

  return (
    <div className="container-main max-w-9xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard size={22} className="text-indigo-500" /> Bill Payments
        </h1>
        <p className="text-sm text-gray-500 mt-1">Review purchase orders, check uploaded proof, and record payments.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total POs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{payments.length}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-indigo-400">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{pendingCount}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-green-400">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{paidCount}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 mb-5">
        {[{v:'pending',l:'Pending'},{v:'paid',l:'Paid'},{v:'all',l:'All'}].map(t => (
          <button key={t.v} onClick={() => setFilter(t.v)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${filter===t.v?'border-indigo-600 text-indigo-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Cards list */}
      {loading ? (
        <div className="card p-10 text-center text-gray-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">No {filter} bill payment records.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const po        = p.issueAction;
            const isOpen    = expanded[p._id];
            const hasProofs = po?.proofFiles?.length > 0;

            return (
              <div key={p._id} className="card overflow-hidden">
                {/* Main row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* PO Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-900">{p.poNumber}</span>
                      <span className="text-xs text-gray-500">·</span>
                      <span className="text-sm text-gray-700">{p.poTitle || po?.title || '—'}</span>
                    </div>
                    <p className="text-xs text-gray-500">Trip {p.tripNumber}{p.trip?.fromLocation ? ` · ${p.trip.fromLocation} → ${p.trip.toLocation}` : ''}</p>
                    <p className="text-xs text-gray-400 mt-0.5">PO raised {fmtD(p.createdAt)}</p>
                  </div>

                  {/* Amount + proof count */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-base font-bold text-gray-900">{INR(p.poAmount)}</p>
                    {hasProofs ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle size={11} /> {po.proofFiles.length} proof file{po.proofFiles.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No proof yet</span>
                    )}
                  </div>

                  {/* Status + action */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {p.status === 'pending' ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                          <Clock size={11} /> Pending
                        </span>
                        <button onClick={() => setModalPmt(p)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-300 px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors">
                          Make Payment
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-medium">
                          <CheckCircle size={11} /> Paid
                        </span>
                        <p className="text-xs text-gray-500">{INR(p.amount)}{p.paymentMode ? ` · ${p.paymentMode}` : ''}</p>
                        <p className="text-xs text-gray-400">{fmtD(p.paidAt)}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Proof files row */}
                {hasProofs && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-gray-500 font-medium">Proof:</span>
                    {po.proofFiles.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-indigo-600 underline underline-offset-1">
                        <FileCheck size={12} /> File {i + 1}{f.uploadedBy ? ` (${f.uploadedBy})` : ''}
                      </a>
                    ))}
                  </div>
                )}

                {/* Expandable PO breakdown */}
                <div className="border-t border-gray-100">
                  <button onClick={() => toggleRow(p._id)}
                    className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1">
                    <FileCheck size={12} /> {isOpen ? 'Hide' : 'Show'} PO Breakdown
                    <span className="ml-auto">{isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      <PODetail po={po} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalPmt && <PaymentModal payment={modalPmt} onClose={() => setModalPmt(null)} onPaid={handlePaid} />}
    </div>
  );
}