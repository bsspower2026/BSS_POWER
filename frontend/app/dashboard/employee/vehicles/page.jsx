// app/dashboard/employee/vehicles/page.jsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Plus, Car, AlertTriangle, CheckCircle, Wrench, Image, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentVehicle, setCurrentVehicle] = useState(null);

  useEffect(() => {
    fetchVehicles();
    fetchStats();
  }, []);

  const fetchVehicles = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }

      const result = await response.json();
      setVehicles(result.data || []);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      alert('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete vehicle');
      }

      setVehicles(vehicles.filter(v => v._id !== id));
      fetchStats(); // Refresh stats after deletion
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      alert('Failed to delete vehicle');
    }
  };

  const openPhotoModal = (vehicle, photoIndex) => {
    setCurrentVehicle(vehicle);
    setCurrentPhotoIndex(photoIndex);
    setSelectedPhoto(vehicle.photos[photoIndex]);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setCurrentVehicle(null);
    setCurrentPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (currentVehicle && currentVehicle.photos) {
      const nextIndex = (currentPhotoIndex + 1) % currentVehicle.photos.length;
      setCurrentPhotoIndex(nextIndex);
      setSelectedPhoto(currentVehicle.photos[nextIndex]);
    }
  };

  const prevPhoto = () => {
    if (currentVehicle && currentVehicle.photos) {
      const prevIndex = (currentPhotoIndex - 1 + currentVehicle.photos.length) % currentVehicle.photos.length;
      setCurrentPhotoIndex(prevIndex);
      setSelectedPhoto(currentVehicle.photos[prevIndex]);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(search.toLowerCase()) ||
    vehicle.make?.toLowerCase().includes(search.toLowerCase()) ||
    vehicle.licensePlate?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'maintenance':
        return <Wrench size={16} className="text-yellow-600" />;
      case 'inactive':
        return <AlertTriangle size={16} className="text-red-600" />;
      default:
        return <Car size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container-main">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-600 mt-1">Manage all vehicles in the fleet</p>
        </div>
        <Link href="/dashboard/employee/vehicles/form">
          <button className="btn-primary flex items-center gap-2 w-full md:w-auto">
            <Plus size={20} /> Add Vehicle
          </button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Car size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Wrench size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Under Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.underMaintenance}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 mb-6">
        <input
          type="text"
          placeholder="Search by registration number, model, make, or license plate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            {search ? 'No vehicles found matching your search' : 'No vehicles found. Click "Add Vehicle" to get started.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Photo</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Registration Number</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Make & Model</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Year</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Color</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Status</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle._id} className="hover:bg-gray-50">
                  <td className="table-cell text-sm">
                    {vehicle.photos && vehicle.photos.length > 0 ? (
                      <div className="relative group">
                        <img
                          src={vehicle.photos[0].url}
                          alt={vehicle.registrationNumber}
                          className="w-12 h-12 object-cover rounded-lg cursor-pointer border border-gray-200 hover:border-indigo-500 transition-all"
                          onClick={() => openPhotoModal(vehicle, 0)}
                        />
                        {vehicle.photos.length > 1 && (
                          <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            +{vehicle.photos.length}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image size={20} className="text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="table-cell text-sm">
                    <div>
                      <div className="font-medium text-gray-900">{vehicle.registrationNumber || '-'}</div>
                      {vehicle.licensePlate && (
                        <div className="text-xs text-gray-500 mt-1">Plate: {vehicle.licensePlate}</div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell text-sm">
                    <div>
                      <div className="text-gray-900">{vehicle.make} {vehicle.model}</div>
                      {vehicle.vin && (
                        <div className="text-xs text-gray-500 mt-1">VIN: {vehicle.vin}</div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell text-sm text-gray-600">{vehicle.year || '-'}</td>
                  <td className="table-cell text-sm text-gray-600">
                    {vehicle.color && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: vehicle.color.toLowerCase() }}
                        />
                        <span>{vehicle.color}</span>
                      </div>
                    )}
                    {!vehicle.color && '-'}
                  </td>
                  <td className="table-cell text-sm">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                      {getStatusIcon(vehicle.status)}
                      {vehicle.status === 'active' ? 'Active' :
                        vehicle.status === 'maintenance' ? 'Under Maintenance' :
                          'Inactive'}
                    </span>
                    {vehicle.nextServiceDate && vehicle.status === 'active' && (
                      <div className="text-xs text-gray-500 mt-1">
                        Next service: {new Date(vehicle.nextServiceDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="table-cell text-sm">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/employee/vehicles/${vehicle._id}`}>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View Details">
                          <Eye size={18} className="text-blue-600" />
                        </button>
                      </Link>

                      <Link href={`/dashboard/employee/vehicles/form?id=${vehicle._id}`}>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit2 size={18} className="text-indigo-600" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(vehicle._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={closePhotoModal}>
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={closePhotoModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={32} />
            </button>

            {/* Image Container */}
            <div className="relative">
              <img
                src={selectedPhoto.url}
                alt="Vehicle"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />

              {/* Navigation Buttons */}
              {currentVehicle && currentVehicle.photos && currentVehicle.photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Image Info */}
            <div className="mt-4 text-white text-center">
              <p className="text-lg font-semibold">
                {currentVehicle?.registrationNumber} - {currentVehicle?.make} {currentVehicle?.model}
              </p>
              {currentVehicle && currentVehicle.photos && (
                <p className="text-sm text-gray-300 mt-1">
                  Photo {currentPhotoIndex + 1} of {currentVehicle.photos.length}
                </p>
              )}
              {selectedPhoto.uploadedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Uploaded: {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}