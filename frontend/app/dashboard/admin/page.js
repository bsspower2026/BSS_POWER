'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flag, Fuel, CreditCard, CheckCircle, Clock, AlertTriangle,
  PlayCircle, FileCheck, Upload, TrendingUp, Car, Users
} from 'lucide-react';

const INR    = n => `₹${(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtDT  = d => d ? new Date(d).toLocaleString('en-IN',{ day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const fmtD   = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

const ACTIVITY_META = {
  trip_start:     { icon: PlayCircle,  color: 'text-indigo-600',  bg: 'bg-indigo-50',  label: 'Trip Started' },
  trip_end:       { icon: CheckCircle, color: 'text-green-600',   bg: 'bg-green-50',   label: 'Trip Completed' },
  fuel_fill:      { icon: Fuel,        color: 'text-amber-600',   bg: 'bg-amber-50',   label: 'Fuel Filled' },
  issue:          { icon: AlertTriangle,color:'text-red-600',     bg: 'bg-red-50',     label: 'Issue Reported' },
  po_generated:   { icon: FileCheck,   color: 'text-indigo-600',  bg: 'bg-indigo-50',  label: 'PO Generated' },
  proof_uploaded: { icon: Upload,      color: 'text-green-600',   bg: 'bg-green-50',   label: 'Proof Uploaded' },
  payment:        { icon: CreditCard,  color: 'text-gray-600',    bg: 'bg-gray-100',   label: 'Payment Made' },
};

function StatCard({ label, value, sub, Icon, iconColor, linkTo, highlight }) {
  const inner = (
    <div className={`card p-4 ${highlight ? 'border-l-4 border-l-indigo-500' : ''} ${linkTo ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-indigo-700' : 'text-gray-900'}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-gray-100`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
  return linkTo ? <Link href={linkTo}>{inner}</Link> : inner;
}

function ActivityItem({ ev }) {
  const meta = ACTIVITY_META[ev.type] || ACTIVITY_META.trip_start;
  const Icon = meta.icon;

  const getLabel = () => {
    switch (ev.type) {
      case 'trip_start':     return `Trip ${ev.trip} started${ev.vehicle ? ` · ${ev.vehicle}${ev.regNo ? ` (${ev.regNo})` : ''}` : ''}${ev.driver ? ` · ${ev.driver}` : ''}`;
      case 'trip_end':       return `Trip ${ev.trip} completed${ev.vehicle ? ` · ${ev.vehicle}` : ''}`;
      case 'fuel_fill':      return `${ev.litres}L fuel filled on Trip ${ev.trip}${ev.by ? ` by ${ev.by}` : ''}${ev.hasBills ? ' · bill attached' : ''}`;
      case 'issue':          return `Issue on Trip ${ev.trip} — ${ev.severity?.toUpperCase()}: ${ev.desc}`;
      case 'po_generated':   return `PO ${ev.poNumber} generated for Trip ${ev.trip} · ${INR(ev.amount)}`;
      case 'proof_uploaded': return `Proof uploaded for PO ${ev.poNumber} (Trip ${ev.trip})`;
      case 'payment':        return `${ev.payType === 'fuel' ? 'Fuel' : 'Bill'} payment recorded for Trip ${ev.trip} · ${INR(ev.amount)}${ev.by ? ` by ${ev.by}` : ''}`;
      default: return '—';
    }
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={15} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-snug">{getLabel()}</p>
        <p className="text-xs text-gray-400 mt-0.5">{fmtDT(ev.time)}</p>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOverview(); }, []);

  const fetchOverview = async () => {
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/overview`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return <div className="container-main py-12 text-center text-gray-500">Loading…</div>;
  if (!data)   return <div className="container-main py-12 text-center text-gray-500">Failed to load overview.</div>;

  const { stats, activity } = data;

  return (
    <div className="container-main max-w-9xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-sm text-gray-500 mt-1">All transactions, payments, and trip activity at a glance.</p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Trips"    value={stats.activeTrips}    sub={`${stats.totalTrips} total`}     Icon={Flag}      iconColor="text-indigo-600" />
        <StatCard label="Completed Trips" value={stats.completedTrips} sub="all time"                       Icon={CheckCircle} iconColor="text-green-600" />
        <StatCard label="Total Vehicles"  value={stats.totalVehicles}  sub="in fleet"                       Icon={Car}       iconColor="text-blue-600" />
        <StatCard label="Total Staff"     value={stats.totalDrivers}   sub="drivers registered"              Icon={Users}     iconColor="text-gray-600" />
      </div>

      {/* ── Payment summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Fuel payments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Fuel size={16} className="text-amber-500" /> Fuel Payments
            </h2>
            <Link href="/dashboard/admin/fuel-payments" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Pending</p>
              <p className="text-xl font-bold text-amber-600">{stats.pendingFuel}</p>
              <p className="text-xs text-gray-400 mt-0.5">payments awaiting</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Paid</p>
              <p className="text-xl font-bold text-gray-900">{INR(stats.totalFuelPaid)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stats.paidFuel} payments made</p>
            </div>
          </div>
          {stats.pendingFuel > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              {stats.pendingFuel} fuel payment{stats.pendingFuel > 1 ? 's' : ''} pending review
            </div>
          )}
        </div>

        {/* Bill payments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard size={16} className="text-indigo-500" /> Bill Payments
            </h2>
            <Link href="/dashboard/admin/bill-payments" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Pending</p>
              <p className="text-xl font-bold text-indigo-600">{stats.pendingBill}</p>
              <p className="text-xs text-gray-400 mt-0.5">PO bills awaiting</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Paid</p>
              <p className="text-xl font-bold text-gray-900">{INR(stats.totalBillPaid)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stats.paidBill} payments made</p>
            </div>
          </div>
          {stats.pendingBill > 0 && (
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-700">
              {stats.pendingBill} PO bill{stats.pendingBill > 1 ? 's' : ''} pending payment
            </div>
          )}
        </div>
      </div>

      {/* ── Combined payments summary ── */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">Total Disbursed</span>
          </div>
          <span className="text-xl font-bold text-gray-900">{INR((stats.totalFuelPaid||0) + (stats.totalBillPaid||0))}</span>
        </div>
        <div className="flex gap-6 mt-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            Fuel: {INR(stats.totalFuelPaid)}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
            Bills: {INR(stats.totalBillPaid)}
          </div>
        </div>
      </div>

      {/* ── Recent activity feed ── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No activity recorded yet.</p>
        ) : (
          <div>
            {activity.map((ev, i) => <ActivityItem key={i} ev={ev} />)}
          </div>
        )}
      </div>
    </div>
  );
}