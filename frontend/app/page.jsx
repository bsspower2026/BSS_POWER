'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Redirect map - centralised so it's easy to update
  const ROLE_REDIRECTS = {
    employee:        '/dashboard/employee',
    supervisor:      '/dashboard/supervisor',
    driver:          '/dashboard/driver',
    helper:          '/dashboard/driver',        // shares driver portal; adjust if you add a dedicated helper dashboard
    site_supervisor: '/dashboard/supervisor',    // shares supervisor portal; adjust as needed
  };

  // Auto-redirect if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const dest = ROLE_REDIRECTS[data.user.role];
          if (dest) router.push(dest);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const dest = ROLE_REDIRECTS[data.user.role];
      if (dest) {
        router.push(dest);
      } else {
        throw new Error('Unknown role. Please contact the administrator.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Real-time vehicle tracking and monitoring',
    'Driver assignment and performance management',
    'Automated maintenance scheduling',
    'Fuel consumption and cost analysis',
    'Route planning and optimization',
    'Comprehensive reporting and analytics',
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Left Side ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-white border-r border-gray-200">
        <div className="flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 relative">
                <Image src="/bss-primary-logo.png" alt="VMS Logo" fill className="object-contain" priority />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">BSS Power</h1>
                <p className="text-gray-500 text-sm">Vehicle Management System</p>
              </div>
            </div>

            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Fleet Management<br />Made Simple
            </h2>
            <p className="text-gray-600 text-base mb-8 leading-relaxed">
              A comprehensive solution to manage your vehicle fleet, drivers, and maintenance operations efficiently.
            </p>

            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-gray-400 shrink-0" />
                  <span className="text-gray-700 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div><div className="text-2xl font-semibold text-gray-900">500+</div><div className="text-xs text-gray-500">Active Users</div></div>
              <div><div className="text-2xl font-semibold text-gray-900">1000+</div><div className="text-xs text-gray-500">Vehicles</div></div>
              <div><div className="text-2xl font-semibold text-gray-900">98%</div><div className="text-xs text-gray-500">Satisfaction</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Side - Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 relative mx-auto mb-4">
              <Image src="/bss-primary-logo.png" alt="VMS Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">BSS Power</h1>
            <p className="text-gray-500 text-sm mt-1">Vehicle Management System</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Sign In</h2>
              <p className="text-gray-500 text-sm mt-2">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-11"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} BSS Power Private Limited. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}