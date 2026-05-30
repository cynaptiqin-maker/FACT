import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { notificationAPI } from '@services/api';
import { useQuery } from '@tanstack/react-query';
import {
  Bell, Search, LogOut, User, Settings, ChevronDown,
  Menu, Brain, Moon, Sun, Command
} from 'lucide-react';
import clsx from 'clsx';

// ─── TopBar ───────────────────────────────────────────────────────────────────
export default function TopBar({ onMenuToggle, collapsed }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Unread notification count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationAPI.getUnreadCount().then((r) => r.data.data),
    refetchInterval: 60000, // every minute
    retry: false,
  });

  const unreadCount = unreadData?.count || 0;

  // Close menus on outside click
  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode((d) => !d);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header
      className="fixed top-0 right-0 h-[60px] flex items-center px-4 gap-3 z-20 transition-all duration-300"
      style={{
        left: collapsed ? '56px' : '240px',
        backgroundColor: '#FFF7E6',
        borderBottom: '1px solid rgba(28,55,65,0.1)',
        fontFamily: "'Open Sans', sans-serif",
      }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Global Search Trigger */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm flex-1 max-w-sm"
        style={{ backgroundColor: 'rgba(28,55,65,0.07)', color: 'rgba(28,55,65,0.5)', border: '1px solid rgba(28,55,65,0.1)' }}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:block">Search or ask AI...</span>
        <span className="ml-auto hidden sm:flex items-center gap-1 text-xs" style={{ color: 'rgba(28,55,65,0.35)' }}>
          <Command className="w-3 h-3" />K
        </span>
      </button>

      <div className="flex-1" />

      {/* AI Assistant */}
      <button
        onClick={() => navigate('/ai')}
        className="p-1.5 rounded-md transition-colors"
        style={{ color: 'rgba(28,55,65,0.5)' }}
        title="AI Financial Assistant"
      >
        <Brain className="w-5 h-5" />
      </button>

      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className="p-1.5 rounded-md transition-colors"
        style={{ color: 'rgba(28,55,65,0.5)' }}
        title={darkMode ? 'Light mode' : 'Dark mode'}
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-slide-in">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-brand-600 font-medium">{unreadCount} new</span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {unreadCount === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No new notifications
                </div>
              ) : (
                <div className="p-2">
                  <p className="text-xs text-slate-500 text-center py-4">
                    Loading notifications...
                  </p>
                </div>
              )}
            </div>
            <div className="px-4 py-2 border-t border-slate-100">
              <button
                onClick={() => { navigate('/admin/audit-logs'); setNotifOpen(false); }}
                className="w-full text-center text-xs text-brand-600 hover:text-brand-700 font-medium py-1"
              >
                View all activity
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen((o) => !o)}
          className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#1C3741' }}>
            <span className="text-xs font-semibold" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>
              {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold leading-tight" style={{ color: '#1C3741', fontFamily: "'Open Sans', sans-serif" }}>
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] capitalize leading-tight" style={{ color: 'rgba(28,55,65,0.5)', fontFamily: "'Open Sans', sans-serif" }}>
              {Array.isArray(user?.roles) ? user.roles[0] : user?.role || 'Staff'}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-slide-in">
            <div className="p-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <MenuButton icon={User} label="Profile" onClick={() => { setUserMenuOpen(false); }} />
              <MenuButton icon={Settings} label="Settings" onClick={() => { navigate('/admin'); setUserMenuOpen(false); }} />
              <div className="border-t border-slate-100 my-1" />
              <MenuButton icon={LogOut} label="Logout" onClick={handleLogout} danger />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function MenuButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-100'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
