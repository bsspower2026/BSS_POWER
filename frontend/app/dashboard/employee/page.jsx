'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, Users, Package, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function EmployeeOverview() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalDrivers: 0,
    totalParts: 0,
    activeVehicles: 0,
    underMaintenance: 0,
    activeDrivers: 0,
    onLeaveDrivers: 0,
    lowStockParts: 0,
    outOfStockParts: 0,
    recentActivity: []
  });
  
  const [loading, setLoading] = useState(true);
  const [vehicleData, setVehicleData] = useState([]);
  const [driverData, setDriverData] = useState([]);
  const [partData, setPartData] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [vehiclesRes, driversRes, partsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/drivers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const vehicles = await vehiclesRes.json();
      const drivers = await driversRes.json();
      const parts = await partsRes.json();

      const vehiclesData = vehicles.data || [];
      const driversData = drivers.data || [];
      const partsData = parts.data || [];

      // Calculate statistics
      const activeVehicles = vehiclesData.filter(v => v.status === 'active').length;
      const underMaintenance = vehiclesData.filter(v => v.status === 'maintenance').length;
      const activeDrivers = driversData.filter(d => d.status === 'Active').length;
      const onLeaveDrivers = driversData.filter(d => d.status === 'On Leave').length;
      const lowStockParts = partsData.filter(p => p.quantity <= p.minimumLevel && p.quantity > 0).length;
      const outOfStockParts = partsData.filter(p => p.quantity === 0).length;

      setStats({
        totalVehicles: vehiclesData.length,
        totalDrivers: driversData.length,
        totalParts: partsData.length,
        activeVehicles,
        underMaintenance,
        activeDrivers,
        onLeaveDrivers,
        lowStockParts,
        outOfStockParts,
        recentActivity: generateRecentActivity(vehiclesData, driversData, partsData)
      });

      // Prepare data for charts
      setVehicleData(prepareVehicleChartData(vehiclesData));
      setDriverData(prepareDriverChartData(driversData));
      setPartData(preparePartChartData(partsData));

    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (vehicles, drivers, parts) => {
    const activities = [];
    
    // Add recent vehicles
    const recentVehicles = [...vehicles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 2);
    recentVehicles.forEach(v => {
      activities.push({
        type: 'vehicle',
        action: 'added',
        name: `${v.make} ${v.model}`,
        time: new Date(v.createdAt).toLocaleDateString(),
        icon: Truck
      });
    });
    
    // Add recent drivers
    const recentDrivers = [...drivers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 2);
    recentDrivers.forEach(d => {
      activities.push({
        type: 'driver',
        action: 'added',
        name: `${d.firstName} ${d.lastName}`,
        time: new Date(d.createdAt).toLocaleDateString(),
        icon: Users
      });
    });
    
    // Add recent parts
    const recentParts = [...parts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 2);
    recentParts.forEach(p => {
      activities.push({
        type: 'part',
        action: 'added',
        name: p.name,
        time: new Date(p.createdAt).toLocaleDateString(),
        icon: Package
      });
    });
    
    return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
  };

  const prepareVehicleChartData = (vehicles) => {
    const statusCount = {
      'Active': vehicles.filter(v => v.status === 'active').length,
      'Maintenance': vehicles.filter(v => v.status === 'maintenance').length,
      'Inactive': vehicles.filter(v => v.status === 'inactive').length
    };
    
    return [
      { name: 'Active', value: statusCount.Active, color: '#10b981' },
      { name: 'Maintenance', value: statusCount.Maintenance, color: '#f59e0b' },
      { name: 'Inactive', value: statusCount.Inactive, color: '#ef4444' }
    ];
  };

  const prepareDriverChartData = (drivers) => {
    const statusCount = {
      'Active': drivers.filter(d => d.status === 'Active').length,
      'On Leave': drivers.filter(d => d.status === 'On Leave').length,
      'Inactive': drivers.filter(d => d.status === 'Inactive').length
    };
    
    return [
      { name: 'Active', value: statusCount.Active, color: '#10b981' },
      { name: 'On Leave', value: statusCount['On Leave'], color: '#f59e0b' },
      { name: 'Inactive', value: statusCount.Inactive, color: '#ef4444' }
    ];
  };

  const preparePartChartData = (parts) => {
    const inStock = parts.filter(p => p.quantity > p.minimumLevel).length;
    const lowStock = parts.filter(p => p.quantity <= p.minimumLevel && p.quantity > 0).length;
    const outOfStock = parts.filter(p => p.quantity === 0).length;
    
    return [
      { name: 'In Stock', value: inStock, color: '#10b981' },
      { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
      { name: 'Out of Stock', value: outOfStock, color: '#ef4444' }
    ];
  };

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: Truck,
      href: '/dashboard/employee/vehicles',
      trend: `${stats.activeVehicles} Active`,
      trendIcon: CheckCircle,
      trendColor: 'text-green-600'
    },
    {
      title: 'Total Drivers',
      value: stats.totalDrivers,
      icon: Users,
      href: '/dashboard/employee/drivers',
      trend: `${stats.activeDrivers} Active`,
      trendIcon: CheckCircle,
      trendColor: 'text-green-600'
    },
    {
      title: 'Total Parts',
      value: stats.totalParts,
      icon: Package,
      href: '/dashboard/employee/parts',
      trend: `${stats.lowStockParts} Low Stock`,
      trendIcon: AlertTriangle,
      trendColor: 'text-yellow-600'
    },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="container-main py-10 text-center">
        <div className="text-gray-600">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="container-main">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">Welcome to BSS Power Vehicle Management System</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.trendIcon;
          return (
            <Link key={card.href} href={card.href}>
              <div className="card p-6 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendIcon size={14} className={card.trendColor} />
                      <p className={`text-xs ${card.trendColor}`}>{card.trend}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <Icon className="w-8 h-8 text-indigo-600" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Vehicle Status Pie Chart */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck size={20} className="text-indigo-600" />
            Vehicle Status Distribution
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vehicleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
            {vehicleData.map((item) => (
              <div key={item.name} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-600">{item.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Status Pie Chart */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-indigo-600" />
            Driver Status Distribution
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={driverData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {driverData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
            {driverData.map((item) => (
              <div key={item.name} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-600">{item.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Parts Inventory Bar Chart */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={20} className="text-indigo-600" />
            Parts Inventory Status
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={partData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8">
                  {partData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
            {partData.map((item) => (
              <div key={item.name} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-600">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-indigo-600" />
          Recent Activity
        </h2>
        <div className="space-y-3">
          {stats.recentActivity.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No recent activity to display
            </div>
          ) : (
            stats.recentActivity.map((activity, index) => {
              const ActivityIcon = activity.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <ActivityIcon size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.type === 'vehicle' ? 'Vehicle' : activity.type === 'driver' ? 'Driver' : 'Part'} {activity.action}
                      </p>
                      <p className="text-sm text-gray-600">{activity.name}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/employee/vehicles/form">
              <button className="btn-primary w-full flex items-center justify-center gap-2">
                <Truck size={18} />
                Add Vehicle
              </button>
            </Link>
            <Link href="/dashboard/employee/drivers/form">
              <button className="btn-primary w-full flex items-center justify-center gap-2">
                <Users size={18} />
                Add Driver
              </button>
            </Link>
            <Link href="/dashboard/employee/parts/form">
              <button className="btn-primary w-full flex items-center justify-center gap-2">
                <Package size={18} />
                Add Part
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}