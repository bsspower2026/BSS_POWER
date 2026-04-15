'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu, X, LogOut, LayoutDashboard, Car, Users, Wrench,
  Settings, UserCircle, Moon, Sun, Monitor, Flag, History,
  CreditCard, Fuel, ShieldCheck
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser]               = useState(null);
  const [theme, setTheme]             = useState('light');
  const [badges, setBadges]           = useState({ fuel: 0, bill: 0 });
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const saved    = localStorage.getItem('theme') || 'light';
    if (!token || !userData) { router.push('/'); return; }
    const u = JSON.parse(userData);
    setUser(u);
    setTheme(saved);
    applyTheme(saved);
    if (u.role === 'admin') fetchBadges(token);
  }, [router]);

  const fetchBadges = async token => {
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/unseen-count`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setBadges({ fuel: data.data.fuel, bill: data.data.bill });
    } catch { /* silent */ }
  };

  const applyTheme = t => { document.documentElement.classList.remove('light','medium','dark'); document.documentElement.classList.add(t); localStorage.setItem('theme', t); };
  const cycleTheme = () => { const themes=['light','medium','dark']; const next=themes[(themes.indexOf(theme)+1)%themes.length]; setTheme(next); applyTheme(next); };
  const getThemeIcon = () => theme==='dark'?<Moon size={20}/>:theme==='medium'?<Monitor size={20}/>:<Sun size={20}/>;
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/'); };

  const getIcon = label => {
    const icons = { Overview:<LayoutDashboard size={20}/>, Dashboard:<LayoutDashboard size={20}/>, Vehicles:<Car size={20}/>, Drivers:<Users size={20}/>, Parts:<Wrench size={20}/>, Trips:<Flag size={20}/>, Settings:<Settings size={20}/>, 'Trip History':<History size={20}/>, 'Fuel Payments':<Fuel size={20}/>, 'Bill Payments':<CreditCard size={20}/>, Staffs:<Users size={20}/> };
    return icons[label] || <LayoutDashboard size={20}/>;
  };

  const navItems = {
    admin: [
      { label: 'Overview',       href: '/dashboard/admin' },
      { label: 'Fuel Payments',  href: '/dashboard/admin/fuel-payments',  badge: badges.fuel },
      { label: 'Bill Payments',  href: '/dashboard/admin/bill-payments',  badge: badges.bill },
    ],
    employee: [
      { label: 'Overview',  href: '/dashboard/employee' },
      { label: 'Vehicles',  href: '/dashboard/employee/vehicles' },
      { label: 'Staffs',    href: '/dashboard/employee/drivers' },
      { label: 'Trips',     href: '/dashboard/employee/trips' },
      { label: 'Parts',     href: '/dashboard/employee/parts' },
      { label: 'Settings',  href: '/dashboard/employee/settings' },
    ],
    supervisor: [
      { label: 'Dashboard', href: '/dashboard/supervisor' },
    ],
    driver: [
      { label: 'Overview',     href: '/dashboard/driver' },
      { label: 'Trip History', href: '/dashboard/driver/history' },
    ],
  };

  const items = navItems[user?.role] || [];

  const getThemeStyles = () => {
    if (theme === 'dark') return { sidebar:'bg-gray-900 border-gray-800', sidebarText:'text-white', sidebarBorder:'border-gray-800', header:'bg-gray-900 border-gray-800', headerText:'text-white', mainBg:'bg-gray-950', navHover:'hover:bg-gray-800', navActive:'bg-gray-800 text-white', navInactive:'text-gray-300' };
    if (theme === 'medium') return { sidebar:'bg-gray-700 border-gray-600', sidebarText:'text-gray-100', sidebarBorder:'border-gray-600', header:'bg-gray-700 border-gray-600', headerText:'text-gray-100', mainBg:'bg-gray-600', navHover:'hover:bg-gray-600', navActive:'bg-gray-600 text-white', navInactive:'text-gray-200' };
    return { sidebar:'bg-white border-gray-200', sidebarText:'text-gray-900', sidebarBorder:'border-gray-200', header:'bg-white border-gray-200', headerText:'text-gray-900', mainBg:'bg-gray-50', navHover:'hover:bg-gray-100', navActive:'bg-indigo-50 text-indigo-600', navInactive:'text-gray-700' };
  };

  const s = getThemeStyles();
  const isActive = href => href === '/dashboard/employee' || href === '/dashboard/driver' || href === '/dashboard/supervisor' || href === '/dashboard/admin' ? pathname === href : pathname.startsWith(href);

  if (!user) return null;

  return (
    <div className={`flex h-screen ${theme}`}>
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 shadow-lg transition-transform duration-300 ${sidebarOpen?'translate-x-0':'-translate-x-full md:translate-x-0'} ${s.sidebar}`}>
        <div className={`p-6 border-b ${s.sidebarBorder}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image src="/bss-primary-logo.png" alt="VMS" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${s.sidebarText}`}>VMS</h1>
              <p className={`text-xs ${theme==='dark'?'text-gray-400':theme==='medium'?'text-gray-300':'text-gray-500'}`}>
                {user.role === 'admin' ? 'Admin Panel' : 'Vehicle Management'}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {items.map(item => (
            <Link key={item.href} href={item.href} onClick={()=>setSidebarOpen(false)}>
              <span className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive(item.href)?s.navActive:`${s.navInactive} ${s.navHover}`}`}>
                <span className="flex items-center gap-3">
                  {getIcon(item.label)}
                  {item.label}
                </span>
                {item.badge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 text-xs font-semibold bg-red-500 text-white rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${s.sidebarBorder} ${s.sidebar}`}>
          <div className="mb-3">
            <button onClick={cycleTheme} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${s.navHover} ${s.navInactive}`}>
              {getThemeIcon()} <span className="text-sm capitalize">Theme: {theme}</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme==='dark'?'bg-gray-800':theme==='medium'?'bg-gray-600':'bg-gray-100'}`}>
              {user.role === 'admin'
                ? <ShieldCheck size={22} className={theme==='dark'?'text-indigo-400':'text-indigo-600'}/>
                : <UserCircle size={24} className={theme==='dark'?'text-gray-400':theme==='medium'?'text-gray-300':'text-gray-600'}/>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${s.sidebarText}`}>{user.name}</p>
              <p className={`text-xs capitalize ${theme==='dark'?'text-gray-400':theme==='medium'?'text-gray-300':'text-gray-500'}`}>{user.role}</p>
            </div>
            <button onClick={handleLogout} className={`p-2 rounded-lg transition-colors ${s.navHover} ${s.navInactive}`} title="Logout">
              <LogOut size={18}/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={`border-b px-4 md:px-6 py-4 flex items-center justify-between shadow-sm ${s.header}`}>
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} className={`md:hidden p-2 rounded-lg transition-colors ${s.navHover} ${s.navInactive}`}>
            {sidebarOpen?<X size={24}/>:<Menu size={24}/>}
          </button>
          <div className="flex-1">
            <h2 className={`text-lg font-semibold ${s.headerText}`}>
              {items.find(item=>isActive(item.href))?.label || (user.role === 'admin' ? 'Admin Dashboard' : 'Dashboard')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className={`text-sm font-medium ${s.headerText}`}>{user.name}</p>
              <p className={`text-xs capitalize ${theme==='dark'?'text-gray-400':theme==='medium'?'text-gray-300':'text-gray-500'}`}>{user.role}</p>
            </div>
            <button onClick={handleLogout} className={`hidden md:flex p-2 rounded-lg transition-colors ${s.navHover} ${s.navInactive}`} title="Logout">
              <LogOut size={20}/>
            </button>
          </div>
        </header>
        <main className={`flex-1 overflow-auto p-4 md:p-6 ${s.mainBg}`}>{children}</main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={()=>setSidebarOpen(false)}/>}
    </div>
  );
}