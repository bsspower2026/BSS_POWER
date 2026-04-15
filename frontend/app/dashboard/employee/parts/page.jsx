'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Plus, Package, AlertTriangle, Image } from 'lucide-react';

export default function PartsPage() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentPart, setCurrentPart] = useState(null);

  useEffect(() => {
    fetchParts();
    fetchStats();
  }, []);

  const fetchParts = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch parts');
      }
      
      const result = await response.json();
      setParts(result.data || []);
    } catch (err) {
      console.error('Failed to fetch parts:', err);
      alert('Failed to load parts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parts/stats/overview`, {
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
    if (!confirm('Are you sure you want to delete this part?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete part');
      }
      
      setParts(parts.filter(p => p._id !== id));
      fetchStats(); // Refresh stats after deletion
    } catch (err) {
      console.error('Failed to delete part:', err);
      alert('Failed to delete part');
    }
  };

  const openPhotoModal = (part, photoIndex) => {
    setCurrentPart(part);
    setCurrentPhotoIndex(photoIndex);
    setSelectedPhoto(part.photos[photoIndex]);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setCurrentPart(null);
    setCurrentPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (currentPart && currentPart.photos) {
      const nextIndex = (currentPhotoIndex + 1) % currentPart.photos.length;
      setCurrentPhotoIndex(nextIndex);
      setSelectedPhoto(currentPart.photos[nextIndex]);
    }
  };

  const prevPhoto = () => {
    if (currentPart && currentPart.photos) {
      const prevIndex = (currentPhotoIndex - 1 + currentPart.photos.length) % currentPart.photos.length;
      setCurrentPhotoIndex(prevIndex);
      setSelectedPhoto(currentPart.photos[prevIndex]);
    }
  };

  const filteredParts = parts.filter(part =>
    part.name?.toLowerCase().includes(search.toLowerCase()) ||
    part.partNumber?.toLowerCase().includes(search.toLowerCase()) ||
    part.category?.toLowerCase().includes(search.toLowerCase())
  );

  const isLowStock = (part) => {
    return part.quantity <= part.minimumLevel && part.quantity > 0;
  };

  return (
    <div className="container-main">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parts Inventory</h1>
          <p className="text-gray-600 mt-1">Manage and track parts inventory</p>
        </div>
        <Link href="/dashboard/employee/parts/form">
          <button className="btn-primary flex items-center gap-2 w-full md:w-auto">
            <Plus size={20} /> Add Part
          </button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inStock}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Package size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 mb-6">
        <input
          type="text"
          placeholder="Search by name, part number, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading...</div>
        ) : filteredParts.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            {search ? 'No parts found matching your search' : 'No parts found. Click "Add Part" to get started.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Photo</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Part Name</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Part Number</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Category</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Quantity</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Unit</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Status</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((part) => (
                <tr key={part._id} className="hover:bg-gray-50">
                  <td className="table-cell text-sm">
                    {part.photos && part.photos.length > 0 ? (
                      <div className="relative group">
                        <img
                          src={part.photos[0].url}
                          alt={part.name}
                          className="w-12 h-12 object-cover rounded-lg cursor-pointer border border-gray-200 hover:border-indigo-500 transition-all"
                          onClick={() => openPhotoModal(part, 0)}
                        />
                        {part.photos.length > 1 && (
                          <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            +{part.photos.length}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image size={20} className="text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="table-cell text-sm text-gray-900 font-medium">{part.name || '-'}</td>
                  <td className="table-cell text-sm text-gray-600">{part.partNumber || '-'}</td>
                  <td className="table-cell text-sm text-gray-600">
                    <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                      {part.category || '-'}
                    </span>
                  </td>
                  <td className="table-cell text-sm font-semibold text-gray-900">{part.quantity || 0}</td>
                  <td className="table-cell text-sm text-gray-600">{part.unitOfMeasurement || '-'}</td>
                  <td className="table-cell text-sm">
                    {part.quantity === 0 ? (
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    ) : isLowStock(part) ? (
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="table-cell text-sm">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/employee/parts/form?id=${part._id}`}>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit2 size={18} className="text-indigo-600" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(part._id)}
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
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
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
                alt="Part"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              
              {/* Navigation Buttons */}
              {currentPart && currentPart.photos && currentPart.photos.length > 1 && (
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
                {currentPart?.name} - {currentPart?.partNumber}
              </p>
              {currentPart && currentPart.photos && (
                <p className="text-sm text-gray-300 mt-1">
                  Photo {currentPhotoIndex + 1} of {currentPart.photos.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ChevronLeft and ChevronRight icons
const ChevronLeft = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const X = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);