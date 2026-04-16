'use client';

import { useState, useEffect } from 'react';
import { Fuel, CheckCircle, Clock, X, ChevronDown, ChevronUp } from 'lucide-react';

const INR  = n => `₹${(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fmtT = d => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

const isPDF = url => url?.toLowerCase().includes('.pdf') || url?.toLowerCase().includes('pdf');

// ── Make Payment modal ─────────────────────────────────────────────────────────
function PaymentModal({ payment, onClose, onPaid }) {
  const [amount,      setAmount]      = useState('');
  const [description, setDescription] = useState('');
  const [mode,        setMode]        = useState('');
  const [saving,      setSaving]      = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const submit = async () => {
    if (!amount || Number(amount) <= 0) { alert('Enter payment amount'); return; }
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/${payment._id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount), description, paymentMode: mode, paidByName: user.name || 'Admin' }),
      });
      const r = await res.json();
      if (!res.ok) { alert(r.message); return; }
      onPaid(r.data); onClose();
    } catch { alert('Failed'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-900">Record Fuel Payment</p>
            <p className="text-xs text-gray-500 mt-0.5">Trip {payment.tripNumber} · {payment.fuelLitres}L</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="form-label">Amount Paid (₹) *</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="input-field" min="0" step="0.01" placeholder="e.g. 2500.00" autoFocus />
          </div>
          <div>
            <label className="form-label">Payment Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className="input-field">
              <option value="">Select</option>
              {['Cash','NEFT','IMPS','Cheque','UPI'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Notes / Reference</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="input-field" rows={2} placeholder="Transaction reference, remarks…" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={submit} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving…' : 'Confirm Payment'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Single fuel payment card ───────────────────────────────────────────────────
function FuelCard({ payment, onMakePayment }) {
  const [open, setOpen] = useState(false);

  // The fuel log data comes from the populated trip.fuelLogs[]
  const fuelLog = payment.trip?.fuelLogs?.[payment.fuelLogIndex];
  const bills   = fuelLog?.receiptBills || [];
  const isPaid  = payment.status === 'paid';

  const vehiclePhoto = payment.trip?.vehicle?.photos?.[0]?.url;

  return (
    <div className={`border rounded-lg overflow-hidden ${isPaid ? 'border-gray-200' : 'border-gray-300'}`}>
      {/* ── Card header ── */}
      <div className="px-4 py-4 bg-white">
        <div className="flex items-start gap-4 flex-wrap">

          {/* Vehicle photo */}
          <div className="flex-shrink-0">
            {vehiclePhoto ? (
              <img src={vehiclePhoto} alt="Vehicle"
                className="w-24 h-18 object-cover rounded border border-gray-200" style={{height:'72px',width:'96px'}} />
            ) : (
              <div className="flex items-center justify-center rounded border border-gray-200 bg-gray-100" style={{height:'72px',width:'96px'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
            )}
            <p className="text-xs text-gray-400 text-center mt-1 truncate" style={{width:'96px'}}>
              {payment.trip?.vehicle?.registrationNumber || '—'}
            </p>
          </div>

          {/* Core info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-sm font-semibold text-gray-900">Trip {payment.tripNumber}</span>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-medium">
                  <CheckCircle size={11} /> Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  <Clock size={11} /> Pending
                </span>
              )}
              {bills.length > 0 && (
                <span className="text-xs text-gray-500">{bills.length} receipt{bills.length > 1 ? 's' : ''} attached</span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs text-gray-600">
              <div><span className="text-gray-400">Fuel filled</span><br /><strong className="text-gray-900 text-sm">{payment.fuelLitres}L</strong></div>
              <div><span className="text-gray-400">Filled by</span><br /><span className="text-gray-700">{payment.fuelFilledBy || '—'}</span></div>
              <div><span className="text-gray-400">Vehicle</span><br /><span className="text-gray-700">{payment.trip?.vehicle?.make} {payment.trip?.vehicle?.model}</span></div>
              <div><span className="text-gray-400">Fuel Type</span><br /><span className="text-gray-700">{payment.trip?.vehicle?.fuelType || '—'}</span></div>
              <div className="sm:col-span-2"><span className="text-gray-400">Route</span><br /><span className="text-gray-700">{payment.trip?.fromLocation || '—'} → {payment.trip?.toLocation || '—'}</span></div>
              <div><span className="text-gray-400">Date</span><br /><span className="text-gray-700">{fmtT(payment.createdAt)}</span></div>
              {fuelLog?.note && <div className="sm:col-span-2"><span className="text-gray-400">Note</span><br /><span className="text-gray-700 italic">{fuelLog.note}</span></div>}
            </div>
          </div>

          {/* Right: amount + action */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0 text-right">
            {isPaid ? (
              <>
                <p className="text-base font-bold text-gray-900">{INR(payment.amount)}</p>
                <p className="text-xs text-gray-500">{payment.paymentMode}{payment.paidByName ? ` · ${payment.paidByName}` : ''}</p>
                <p className="text-xs text-gray-400">{fmtD(payment.paidAt)}</p>
              </>
            ) : (
              <button onClick={() => onMakePayment(payment)}
                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded transition-colors">
                Make Payment
              </button>
            )}
          </div>
        </div>

        {/* Toggle receipts */}
        {bills.length > 0 && (
          <button onClick={() => setOpen(v => !v)}
            className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {open ? 'Hide' : 'View'} {bills.length} receipt image{bills.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* ── Expanded: receipt images inline ── */}
      {open && bills.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Receipt Bills</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {bills.map((bill, i) => (
              <div key={i} className="border border-gray-200 rounded overflow-hidden bg-white">
                {isPDF(bill.url) ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-xs gap-2">
                    <div className="w-8 h-10 border-2 border-gray-300 rounded flex items-center justify-center text-gray-500 font-bold text-xs">PDF</div>
                    <a href={bill.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline underline-offset-1">
                      Open Bill {i + 1}
                    </a>
                  </div>
                ) : (
                  <a href={bill.url} target="_blank" rel="noopener noreferrer">
                    <img src={bill.url} alt={`Receipt ${i + 1}`}
                      className="w-full h-32 object-cover hover:opacity-90 transition-opacity"
                      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                    <div className="hidden w-full h-32 items-center justify-center text-gray-400 text-xs">
                      Bill {i + 1} (tap to open)
                    </div>
                  </a>
                )}
                <div className="px-2 py-1.5 border-t border-gray-100 text-xs text-center text-gray-500">
                  Bill {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function FuelPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('pending');
  const [modal,    setModal]    = useState(null);

  useEffect(() => { fetchPayments(); markSeen(); }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments?type=fuel`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setPayments(data.data);
    } catch { } finally { setLoading(false); }
  };

  const markSeen = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/mark-seen`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'fuel' }),
      });
    } catch { }
  };

  const handlePaid = u => setPayments(prev => prev.map(p => p._id === u._id ? u : p));

  const filtered     = payments.filter(p => filter === 'all' ? true : p.status === filter);
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const paidCount    = payments.filter(p => p.status === 'paid').length;
  const totalPaid    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="container-main max-w-9xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Fuel size={22} className="text-amber-500" /> Fuel Payments
        </h1>
        <p className="text-sm text-gray-500 mt-1">Each card shows the full fuel fill record including receipt images.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Records</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{payments.length}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-amber-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">awaiting payment</p>
        </div>
        <div className="card p-4 border-l-4 border-l-green-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{paidCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">{INR(totalPaid)} disbursed</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex border-b border-gray-200 mb-5">
        {[{v:'pending',l:'Pending'},{v:'paid',l:'Paid'},{v:'all',l:'All Records'}].map(t => (
          <button key={t.v} onClick={() => setFilter(t.v)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${filter === t.v ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.l}
            {t.v === 'pending' && pendingCount > 0 && (
              <span className="ml-2 min-w-[18px] h-[18px] px-1 text-xs bg-amber-500 text-white rounded-full inline-flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="card p-10 text-center text-gray-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">No {filter === 'all' ? '' : filter} fuel payment records.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
            <FuelCard key={p._id} payment={p} onMakePayment={setModal} />
          ))}
        </div>
      )}

      {modal && <PaymentModal payment={modal} onClose={() => setModal(null)} onPaid={handlePaid} />}
    </div>
  );
}