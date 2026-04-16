'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ── Icons (inline SVG helpers) ────────────────────────────────────────────────
const Icon = ({ d, size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

// ── Section fade-in hook ──────────────────────────────────────────────────────
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    el.querySelectorAll('.fade-up').forEach(node => obs.observe(node));
    return () => obs.disconnect();
  }, []);
  return ref;
}

const fadeStyle = {
  opacity: 0,
  transform: 'translateY(24px)',
  transition: 'opacity 0.55s ease, transform 0.55s ease',
};

// ── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: 'Trip Lifecycle Management',
    desc: 'Create, assign, and monitor every trip from dispatch to official closure. Full history of who did what and when.',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    title: 'Fuel Tracking & Caps',
    desc: 'Admin sets fuel allocations per trip. Drivers log fills with receipt photos. Automatic cap enforcement prevents over-spend.',
    icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  },
  {
    title: 'Purchase Orders (PO)',
    desc: 'Office staff raise formal POs against trip issues — parts, fines, or labour costs — with full breakdown and digital signature.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'Photo Evidence Capture',
    desc: 'Drivers capture issue photos directly from the camera. Receipt images and proof files are stored against each record.',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    title: 'Admin Payment Dashboard',
    desc: 'Every fuel fill and PO automatically creates a payment request. Admin reviews, verifies proof, and records payments in one view.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Multi-Role Access Control',
    desc: 'Admin, Employee, Driver, Helper, and Site Supervisor roles — each with a tailored portal and precisely scoped permissions.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
];

const ROLES = [
  {
    emoji: '🛡️', name: 'Admin', color: 'rgba(79,110,247,0.1)',
    desc: 'Full financial oversight. Reviews all payment requests, approves fuel bills, PO proof, and maintains payment records.',
    perms: ['View all trips and activity', 'Fuel payment approval', 'PO bill payment', 'Overview dashboard'],
  },
  {
    emoji: '💼', name: 'Employee', color: 'rgba(16,185,129,0.1)',
    desc: 'Manages trips, staff, vehicles, and parts. Can act on behalf of drivers when needed through bypass mode.',
    perms: ['Create and manage trips', 'Staff & vehicle management', 'Raise Purchase Orders', 'Driver bypass actions'],
  },
  {
    emoji: '🚛', name: 'Driver / Helper', color: 'rgba(245,158,11,0.1)',
    desc: 'Mobile-first portal. Starts trips, logs fuel fills with camera-captured receipts, reports issues with photo evidence.',
    perms: ['Start and end trips', 'Log fuel fills', 'Report issues with photos', 'Upload proof against POs'],
  },
  {
    emoji: '📋', name: 'Site Supervisor', color: 'rgba(168,85,247,0.1)',
    desc: 'View-only access to assigned trips. Monitors progress, route, fuel, and issues without performing actions.',
    perms: ['View assigned trips', 'Monitor fuel and issues', 'Track trip progress', 'Read-only access'],
  },
];

const STEPS = [
  {
    n: '01', title: 'Trip Creation & Assignment',
    desc: 'An employee creates a trip with vehicle, route, customer details, and assigned staff. An initial fuel allocation is set as a cap.',
    tags: ['Vehicle Selection', 'Staff Assignment', 'Fuel Allocation', 'Customer Info'],
  },
  {
    n: '02', title: 'Trip Execution by Driver',
    desc: 'The driver starts the trip from their mobile portal. During the trip, they log fuel fills with receipt photos and report issues with photo evidence.',
    tags: ['Live Timer', 'Fuel Logging', 'Camera Capture', 'Issue Reporting'],
  },
  {
    n: '03', title: 'Purchase Order Against Issues',
    desc: 'For any reported issue, an employee raises a formal PO with parts list, additional costs, unit pricing, and an authorising digital signature.',
    tags: ['Parts Catalogue', 'Cost Breakdown', 'Digital Signature', 'PO Number'],
  },
  {
    n: '04', title: 'Proof Upload & Admin Review',
    desc: 'The driver uploads proof of the PO (receipt, service bill). This auto-creates a pending payment request on the admin dashboard.',
    tags: ['Auto Payment Request', 'Proof Verification', 'Admin Approval'],
  },
  {
    n: '05', title: 'Official Trip Closure',
    desc: 'Once the driver marks the trip complete, an employee officially closes it — locking the full audit record permanently.',
    tags: ['Audit Trail', 'Official Closure', 'Complete Record'],
  },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const featRef = useFadeIn();
  const rolesRef = useFadeIn();
  const workRef = useFadeIn();
  const payRef = useFadeIn();

  // Inject Google Font
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 68, behavior: 'smooth' });
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#ffffff', color: '#374151', lineHeight: 1.6 }}>

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60,
        display: 'flex', alignItems: 'center', padding: '0 24px',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{ width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/bss-primary-logo.png"
              alt="BSS Logo"
              style={{ height: 32, width: 'auto', objectFit: 'contain' }}
            />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
              BSS <span style={{ color: '#4f6ef7' }}>Power</span>
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {['features', 'roles', 'workflow', 'payments'].map(id => (
              <button key={id} onClick={() => scrollTo(id)}
                style={{ fontSize: 13, color: '#6b7280', padding: '6px 12px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}
                onMouseEnter={e => { e.target.style.color = '#111827'; e.target.style.background = '#f3f4f6'; }}
                onMouseLeave={e => { e.target.style.color = '#6b7280'; e.target.style.background = 'none'; }}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
            <Link href="/login">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#4f6ef7', padding: '7px 18px', borderRadius: 7, cursor: 'pointer', marginLeft: 4, display: 'inline-block', transition: 'background 0.2s' }}
                onMouseEnter={e => e.target.style.background = '#3d5be5'}
                onMouseLeave={e => e.target.style.background = '#4f6ef7'}>
                Sign In →
              </span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMenuOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 6 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 99, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['features', 'roles', 'workflow', 'payments'].map(id => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ fontSize: 14, color: '#374151', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', textTransform: 'capitalize' }}>
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
          <Link href="/login" onClick={() => setMenuOpen(false)}>
            <span style={{ display: 'block', marginTop: 8, textAlign: 'center', background: '#4f6ef7', color: '#fff', padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
              Sign In →
            </span>
          </Link>
        </div>
      )}

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 24px 60px', position: 'relative', overflow: 'hidden', background: '#ffffff' }}>
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(79,110,247,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(79,110,247,0.06) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%,black 30%,transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%,black 30%,transparent 100%)',
        }} />
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse at center,rgba(79,110,247,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 60, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4f6ef7', background: 'rgba(79,110,247,0.08)', border: '1px solid rgba(79,110,247,0.2)', padding: '5px 14px', borderRadius: 100, marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f6ef7', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              BSS Power Private Limited
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, color: '#111827', lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
              Fleet Operations,{' '}
              <span style={{ color: '#4f6ef7' }}>Fully Managed</span>
            </h1>
            <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.75, marginBottom: 36, maxWidth: 440 }}>
              End-to-end vehicle management for BSS Power's operations team. Track trips in real-time, manage fuel and purchase orders, and maintain complete financial accountability.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/login">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#fff', background: '#4f6ef7', padding: '12px 24px', borderRadius: 8, cursor: 'pointer' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                  Sign In to Platform
                </span>
              </Link>

            </div>
            {/* Stats */}
            <div style={{ display: 'flex', gap: 32, marginTop: 48, paddingTop: 32, borderTop: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
              {[['5', 'User Roles'], ['100%', 'Trip Visibility'], ['₹0', 'Untracked Spend']].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: -1, fontFamily: "'DM Mono', monospace" }}>{n}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div style={{ position: 'relative' }} className="hidden lg:block">
            <div style={{ background: '#111318', border: '1px solid #2a2d36', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.06)' }}>
              {/* Window bar */}
              <div style={{ height: 36, background: '#1a1d24', borderBottom: '1px solid #2a2d36', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
                {['#ff5f57', '#ffbd2e', '#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ padding: 20, background: '#111318' }}>
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                  {[['Active Trips', '12', '↑ 3 started today', '#10b981'], ['Fuel Pending', '8', '4 new today', '#d97706'], ['PO Bills', '3', 'Review needed', '#dc2626']].map(([label, val, sub, color]) => (
                    <div key={label} style={{ background: '#1a1d24', border: '1px solid #2a2d36', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#f0f2f5', fontFamily: "'DM Mono', monospace", letterSpacing: -1 }}>{val}</div>
                      <div style={{ fontSize: 10, color, marginTop: 3 }}>{sub}</div>
                    </div>
                  ))}
                </div>
                {/* Trip rows */}
                {[
                  ['TRP-00041', 'Bhubaneswar → Berhampur', 'In Progress', '#f59e0b', 'rgba(245,158,11,0.15)'],
                  ['TRP-00042', 'Cuttack → Rourkela', 'Assigned', '#4f6ef7', 'rgba(79,110,247,0.15)'],
                  ['TRP-00039', 'Puri → Bhubaneswar', 'Completed', '#10b981', 'rgba(16,185,129,0.15)'],
                  ['TRP-00043', 'Sambalpur → Jharsuguda', 'Assigned', '#4f6ef7', 'rgba(79,110,247,0.15)'],
                ].map(([num, route, status, dot, badgeBg]) => (
                  <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1a1d24', border: '1px solid #2a2d36', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#f0f2f5', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{num}</span>
                    <span style={{ fontSize: 11, color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{route}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: badgeBg, color: dot, flexShrink: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: -20, right: 20, fontSize: 11, color: '#9ca3af', fontFamily: "'DM Mono', monospace" }}>Admin Dashboard · Live View</div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <div ref={featRef} style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4f6ef7', marginBottom: 10 }}>Platform Capabilities</p>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 700, color: '#111827', letterSpacing: -1, lineHeight: 1.15, marginBottom: 12 }}>Everything your fleet operations need</h2>
            <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 560, lineHeight: 1.7 }}>Purpose-built for BSS Power's vehicle and logistics workflows, from trip creation to final payment reconciliation.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 1, background: '#e5e7eb', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="fade-up" style={{ ...fadeStyle, background: '#fff', padding: '28px 24px', transitionDelay: `${i * 0.08}s` }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <div style={{ width: 44, height: 44, background: 'rgba(79,110,247,0.08)', border: '1px solid rgba(79,110,247,0.18)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ──────────────────────────────────────────────────────────── */}
      <section id="roles" style={{ padding: '80px 24px', background: '#ffffff' }}>
        <div ref={rolesRef} style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4f6ef7', marginBottom: 10 }}>Access Roles</p>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 700, color: '#111827', letterSpacing: -1, lineHeight: 1.15, marginBottom: 12 }}>The right view for every person</h2>
            <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 560, lineHeight: 1.7 }}>Each role gets a dedicated portal built around what they actually need — nothing more, nothing less.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {ROLES.map((r, i) => (
              <div key={r.name} className="fade-up" style={{ ...fadeStyle, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px 22px', transitionDelay: `${i * 0.1}s`, transition: `${fadeStyle.transition}, border-color 0.2s, box-shadow 0.2s` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f6ef7'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(79,110,247,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>{r.emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{r.name}</div>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65, marginBottom: 16 }}>{r.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {r.perms.map(p => (
                    <div key={p} style={{ fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4f6ef7', flexShrink: 0, display: 'inline-block' }} />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ───────────────────────────────────────────────────────── */}
      <section id="workflow" style={{ padding: '80px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <div ref={workRef} style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4f6ef7', marginBottom: 10 }}>How It Works</p>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 700, color: '#111827', letterSpacing: -1, lineHeight: 1.15 }}>From dispatch to payment, every step covered</h2>
          </div>
          <div>
            {STEPS.map((s, i) => (
              <div key={s.n} className="fade-up" style={{ ...fadeStyle, display: 'grid', gridTemplateColumns: '56px 1fr', gap: 24, padding: '28px 0', borderBottom: i < STEPS.length - 1 ? '1px solid #e5e7eb' : 'none', transitionDelay: `${i * 0.1}s` }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#4f6ef7', fontWeight: 500, letterSpacing: '0.5px', paddingTop: 2 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65, maxWidth: 600, marginBottom: 12 }}>{s.desc}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {s.tags.map(t => (
                      <span key={t} style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(79,110,247,0.06)', border: '1px solid rgba(79,110,247,0.15)', borderRadius: 100, color: '#4f6ef7' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENTS ───────────────────────────────────────────────────────── */}
      <section id="payments" style={{ padding: '80px 24px', background: '#ffffff' }}>
        <div ref={payRef} style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4f6ef7', marginBottom: 10 }}>Financial Accountability</p>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 700, color: '#111827', letterSpacing: -1, lineHeight: 1.15, marginBottom: 12 }}>Full payment traceability</h2>
            <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 560, lineHeight: 1.7 }}>Every rupee spent on fuel or repairs flows through a structured approval process — nothing goes unrecorded.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              {
                label: 'Fuel Payments', sub: 'Auto-generated per fuel fill', iconColor: '#d97706', iconBg: 'rgba(245,158,11,0.1)',
                iconPath: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
                steps: [
                  ['Driver fills fuel and uploads', 'receipt photo via camera'],
                  ['Pending payment request', 'auto-created in admin panel'],
                  ['Admin views vehicle, litres,', 'route and receipt images inline'],
                  ['Admin records amount,', 'payment mode and marks paid'],
                ],
              },
              {
                label: 'Bill Payments (POs)', sub: 'Triggered on proof upload', iconColor: '#4f6ef7', iconBg: 'rgba(79,110,247,0.1)',
                iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                steps: [
                  ['Employee raises PO with', 'parts list, costs and signature'],
                  ['Driver uploads', 'proof of work or payment'],
                  ['Bill payment request', 'auto-created with full PO data'],
                  ['Admin verifies signature,', 'proof and records payment'],
                ],
              },
            ].map((card, ci) => (
              <div key={card.label} className="fade-up" style={{ ...fadeStyle, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 28, transitionDelay: `${ci * 0.15}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={card.iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={card.iconPath} />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{card.label}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{card.sub}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {card.steps.map(([a, b], j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 20, height: 20, background: 'rgba(79,110,247,0.08)', border: '1px solid rgba(79,110,247,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: "'DM Mono', monospace", color: '#4f6ef7', flexShrink: 0 }}>
                        {j + 1}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, paddingTop: 1 }}>
                        {a} <strong style={{ color: '#374151', fontWeight: 500 }}>{b}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4f6ef7', marginBottom: 12 }}>Get Started</p>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 700, color: '#111827', letterSpacing: -1, marginBottom: 16 }}>Ready to manage your fleet?</h2>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 420, margin: '0 auto 36px', lineHeight: 1.7 }}>Log in with your credentials to access the dashboard for your role.</p>
          <Link href="/login">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: '#fff', background: '#4f6ef7', padding: '13px 32px', borderRadius: 8, cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
              Sign In Now
            </span>
          </Link>
          {/* Credentials */}

        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>© {new Date().getFullYear()} BSS Power Private Limited. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['features', 'workflow', 'login'].map(id => (
              id === 'login'
                ? <Link key={id} href="/login"><span style={{ fontSize: 12, color: '#9ca3af', cursor: 'pointer' }}>Sign In</span></Link>
                : <button key={id} onClick={() => scrollTo(id)} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{id.charAt(0).toUpperCase() + id.slice(1)}</button>
            ))}
          </div>
        </div>
      </footer>


    </div>
  );
}