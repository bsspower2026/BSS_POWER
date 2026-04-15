'use client';

import { useState, useEffect } from 'react';
import { Fuel, CheckCircle, Clock, X, Receipt, Eye } from 'lucide-react';

const INR   = n => `₹${(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtDT = d => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const fmtD  = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

// ── Payment Modal ──────────────────────────────────────────────────────────────
function PaymentModal({ payment, onClose, onPaid }) {
  const [amount,      setAmount]      = useState(payment.fuelLitres ? '' : '');
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
      onPaid(r.data);
      onClose();
    } catch { alert('Failed to record payment'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Record Fuel Payment</h3>
            <p className="text-xs text-gray-500 mt-0.5">Trip {payment.tripNumber} · {payment.fuelLitres}L filled{payment.fuelFilledBy ? ` by ${payment.fuelFilledBy}` : ''}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="form-label">Amount Paid (₹) *</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="input-field" min="0" step="0.01" placeholder="e.g. 2500.00" autoFocus />
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
              className="input-field" rows={2} placeholder="Payment reference, remarks, etc." />
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function FuelPaymentsPage() {
  const [payments, setPayments]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [filter,   setFilter]     = useState('pending');
  const [modalPmt, setModalPmt]   = useState(null);

  useEffect(() => { fetchPayments(); markSeen(); }, []);

  const fetchPayments = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments?type=fuel`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setPayments(data.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const markSeen = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/mark-seen`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'fuel' }),
      });
    } catch { /* silent */ }
  };

  const handlePaid = updated => setPayments(prev => prev.map(p => p._id === updated._id ? updated : p));

  const filtered = payments.filter(p => filter === 'all' ? true : p.status === filter);
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const paidCount    = payments.filter(p => p.status === 'paid').length;

  return (
    <div className="container-main max-w-9xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Fuel size={22} className="text-amber-500" /> Fuel Payments
        </h1>
        <p className="text-sm text-gray-500 mt-1">Review fuel fill records and record payments.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Records</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{payments.length}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-amber-400">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
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
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${filter === t.v ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-10 text-center text-gray-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">No {filter} fuel payment records.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trip</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fuel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Filled By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bills</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.tripNumber || '—'}</p>
                      {p.trip?.fromLocation && <p className="text-xs text-gray-400 mt-0.5">{p.trip.fromLocation} → {p.trip.toLocation}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{p.fuelLitres || '—'}L</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.fuelFilledBy || '—'}</td>
                    <td className="px-4 py-3">
                      {/* Fuel bills from the corresponding trip fuel log */}
                      {p.trip?.fuelLogs?.[p.fuelLogIndex]?.receiptBills?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.trip.fuelLogs[p.fuelLogIndex].receiptBills.map((b, i) => (
                            <a key={i} href={b.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-indigo-600 underline underline-offset-1">
                              <Receipt size={11} /> Bill {i + 1}
                            </a>
                          ))}
                        </div>
                      ) : <span className="text-xs text-gray-400">None</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtD(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      {p.status === 'paid'
                        ? <span className="font-semibold text-gray-900">{INR(p.amount)}</span>
                        : <span className="text-gray-400">—</span>}
                      {p.paidAt && <p className="text-xs text-gray-400 mt-0.5">{fmtD(p.paidAt)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                          <Clock size={11} /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-medium">
                          <CheckCircle size={11} /> Paid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'pending' ? (
                        <button onClick={() => setModalPmt(p)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-300 px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors">
                          Make Payment
                        </button>
                      ) : (
                        <div className="text-xs text-gray-400">
                          {p.paymentMode && <span>{p.paymentMode}</span>}
                          {p.paidByName && <span className="ml-1">· {p.paidByName}</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalPmt && <PaymentModal payment={modalPmt} onClose={() => setModalPmt(null)} onPaid={handlePaid} />}
    </div>
  );
}