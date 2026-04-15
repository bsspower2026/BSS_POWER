'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Edit2, Download, User, Mail, Phone,
  FileText, Eye, Key, X, Copy, CheckCircle, Share2, CreditCard
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ─── Per-type config ───────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  driver: {
    label: 'Driver',
    endpoint: '/api/drivers',
    showLicense: true,
    overviewTabs: ['overview', 'personal', 'license', 'employment', 'documents'],
  },
  helper: {
    label: 'Helper',
    endpoint: '/api/helpers',
    showLicense: false,
    overviewTabs: ['overview', 'personal', 'employment', 'documents'],
  },
  supervisor: {
    label: 'Site Supervisor',
    endpoint: '/api/site-supervisors',
    showLicense: false,
    overviewTabs: ['overview', 'personal', 'employment', 'documents'],
  },
};

const TAB_LABELS = {
  overview: 'Overview',
  personal: 'Personal Details',
  license: 'License Details',
  employment: 'Employment',
  documents: 'Documents',
};

// ─── Status badge helper ───────────────────────────────────────────────────────
const statusClass = (s) =>
  s === 'active' ? 'bg-green-100 text-green-800' :
  s === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';

const statusLabel = (s) =>
  s === 'active' ? 'Active' : s === 'inactive' ? 'Inactive' : 'On Leave';

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div className="border-b pb-2">
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className="text-gray-900 font-medium">{value || 'N/A'}</p>
  </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
      <Icon size={17} /> {title}
    </h3>
    <div className="space-y-2 text-sm">{children}</div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StaffViewPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'driver';
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.driver;

  const [id, setId] = useState(null);
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  // Password reset state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Unwrap params Promise (Next.js 15)
  useEffect(() => {
    const unwrap = async () => {
      const p = await params;
      setId(p.id);
    };
    unwrap();
  }, [params]);

  useEffect(() => {
    if (id) fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${config.endpoint}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setPerson(result.data);
    } catch (err) {
      console.error('Failed to fetch:', err);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ── Password reset ──────────────────────────────────────────────────────────
  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) { alert('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { alert('Passwords do not match'); return; }

    setResettingPassword(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${config.endpoint}/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error('Failed to reset password');
      setPasswordResetSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordResetSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      alert('Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendNewPasswordViaWhatsApp = () => {
    const message = `*BSS Power ${config.label} Portal - Password Updated* 🔐\n\nDear ${person.firstName} ${person.lastName},\n\nYour account password has been updated.\n\n*New Password:* ${newPassword}\n\n*Login Link:* ${window.location.origin}/login\n\nPlease change your password after first login for security.\n\nRegards,\nBSS Power Team`;
    window.open(`https://wa.me/${person.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const exportToPDF = async () => {
    setExporting(true);
    const el = document.createElement('div');
    el.style.cssText = 'width:210mm;min-height:297mm;padding:15mm;background:white;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#333;';

    el.innerHTML = `
      <style>
        .hdr{text-align:center;border-bottom:2px solid #4f46e5;padding-bottom:14px;margin-bottom:18px}
        .co{color:#4f46e5;font-size:22px;font-weight:bold}
        .sub{color:#666;font-size:10px;margin:4px 0}
        .title{font-size:17px;font-weight:bold;margin:18px 0 6px}
        .sec{margin-bottom:18px}
        .sec-title{font-size:13px;font-weight:bold;color:#4f46e5;border-left:3px solid #4f46e5;padding-left:8px;margin-bottom:10px}
        .grid{display:flex;gap:18px}
        .col{flex:1}
        .row{padding:7px 0;border-bottom:1px solid #eee;font-size:11px}
        .lbl{font-weight:600;color:#555;width:130px;display:inline-block}
        .badge{display:inline-block;padding:2px 9px;border-radius:10px;font-size:10px}
        .act{background:#d1fae5;color:#065f46}
        .inact{background:#fee2e2;color:#991b1b}
        .leave{background:#fef3c7;color:#92400e}
        .foot{margin-top:36px;padding-top:12px;border-top:1px solid #ddd;text-align:center;font-size:9px;color:#aaa}
      </style>
      <div class="hdr">
        <div class="co">BSS Power Private Limited</div>
        <div class="sub">Plot No-847/540, At-Nimapali PO-Pingal, PS-Kalinganagar, Jajpur, Orissa - 755026</div>
        <div class="sub">Email: dsignsolution18@gmail.com | CIN: U45201OR2019PTC030639</div>
      </div>
      <div class="title">${config.label} Details Report</div>
      <div style="color:#888;font-size:10px;margin-bottom:22px">Generated on: ${new Date().toLocaleString()}</div>

      <div class="sec">
        <div class="sec-title">Personal Information</div>
        <div class="grid">
          <div class="col">
            <div class="row"><span class="lbl">Full Name:</span>${person.firstName} ${person.lastName}</div>
            <div class="row"><span class="lbl">Date of Birth:</span>${person.dateOfBirth || 'N/A'}</div>
            <div class="row"><span class="lbl">Gender:</span>${person.gender || 'N/A'}</div>
            <div class="row"><span class="lbl">Blood Group:</span>${person.bloodGroup || 'N/A'}</div>
          </div>
          <div class="col">
            <div class="row"><span class="lbl">Email:</span>${person.email || 'N/A'}</div>
            <div class="row"><span class="lbl">Phone:</span>${person.phone || 'N/A'}</div>
            <div class="row"><span class="lbl">Address:</span>${person.address || 'N/A'}</div>
            <div class="row"><span class="lbl">City/State:</span>${person.city || 'N/A'}, ${person.state || ''} ${person.zipCode || ''}</div>
          </div>
        </div>
      </div>

      ${config.showLicense ? `
      <div class="sec">
        <div class="sec-title">License Information</div>
        <div class="grid">
          <div class="col">
            <div class="row"><span class="lbl">License Number:</span>${person.licenseNumber || 'N/A'}</div>
            <div class="row"><span class="lbl">License Type:</span>${person.licenseType || 'N/A'}</div>
            <div class="row"><span class="lbl">Issue Date:</span>${person.licenseIssueDate || 'N/A'}</div>
          </div>
          <div class="col">
            <div class="row"><span class="lbl">Expiry Date:</span>${person.licenseExpiryDate || 'N/A'}</div>
            <div class="row"><span class="lbl">Issue Authority:</span>${person.licenseIssueState || 'N/A'}</div>
          </div>
        </div>
      </div>` : ''}

      <div class="sec">
        <div class="sec-title">Employment Details</div>
        <div class="grid">
          <div class="col">
            <div class="row"><span class="lbl">Start Date:</span>${person.employmentStartDate || 'N/A'}</div>
            <div class="row"><span class="lbl">Department:</span>${person.department || 'N/A'}</div>
            <div class="row"><span class="lbl">Designation:</span>${person.designation || 'N/A'}</div>
          </div>
          <div class="col">
            <div class="row"><span class="lbl">Experience:</span>${person.yearsOfExperience || 'N/A'} years</div>
            <div class="row"><span class="lbl">Status:</span><span class="badge ${person.employmentStatus === 'active' ? 'act' : person.employmentStatus === 'inactive' ? 'inact' : 'leave'}">${statusLabel(person.employmentStatus)}</span></div>
            <div class="row"><span class="lbl">Employee ID:</span>${person.employeeId || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">Emergency Contact</div>
        <div class="grid">
          <div class="col"><div class="row"><span class="lbl">Name:</span>${person.emergencyContactName || 'N/A'}</div></div>
          <div class="col">
            <div class="row"><span class="lbl">Phone:</span>${person.emergencyContactPhone || 'N/A'}</div>
            <div class="row"><span class="lbl">Relation:</span>${person.emergencyContactRelation || 'N/A'}</div>
          </div>
        </div>
      </div>

      ${person.documents?.length > 0 ? `
      <div class="sec">
        <div class="sec-title">Documents (${person.documents.length})</div>
        ${person.documents.map(d => `<div style="padding:7px;background:#f9fafb;margin-bottom:6px;border-radius:4px;font-size:11px"><strong>${d.name}</strong> &nbsp; <span style="color:#888">Uploaded: ${new Date(d.uploadedAt).toLocaleDateString()}</span></div>`).join('')}
      </div>` : ''}

      ${person.notes ? `<div class="sec"><div class="sec-title">Notes</div><div style="background:#f9fafb;padding:10px;border-radius:4px;font-size:11px">${person.notes}</div></div>` : ''}

      <div class="foot">
        <p>Computer-generated document. No signature required.</p>
        <p>BSS Power Private Limited</p>
      </div>
    `;

    document.body.appendChild(el);
    try {
      const canvas = await html2canvas(el, { scale: 3, logging: false, useCORS: true, backgroundColor: '#ffffff' });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgW = 210, pageH = 297;
      const imgH = (canvas.height * imgW) / canvas.width;
      let left = imgH, pos = 0;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, imgW, imgH);
      left -= pageH;
      while (left > 0) { pos = left - imgH; pdf.addPage(); pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, imgW, imgH); left -= pageH; }
      pdf.save(`${config.label}_${person.firstName}_${person.lastName}_Details.pdf`);
    } catch (err) {
      alert('Failed to generate PDF');
    } finally {
      document.body.removeChild(el);
      setExporting(false);
    }
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading) return <div className="container-main py-10 text-center text-gray-500">Loading {config.label} details...</div>;
  if (!person) return (
    <div className="container-main py-10 text-center">
      <p className="text-red-600">{config.label} not found</p>
      <Link href="/dashboard/employee/drivers" className="text-indigo-600 hover:underline mt-3 inline-block">Back to Staff</Link>
    </div>
  );

  return (
    <div className="container-main">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/employee/drivers">
            <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
              <ChevronLeft size={20} /> Back
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{config.label} Details</h1>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowPasswordModal(true)} className="btn-secondary flex items-center gap-2">
            <Key size={17} /> Reset Password
          </button>
          {activeTab === 'overview' && (
            <button onClick={exportToPDF} disabled={exporting} className="btn-primary flex items-center gap-2">
              <Download size={17} /> {exporting ? 'Generating...' : 'Export PDF'}
            </button>
          )}
          <Link href={`/dashboard/employee/drivers/form?id=${person._id}&type=${type}`}>
            <button className="btn-secondary flex items-center gap-2">
              <Edit2 size={17} /> Edit
            </button>
          </Link>
        </div>
      </div>

      {/* ── Profile Header Card ── */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {person.profilePhoto?.url ? (
            <img src={person.profilePhoto.url} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-indigo-400" />
          ) : (
            <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
              <User size={44} className="text-gray-400" />
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900">{person.firstName} {person.lastName}</h2>
            <div className="flex flex-wrap gap-4 mt-1 justify-center md:justify-start text-gray-500 text-sm">
              <span className="flex items-center gap-1"><Mail size={14} />{person.email || 'N/A'}</span>
              <span className="flex items-center gap-1"><Phone size={14} />{person.phone || 'N/A'}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass(person.employmentStatus)}`}>
                {statusLabel(person.employmentStatus)}
              </span>
              {person.designation && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">{person.designation}</span>
              )}
              {config.showLicense && person.licenseNumber && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">License: {person.licenseNumber}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Tabs ── */}
      <div className="card p-6">
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {config.overviewTabs.map(tabId => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tabId ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {TAB_LABELS[tabId]}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Section icon={User} title="Personal Information">
                <p><strong>Full Name:</strong> {person.firstName} {person.lastName}</p>
                <p><strong>Date of Birth:</strong> {person.dateOfBirth || 'N/A'}</p>
                <p><strong>Gender:</strong> {person.gender || 'N/A'}</p>
                <p><strong>Blood Group:</strong> {person.bloodGroup || 'N/A'}</p>
                <p><strong>Email:</strong> {person.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {person.phone || 'N/A'}</p>
                <p><strong>Address:</strong> {person.address || 'N/A'}</p>
              </Section>
              {config.showLicense ? (
                <Section icon={CreditCard} title="License Information">
                  <p><strong>License No:</strong> {person.licenseNumber || 'N/A'}</p>
                  <p><strong>Type:</strong> {person.licenseType || 'N/A'}</p>
                  <p><strong>Issue Date:</strong> {person.licenseIssueDate || 'N/A'}</p>
                  <p><strong>Expiry Date:</strong> {person.licenseExpiryDate || 'N/A'}</p>
                  <p><strong>Authority:</strong> {person.licenseIssueState || 'N/A'}</p>
                </Section>
              ) : (
                <Section icon={Phone} title="Emergency Contact">
                  <p><strong>Name:</strong> {person.emergencyContactName || 'N/A'}</p>
                  <p><strong>Phone:</strong> {person.emergencyContactPhone || 'N/A'}</p>
                  <p><strong>Relation:</strong> {person.emergencyContactRelation || 'N/A'}</p>
                </Section>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Section icon={BriefcaseIcon} title="Employment Details">
                <p><strong>Start Date:</strong> {person.employmentStartDate || 'N/A'}</p>
                <p><strong>Department:</strong> {person.department || 'N/A'}</p>
                <p><strong>Designation:</strong> {person.designation || 'N/A'}</p>
                <p><strong>Experience:</strong> {person.yearsOfExperience || 'N/A'} years</p>
                <p><strong>Employee ID:</strong> {person.employeeId || 'N/A'}</p>
                <p><strong>Status:</strong> {statusLabel(person.employmentStatus)}</p>
              </Section>
              {config.showLicense && (
                <Section icon={Phone} title="Emergency Contact">
                  <p><strong>Name:</strong> {person.emergencyContactName || 'N/A'}</p>
                  <p><strong>Phone:</strong> {person.emergencyContactPhone || 'N/A'}</p>
                  <p><strong>Relation:</strong> {person.emergencyContactRelation || 'N/A'}</p>
                </Section>
              )}
            </div>
            {person.notes && (
              <Section icon={FileText} title="Additional Notes">
                <p className="text-gray-700">{person.notes}</p>
              </Section>
            )}
            {person.documents?.length > 0 && (
              <Section icon={FileText} title={`Documents (${person.documents.length})`}>
                {person.documents.map((doc, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-white rounded border">
                    <span>{doc.name}</span>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs">View</a>
                  </div>
                ))}
              </Section>
            )}
          </div>
        )}

        {/* Personal Details */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoRow label="First Name" value={person.firstName} />
              <InfoRow label="Last Name" value={person.lastName} />
              <InfoRow label="Date of Birth" value={person.dateOfBirth} />
              <InfoRow label="Gender" value={person.gender} />
              <InfoRow label="Blood Group" value={person.bloodGroup} />
              <InfoRow label="Nationality" value={person.nationality} />
            </div>
            <div className="space-y-4">
              <InfoRow label="Email Address" value={person.email} />
              <InfoRow label="Phone Number" value={person.phone} />
              <InfoRow label="Alternate Phone" value={person.alternatePhone} />
              <InfoRow label="Address" value={person.address} />
              <InfoRow label="City" value={person.city} />
              <InfoRow label="State / Zip" value={`${person.state || ''} ${person.zipCode || ''}`} />
            </div>
          </div>
        )}

        {/* License (driver only) */}
        {activeTab === 'license' && config.showLicense && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoRow label="License Number" value={person.licenseNumber} />
              <InfoRow label="License Type" value={person.licenseType} />
              <InfoRow label="Issue Date" value={person.licenseIssueDate} />
            </div>
            <div className="space-y-4">
              <InfoRow label="Expiry Date" value={person.licenseExpiryDate} />
              <InfoRow label="Issue Authority / State" value={person.licenseIssueState} />
            </div>
          </div>
        )}

        {/* Employment */}
        {activeTab === 'employment' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoRow label="Employee ID" value={person.employeeId} />
              <InfoRow label="Start Date" value={person.employmentStartDate} />
              <InfoRow label="Department" value={person.department} />
              <InfoRow label="Designation" value={person.designation} />
              <InfoRow label="Years of Experience" value={person.yearsOfExperience ? `${person.yearsOfExperience} years` : null} />
            </div>
            <div className="space-y-4">
              <InfoRow label="Employment Status" value={statusLabel(person.employmentStatus)} />
              <InfoRow label="Salary" value={person.salary ? `₹${person.salary}` : null} />
              <InfoRow label="Emergency Contact" value={person.emergencyContactName} />
              <InfoRow label="Emergency Phone" value={person.emergencyContactPhone} />
              <InfoRow label="Relation" value={person.emergencyContactRelation} />
            </div>
          </div>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div>
            {person.profilePhoto?.url && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Profile Photo</h3>
                <img src={person.profilePhoto.url} alt="Profile" className="w-44 h-44 object-cover rounded-lg border" />
              </div>
            )}
            {person.documents?.length > 0 ? (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Uploaded Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {person.documents.map((doc, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium text-gray-900">{doc.name}</h4>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">View</a>
                      </div>
                      <p className="text-xs text-gray-400">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">No documents uploaded yet</p>
            )}
          </div>
        )}
      </div>

      {/* ── Password Reset Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
              <button onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); setPasswordResetSuccess(false); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {passwordResetSuccess ? (
              <div className="text-center py-6">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <p className="text-green-600 font-medium mb-4">Password reset successfully!</p>
                <div className="flex gap-3">
                  <button onClick={() => copyToClipboard(newPassword)} className="flex-1 btn-secondary flex items-center justify-center gap-2">
                    <Copy size={17} /> Copy Password
                  </button>
                  <button onClick={sendNewPasswordViaWhatsApp} className="flex-1 btn-primary flex items-center justify-center gap-2">
                    <Share2 size={17} /> WhatsApp
                  </button>
                </div>
                {copied && <p className="text-green-600 text-sm mt-2 flex items-center justify-center gap-1"><CheckCircle size={14} />Copied!</p>}
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="form-label">New Password *</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="Min. 6 characters" />
                </div>
                <div className="mb-6">
                  <label className="form-label">Confirm Password *</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" placeholder="Repeat password" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); }} className="flex-1 btn-secondary">Cancel</button>
                  <button onClick={handlePasswordReset} disabled={resettingPassword} className="flex-1 btn-primary">
                    {resettingPassword ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline Briefcase SVG icon ────────────────────────────────────────────────
const BriefcaseIcon = ({ size = 17, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);