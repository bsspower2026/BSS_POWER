'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Upload, X, Image, Trash2 } from 'lucide-react';
import { uploadMultipleToCloudinary } from '../../../../../lib/upload';

export default function PartsFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    partNumber: '',
    category: '',
    description: '',
    
    // Inventory Management
    quantity: 0,
    unitOfMeasurement: '',
    minimumLevel: 0,
    reorderLevel: 0,
    
    // Pricing & Supplier
    costPrice: 0,
    sellingPrice: 0,
    supplier: '',
    supplierPartNumber: '',
    supplierPhone: '',
    
    // Additional
    location: '',
    warrantyMonths: '',
    notes: '',
    
    // Photos
    photos: []
  });

  useEffect(() => {
    if (id) {
      fetchPart();
    }
  }, [id]);

  const fetchPart = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch part');
      }
      
      const result = await response.json();
      setFormData(result.data);
    } catch (err) {
      console.error('Failed to fetch part:', err);
      alert('Failed to load part data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    if (formData.photos.length + files.length > 10) {
      alert('Maximum 10 photos allowed');
      return;
    }
    
    setUploadError('');
    setUploadingPhotos(true);
    
    try {
      const uploadResults = await uploadMultipleToCloudinary(files);
      const newPhotos = uploadResults.map(result => ({
        url: result.url,
        publicId: result.publicId,
        uploadedAt: new Date().toISOString()
      }));
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos]
      }));
    } catch (error) {
      console.error('Error uploading photos:', error);
      setUploadError('Failed to upload photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const token = localStorage.getItem('token');
    const url = id
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/parts/${id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/parts`;

    try {
      const response = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to save part');
      }

      router.push('/dashboard/employee/parts');
    } catch (err) {
      console.error('Error saving part:', err);
      alert(`Failed to save part: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'inventory', label: 'Inventory Management' },
    { id: 'pricing', label: 'Pricing & Supplier' },
    { id: 'photos', label: 'Photos' },
    { id: 'additional', label: 'Additional Info' },
  ];

  if (loading) {
    return <div className="container-main py-10 text-center">Loading...</div>;
  }

  return (
    <div className="container-main">
      <Link href="/dashboard/employee/parts">
        <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
          <ChevronLeft size={20} /> Back to Parts
        </button>
      </Link>

      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {id ? 'Edit Part' : 'Add New Part'}
        </h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Part Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="input-field" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Part Number *</label>
                <input 
                  type="text" 
                  name="partNumber" 
                  value={formData.partNumber} 
                  onChange={handleChange} 
                  className="input-field" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  className="input-field" 
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Engine">Engine</option>
                  <option value="Transmission">Transmission</option>
                  <option value="Brakes">Brakes</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Cooling">Cooling</option>
                  <option value="Exhaust">Exhaust</option>
                  <option value="Body">Body</option>
                  <option value="Interior">Interior</option>
                  <option value="Lubricants">Lubricants</option>
                </select>
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  className="input-field" 
                  rows="3" 
                  placeholder="Detailed description of the part..."
                />
              </div>
            </div>
          )}

          {/* Inventory Management Tab */}
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Current Quantity *</label>
                <input 
                  type="number" 
                  name="quantity" 
                  value={formData.quantity || ''} 
                  onChange={handleChange} 
                  className="input-field" 
                  step="0.1"
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unit of Measurement *</label>
                <select 
                  name="unitOfMeasurement" 
                  value={formData.unitOfMeasurement || ''} 
                  onChange={handleChange} 
                  className="input-field" 
                  required
                >
                  <option value="">Select Unit</option>
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="gram">Gram (g)</option>
                  <option value="liter">Liter (L)</option>
                  <option value="milliliter">Milliliter (ml)</option>
                  <option value="meter">Meter (m)</option>
                  <option value="centimeter">Centimeter (cm)</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                  <option value="set">Set</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Stock Level</label>
                <input 
                  type="number" 
                  name="minimumLevel" 
                  value={formData.minimumLevel || ''} 
                  onChange={handleChange} 
                  className="input-field" 
                  step="0.1"
                  placeholder="Alert when stock falls below this level"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reorder Level</label>
                <input 
                  type="number" 
                  name="reorderLevel" 
                  value={formData.reorderLevel || ''} 
                  onChange={handleChange} 
                  className="input-field" 
                  step="0.1"
                  placeholder="Quantity to reorder"
                />
              </div>
            </div>
          )}

          {/* Pricing & Supplier Tab */}
          {activeTab === 'pricing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Cost Price (₹)</label>
                <input 
                  type="number" 
                  name="costPrice" 
                  value={formData.costPrice || ''} 
                  onChange={handleChange} 
                  className="input-field" 
                  step="0.01"
                  placeholder="Purchase price"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price (₹)</label>
                <input 
                  type="number" 
                  name="sellingPrice" 
                  value={formData.sellingPrice || ''} 
                  onChange={handleChange} 
                  className="input-field" 
                  step="0.01"
                  placeholder="Retail price"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Supplier Name</label>
                <input 
                  type="text" 
                  name="supplier" 
                  value={formData.supplier} 
                  onChange={handleChange} 
                  className="input-field" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Supplier Part Number</label>
                <input 
                  type="text" 
                  name="supplierPartNumber" 
                  value={formData.supplierPartNumber} 
                  onChange={handleChange} 
                  className="input-field" 
                />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Supplier Phone</label>
                <input 
                  type="tel" 
                  name="supplierPhone" 
                  value={formData.supplierPhone} 
                  onChange={handleChange} 
                  className="input-field" 
                />
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div>
              <div className="mb-6">
                <label className="form-label">Upload Photos (Max 10)</label>
                <div className="mt-2">
                  <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors ${
                    (uploadingPhotos || formData.photos.length >= 10) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                    <Upload size={20} />
                    <span>Choose Files</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhotos || formData.photos.length >= 10}
                      className="hidden"
                    />
                  </label>
                  {uploadingPhotos && <span className="ml-3 text-gray-600">Uploading...</span>}
                  <p className="text-xs text-gray-500 mt-1">
                    {10 - formData.photos.length} photos remaining (JPG, PNG, GIF)
                  </p>
                  {uploadError && (
                    <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle size={16} />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              </div>

              {formData.photos.length === 0 ? (
                <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Image size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>No photos uploaded yet.</p>
                  <p className="text-sm">Upload up to 10 photos of the part</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.url}
                        alt={`Part photo ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Additional Info Tab */}
          {activeTab === 'additional' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Storage Location</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  className="input-field" 
                  placeholder="e.g., Warehouse A, Shelf 5, Bin 3"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Warranty (Months)</label>
                <input 
                  type="number" 
                  name="warrantyMonths" 
                  value={formData.warrantyMonths || ''} 
                  onChange={handleChange} 
                  className="input-field" 
                  step="1"
                  min="0"
                />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Additional Notes</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange} 
                  className="input-field" 
                  rows="4" 
                  placeholder="Any additional information about this part..."
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            <button 
              type="submit" 
              disabled={submitting} 
              className="btn-primary"
            >
              {submitting ? 'Saving...' : 'Save Part'}
            </button>
            <Link href="/dashboard/employee/parts">
              <button type="button" className="btn-secondary">
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// AlertCircle component
const AlertCircle = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);