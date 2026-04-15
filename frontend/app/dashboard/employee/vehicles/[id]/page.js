'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Edit2, Car, Fuel, MapPin, Calendar, CreditCard, Wrench, Image, User, Phone, Mail, X, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';

export default function VehicleViewPage({ params }) {
  const router = useRouter();
  const [id, setId] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const unwrapParams = async () => {
      const unwrappedParams = await params;
      setId(unwrappedParams.id);
    };
    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch vehicle');
      
      const result = await response.json();
      setVehicle(result.data);
    } catch (err) {
      console.error('Failed to fetch vehicle:', err);
      alert('Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const openPhotoModal = (index) => {
    setCurrentPhotoIndex(index);
    setSelectedPhoto(vehicle.photos[index]);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setCurrentPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (vehicle && vehicle.photos) {
      const nextIndex = (currentPhotoIndex + 1) % vehicle.photos.length;
      setCurrentPhotoIndex(nextIndex);
      setSelectedPhoto(vehicle.photos[nextIndex]);
    }
  };

  const prevPhoto = () => {
    if (vehicle && vehicle.photos) {
      const prevIndex = (currentPhotoIndex - 1 + vehicle.photos.length) % vehicle.photos.length;
      setCurrentPhotoIndex(prevIndex);
      setSelectedPhoto(vehicle.photos[prevIndex]);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'tracking', label: 'Tracking Details' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'photos', label: 'Photos' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'active': return 'Active';
      case 'maintenance': return 'Under Maintenance';
      case 'inactive': return 'Inactive';
      default: return status;
    }
  };

  if (loading) {
    return <div className="container-main py-10 text-center">Loading vehicle details...</div>;
  }

  if (!vehicle) {
    return (
      <div className="container-main py-10 text-center">
        <div className="text-red-600">Vehicle not found</div>
        <Link href="/dashboard/employee/vehicles" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">Back to Vehicles</Link>
      </div>
    );
  }

  return (
    <div className="container-main">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/employee/vehicles">
            <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
              <ChevronLeft size={20} /> Back
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Details</h1>
        </div>
        <Link href={`/dashboard/employee/vehicles/form?id=${vehicle._id}`}>
          <button className="btn-secondary flex items-center gap-2">
            <Edit2 size={18} /> Edit Vehicle
          </button>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="relative">
            {vehicle.photos && vehicle.photos.length > 0 ? (
              <img src={vehicle.photos[0].url} alt={vehicle.registrationNumber} className="w-32 h-32 object-cover rounded-lg border-2 border-indigo-500 cursor-pointer" onClick={() => openPhotoModal(0)} />
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center"><Car size={48} className="text-gray-400" /></div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900">{vehicle.make} {vehicle.model}</h2>
            <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start">
              <div className="flex items-center gap-2 text-gray-600"><Car size={16} /><span>{vehicle.registrationNumber || 'N/A'}</span></div>
              <div className="flex items-center gap-2 text-gray-600"><Fuel size={16} /><span>{vehicle.fuelType || 'N/A'}</span></div>
              {vehicle.avgMileage && <div className="flex items-center gap-2 text-gray-600"><span>📊</span><span>{vehicle.avgMileage}</span></div>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vehicle.status)}`}>{getStatusText(vehicle.status)}</span>
              {vehicle.gpsDeviceId && <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">GPS: {vehicle.gpsDeviceId}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-6">
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Registration Number</label><p className="text-gray-900 font-medium">{vehicle.registrationNumber || 'N/A'}</p></div>
              <div className="border-b pb-2"><label className="text-sm text-gray-500">License Plate</label><p className="text-gray-900 font-medium">{vehicle.licensePlate || 'N/A'}</p></div>
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Make</label><p className="text-gray-900 font-medium">{vehicle.make || 'N/A'}</p></div>
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Model</label><p className="text-gray-900 font-medium">{vehicle.model || 'N/A'}</p></div>
            </div>
            <div className="space-y-4">
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Year</label><p className="text-gray-900 font-medium">{vehicle.year || 'N/A'}</p></div>
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Color</label><p className="text-gray-900 font-medium">{vehicle.color || 'N/A'}</p></div>
              <div className="border-b pb-2"><label className="text-sm text-gray-500">VIN</label><p className="text-gray-900 font-medium">{vehicle.vin || 'N/A'}</p></div>
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Status</label><p className="text-gray-900 font-medium">{getStatusText(vehicle.status)}</p></div>
            </div>
          </div>
        )}

        {/* Tracking Details Tab */}
        {activeTab === 'tracking' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Fuel Type</label><p className="text-gray-900 font-medium">{vehicle.fuelType || 'N/A'}</p></div>
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Average Mileage</label><p className="text-gray-900 font-medium">{vehicle.avgMileage || 'N/A'}</p></div>
              <div className="border-b pb-2"><label className="text-sm text-gray-500">GPS Device ID</label><p className="text-gray-900 font-medium">{vehicle.gpsDeviceId || 'N/A'}</p></div>
            </div>
            <div className="space-y-4">
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Tracking Device Model</label><p className="text-gray-900 font-medium">{vehicle.trackingDeviceModel || 'N/A'}</p></div>
              <div className="border-b pb-2"><label className="text-sm text-gray-500">SIM Card Number</label><p className="text-gray-900 font-medium">{vehicle.simCardNumber || 'N/A'}</p></div>
            </div>
          </div>
        )}

        {/* Insurance Tab */}
        {activeTab === 'insurance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Insurance Provider</label><p className="text-gray-900 font-medium">{vehicle.insuranceProvider || 'N/A'}</p></div>
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Policy Number</label><p className="text-gray-900 font-medium">{vehicle.insurancePolicyNumber || 'N/A'}</p></div>
            </div>
            <div className="space-y-4">
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Insurance Expiry Date</label><p className="text-gray-900 font-medium">{vehicle.insuranceExpiryDate || 'N/A'}</p></div>
              <div className="border-b pb-2"><label className="text-sm text-gray-500">Registration Expiry Date</label><p className="text-gray-900 font-medium">{vehicle.registrationExpiryDate || 'N/A'}</p></div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border-b pb-2"><label className="text-sm text-gray-500">Last Service Date</label><p className="text-gray-900 font-medium">{vehicle.lastServiceDate || 'N/A'}</p></div>
                <div className="border-b pb-2"><label className="text-sm text-gray-500">Last Service Mileage</label><p className="text-gray-900 font-medium">{vehicle.lastServiceMileage || 'N/A'}</p></div>
              </div>
              <div className="space-y-4">
                <div className="border-b pb-2"><label className="text-sm text-gray-500">Next Service Date</label><p className="text-gray-900 font-medium">{vehicle.nextServiceDate || 'N/A'}</p></div>
              </div>
            </div>
            {vehicle.maintenanceNotes && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm text-gray-500 block mb-2">Maintenance Notes</label>
                <p className="text-gray-700">{vehicle.maintenanceNotes}</p>
              </div>
            )}
            {vehicle.assignedDriver && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><User size={18} /> Assigned Driver</h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {vehicle.assignedDriver.firstName} {vehicle.assignedDriver.lastName}</p>
                  <p><strong>Phone:</strong> {vehicle.assignedDriver.phone}</p>
                  <p><strong>Email:</strong> {vehicle.assignedDriver.email}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div>
            {vehicle.photos && vehicle.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {vehicle.photos.map((photo, index) => (
                  <div key={index} className="relative group cursor-pointer" onClick={() => openPhotoModal(index)}>
                    <img src={photo.url} alt={`Vehicle ${index + 1}`} className="w-full h-48 object-cover rounded-lg border-2 border-transparent hover:border-indigo-500 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8"><Image size={48} className="mx-auto mb-3 text-gray-400" /><p>No photos uploaded yet.</p></div>
            )}
          </div>
        )}

        {vehicle.notes && activeTab !== 'photos' && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold text-gray-900 mb-2">Additional Notes</h3>
            <p className="text-gray-700">{vehicle.notes}</p>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={closePhotoModal}>
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={closePhotoModal} className="absolute -top-12 right-0 text-white hover:text-gray-300"><X size={32} /></button>
            <div className="relative">
              <img src={selectedPhoto.url} alt="Vehicle" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
              {vehicle.photos && vehicle.photos.length > 1 && (
                <>
                  <button onClick={prevPhoto} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"><ChevronLeftIcon size={24} /></button>
                  <button onClick={nextPhoto} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"><ChevronRightIcon size={24} /></button>
                </>
              )}
            </div>
            <div className="mt-4 text-white text-center">
              <p className="text-lg font-semibold">{vehicle.registrationNumber} - {vehicle.make} {vehicle.model}</p>
              <p className="text-sm text-gray-300 mt-1">Photo {currentPhotoIndex + 1} of {vehicle.photos.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}