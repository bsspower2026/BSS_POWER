'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Upload, X, Image, Trash2 } from 'lucide-react';
import { uploadMultipleToCloudinary } from '../../../../../lib/upload';

export default function VehicleFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [driversList, setDriversList] = useState([]);

  const [formData, setFormData] = useState({
    // Basic Information
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    color: '',
    vin: '',
    licensePlate: '',
    
    // Vehicle Tracking
    fuelType: '',
    avgMileage: '',
    gpsDeviceId: '',
    trackingDeviceModel: '',
    simCardNumber: '',
    
    // Insurance & Documents
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceExpiryDate: '',
    registrationExpiryDate: '',
    
    // Maintenance
    lastServiceDate: '',
    nextServiceDate: '',
    lastServiceMileage: '',
    maintenanceNotes: '',
    status: 'active',
    
    // Additional
    purchaseDate: '',
    purchasePrice: '',
    assignedDriver: '',
    notes: '',
    
    // Photos
    photos: []
  });

  useEffect(() => {
    fetchDrivers();
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchDrivers = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setDriversList(result.data || []);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    }
  };

  const fetchVehicle = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle');
      }
      
      const result = await response.json();
      setFormData(result.data);
    } catch (err) {
      console.error('Failed to fetch vehicle:', err);
      alert('Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.photos.length + files.length > 10) {
      alert('Maximum 10 photos allowed');
      return;
    }
    
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
      alert('Failed to upload photos');
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
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/${id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/vehicles`;

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
        throw new Error(responseData.message || 'Failed to save vehicle');
      }

      router.push('/dashboard/employee/vehicles');
    } catch (err) {
      console.error('Error saving vehicle:', err);
      alert(`Failed to save vehicle: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'tracking', label: 'Tracking Details' },
    { id: 'insurance', label: 'Insurance & Documents' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'photos', label: 'Photos' },
    { id: 'additional', label: 'Additional Info' },
  ];

  if (loading) {
    return <div className="container-main py-10 text-center">Loading...</div>;
  }

  return (
    <div className="container-main">
      <Link href="/dashboard/employee/vehicles">
        <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
          <ChevronLeft size={20} /> Back to Vehicles
        </button>
      </Link>

      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {id ? 'Edit Vehicle' : 'Add New Vehicle'}
        </h1>

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
                <label className="form-label">Registration Number</label>
                <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">License Plate</label>
                <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Make</label>
                <input type="text" name="make" value={formData.make} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input type="text" name="model" value={formData.model} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input type="number" name="year" value={formData.year || ''} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <input type="text" name="color" value={formData.color} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">VIN (Vehicle Identification Number)</label>
                <input type="text" name="vin" value={formData.vin} onChange={handleChange} className="input-field" />
              </div>
            </div>
          )}

          {/* Tracking Details Tab */}
          {activeTab === 'tracking' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Fuel Type</label>
                <select name="fuelType" value={formData.fuelType} onChange={handleChange} className="input-field">
                  <option value="">Select Fuel Type</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Average Mileage (km/l or km/charge)</label>
                <input type="text" name="avgMileage" value={formData.avgMileage} onChange={handleChange} className="input-field" placeholder="e.g., 18 km/l" />
              </div>
              <div className="form-group">
                <label className="form-label">GPS Device ID</label>
                <input type="text" name="gpsDeviceId" value={formData.gpsDeviceId} onChange={handleChange} className="input-field" placeholder="e.g., GPS-12345" />
              </div>
              <div className="form-group">
                <label className="form-label">Tracking Device Model</label>
                <input type="text" name="trackingDeviceModel" value={formData.trackingDeviceModel} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">SIM Card Number</label>
                <input type="text" name="simCardNumber" value={formData.simCardNumber} onChange={handleChange} className="input-field" placeholder="e.g., 9876543210" />
              </div>
            </div>
          )}

          {/* Insurance & Documents Tab */}
          {activeTab === 'insurance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Insurance Provider</label>
                <input type="text" name="insuranceProvider" value={formData.insuranceProvider} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Policy Number</label>
                <input type="text" name="insurancePolicyNumber" value={formData.insurancePolicyNumber} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Insurance Expiry Date</label>
                <input type="date" name="insuranceExpiryDate" value={formData.insuranceExpiryDate} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Registration Expiry Date</label>
                <input type="date" name="registrationExpiryDate" value={formData.registrationExpiryDate} onChange={handleChange} className="input-field" />
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Last Service Date</label>
                <input type="date" name="lastServiceDate" value={formData.lastServiceDate} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Service Mileage</label>
                <input type="text" name="lastServiceMileage" value={formData.lastServiceMileage} onChange={handleChange} className="input-field" placeholder="e.g., 15,000 km" />
              </div>
              <div className="form-group">
                <label className="form-label">Next Service Date</label>
                <input type="date" name="nextServiceDate" value={formData.nextServiceDate} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                  <option value="active">Active</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Maintenance Notes</label>
                <textarea name="maintenanceNotes" value={formData.maintenanceNotes} onChange={handleChange} className="input-field" rows="3" />
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div>
              <div className="mb-6">
                <label className="form-label">Upload Photos (Max 10)</label>
                <div className="mt-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Upload size={20} />
                    <span>Choose Files</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={uploadingPhotos || formData.photos.length >= 10} className="hidden" />
                  </label>
                  {uploadingPhotos && <span className="ml-3 text-gray-600">Uploading...</span>}
                  <p className="text-xs text-gray-500 mt-1">{10 - formData.photos.length} photos remaining</p>
                </div>
              </div>

              {formData.photos.length === 0 ? (
                <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Image size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>No photos uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img src={photo.url} alt={`Vehicle photo ${index + 1}`} className="w-full h-40 object-cover rounded-lg" />
                      <button type="button" onClick={() => handleRemovePhoto(index)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
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
                <label className="form-label">Purchase Date</label>
                <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Price (₹)</label>
                <input type="number" name="purchasePrice" value={formData.purchasePrice || ''} onChange={handleChange} className="input-field" step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Driver</label>
                <select name="assignedDriver" value={formData.assignedDriver || ''} onChange={handleChange} className="input-field">
                  <option value="">Select Driver</option>
                  {driversList.map(driver => (
                    <option key={driver._id} value={driver._id}>{driver.firstName} {driver.lastName} - {driver.phone}</option>
                  ))}
                </select>
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Additional Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field" rows="4" />
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Vehicle'}</button>
            <Link href="/dashboard/employee/vehicles"><button type="button" className="btn-secondary">Cancel</button></Link>
          </div>
        </form>
      </div>
    </div>
  );
}