'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu, X, LogOut, LayoutDashboard, Car, Users, Wrench,
  Settings, UserCircle, Moon, Sun, Monitor, Flag, History
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const savedTheme = localStorage.getItem('theme') || 'light';

    if (!token || !userData) { router.push('/'); return; }

    setUser(JSON.parse(userData));
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, [router]);

  const applyTheme = (selectedTheme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'medium', 'dark');
    root.classList.add(selectedTheme);
    localStorage.setItem('theme', selectedTheme);
  };

  const handleThemeChange = () => {
    const themes = ['light', 'medium', 'dark'];
    const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon size={20} />;
    if (theme === 'medium') return <Monitor size={20} />;
    return <Sun size={20} />;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  const getIcon = (label) => {
    switch (label) {
      case 'Overview': return <LayoutDashboard size={20} />;
      case 'Dashboard': return <LayoutDashboard size={20} />;
      case 'Vehicles': return <Car size={20} />;
      case 'Drivers': return <Users size={20} />;
      case 'Parts': return <Wrench size={20} />;
      case 'Trips': return <Flag size={20} />;
      case 'Settings': return <Settings size={20} />;
      case 'Trip History': return <History size={20} />;
      default: return <LayoutDashboard size={20} />;
    }
  };

  const navItems = {
    employee: [
      { label: 'Overview', href: '/dashboard/employee' },
      { label: 'Vehicles', href: '/dashboard/employee/vehicles' },
      { label: 'Staffs', href: '/dashboard/employee/drivers' },
      { label: 'Trips', href: '/dashboard/employee/trips' },
      { label: 'Parts', href: '/dashboard/employee/parts' },
      { label: 'Settings', href: '/dashboard/employee/settings' },
    ],
    supervisor: [
      { label: 'Dashboard', href: '/dashboard/supervisor' },
    ],
    driver: [
      { label: 'Overview', href: '/dashboard/driver' },
      { label: 'Trip History', href: '/dashboard/driver/history' },
    ],
  };

  const items = navItems[user.role] || [];

  const getThemeStyles = () => {
    if (theme === 'dark') return {
      sidebar: 'bg-gray-900 border-gray-800', sidebarText: 'text-white',
      sidebarBorder: 'border-gray-800', header: 'bg-gray-900 border-gray-800',
      headerText: 'text-white', mainBg: 'bg-gray-950',
      navHover: 'hover:bg-gray-800', navActive: 'bg-gray-800 text-white',
      navInactive: 'text-gray-300',
    };
    if (theme === 'medium') return {
      sidebar: 'bg-gray-700 border-gray-600', sidebarText: 'text-gray-100',
      sidebarBorder: 'border-gray-600', header: 'bg-gray-700 border-gray-600',
      headerText: 'text-gray-100', mainBg: 'bg-gray-600',
      navHover: 'hover:bg-gray-600', navActive: 'bg-gray-600 text-white',
      navInactive: 'text-gray-200',
    };
    return {
      sidebar: 'bg-white border-gray-200', sidebarText: 'text-gray-900',
      sidebarBorder: 'border-gray-200', header: 'bg-white border-gray-200',
      headerText: 'text-gray-900', mainBg: 'bg-gray-50',
      navHover: 'hover:bg-gray-100', navActive: 'bg-indigo-50 text-indigo-600',
      navInactive: 'text-gray-700',
    };
  };

  const styles = getThemeStyles();

  // Check if a nav item is active (handle nested paths)
  const isActive = (href) => {
    if (href === '/dashboard/employee' || href === '/dashboard/driver' || href === '/dashboard/supervisor') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : theme === 'medium' ? 'medium' : 'light'}`}>
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 shadow-lg transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${styles.sidebar}`}>
        {/* Logo */}
        <div className={`p-6 border-b ${styles.sidebarBorder}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image src="/bss-primary-logo.png" alt="VMS Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${styles.sidebarText}`}>VMS</h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : theme === 'medium' ? 'text-gray-300' : 'text-gray-500'}`}>
                Vehicle Management System
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <span className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? styles.navActive
                  : `${styles.navInactive} ${styles.navHover}`
              }`}>
                {getIcon(item.label)}
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Bottom user info */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${styles.sidebarBorder} ${styles.sidebar}`}>
          <div className="mb-3">
            <button
              onClick={handleThemeChange}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${styles.navHover} ${styles.navInactive}`}
            >
              {getThemeIcon()}
              <span className="text-sm capitalize">Theme: {theme}</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : theme === 'medium' ? 'bg-gray-600' : 'bg-gray-100'}`}>
              <UserCircle size={24} className={theme === 'dark' ? 'text-gray-400' : theme === 'medium' ? 'text-gray-300' : 'text-gray-600'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${styles.sidebarText}`}>{user.name}</p>
              <p className={`text-xs capitalize ${theme === 'dark' ? 'text-gray-400' : theme === 'medium' ? 'text-gray-300' : 'text-gray-500'}`}>{user.role}</p>
            </div>
            <button onClick={handleLogout} className={`p-2 rounded-lg transition-colors ${styles.navHover} ${styles.navInactive}`} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`border-b px-4 md:px-6 py-4 flex items-center justify-between shadow-sm ${styles.header}`}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`md:hidden p-2 rounded-lg transition-colors ${styles.navHover} ${styles.navInactive}`}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex-1">
            <h2 className={`text-lg font-semibold ${styles.headerText}`}>
              {items.find(item => isActive(item.href))?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className={`text-sm font-medium ${styles.headerText}`}>{user.name}</p>
              <p className={`text-xs capitalize ${theme === 'dark' ? 'text-gray-400' : theme === 'medium' ? 'text-gray-300' : 'text-gray-500'}`}>{user.role}</p>
            </div>
            <button onClick={handleLogout} className={`hidden md:flex p-2 rounded-lg transition-colors ${styles.navHover} ${styles.navInactive}`} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className={`flex-1 overflow-auto p-4 md:p-6 ${styles.mainBg}`}>
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}