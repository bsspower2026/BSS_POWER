'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, X, Upload, Trash2, Copy, Share2, CheckCircle, FileText, Image } from 'lucide-react';
import { uploadToCloudinary } from '../../../../../lib/upload';

// ─── Per-type config ───────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  driver: {
    label: 'Driver',
    endpoint: '/api/drivers',
    tempKeyName: 'tempPassword',         // key in response.data that holds temp password
    showLicense: true,
    tabs: ['personal', 'license', 'employment', 'documents', 'additional'],
  },
  helper: {
    label: 'Helper',
    endpoint: '/api/helpers',
    tempKeyName: 'tempPassword',
    showLicense: false,
    tabs: ['personal', 'employment', 'documents', 'additional'],
  },
  supervisor: {
    label: 'Site Supervisor',
    endpoint: '/api/site-supervisors',
    tempKeyName: 'tempPassword',
    showLicense: false,
    tabs: ['personal', 'employment', 'documents', 'additional'],
  },
};

const TAB_LABELS = {
  personal: 'Personal Information',
  license: 'License Information',
  employment: 'Employment',
  documents: 'Photo & Documents',
  additional: 'Additional Info',
};

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  nationality: '',
  email: '',
  phone: '',
  alternatePhone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  // License (driver only)
  licenseNumber: '',
  licenseType: '',
  licenseExpiryDate: '',
  licenseIssueDate: '',
  licenseIssueState: '',
  // Employment
  employeeId: '',
  employmentStartDate: '',
  employmentStatus: 'active',
  yearsOfExperience: '',
  department: '',
  designation: '',
  salary: '',
  // Emergency
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactPhone: '',
  // Additional
  aadharNumber: '',
  panNumber: '',
  bankAccountNumber: '',
  ifscCode: '',
  notes: '',
  // Media
  profilePhoto: null,
  documents: [],
};

export default function StaffFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'driver';
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.driver;

  const [activeTab, setActiveTab] = useState(config.tabs[0]);
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [showCredentialsPopup, setShowCredentialsPopup] = useState(false);
  const [tempCredentials, setTempCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (id) fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${config.endpoint}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch record');
      const result = await res.json();
      setFormData({ ...EMPTY_FORM, ...result.data });
    } catch (err) {
      console.error('Failed to fetch record:', err);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const result = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, profilePhoto: { url: result.url, publicId: result.publicId } }));
    } catch (error) {
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !newDocumentName) { alert('Please provide a document name first'); return; }
    setUploadingDocument(true);
    try {
      const result = await uploadToCloudinary(file);
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, {
          name: newDocumentName,
          url: result.url,
          publicId: result.publicId,
          uploadedAt: new Date().toISOString(),
        }],
      }));
      setNewDocumentName('');
    } catch (error) {
      alert('Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleRemoveDocument = (index) => {
    setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendViaWhatsApp = (email, password) => {
    const roleLabel = config.label;
    const message = `*Welcome to BSS-Power ${roleLabel} Portal!*\n\nDear ${formData.firstName} ${formData.lastName},\n\nYour ${roleLabel.toLowerCase()} account has been created. Please use the following credentials to login:\n\n*Email:* ${email}\n*Password:* ${password}\n\n*Login Link:* ${window.location.origin}/login\n\nPlease change your password after first login.\n\nRegards,\nBSS-Power Team`;
    window.open(`https://wa.me/${formData.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    const url = id
      ? `${process.env.NEXT_PUBLIC_API_URL}${config.endpoint}/${id}`
      : `${process.env.NEXT_PUBLIC_API_URL}${config.endpoint}`;

    try {
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || 'Failed to save');

      if (!id && responseData.data?.tempPassword) {
        setTempCredentials({ email: formData.email, password: responseData.data.tempPassword });
        setShowCredentialsPopup(true);
      } else {
        router.push('/dashboard/employee/drivers');
      }
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container-main py-10 text-center">Loading...</div>;

  return (
    <div className="container-main">
      <Link href="/dashboard/employee/drivers">
        <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
          <ChevronLeft size={20} /> Back to Staff
        </button>
      </Link>

      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {id ? `Edit ${config.label}` : `Add New ${config.label}`}
        </h1>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          {config.tabs.map(tabId => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tabId
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {TAB_LABELS[tabId]}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Personal Information ── */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input-field" required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input-field" required />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="input-field">
                  <option value="">Select Blood Group</option>
                  {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nationality</label>
                <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="input-field" placeholder="e.g. Indian" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" required />
              </div>
              <div className="form-group">
                <label className="form-label">Alternate Phone</label>
                <input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Zip Code</label>
                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className="input-field" />
              </div>
            </div>
          )}

          {/* ── License Information (driver only) ── */}
          {activeTab === 'license' && config.showLicense && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">License Number *</label>
                <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="input-field" required />
              </div>
              <div className="form-group">
                <label className="form-label">License Type</label>
                <select name="licenseType" value={formData.licenseType} onChange={handleChange} className="input-field">
                  <option value="">Select License Type</option>
                  <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                  <option value="LMV">LMV (Light Motor Vehicle)</option>
                  <option value="HPMV">HPMV (Heavy Passenger Motor Vehicle)</option>
                  <option value="Two Wheeler">Two Wheeler</option>
                  <option value="Auto">Auto</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">License Issue Date</label>
                <input type="date" name="licenseIssueDate" value={formData.licenseIssueDate} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">License Expiry Date</label>
                <input type="date" name="licenseExpiryDate" value={formData.licenseExpiryDate} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">License Issue State / Authority</label>
                <input type="text" name="licenseIssueState" value={formData.licenseIssueState} onChange={handleChange} className="input-field" />
              </div>
            </div>
          )}

          {/* ── Employment ── */}
          {activeTab === 'employment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Employment Start Date</label>
                <input type="date" name="employmentStartDate" value={formData.employmentStartDate} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input type="text" name="department" value={formData.department} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience || ''} onChange={handleChange} className="input-field" step="0.5" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Salary (₹)</label>
                <input type="number" name="salary" value={formData.salary || ''} onChange={handleChange} className="input-field" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Employment Status</label>
                <select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} className="input-field">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="onLeave">On Leave</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Name</label>
                <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Relation</label>
                <input type="text" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} className="input-field" placeholder="e.g. Father, Spouse" />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Phone</label>
                <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="input-field" />
              </div>
            </div>
          )}

          {/* ── Photo & Documents ── */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {formData.profilePhoto?.url ? (
                      <img src={formData.profilePhoto.url} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500" />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                        <Image size={48} className="text-gray-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700">
                      <Upload size={16} />
                      <input type="file" accept="image/*" onChange={handleProfilePhotoUpload} disabled={uploadingPhoto} className="hidden" />
                    </label>
                  </div>
                  {uploadingPhoto && <span className="text-gray-500 text-sm">Uploading...</span>}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                <div className="flex gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Document name (e.g. Aadhar Card, PAN Card)"
                    value={newDocumentName}
                    onChange={e => setNewDocumentName(e.target.value)}
                    className="input-field flex-1"
                  />
                  <label className={`btn-secondary cursor-pointer inline-flex items-center gap-2 ${(!newDocumentName || uploadingDocument) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Plus size={18} />
                    <span>Add Document</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocumentUpload} disabled={uploadingDocument || !newDocumentName} className="hidden" />
                  </label>
                </div>
                {uploadingDocument && <p className="text-gray-500 text-sm mb-4">Uploading document...</p>}

                {formData.documents.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 border-2 border-dashed rounded-lg">
                    <FileText size={40} className="mx-auto mb-2" />
                    No documents uploaded yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-indigo-600 shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">{doc.name}</div>
                            <div className="text-xs text-gray-500">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 items-center">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">View</a>
                          <button type="button" onClick={() => handleRemoveDocument(index)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Additional Info ── */}
          {activeTab === 'additional' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Aadhar Number</label>
                <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} className="input-field" maxLength={12} />
              </div>
              <div className="form-group">
                <label className="form-label">PAN Number</label>
                <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="input-field" maxLength={10} />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Account Number</label>
                <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Additional Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field" rows={4} />
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-4 mt-8">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : `Save ${config.label}`}
            </button>
            <Link href="/dashboard/employee/drivers">
              <button type="button" className="btn-secondary">Cancel</button>
            </Link>
          </div>
        </form>
      </div>

      {/* ── Credentials Popup ── */}
      {showCredentialsPopup && tempCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{config.label} Account Created! 🎉</h3>
              <button onClick={() => { setShowCredentialsPopup(false); router.push('/dashboard/employee/drivers'); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-600 mb-4 text-sm">
              Account created successfully. Share these login credentials with the {config.label.toLowerCase()}:
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
              {[['Email ID', tempCredentials.email], ['Password', tempCredentials.password]].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                  <div className="flex items-center gap-2">
                    <input type="text" value={val} readOnly className="input-field flex-1 bg-gray-100 text-sm" />
                    <button onClick={() => copyToClipboard(val)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Copy">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {copied && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle size={15} /> Copied to clipboard!
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => sendViaWhatsApp(tempCredentials.email, tempCredentials.password)} className="flex-1 btn-primary flex items-center justify-center gap-2">
                <Share2 size={17} /> WhatsApp
              </button>
              <button onClick={() => { setShowCredentialsPopup(false); router.push('/dashboard/employee/drivers'); }} className="flex-1 btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}