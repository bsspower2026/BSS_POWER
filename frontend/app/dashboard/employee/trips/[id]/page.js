'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Car, Users, MapPin, Fuel, Clock, CheckCircle,
  AlertTriangle, ChevronRight, Flag, Gauge, Receipt, AlertCircle,
  Calendar, Timer, Plus, X, UserCircle, Upload, Package,
  DollarSign, PenLine, Search, Trash2, PlayCircle, StopCircle,
  Eye, FileCheck, Activity, Info, User
} from 'lucide-react';
import { uploadToCloudinary, uploadMultipleToCloudinary } from '../../../../../lib/upload';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDT  = d => d ? new Date(d).toLocaleString('en-IN',     { day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const fmtD   = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit',month:'short',year:'numeric'}) : '—';
const msToHM = ms => { if(!ms||ms<0)return'—'; const m=Math.floor(ms/60000),h=Math.floor(m/60); return h===0?`${m}m`:`${h}h ${m%60}m`; };
const INR    = n  => `₹${(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

const STATUS = {
  assigned:    { label:'Assigned',    cls:'bg-blue-50 text-blue-700 border border-blue-200' },
  in_progress: { label:'In Progress', cls:'bg-amber-50 text-amber-700 border border-amber-200' },
  completed:   { label:'Completed',   cls:'bg-green-50 text-green-700 border border-green-200' },
  cancelled:   { label:'Cancelled',   cls:'bg-red-50 text-red-700 border border-red-200' },
};
const SEV = {
  low:    'bg-blue-50 text-blue-700 border-blue-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high:   'bg-red-50 text-red-700 border-red-200',
};
const PO_S = {
  draft:          { label:'Draft',          cls:'bg-gray-100 text-gray-600' },
  generated:      { label:'PO Generated',   cls:'bg-indigo-50 text-indigo-700' },
  proof_uploaded: { label:'Proof Uploaded', cls:'bg-green-50 text-green-700' },
  closed:         { label:'Closed',         cls:'bg-gray-100 text-gray-500' },
};

// ─── Live timer ───────────────────────────────────────────────────────────────
function LiveDuration({ startedAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(()=>setNow(Date.now()),10000); return ()=>clearInterval(id); },[]);
  return <>{msToHM(now - new Date(startedAt).getTime())}</>;
}

// ─── Row component ────────────────────────────────────────────────────────────
const Row = ({ label, value, span }) => (
  <div className={span ? 'md:col-span-2' : ''}>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm text-gray-900">{value || <span className="text-gray-400">—</span>}</p>
  </div>
);

// ─── Section heading ──────────────────────────────────────────────────────────
const SH = ({ children }) => (
  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">
    {children}
  </h3>
);

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE CANVAS
// ─────────────────────────────────────────────────────────────────────────────
function SignatureCanvas({ onDataChange }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x:0, y:0 });
  const getPos = e => {
    const c=ref.current, r=c.getBoundingClientRect(), sx=c.width/r.width, sy=c.height/r.height, src=e.touches?e.touches[0]:e;
    return { x:(src.clientX-r.left)*sx, y:(src.clientY-r.top)*sy };
  };
  const start = e => { e.preventDefault(); drawing.current=true; const p=getPos(e); last.current=p; const ctx=ref.current.getContext('2d'); ctx.fillStyle='#111827'; ctx.beginPath(); ctx.arc(p.x,p.y,1,0,Math.PI*2); ctx.fill(); };
  const move  = e => { if(!drawing.current)return; e.preventDefault(); const ctx=ref.current.getContext('2d'), p=getPos(e); ctx.beginPath(); ctx.moveTo(last.current.x,last.current.y); ctx.lineTo(p.x,p.y); ctx.strokeStyle='#111827'; ctx.lineWidth=1.8; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke(); last.current=p; };
  const stop  = () => { if(!drawing.current)return; drawing.current=false; onDataChange(ref.current.toDataURL()); };
  const clear = () => { ref.current.getContext('2d').clearRect(0,0,ref.current.width,ref.current.height); onDataChange(null); };
  return (
    <div>
      <canvas ref={ref} width={460} height={120} style={{height:120}}
        className="w-full border border-gray-300 rounded bg-gray-50 cursor-crosshair touch-none"
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={move} onTouchEnd={stop} />
      <button type="button" onClick={clear} className="mt-1 text-xs text-gray-500 hover:text-red-600 underline underline-offset-2">
        Clear
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PO CREATE MODAL  (scrollbar hidden, clean design)
// ─────────────────────────────────────────────────────────────────────────────
function POCreateModal({ trip, issueIndex, issueDesc, employeeName, onClose, onCreated }) {
  const [title,  setTitle]  = useState('');
  const [desc,   setDesc]   = useState('');
  const [hasPC,  setHasPC]  = useState(null);
  const [ps,     setPS]     = useState('');
  const [pRes,   setPRes]   = useState([]);
  const [pLoad,  setPLoad]  = useState(false);
  const [parts,  setParts]  = useState([]);
  const [costs,  setCosts]  = useState([]);
  const [sig,    setSig]    = useState(null);
  const [saving, setSaving] = useState(false);
  const pTimer = useRef(null);

  useEffect(() => {
    if (!ps.trim() || !hasPC) { setPRes([]); return; }
    clearTimeout(pTimer.current);
    pTimer.current = setTimeout(async () => {
      setPLoad(true);
      try {
        const token = localStorage.getItem('token');
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parts?search=${encodeURIComponent(ps)}&limit=8`, { headers:{ Authorization:`Bearer ${token}` } });
        const d = await r.json(); setPRes(d.data||[]);
      } catch { setPRes([]); } finally { setPLoad(false); }
    }, 300);
  }, [ps, hasPC]);

  const addPart  = p  => { if(parts.find(x=>x.partId===p._id))return; setParts(prev=>[...prev,{partId:p._id,partName:p.name,partNumber:p.partNumber||'',qty:1,costPrice:p.costPrice||0,unitPrice:p.costPrice||0}]); setPS(''); setPRes([]); };
  const updPart  = (i,k,v) => setParts(prev=>prev.map((p,j)=>j===i?{...p,[k]:Number(v)||0}:p));
  const remPart  = i  => setParts(prev=>prev.filter((_,j)=>j!==i));
  const addCost  = ()  => setCosts(prev=>[...prev,{id:Date.now(),reason:'',amount:''}]);
  const updCost  = (id,k,v) => setCosts(prev=>prev.map(c=>c.id===id?{...c,[k]:v}:c));
  const remCost  = id  => setCosts(prev=>prev.filter(c=>c.id!==id));

  const partsTotal = parts.reduce((s,p)=>s+((p.qty||1)*(p.unitPrice||0)),0);
  const costsTotal = costs.reduce((s,c)=>s+(Number(c.amount)||0),0);
  const grandTotal = partsTotal+costsTotal;

  const generate = async () => {
    if (!title.trim())  { alert('Title is required'); return; }
    if (hasPC===null)   { alert('Please specify whether parts changes are needed'); return; }
    if (!sig)           { alert('Authorising signature is required'); return; }
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const cr = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/issue-actions`,{
        method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body: JSON.stringify({ tripId:trip._id, issueIndex, issueDescription:issueDesc, title:title.trim(), description:desc, hasPartChanges:hasPC, parts, additionalCosts:costs.filter(c=>c.reason.trim()&&Number(c.amount)>0).map(c=>({reason:c.reason.trim(),amount:Number(c.amount)})), createdByName:employeeName }),
      });
      const cd = await cr.json(); if(!cr.ok){alert(cd.message);return;}
      const gr = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/issue-actions/${cd.data._id}/generate`,{
        method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body: JSON.stringify({ signature:sig }),
      });
      const gd = await gr.json(); if(!gr.ok){alert(gd.message);return;}
      onCreated(gd.data); onClose();
    } catch(err){alert('Error: '+err.message);} finally{setSaving(false);}
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col" style={{maxHeight:'calc(100vh - 64px)'}}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Create Purchase Order</h2>
            <p className="text-xs text-gray-500 mt-0.5">Issue #{issueIndex+1} — {issueDesc?.slice(0,70)}{issueDesc?.length>70?'…':''}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Modal scrollable body — scrollbar hidden */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
          style={{ scrollbarWidth:'none', msOverflowStyle:'none' }}>

          {/* Title + Description */}
          <div className="space-y-3">
            <div>
              <label className="form-label">PO Title *</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="input-field"
                placeholder="e.g. Tyre replacement, Traffic challan payment" />
            </div>
            <div>
              <label className="form-label">Description / Key Points</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="input-field" rows={2}
                placeholder="Scope of work, reason for cost, relevant notes…" />
            </div>
          </div>

          {/* Parts section */}
          <div>
            <label className="form-label">Parts / Components Required?</label>
            <div className="flex gap-3 mb-3">
              {[{v:true,l:'Yes — parts needed'},{v:false,l:'No — cost / fine only'}].map(opt=>(
                <button key={String(opt.v)} type="button" onClick={()=>setHasPC(opt.v)}
                  className={`flex-1 py-2 text-sm border rounded transition-colors ${hasPC===opt.v?'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium':'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                  {opt.l}
                </button>
              ))}
            </div>

            {hasPC===true && (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={ps} onChange={e=>setPS(e.target.value)} className="input-field pl-9"
                    placeholder="Search parts by name or code…" />
                </div>

                {pLoad && <p className="text-xs text-gray-400">Searching…</p>}

                {pRes.length>0 && (
                  <div className="border border-gray-200 rounded divide-y divide-gray-100 max-h-40 overflow-y-auto" style={{scrollbarWidth:'none'}}>
                    {pRes.map(p=>(
                      <button key={p._id} type="button" onClick={()=>addPart(p)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900">{p.name}</span>
                          <span className="text-gray-400 ml-2 text-xs">{p.partNumber}</span>
                        </div>
                        <span className="text-gray-700 font-medium flex-shrink-0">{INR(p.costPrice)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {ps && !pLoad && pRes.length===0 && <p className="text-xs text-gray-400 italic">No parts found for "{ps}"</p>}

                {parts.length>0 && (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Part</th>
                        <th className="text-center py-1.5 text-xs text-gray-500 font-medium w-16">Qty</th>
                        <th className="text-center py-1.5 text-xs text-gray-500 font-medium w-28">Unit Price ✎</th>
                        <th className="text-right py-1.5 text-xs text-gray-500 font-medium w-20">Total</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parts.map((p,i)=>(
                        <tr key={i}>
                          <td className="py-1.5 text-gray-900">{p.partName}<span className="text-gray-400 text-xs ml-1">{p.partNumber}</span></td>
                          <td className="py-1.5 text-center">
                            <input type="number" value={p.qty} min="1" onChange={e=>updPart(i,'qty',e.target.value)}
                              className="w-14 text-center border border-gray-300 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
                          </td>
                          <td className="py-1.5 text-center">
                            <input type="number" value={p.unitPrice} min="0" step="0.01" onChange={e=>updPart(i,'unitPrice',e.target.value)}
                              className="w-24 text-center border border-indigo-300 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400 bg-indigo-50" />
                          </td>
                          <td className="py-1.5 text-right text-gray-700">{INR((p.qty||1)*(p.unitPrice||0))}</td>
                          <td className="py-1.5 pl-2">
                            <button type="button" onClick={()=>remPart(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td colSpan={3} className="py-1.5 text-right text-xs text-gray-500 pr-2">Parts subtotal</td>
                        <td className="py-1.5 text-right font-medium text-gray-900">{INR(partsTotal)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Additional costs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Additional Costs</label>
              <button type="button" onClick={addCost} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                + Add
              </button>
            </div>
            {costs.length===0 && <p className="text-xs text-gray-400 italic">None — add challan, fine, towing, labour, etc.</p>}
            <div className="space-y-2">
              {costs.map(c=>(
                <div key={c.id} className="flex gap-2 items-center">
                  <input value={c.reason} onChange={e=>updCost(c.id,'reason',e.target.value)} className="input-field flex-1 py-1.5 text-sm" placeholder="Reason" />
                  <div className="relative w-32 flex-shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="number" value={c.amount} onChange={e=>updCost(c.id,'amount',e.target.value)}
                      className="input-field pl-6 py-1.5 text-sm" placeholder="0" min="0" />
                  </div>
                  <button type="button" onClick={()=>remCost(c.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          {(partsTotal>0||costsTotal>0) && (
            <div className="bg-gray-50 rounded border border-gray-200 px-4 py-3">
              <div className="space-y-1 text-sm">
                {partsTotal>0 && <div className="flex justify-between text-gray-600"><span>Parts ({parts.length})</span><span>{INR(partsTotal)}</span></div>}
                {costsTotal>0 && <div className="flex justify-between text-gray-600"><span>Additional Costs</span><span>{INR(costsTotal)}</span></div>}
                <div className="flex justify-between font-semibold text-gray-900 text-base pt-2 mt-1 border-t border-gray-200">
                  <span>Total</span><span>{INR(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Signature */}
          <div>
            <label className="form-label">Authorising Signature *</label>
            <p className="text-xs text-gray-400 mb-2">Draw your signature to confirm this purchase order.</p>
            <SignatureCanvas onDataChange={setSig} />
            {sig && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12} /> Captured</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={generate} disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            <FileCheck size={16} /> {saving ? 'Generating…' : 'Generate PO'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PO ROW — compact display under each issue
// ─────────────────────────────────────────────────────────────────────────────
function PORow({ action, onProofUploaded }) {
  const [open, setOpen]     = useState(false);
  const [up,   setUp]       = useState(false);
  const fileRef             = useRef(null);
  const user                = JSON.parse(localStorage.getItem('user')||'{}');
  const st                  = PO_S[action.status]||PO_S.draft;

  const uploadProof = async e => {
    const file = e.target.files[0]; if(!file)return;
    setUp(true);
    try {
      const uploaded = await uploadToCloudinary(file);
      const token    = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/issue-actions/${action._id}/proof`,{
        method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body: JSON.stringify({ url:uploaded.url, publicId:uploaded.publicId, uploadedBy:user.name, uploadedByRole:'employee_bypass' }),
      });
      const r = await res.json(); if(!res.ok){alert(r.message);return;} onProofUploaded(r.data);
    } catch{ alert('Upload failed'); } finally{ setUp(false); }
  };

  return (
    <div className="mt-2 border border-gray-200 rounded">
      {/* Header row */}
      <button onClick={()=>setOpen(v=>!v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-3 min-w-0">
          <FileCheck size={14} className="text-indigo-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900">{action.poNumber}</span>
          <span className="text-sm text-gray-600 truncate">{action.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${st.cls}`}>{st.label}</span>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          <span className="text-sm font-semibold text-gray-900">{INR(action.totalAmount)}</span>
          <span className="text-xs text-gray-400">{open?'▲':'▼'}</span>
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 text-sm">
          {action.description && <p className="text-gray-600 text-xs">{action.description}</p>}

          {action.hasPartChanges && action.parts?.length>0 && (
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400"><th className="text-left py-1 font-medium">Part</th><th className="text-center py-1 font-medium w-12">Qty</th><th className="text-right py-1 font-medium">Total</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {action.parts.map((p,i)=>(
                  <tr key={i}>
                    <td className="py-1 text-gray-700">{p.partName} {p.partNumber?`(${p.partNumber})`:''}</td>
                    <td className="py-1 text-center text-gray-600">{p.qty}</td>
                    <td className="py-1 text-right text-gray-700">{INR(p.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {action.additionalCosts?.length>0 && (
            <div className="space-y-0.5">
              {action.additionalCosts.map((c,i)=>(
                <div key={i} className="flex justify-between text-xs text-gray-600">
                  <span>{c.reason}</span><span>{INR(c.amount)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between font-semibold text-gray-900 text-xs pt-1 border-t border-gray-100">
            <span>Total</span><span>{INR(action.totalAmount)}</span>
          </div>

          {action.proofFiles?.length>0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {action.proofFiles.map((f,i)=>(
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-600 underline underline-offset-2">
                  <Eye size={12}/> Proof {i+1}{f.uploadedBy?` (${f.uploadedBy})`:''}
                </a>
              ))}
            </div>
          )}

          {['generated','proof_uploaded'].includes(action.status) && (
            <label className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer text-indigo-600 hover:text-indigo-700 ${up?'opacity-50 cursor-not-allowed':''}`}>
              <Upload size={12}/> {up?'Uploading…':'Upload Proof'}
              <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={uploadProof} disabled={up} className="hidden"/>
            </label>
          )}

          {action.signature && (
            <details className="text-xs">
              <summary className="text-gray-400 cursor-pointer hover:text-gray-600 select-none">View Signature</summary>
              <img src={action.signature} alt="Signature" className="mt-2 h-14 border rounded bg-white"/>
            </details>
          )}

          <p className="text-xs text-gray-400">Created by {action.createdByName||'—'} · {fmtD(action.createdAt)}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BYPASS PANEL — left slide-in, professional
// ─────────────────────────────────────────────────────────────────────────────
function BypassPanel({ trip, issueActions, onClose, onTripUpdate, onActionsUpdate }) {
  const user    = JSON.parse(localStorage.getItem('user')||'{}');
  const empName = user.name||'Employee';

  const [actLoad,   setActLoad]   = useState('');
  const [showFuel,  setShowFuel]  = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [proofUp,   setProofUp]   = useState({});

  const [fuelL,     setFuelL]     = useState('');
  const [fuelNote,  setFuelNote]  = useState('');
  const [fuelBills, setFuelBills] = useState([]);
  const [fuelUL,    setFuelUL]    = useState(false);
  const [fuelSave,  setFuelSave]  = useState(false);
  const fuelRef = useRef(null);

  const [issueSev,  setIssueSev]  = useState('medium');
  const [issueD,    setIssueD]    = useState('');
  const [issueSave, setIssueSave] = useState(false);

  const totalFilled = (trip.fuelLogs||[]).reduce((s,l)=>s+(l.litresFilled||0),0);
  const fuelRem     = trip.estimatedFuelLitres>0 ? Math.max(0,trip.estimatedFuelLitres-totalFilled) : null;
  const genPOs      = (issueActions||[]).filter(a=>['generated','proof_uploaded'].includes(a.status));
  const staffNames  = [...(trip.drivers||[]),...(trip.helpers||[])].map(s=>`${s.firstName} ${s.lastName}`).join(', ')||'—';

  const call = async (ep, method, body={}) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/driver-trips/${trip._id}/${ep}`,{
      method, headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
      body: JSON.stringify({...body,performedBy:empName,performedByRole:'employee_bypass',bypass:true}),
    });
    return res.json();
  };

  const handleStart = async () => { if(!confirm('Start trip on behalf of assigned staff?'))return; setActLoad('start'); try { const r=await call('start','PATCH'); if(!r.success){alert(r.message);return;} onTripUpdate(r.data); } catch{alert('Failed');} finally{setActLoad('');} };
  const handleEnd   = async () => { if(!confirm('End trip on behalf of assigned staff?'))return; setActLoad('end');   try { const r=await call('end',  'PATCH'); if(!r.success){alert(r.message);return;} onTripUpdate(r.data); } catch{alert('Failed');} finally{setActLoad('');} };

  const handleBills = async e => {
    const files=Array.from(e.target.files); if(fuelBills.length+files.length>5){alert('Max 5');return;} setFuelUL(true);
    try { const rs=await uploadMultipleToCloudinary(files); setFuelBills(p=>[...p,...rs.map(r=>({url:r.url,publicId:r.publicId}))]); } catch{alert('Failed');} finally{setFuelUL(false);};
  };

  const submitFuel = async () => {
    if(!fuelL||Number(fuelL)<=0){alert('Enter litres');return;} setFuelSave(true);
    try { const r=await call('fuel','POST',{litresFilled:Number(fuelL),receiptBills:fuelBills,note:fuelNote,filledBy:empName,filledByRole:'employee_bypass'}); if(!r.success){alert(r.message);return;} onTripUpdate(r.data); setFuelL(''); setFuelNote(''); setFuelBills([]); setShowFuel(false); } catch{alert('Failed');} finally{setFuelSave(false);}
  };

  const submitIssue = async () => {
    if(!issueD.trim()){alert('Describe the issue');return;} setIssueSave(true);
    try { const r=await call('report','POST',{description:issueD,severity:issueSev,reportedBy:empName,reportedByRole:'employee_bypass'}); if(!r.success){alert(r.message);return;} onTripUpdate(r.data); setIssueD(''); setIssueSev('medium'); setShowIssue(false); } catch{alert('Failed');} finally{setIssueSave(false);}
  };

  const uploadProof = async (poId,e) => {
    const file=e.target.files[0]; if(!file)return; setProofUp(p=>({...p,[poId]:true}));
    try { const up=await uploadToCloudinary(file); const token=localStorage.getItem('token'); const res=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/issue-actions/${poId}/proof`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({url:up.url,publicId:up.publicId,uploadedBy:empName,uploadedByRole:'employee_bypass'})}); const r=await res.json(); if(!res.ok){alert(r.message);return;} onActionsUpdate(r.data); } catch{alert('Failed');} finally{setProofUp(p=>({...p,[poId]:false}));}
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}/>
      <div className="fixed left-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-xl flex flex-col overflow-hidden border-r border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Acting on behalf of driver</h3>
            <p className="text-xs text-gray-500 mt-0.5">Logged as: <strong className="text-indigo-600">{empName}</strong></p>
            <p className="text-xs text-gray-400 mt-0.5">Staff: {staffNames}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded transition-colors"><X size={18} className="text-gray-500"/></button>
        </div>

        {/* Status bar */}
        <div className={`px-5 py-2.5 text-xs font-medium border-b flex items-center justify-between ${
          trip.status==='assigned'?'bg-blue-50 text-blue-700 border-blue-100':
          trip.status==='in_progress'?'bg-amber-50 text-amber-700 border-amber-100':'bg-green-50 text-green-700 border-green-100'
        }`}>
          <span>{trip.tripNumber} · {STATUS[trip.status]?.label||trip.status}</span>
          {trip.status==='in_progress'&&trip.startedAt&&(
            <span className="flex items-center gap-1"><Timer size={12}/><LiveDuration startedAt={trip.startedAt}/></span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{scrollbarWidth:'none'}}>

          {/* Trip controls */}
          {trip.status==='assigned'&&(
            <button onClick={handleStart} disabled={!!actLoad} className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
              <PlayCircle size={17}/>{actLoad==='start'?'Starting…':'Start Trip'}
            </button>
          )}
          {trip.status==='in_progress'&&(
            <button onClick={handleEnd} disabled={!!actLoad} className="w-full bg-green-600 hover:bg-green-700 text-white btn flex items-center justify-center gap-2 disabled:opacity-50">
              <CheckCircle size={17}/>{actLoad==='end'?'Ending…':'End Trip'}
            </button>
          )}

          {/* Fill Fuel */}
          {['assigned','in_progress'].includes(trip.status)&&(
            <div className="border border-gray-200 rounded">
              <button onClick={()=>setShowFuel(v=>!v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2"><Fuel size={15} className="text-amber-500"/> Fill Fuel</span>
                <span className="text-gray-400 text-xs">{showFuel?'▲':'▼'}</span>
              </button>
              {showFuel&&(
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                  {fuelRem!==null&&<p className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 border border-gray-200">Max allowed: <strong>{fuelRem.toFixed(1)}L</strong></p>}
                  <div><label className="form-label">Litres *</label><input type="number" value={fuelL} onChange={e=>setFuelL(e.target.value)} className="input-field" min="0.1" step="0.5" max={fuelRem>0?fuelRem:undefined} placeholder="e.g. 25"/></div>
                  <div><label className="form-label">Note</label><input value={fuelNote} onChange={e=>setFuelNote(e.target.value)} className="input-field" placeholder="Pump name, location"/></div>
                  <div>
                    <label className="form-label">Bills (max 5)</label>
                    <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                      <Upload size={14}/>{fuelUL?'Uploading…':'Choose'}
                      <input ref={fuelRef} type="file" accept="image/*,application/pdf" multiple onChange={handleBills} disabled={fuelUL} className="hidden"/>
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {fuelBills.map((b,i)=>(
                        <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-300 px-2 py-0.5 rounded">
                          <Receipt size={11}/> Bill {i+1}
                          <button onClick={()=>setFuelBills(p=>p.filter((_,j)=>j!==i))} className="ml-1 text-gray-400 hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={submitFuel} disabled={fuelSave||fuelUL} className="btn-primary flex-1 disabled:opacity-50">{fuelSave?'Saving…':'Save'}</button>
                    <button onClick={()=>setShowFuel(false)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Report Issue */}
          {['assigned','in_progress'].includes(trip.status)&&(
            <div className="border border-gray-200 rounded">
              <button onClick={()=>setShowIssue(v=>!v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2"><AlertCircle size={15} className="text-orange-500"/> Report Issue</span>
                <span className="text-gray-400 text-xs">{showIssue?'▲':'▼'}</span>
              </button>
              {showIssue&&(
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                  <div>
                    <label className="form-label">Severity</label>
                    <div className="flex gap-2">
                      {['low','medium','high'].map(s=>(
                        <label key={s} className={`flex-1 text-center py-1.5 text-xs font-medium border rounded cursor-pointer capitalize transition-colors ${issueSev===s?(s==='high'?'bg-red-50 border-red-400 text-red-700':s==='medium'?'bg-amber-50 border-amber-400 text-amber-700':'bg-blue-50 border-blue-400 text-blue-700'):'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                          <input type="radio" name="bp_sev" value={s} checked={issueSev===s} onChange={()=>setIssueSev(s)} className="hidden"/>{s}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div><label className="form-label">Description *</label><textarea value={issueD} onChange={e=>setIssueD(e.target.value)} className="input-field" rows={3} placeholder="Describe the issue…"/></div>
                  <div className="flex gap-2">
                    <button onClick={submitIssue} disabled={issueSave} className="btn-primary flex-1 disabled:opacity-50">{issueSave?'Saving…':'Submit'}</button>
                    <button onClick={()=>setShowIssue(false)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Proof for POs */}
          {genPOs.length>0&&(
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Upload Proof Against POs</p>
              {genPOs.map(po=>(
                <div key={po._id} className="border border-gray-200 rounded px-4 py-3 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div><span className="text-sm font-medium text-gray-900">{po.poNumber}</span><span className="text-xs text-gray-500 ml-2">{po.title}</span></div>
                    <span className="text-sm font-semibold text-gray-900">{INR(po.totalAmount)}</span>
                  </div>
                  {po.proofFiles?.length>0&&<p className="text-xs text-green-600 mb-2">{po.proofFiles.length} proof file{po.proofFiles.length>1?'s':''} uploaded</p>}
                  <label className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer text-indigo-600 hover:text-indigo-700 ${proofUp[po._id]?'opacity-50 cursor-not-allowed':''}`}>
                    <Upload size={12}/>{proofUp[po._id]?'Uploading…':'Upload Proof'}
                    <input type="file" accept="image/*,application/pdf" onChange={e=>uploadProof(po._id,e)} disabled={!!proofUp[po._id]} className="hidden"/>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FUEL MODAL (admin allocation)
// ─────────────────────────────────────────────────────────────────────────────
function AddFuelModal({ tripId, onClose, onSuccess }) {
  const [litres, setLitres] = useState('');
  const [note,   setNote]   = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if(!litres||Number(litres)<=0){alert('Enter litres');return;} setSaving(true);
    try { const token=localStorage.getItem('token'); const res=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${tripId}/add-fuel`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({litres:Number(litres),note})}); const r=await res.json(); if(!res.ok){alert(r.message);return;} onSuccess(r.data); onClose(); } catch{alert('Failed');} finally{setSaving(false);}
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b"><h3 className="text-sm font-semibold text-gray-900">Add Fuel Allocation</h3><button onClick={onClose}><X size={18} className="text-gray-400"/></button></div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-500">Adds to the existing fuel cap. Logged for record-keeping.</p>
          <div><label className="form-label">Additional Litres *</label><input type="number" value={litres} onChange={e=>setLitres(e.target.value)} className="input-field" min="0.1" step="0.5" placeholder="e.g. 20" autoFocus/></div>
          <div><label className="form-label">Reason / Note</label><input type="text" value={note} onChange={e=>setNote(e.target.value)} className="input-field" placeholder="e.g. Route extended by 30 km"/></div>
        </div>
        <div className="px-5 pb-5 flex gap-3"><button onClick={save} disabled={saving} className="btn-primary flex-1">{saving?'Saving…':'Add Fuel'}</button><button onClick={onClose} className="btn-secondary">Cancel</button></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function TripDetailPage() {
  const params = useParams();

  const [trip,         setTrip]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [closing,      setClosing]      = useState(false);
  const [showAddFuel,  setShowAddFuel]  = useState(false);
  const [showBypass,   setShowBypass]   = useState(false);
  const [issueActions, setIssueActions] = useState([]);
  const [showPOModal,  setShowPOModal]  = useState(false);
  const [selIssue,     setSelIssue]     = useState(null);
  const [activeTab,    setActiveTab]    = useState('details');

  const user        = JSON.parse(localStorage.getItem('user')||'{}');
  const employeeName = user.name||'Employee';

  useEffect(() => { if(params.id){fetchTrip();fetchActions();} },[params.id]);

  const fetchTrip = async () => {
    const token = localStorage.getItem('token');
    try { const res=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${params.id}`,{headers:{Authorization:`Bearer ${token}`}}); const r=await res.json(); setTrip(r.data); }
    catch(e){console.error(e);} finally{setLoading(false);}
  };
  const fetchActions = async () => {
    const token = localStorage.getItem('token');
    try { const res=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/issue-actions/trip/${params.id}`,{headers:{Authorization:`Bearer ${token}`}}); const r=await res.json(); setIssueActions(r.data||[]); }
    catch(e){console.error(e);}
  };
  const upsertAction = a => setIssueActions(prev=>{ const i=prev.findIndex(x=>x._id===a._id); return i>=0?prev.map((x,j)=>j===i?a:x):[...prev,a]; });
  const handleClose  = async () => {
    if(!confirm('Officially close this trip?'))return; setClosing(true);
    const token = localStorage.getItem('token');
    try { const res=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${trip._id}/close`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`}}); const r=await res.json(); if(!res.ok){alert(r.message);return;} setTrip(r.data); } catch{alert('Failed');} finally{setClosing(false);}
  };

  // Build chronological activity feed from trip data
  const buildActivity = t => {
    if (!t) return [];
    const events = [];
    events.push({ time: t.createdAt, icon: Flag, label: 'Trip created', sub: null });
    if (t.startedAt) events.push({ time: t.startedAt, icon: PlayCircle, label: 'Trip started', sub: t.startedBy ? `by ${t.startedBy}${t.startedByRole==='employee_bypass'?' (staff bypass)':''}` : null });
    (t.fuelLogs||[]).forEach(l => events.push({ time: l.filledAt, icon: Fuel, label: `${l.litresFilled}L fuel filled`, sub: l.filledBy?`by ${l.filledBy}${l.bypass?' (bypass)':''}`:null }));
    (t.issueReports||[]).forEach((r,i) => events.push({ time: r.reportedAt, icon: AlertTriangle, label: `Issue reported — ${r.severity?.toUpperCase()}`, sub: r.reportedBy?`by ${r.reportedBy}${r.bypass?' (bypass)':''}`:`#${i+1}` }));
    issueActions.forEach(a => { if(a.generatedAt) events.push({ time: a.generatedAt, icon: FileCheck, label: `PO generated — ${a.poNumber}`, sub: `${INR(a.totalAmount)} · by ${a.createdByName||'—'}` }); });
    if (t.completedAt) events.push({ time: t.completedAt, icon: CheckCircle, label: 'Trip completed', sub: t.completedBy?`by ${t.completedBy}${t.completedByRole==='employee_bypass'?' (staff bypass)':''}`:null });
    if (t.officiallyClosedAt) events.push({ time: t.officiallyClosedAt, icon: Flag, label: 'Officially closed', sub: null });
    return events.sort((a,b)=>new Date(a.time)-new Date(b.time));
  };

  if (loading) return <div className="container-main py-12 text-center text-gray-500">Loading…</div>;
  if (!trip)   return <div className="container-main py-12 text-center"><p className="text-gray-500 mb-4">Trip not found.</p><Link href="/dashboard/employee/trips"><button className="btn-secondary">Back</button></Link></div>;

  const sc         = STATUS[trip.status]||STATUS.assigned;
  const isOverdue  = trip.deadline && trip.status!=='completed' && new Date(trip.deadline)<new Date();
  const durMs      = trip.startedAt&&trip.completedAt ? new Date(trip.completedAt).getTime()-new Date(trip.startedAt).getTime() : null;
  const allStaff   = [...(trip.drivers||[]).map(d=>({...d,type:'Driver'})),...(trip.helpers||[]).map(h=>({...h,type:'Helper'})),...(trip.supervisors||[]).map(s=>({...s,type:'Supervisor'}))];
  const totalFuel  = trip.fuelLogs?.reduce((s,l)=>s+(l.litresFilled||0),0)||0;
  const fuelCapPct = trip.estimatedFuelLitres>0?Math.min(100,Math.round((totalFuel/trip.estimatedFuelLitres)*100)):0;
  const activity   = buildActivity(trip);
  const TABS = ['details','fuel','issues','activity'];

  return (
    <div className="container-main max-w-9xl">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/employee/trips">
            <button className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm">
              <ChevronLeft size={17}/> Trips
            </button>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">{trip.tripNumber}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['assigned','in_progress'].includes(trip.status)&&(
            <button onClick={()=>setShowBypass(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              <Users size={15}/> Handle for Driver
            </button>
          )}
          {trip.status==='completed'&&!trip.officiallyClosedAt&&(
            <button onClick={handleClose} disabled={closing}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50">
              <CheckCircle size={15}/>{closing?'Closing…':'Finish Trip (Official)'}
            </button>
          )}
        </div>
      </div>

      {/* ── Trip summary card ── */}
      <div className="card p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-xl font-bold text-gray-900">{trip.tripNumber}</h1>
              <span className={`text-xs px-2.5 py-1 rounded font-medium ${sc.cls}`}>{sc.label}</span>
              {isOverdue&&<span className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200 font-medium flex items-center gap-1"><AlertTriangle size={11}/> Overdue</span>}
              {trip.officiallyClosedAt&&<span className="text-xs px-2.5 py-1 rounded bg-gray-100 text-gray-600 font-medium">Closed</span>}
            </div>
            {trip.purpose&&<p className="text-sm text-gray-600 mb-2">{trip.purpose}</p>}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
              <span className="flex items-center gap-1.5"><MapPin size={13} className="text-gray-400"/>{trip.fromLocation||'—'} → {trip.toLocation||'—'}</span>
              {trip.estimatedDistance&&<span className="flex items-center gap-1.5"><Gauge size={13} className="text-gray-400"/>{trip.estimatedDistance} km</span>}
              {trip.deadline&&<span className={`flex items-center gap-1.5 ${isOverdue?'text-red-600 font-medium':''}`}><Calendar size={13} className="text-gray-400"/>{fmtD(trip.deadline)}</span>}
            </div>
            {(trip.startedBy||trip.completedBy)&&(
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
                {trip.startedBy&&<span>Started by: <span className={trip.startedByRole==='employee_bypass'?'text-indigo-600 font-medium':'text-gray-600'}>{trip.startedBy}{trip.startedByRole==='employee_bypass'?' (bypass)':''}</span></span>}
                {trip.completedBy&&<span>Ended by: <span className={trip.completedByRole==='employee_bypass'?'text-indigo-600 font-medium':'text-gray-600'}>{trip.completedBy}{trip.completedByRole==='employee_bypass'?' (bypass)':''}</span></span>}
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="flex-shrink-0">
            {trip.status==='in_progress'&&trip.startedAt&&(
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Running for</p>
                <p className="text-xl font-semibold text-amber-600"><LiveDuration startedAt={trip.startedAt}/></p>
              </div>
            )}
            {durMs!==null&&(
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Total duration</p>
                <p className="text-xl font-semibold text-green-600">{msToHM(durMs)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Top info row: vehicle + customer + staff ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Vehicle */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Vehicle</p>
          <div className="flex gap-3">
            {trip.vehicle?.photos?.[0]?.url
              ? <img src={trip.vehicle.photos[0].url} alt="" className="w-14 h-11 object-cover rounded border border-gray-200 flex-shrink-0"/>
              : <div className="w-14 h-11 bg-gray-100 rounded border border-gray-200 flex items-center justify-center flex-shrink-0"><Car size={20} className="text-gray-400"/></div>}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{trip.vehicle?.make} {trip.vehicle?.model}</p>
              <p className="text-xs text-gray-500">{trip.vehicle?.registrationNumber}</p>
              <p className="text-xs text-gray-400 mt-0.5">{trip.fuelType}{trip.vehicle?.currentFuelQty!=null?` · ${trip.vehicle.currentFuelQty}L`:''}</p>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer</p>
          {trip.customerName ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{trip.customerName}</p>
              {trip.customerPhone&&<p className="text-xs text-gray-500 mt-0.5">{trip.customerPhone}</p>}
              {trip.orderReference&&<p className="text-xs text-gray-400 mt-0.5">Ref: {trip.orderReference}</p>}
              {trip.customerAddress&&<p className="text-xs text-gray-400 mt-0.5 truncate">{trip.customerAddress}</p>}
            </div>
          ) : <p className="text-sm text-gray-400">—</p>}
        </div>

        {/* Staff */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assigned Staff</p>
          {allStaff.length===0 ? <p className="text-sm text-gray-400">None assigned</p> : (
            <div className="space-y-2">
              {allStaff.slice(0,3).map((s,i)=>(
                <div key={i} className="flex items-center gap-2">
                  {s.profilePhoto?.url
                    ? <img src={s.profilePhoto.url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-gray-200"/>
                    : <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200"><User size={13} className="text-gray-400"/></div>}
                  <div className="min-w-0">
                    <span className="text-xs text-gray-900">{s.firstName} {s.lastName}</span>
                    <span className="text-xs text-gray-400 ml-1.5">({s.type})</span>
                  </div>
                </div>
              ))}
              {allStaff.length>3&&<p className="text-xs text-gray-400">+{allStaff.length-3} more</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="card mb-0">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id:'details',  label:'Trip Details' },
            { id:'fuel',     label:`Fuel${totalFuel>0?` (${totalFuel}L)`:''}` },
            { id:'issues',   label:`Issues${trip.issueReports?.length?` (${trip.issueReports.length})`:''}` },
            { id:'activity', label:'Activity Log' },
          ].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                activeTab===t.id?'border-indigo-600 text-indigo-600':'border-transparent text-gray-600 hover:text-gray-900'
              }`}>{t.label}</button>
          ))}
        </div>

        <div className="p-5">

          {/* ── Details Tab ── */}
          {activeTab==='details'&&(
            <div className="space-y-6">
              <div>
                <SH>Route & Schedule</SH>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Row label="From" value={trip.fromLocation}/>
                  <Row label="To" value={trip.toLocation}/>
                  <Row label="Est. Distance" value={trip.estimatedDistance?`${trip.estimatedDistance} km`:null}/>
                  <Row label="Deadline" value={fmtD(trip.deadline)}/>
                </div>
              </div>
              <div>
                <SH>Timeline</SH>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Row label="Created"           value={fmtDT(trip.createdAt)}/>
                  <Row label="Started"           value={fmtDT(trip.startedAt)}/>
                  <Row label="Completed"         value={fmtDT(trip.completedAt)}/>
                  <Row label="Officially Closed" value={fmtDT(trip.officiallyClosedAt)}/>
                </div>
                {durMs!==null&&<p className="mt-3 text-xs text-gray-500">Total trip duration: <strong className="text-gray-700">{msToHM(durMs)}</strong></p>}
              </div>
              <div>
                <SH>Customer Details</SH>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Row label="Name"            value={trip.customerName}/>
                  <Row label="Phone"           value={trip.customerPhone}/>
                  <Row label="Email"           value={trip.customerEmail}/>
                  <Row label="Order Reference" value={trip.orderReference}/>
                  {trip.customerAddress&&<Row label="Delivery Address" value={trip.customerAddress} span/>}
                </div>
              </div>
              {trip.notes&&(
                <div>
                  <SH>Notes</SH>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{trip.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Fuel Tab ── */}
          {activeTab==='fuel'&&(
            <div className="space-y-5">
              {/* Progress */}
              {trip.estimatedFuelLitres>0&&(
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Filled: <strong className="text-gray-900">{totalFuel}L</strong></span>
                    <span>Allocated: <strong className="text-gray-900">{trip.estimatedFuelLitres}L</strong></span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${fuelCapPct>=90?'bg-red-500':fuelCapPct>=70?'bg-amber-400':'bg-green-500'}`} style={{width:`${fuelCapPct}%`}}/>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{fuelCapPct}% used · {Math.max(0,trip.estimatedFuelLitres-totalFuel).toFixed(1)}L remaining</p>
                </div>
              )}

              {/* Admin allocations */}
              {trip.fuelAssignments?.length>0&&(
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <SH>Admin Allocations</SH>
                    {['assigned','in_progress'].includes(trip.status)&&(
                      <button onClick={()=>setShowAddFuel(true)} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1 mb-4">
                        <Plus size={12}/> Add
                      </button>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200"><th className="text-left py-1.5 text-xs text-gray-500 font-medium">#</th><th className="text-left py-1.5 text-xs text-gray-500 font-medium">Litres</th><th className="text-left py-1.5 text-xs text-gray-500 font-medium">Note</th><th className="text-right py-1.5 text-xs text-gray-500 font-medium">When</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {trip.fuelAssignments.map((fa,i)=>(
                        <tr key={i}><td className="py-1.5 text-gray-400 text-xs">#{i+1}</td><td className="py-1.5 font-medium text-gray-900">{fa.litres}L</td><td className="py-1.5 text-gray-600 text-xs">{fa.note||'—'}</td><td className="py-1.5 text-right text-xs text-gray-400">{fmtDT(fa.assignedAt)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!trip.fuelAssignments?.length&&['assigned','in_progress'].includes(trip.status)&&(
                <div className="flex justify-end">
                  <button onClick={()=>setShowAddFuel(true)} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                    <Plus size={12}/> Add Fuel Allocation
                  </button>
                </div>
              )}

              {/* Staff fills */}
              <div>
                <SH>Staff Fuel Fills</SH>
                {!trip.fuelLogs?.length ? <p className="text-sm text-gray-400">No fills logged yet.</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200"><th className="text-left py-1.5 text-xs text-gray-500 font-medium">Litres</th><th className="text-left py-1.5 text-xs text-gray-500 font-medium">By</th><th className="text-left py-1.5 text-xs text-gray-500 font-medium">Note</th><th className="text-left py-1.5 text-xs text-gray-500 font-medium">Bills</th><th className="text-right py-1.5 text-xs text-gray-500 font-medium">When</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {trip.fuelLogs.map((log,i)=>(
                        <tr key={i}>
                          <td className="py-2 font-semibold text-gray-900">{log.litresFilled}L</td>
                          <td className="py-2 text-gray-600 text-xs">{log.filledBy||'—'}{log.bypass&&<span className="ml-1 text-indigo-500">(bypass)</span>}</td>
                          <td className="py-2 text-gray-400 text-xs">{log.note||'—'}</td>
                          <td className="py-2 text-xs">
                            {log.receiptBills?.length>0 ? log.receiptBills.map((b,j)=>(
                              <a key={j} href={b.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline underline-offset-1 mr-2">Bill {j+1}</a>
                            )) : '—'}
                          </td>
                          <td className="py-2 text-right text-xs text-gray-400">{fmtDT(log.filledAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── Issues Tab ── */}
          {activeTab==='issues'&&(
            <div>
              {!trip.issueReports?.length ? (
                <p className="text-sm text-gray-400 py-2">No issues reported for this trip.</p>
              ) : (
                <div className="space-y-4">
                  {trip.issueReports.map((issue,i)=>{
                    const actionsForIssue = issueActions.filter(a=>a.issueIndex===i);
                    return (
                      <div key={i} className="border border-gray-200 rounded">
                        <div className="flex items-start gap-3 p-4">
                          <span className={`mt-0.5 text-xs px-2 py-0.5 rounded font-semibold border flex-shrink-0 ${SEV[issue.severity]||SEV.medium}`}>
                            {issue.severity?.toUpperCase()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{issue.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {issue.reportedBy&&<>Reported by <span className={issue.bypass?'text-indigo-500':undefined}>{issue.reportedBy}{issue.bypass?' (bypass)':''}</span> · </>}
                              {fmtDT(issue.reportedAt)}
                            </p>
                          </div>
                          <button
                            onClick={()=>{ setSelIssue(i); setShowPOModal(true); }}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-indigo-300 text-indigo-700 rounded hover:bg-indigo-50 transition-colors">
                            <FileCheck size={13}/> Action
                          </button>
                        </div>
                        {actionsForIssue.length>0&&(
                          <div className="px-4 pb-4 space-y-1 border-t border-gray-100">
                            {actionsForIssue.map(a=>(
                              <PORow key={a._id} action={a} onProofUploaded={upsertAction}/>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Activity Log Tab ── */}
          {activeTab==='activity'&&(
            <div>
              {activity.length===0 ? <p className="text-sm text-gray-400">No activity recorded yet.</p> : (
                <div className="relative">
                  {/* vertical line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"/>
                  <div className="space-y-0">
                    {activity.map((ev,i)=>{
                      const Icon = ev.icon;
                      return (
                        <div key={i} className="relative flex gap-4 pb-4 last:pb-0">
                          <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                            <Icon size={14} className="text-gray-500"/>
                          </div>
                          <div className="pt-1 min-w-0">
                            <p className="text-sm text-gray-900">{ev.label}</p>
                            {ev.sub&&<p className="text-xs text-gray-500 mt-0.5">{ev.sub}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">{fmtDT(ev.time)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals / Panels ── */}
      {showAddFuel&&<AddFuelModal tripId={trip._id} onClose={()=>setShowAddFuel(false)} onSuccess={u=>{setTrip(u);setShowAddFuel(false);}}/>}

      {showPOModal&&selIssue!==null&&(
        <POCreateModal trip={trip} issueIndex={selIssue} issueDesc={trip.issueReports[selIssue]?.description||''}
          employeeName={employeeName}
          onClose={()=>{setShowPOModal(false);setSelIssue(null);}}
          onCreated={a=>{upsertAction(a);setShowPOModal(false);setSelIssue(null);}}/>
      )}

      {showBypass&&(
        <BypassPanel trip={trip} issueActions={issueActions} onClose={()=>setShowBypass(false)}
          onTripUpdate={u=>setTrip(u)} onActionsUpdate={upsertAction}/>
      )}
    </div>
  );
}