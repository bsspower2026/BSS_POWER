'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Plus, User, Eye } from 'lucide-react';

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'driver',
    label: 'Drivers',
    endpoint: '/api/drivers',
    addLabel: 'Add Driver',
    emptyText: 'No drivers found',
    showLicense: true,
  },
  {
    id: 'helper',
    label: 'Helpers',
    endpoint: '/api/helpers',
    addLabel: 'Add Helper',
    emptyText: 'No helpers found',
    showLicense: false,
  },
  {
    id: 'supervisor',
    label: 'Site Supervisors',
    endpoint: '/api/site-supervisors',
    addLabel: 'Add Site Supervisor',
    emptyText: 'No site supervisors found',
    showLicense: false,
  },
];

// ─── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Active: 'bg-green-100 text-green-800',
    'On Leave': 'bg-yellow-100 text-yellow-800',
    Inactive: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status || 'N/A'}
    </span>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function StaffPage() {
  const [activeTab, setActiveTab] = useState('driver');
  const [data, setData] = useState({ driver: [], helper: [], supervisor: [] });
  const [loading, setLoading] = useState({ driver: true, helper: true, supervisor: true });
  const [search, setSearch] = useState('');

  const tab = TABS.find(t => t.id === activeTab);

  // Fetch all three on mount
  useEffect(() => {
    TABS.forEach(t => fetchList(t));
  }, []);

  const fetchList = async (t) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${t.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(prev => ({ ...prev, [t.id]: json.data || [] }));
    } catch (err) {
      console.error(`Failed to fetch ${t.id}:`, err);
    } finally {
      setLoading(prev => ({ ...prev, [t.id]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab === 'supervisor' ? 'site supervisor' : activeTab}?`)) return;

    const token = localStorage.getItem('token');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}${tab.endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(item => item._id !== id),
      }));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const filtered = (data[activeTab] || []).filter(item =>
    item.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    item.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    item.email?.toLowerCase().includes(search.toLowerCase()) ||
    item.phone?.toLowerCase().includes(search.toLowerCase()) ||
    (tab.showLicense && item.licenseNumber?.toLowerCase().includes(search.toLowerCase())) ||
    (!tab.showLicense && item.designation?.toLowerCase().includes(search.toLowerCase()))
  );

  const isLoading = loading[activeTab];

  return (
    <div className="container-main">
      {/* ── Page header ── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage drivers, helpers, and site supervisors</p>
        </div>
        <Link href={`/dashboard/employee/drivers/form?type=${activeTab}`}>
          <button className="btn-primary flex items-center gap-2 w-full md:w-auto">
            <Plus size={20} /> {tab.addLabel}
          </button>
        </Link>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setSearch(''); }}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
            {!loading[t.id] && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === t.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {data[t.id]?.length || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="card p-4 mb-6">
        <input
          type="text"
          placeholder={`Search ${tab.label.toLowerCase()} by name, email, phone${tab.showLicense ? ', license' : ', designation'}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
        />
      </div>

      {/* ── Table ── */}
      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{tab.emptyText}</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Photo</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Name</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Email</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Phone</th>
                {tab.showLicense ? (
                  <th className="table-cell text-left text-sm font-medium text-gray-700">License No.</th>
                ) : (
                  <th className="table-cell text-left text-sm font-medium text-gray-700">Designation</th>
                )}
                <th className="table-cell text-left text-sm font-medium text-gray-700">Department</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Status</th>
                <th className="table-cell text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  {/* Photo */}
                  <td className="table-cell">
                    {item.profilePhoto?.url ? (
                      <img
                        src={item.profilePhoto.url}
                        alt={item.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={20} className="text-gray-400" />
                      </div>
                    )}
                  </td>

                  {/* Name */}
                  <td className="table-cell text-sm font-medium text-gray-900">
                    {item.firstName} {item.lastName}
                  </td>

                  {/* Email */}
                  <td className="table-cell text-sm text-gray-600">{item.email || '-'}</td>

                  {/* Phone */}
                  <td className="table-cell text-sm text-gray-600">{item.phone || '-'}</td>

                  {/* License / Designation */}
                  <td className="table-cell text-sm text-gray-600">
                    {tab.showLicense ? (item.licenseNumber || '-') : (item.designation || '-')}
                  </td>

                  {/* Department */}
                  <td className="table-cell text-sm text-gray-600">{item.department || '-'}</td>

                  {/* Status */}
                  <td className="table-cell text-sm">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* Actions */}
                  <td className="table-cell text-sm">
                    <div className="flex gap-1">
                      <Link href={`/dashboard/employee/drivers/${item._id}?type=${activeTab}`}>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                          <Eye size={17} className="text-blue-600" />
                        </button>
                      </Link>
                      <Link href={`/dashboard/employee/drivers/form?id=${item._id}&type=${activeTab}`}>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={17} className="text-indigo-600" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={17} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}