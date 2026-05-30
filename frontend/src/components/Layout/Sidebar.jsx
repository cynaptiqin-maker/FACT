import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useModuleStore } from '@store/moduleStore';
import {
  LayoutDashboard, BookOpen, FileText, Landmark, Users, ShieldCheck,
  Building2, Briefcase, TrendingUp, BarChart3, Settings, Brain,
  CreditCard, Banknote, FileBarChart, Stethoscope, Scale, LayoutGrid,
  Zap, Globe, Package, Archive, FolderKanban,
} from 'lucide-react';

// ─── Design tokens (all inline — sidesteps the broken rgba Tailwind tokens) ──
const C = {
  bg:      '#1C3741',
  strip:   '#142830',
  hover:   '#254e5b',
  active:  '#2e5f6e',
  text:    'rgba(255,247,230,0.65)',
  muted:   'rgba(255,247,230,0.35)',
  bright:  '#FFF7E6',
  border:  'rgba(255,247,230,0.08)',
  divider: 'rgba(255,247,230,0.06)',
  accent:  '#5a8896',
};

const ICON_MAP = {
  LayoutDashboard, BookOpen, FileText, Landmark, Users, ShieldCheck,
  Building2, Briefcase, TrendingUp, BarChart3, Settings, Brain,
  CreditCard, Banknote, FileBarChart, Stethoscope, Scale, LayoutGrid, Zap, Globe,
  Package, Archive, FolderKanban,
};

const NAV_GROUPS = [
  {
    label: 'Operations',
    icon: 'LayoutGrid',
    items: [
      { label: 'Command Center',  path: '/command-center', icon: 'LayoutGrid' },
      { label: 'CFO Dashboard',   path: '/', icon: 'LayoutDashboard', exact: true },
      { label: 'Exception Inbox', path: '/exceptions',    icon: 'AlertTriangle' },
    ],
  },
  {
    label: 'Accounting',
    icon: 'BookOpen',
    items: [
      {
        label: 'Core Accounting', icon: 'BookOpen', moduleId: 'core-accounting',
        children: [
          { label: 'Chart of Accounts', path: '/accounting/chart-of-accounts' },
          { label: 'Journal Voucher',   path: '/accounting/journal' },
          { label: 'Ledger',            path: '/accounting/ledger' },
          { label: 'Trial Balance',     path: '/accounting/trial-balance' },
          { label: 'Fiscal Years',      path: '/accounting/fiscal-years' },
        ],
      },
      {
        label: 'General Ledger', icon: 'FileText', moduleId: 'general-ledger',
        children: [
          { label: 'Ledger View',  path: '/gl' },
          { label: 'Journal List', path: '/gl/journals' },
        ],
      },
      {
        label: 'Accounts Receivable', icon: 'TrendingUp', moduleId: 'accounts-receivable',
        children: [
          { label: 'AR Dashboard', path: '/ar' },
          { label: 'Invoices',     path: '/ar/invoices' },
          { label: 'Aging Report', path: '/ar/aging' },
        ],
      },
      {
        label: 'Accounts Payable', icon: 'Landmark', moduleId: 'accounts-payable',
        children: [
          { label: 'AP Dashboard',    path: '/ap' },
          { label: 'Vendor Invoices', path: '/ap/vendor-invoices' },
        ],
      },
      {
        label: 'Cash & Bank', icon: 'Banknote', moduleId: 'cash-bank',
        children: [
          { label: 'Cash Book',           path: '/cash-bank' },
          { label: 'Bank Reconciliation', path: '/cash-bank/reconciliation' },
        ],
      },
      {
        label: 'Reconciliation', icon: 'GitCompareArrows', moduleId: 'reconciliation',
        children: [
          { label: 'Recon Workbench', path: '/reconciliation' },
        ],
      },
      {
        label: 'Period Close', icon: 'CalendarCheck', moduleId: 'period-close',
        children: [
          { label: 'Close Center', path: '/period-close' },
        ],
      },
    ],
  },
  {
    label: 'Hospital Finance',
    icon: 'CreditCard',
    items: [
      {
        label: 'Patient Billing', icon: 'CreditCard', moduleId: 'patient-billing',
        children: [
          { label: 'Dashboard',       path: '/billing' },
          { label: 'New Invoice',     path: '/billing/new' },
          { label: 'All Invoices',    path: '/billing/invoices' },
          { label: 'Payment Receipt', path: '/billing/payment' },
        ],
      },
      {
        label: 'Insurance / TPA', icon: 'ShieldCheck', moduleId: 'insurance-tpa',
        children: [
          { label: 'Claims Dashboard', path: '/insurance' },
          { label: 'TPA Aging Report', path: '/insurance/aging' },
        ],
      },
      {
        label: 'Doctor Payouts', icon: 'Stethoscope', moduleId: 'doctor-payout',
        children: [
          { label: 'Payout Dashboard', path: '/doctor-payouts' },
          { label: 'Revenue Sharing',  path: '/doctor-payouts/revenue-sharing' },
        ],
      },
    ],
  },
  {
    label: 'Operations',
    icon: 'Briefcase',
    items: [
      {
        label: 'Fixed Assets', icon: 'Building2', moduleId: 'fixed-assets',
        children: [
          { label: 'Asset Register',    path: '/assets' },
          { label: 'Depreciation Runs', path: '/assets/depreciation' },
        ],
      },
      {
        label: 'Payroll', icon: 'Users', moduleId: 'payroll',
        children: [
          { label: 'Payroll Dashboard', path: '/payroll' },
          { label: 'Run Payroll',       path: '/payroll/run' },
          { label: 'Payslips',          path: '/payroll/payslips' },
        ],
      },
      {
        label: 'Budgeting', icon: 'BarChart3', moduleId: 'budgeting',
        children: [
          { label: 'Budget Dashboard', path: '/budgeting' },
          { label: 'Variance Report',  path: '/budgeting/variance' },
        ],
      },
    ],
  },
  {
    label: 'Compliance',
    icon: 'Scale',
    items: [
      {
        label: 'FCRA', icon: 'Globe', moduleId: 'fcra',
        children: [
          { label: 'Dashboard',     path: '/fcra' },
          { label: 'Registration',  path: '/fcra/registration' },
          { label: 'Bank Accounts', path: '/fcra/bank-accounts' },
          { label: 'Donors',        path: '/fcra/donors' },
          { label: 'Receipts',      path: '/fcra/receipts' },
          { label: 'Projects',      path: '/fcra/projects' },
          { label: 'Utilisation',   path: '/fcra/utilisation' },
          { label: 'Compliance',    path: '/fcra/compliance' },
          { label: 'FC-4 Filing',   path: '/fcra/fc4' },
          { label: 'Assets',        path: '/fcra/assets',    icon: 'Package' },
          { label: 'Disposals',     path: '/fcra/disposals', icon: 'Archive' },
          { label: 'Asset Income',  path: '/fcra/income',    icon: 'TrendingUp' },
          { label: 'Reports',       path: '/fcra/reports',   icon: 'FileText' },
          { label: 'Audit Trail',   path: '/fcra/audit',     icon: 'ShieldCheck' },
        ],
      },
      {
        label: 'Taxation', icon: 'Scale', moduleId: 'taxation',
        children: [
          { label: 'GST Returns', path: '/taxation/gst' },
          { label: 'TDS Summary', path: '/taxation/tds' },
        ],
      },
      {
        label: 'Reports', icon: 'FileBarChart', moduleId: 'reporting',
        children: [
          { label: 'P&L Statement', path: '/reports/pl' },
          { label: 'Balance Sheet', path: '/reports/balance-sheet' },
          { label: 'Cash Flow',     path: '/reports/cash-flow' },
        ],
      },
    ],
  },
  {
    label: 'Intelligence',
    icon: 'Brain',
    items: [
      {
        label: 'AI Assistant', icon: 'Brain', moduleId: 'ai-engine',
        children: [
          { label: 'Ask Anything',     path: '/ai' },
          { label: 'Anomaly Detector', path: '/ai/anomalies' },
        ],
      },
    ],
  },
  {
    label: 'Admin',
    icon: 'Settings',
    items: [
      {
        label: 'Administration', icon: 'Settings',
        children: [
          { label: 'Overview',        path: '/admin' },
          { label: 'Users',           path: '/admin/users' },
          { label: 'Module Manager',  path: '/admin/modules' },
          { label: 'Audit Logs',      path: '/admin/audit-logs' },
          { label: 'Workflows',       path: '/admin/workflows' },
          { label: 'System Settings', path: '/admin/system-settings' },
        ],
      },
    ],
  },
];

// Auto-abbreviate a label into a short chip label (2–4 chars)
function abbr(label) {
  const words = label.split(/[\s\/\-&]+/).filter(Boolean);
  if (words.length === 1) return label.slice(0, 4).toUpperCase();
  if (words.length === 2) return (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase();
  return words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
}

function groupContainsPath(group, pathname) {
  for (const item of group.items) {
    if (item.path) {
      const hit = item.exact
        ? pathname === item.path
        : pathname === item.path || pathname.startsWith(item.path + '/');
      if (hit) return true;
    }
    if (item.children) {
      for (const c of item.children) {
        if (pathname === c.path || pathname.startsWith(c.path + '/')) return true;
      }
    }
  }
  return false;
}

// ─── Horizontal chip (sub-sub-head) ──────────────────────────────────────────
function SubChip({ item }) {
  return (
    <NavLink
      to={item.path}
      end
      title={item.label}
      className={({ isActive }) => `sb-chip${isActive ? ' sb-active' : ''}`}
    >
      {abbr(item.label)}
    </NavLink>
  );
}

// ─── Sub-head section: label row + horizontal chips ───────────────────────────
function SubHead({ item }) {
  const { isModuleEnabled } = useModuleStore();
  if (item.moduleId && !isModuleEnabled(item.moduleId)) return null;

  const Icon = item.icon ? ICON_MAP[item.icon] : null;
  const hasChildren = !!(item.children?.length);

  // Leaf (no children): render as a full nav link
  if (!hasChildren) {
    return (
      <NavLink
        to={item.path}
        end={item.exact}
        className={({ isActive }) => `sb-link${isActive ? ' sb-active' : ''}`}
      >
        {Icon && <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {item.label}
        </span>
      </NavLink>
    );
  }

  // Parent: label + horizontal chips row
  return (
    <div style={{ marginBottom: 10 }}>
      {/* Sub-head label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 8px 3px',
        color: C.text, fontSize: 12, fontWeight: 600,
      }}>
        {Icon && (
          <Icon style={{ width: 13, height: 13, flexShrink: 0, opacity: 0.8 }} />
        )}
        <span style={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {item.label}
        </span>
      </div>

      {/* Horizontal chip row */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 4,
        padding: '2px 8px 2px',
      }}>
        {item.children.map(child => (
          <SubChip key={child.path} item={child} />
        ))}
      </div>
    </div>
  );
}

// ─── Logo mark (shared) ───────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      backgroundColor: 'rgba(255,247,230,0.15)',
      border: '1px solid rgba(255,247,230,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontWeight: 700, fontSize: 14, color: C.bright }}>F</span>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({ collapsed = false }) {
  const location = useLocation();
  const { user } = useAuthStore();

  const [activeGroupIdx, setActiveGroupIdx] = useState(() => {
    for (let i = 0; i < NAV_GROUPS.length; i++) {
      if (groupContainsPath(NAV_GROUPS[i], location.pathname)) return i;
    }
    return 0;
  });

  useEffect(() => {
    for (let i = 0; i < NAV_GROUPS.length; i++) {
      if (groupContainsPath(NAV_GROUPS[i], location.pathname)) {
        setActiveGroupIdx(i);
        break;
      }
    }
  }, [location.pathname]);

  const activeGroup = NAV_GROUPS[activeGroupIdx];
  const userInitial = (user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const userName = user?.name || user?.email || '';
  const userRole = Array.isArray(user?.roles) ? user.roles[0] : user?.role || 'Staff';

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 56,
        backgroundColor: C.bg, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', zIndex: 30,
        fontFamily: "'Open Sans', system-ui, sans-serif",
      }}>
        <div style={{
          height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <LogoMark />
        </div>

        <nav style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '8px 0', gap: 4, overflowY: 'auto',
        }}>
          {NAV_GROUPS.map((group, gi) => {
            const GroupIcon = ICON_MAP[group.icon];
            const isActive = activeGroupIdx === gi;
            return (
              <button
                key={group.label}
                onClick={() => setActiveGroupIdx(gi)}
                title={group.label}
                className={`sb-tab${isActive ? ' sb-active' : ''}`}
              >
                {GroupIcon && <GroupIcon style={{ width: 18, height: 18 }} />}
              </button>
            );
          })}
        </nav>

        {user && (
          <div style={{
            padding: '12px 0', display: 'flex', justifyContent: 'center',
            borderTop: `1px solid ${C.border}`, flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: 'rgba(255,247,230,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title={userName}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.bright }}>
                {userInitial}
              </span>
            </div>
          </div>
        )}
      </aside>
    );
  }

  // ── Expanded: left icon strip + right sub-head panel ───────────────────────
  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, height: '100vh', width: 240,
      backgroundColor: C.bg, borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'row', zIndex: 30,
      fontFamily: "'Open Sans', system-ui, sans-serif",
    }}>

      {/* ── Left icon strip (56px, darker) ─────────────────────────── */}
      <div style={{
        width: 56, flexShrink: 0, height: '100%',
        backgroundColor: C.strip,
        borderRight: `1px solid ${C.divider}`,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{
          height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <LogoMark />
        </div>

        {/* Group tabs */}
        <nav style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '8px 0', gap: 4, overflowY: 'auto',
        }}>
          {NAV_GROUPS.map((group, gi) => {
            const GroupIcon = ICON_MAP[group.icon];
            const isActive = activeGroupIdx === gi;
            return (
              <button
                key={group.label}
                onClick={() => setActiveGroupIdx(gi)}
                title={group.label}
                className={`sb-tab${isActive ? ' sb-active' : ''}`}
              >
                {GroupIcon && <GroupIcon style={{ width: 17, height: 17 }} />}
              </button>
            );
          })}
        </nav>

        {/* User avatar */}
        {user && (
          <div style={{
            padding: '12px 0', display: 'flex', justifyContent: 'center',
            borderTop: `1px solid ${C.border}`, flexShrink: 0,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              backgroundColor: 'rgba(255,247,230,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title={userName}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.bright }}>
                {userInitial}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Right sub-head panel (184px) ────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Compact group label — flush to top, no large header gap */}
        <div style={{
          padding: '10px 10px 6px',
          borderBottom: `1px solid ${C.divider}`,
          flexShrink: 0,
        }}>
          <p style={{
            margin: 0, fontSize: 9.5, fontWeight: 800,
            color: 'rgba(255,247,230,0.38)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            {activeGroup.label}
          </p>
        </div>

        {/* Sub-head list with horizontal chips */}
        <nav style={{
          flex: 1, overflowY: 'auto', padding: '8px 2px 8px',
        }}>
          {activeGroup.items.map(item => (
            <SubHead key={item.label} item={item} />
          ))}
        </nav>

        {/* User info footer */}
        {user && (
          <div style={{
            padding: '8px 10px', borderTop: `1px solid ${C.border}`, flexShrink: 0,
          }}>
            <p style={{
              margin: 0, fontSize: 12, fontWeight: 600, color: C.bright,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}>
              {userName}
            </p>
            <p style={{
              margin: '2px 0 0', fontSize: 10.5,
              color: 'rgba(255,247,230,0.38)',
              textTransform: 'capitalize',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}>
              {userRole}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
