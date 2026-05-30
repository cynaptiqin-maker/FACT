import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandPalette from '@components/UI/CommandPalette';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();

  // Keyboard shortcut for command palette
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((o) => !o);
      }
    }
    // Also listen for custom event from TopBar
    function handleCustomEvent() {
      setCommandPaletteOpen(true);
    }
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomEvent);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomEvent);
    };
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(false);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5efe0' }}>
      <Sidebar collapsed={sidebarCollapsed} />
      <TopBar
        onMenuToggle={() => setSidebarCollapsed((c) => !c)}
        collapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className="transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? '56px' : '240px',
          paddingTop: '60px',
          paddingLeft: '16px',
          paddingRight: '16px',
          paddingBottom: '24px',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </main>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
