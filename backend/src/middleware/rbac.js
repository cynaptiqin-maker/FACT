'use strict';

/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Permission matrix per role.
 * Each module defines its own granular permissions.
 */

// ─── Permission Constants ─────────────────────────────────────────────────────
const PERMISSIONS = {
  // Core Accounting
  'accounting:read': ['admin', 'accountant', 'cfo', 'auditor', 'billing_staff'],
  'accounting:write': ['admin', 'accountant', 'cfo'],
  'accounting:post': ['admin', 'accountant', 'cfo'],
  'accounting:reverse': ['admin', 'cfo'],
  'accounting:period:lock': ['admin', 'cfo'],
  'accounting:fiscal:close': ['admin', 'cfo'],

  // Patient Billing
  'billing:read': ['admin', 'accountant', 'cfo', 'billing_staff', 'receptionist', 'auditor'],
  'billing:write': ['admin', 'accountant', 'billing_staff', 'receptionist'],
  'billing:finalize': ['admin', 'accountant', 'billing_staff'],
  'billing:cancel': ['admin', 'accountant', 'cfo'],
  'billing:discount': ['admin', 'cfo', 'accountant'],
  'billing:refund': ['admin', 'cfo'],

  // Insurance
  'insurance:read': ['admin', 'accountant', 'cfo', 'billing_staff', 'insurance_staff'],
  'insurance:write': ['admin', 'accountant', 'insurance_staff'],
  'insurance:settle': ['admin', 'cfo', 'accountant'],

  // Payroll
  'payroll:read': ['admin', 'hr', 'cfo', 'accountant'],
  'payroll:write': ['admin', 'hr'],
  'payroll:run': ['admin', 'hr', 'cfo'],
  'payroll:approve': ['admin', 'cfo'],
  'payroll:post': ['admin', 'cfo', 'accountant'],
  'payroll:payslip:read': ['admin', 'hr', 'cfo', 'employee'], // own payslips

  // Doctor Payout
  'doctor-payout:read': ['admin', 'cfo', 'accountant', 'hr'],
  'doctor-payout:write': ['admin', 'cfo'],
  'doctor-payout:approve': ['admin', 'cfo'],

  // Fixed Assets
  'assets:read': ['admin', 'cfo', 'accountant', 'auditor'],
  'assets:write': ['admin', 'accountant'],
  'assets:depreciate': ['admin', 'cfo', 'accountant'],
  'assets:dispose': ['admin', 'cfo'],

  // Procurement
  'procurement:read': ['admin', 'cfo', 'accountant', 'purchase_manager', 'store_keeper'],
  'procurement:pr:write': ['admin', 'purchase_manager', 'store_keeper', 'department_head'],
  'procurement:po:write': ['admin', 'purchase_manager'],
  'procurement:po:approve': ['admin', 'purchase_manager', 'cfo'],
  'procurement:grn:write': ['admin', 'store_keeper'],

  // Reporting
  'reports:read': ['admin', 'cfo', 'accountant', 'auditor'],
  'reports:financial': ['admin', 'cfo', 'auditor'],
  'reports:export': ['admin', 'cfo', 'accountant', 'auditor'],
  'reports:tax': ['admin', 'cfo', 'accountant'],

  // Taxation
  'taxation:read': ['admin', 'cfo', 'accountant', 'auditor'],
  'taxation:write': ['admin', 'accountant'],
  'taxation:file': ['admin', 'cfo'],

  // Budgeting
  'budgeting:read': ['admin', 'cfo', 'accountant', 'department_head'],
  'budgeting:write': ['admin', 'cfo'],
  'budgeting:approve': ['admin', 'cfo'],

  // Admin
  'admin:users': ['admin'],
  'admin:roles': ['admin'],
  'admin:modules': ['admin'],
  'admin:tenant': ['admin'],
  'admin:audit': ['admin', 'auditor'],

  // Accounts Payable
  'ap:read':    ['admin', 'accountant', 'cfo', 'auditor', 'purchase_manager'],
  'ap:write':   ['admin', 'accountant', 'cfo', 'purchase_manager'],
  'ap:approve': ['admin', 'cfo', 'purchase_manager'],
  'ap:post':    ['admin', 'accountant', 'cfo'],
  'ap:pay':     ['admin', 'cfo', 'accountant'],
  'ap:reverse': ['admin', 'cfo'],

  // AI
  'ai:query': ['admin', 'cfo', 'accountant'],
};

/**
 * Role hierarchy (higher roles inherit lower role permissions).
 */
const ROLE_HIERARCHY = {
  admin: ['admin', 'cfo', 'accountant', 'hr', 'billing_staff', 'insurance_staff', 'purchase_manager', 'auditor', 'store_keeper', 'receptionist', 'employee'],
  cfo: ['cfo', 'accountant', 'auditor'],
  accountant: ['accountant'],
  hr: ['hr'],
  billing_staff: ['billing_staff', 'receptionist'],
  insurance_staff: ['insurance_staff'],
  purchase_manager: ['purchase_manager', 'store_keeper'],
  auditor: ['auditor'],
  store_keeper: ['store_keeper'],
  receptionist: ['receptionist'],
  employee: ['employee'],
  department_head: ['department_head'],
};

/**
 * Check if a user has a specific permission.
 */
function hasPermission(userRoles, permission) {
  if (!PERMISSIONS[permission]) {
    // Unknown permission — deny by default
    return false;
  }

  const allowedRoles = PERMISSIONS[permission];

  // Check direct role match or hierarchy
  for (const userRole of userRoles) {
    const expandedRoles = ROLE_HIERARCHY[userRole] || [userRole];
    if (expandedRoles.some((r) => allowedRoles.includes(r))) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user has any of the specified roles.
 */
function hasRole(userRoles, ...requiredRoles) {
  if (!userRoles || userRoles.length === 0) return false;
  return requiredRoles.some((role) => {
    for (const userRole of userRoles) {
      const expanded = ROLE_HIERARCHY[userRole] || [userRole];
      if (expanded.includes(role)) return true;
    }
    return false;
  });
}

/**
 * RBAC middleware factory — checks if user has required permission.
 *
 * @param {string|string[]} permissions - Required permission(s)
 * @param {string} [operator='AND'] - 'AND' requires all permissions, 'OR' requires any
 */
function requirePermission(permissions, operator = 'OR') {
  const permList = Array.isArray(permissions) ? permissions : [permissions];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const userRoles = req.user.roles || [];
    const userPermissions = req.user.permissions || [];

    // Admin bypass
    if (userRoles.includes('admin')) return next();

    let allowed;
    if (operator === 'AND') {
      allowed = permList.every(
        (p) => hasPermission(userRoles, p) || userPermissions.includes(p)
      );
    } else {
      allowed = permList.some(
        (p) => hasPermission(userRoles, p) || userPermissions.includes(p)
      );
    }

    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions.',
        required: permList,
        userRoles,
      });
    }

    next();
  };
}

/**
 * Role middleware — checks if user has any of the specified roles.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (hasRole(req.user.roles, ...roles)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access denied. Insufficient role.',
      required: roles,
      current: req.user.roles,
    });
  };
}

module.exports = {
  requirePermission,
  requireRole,
  hasPermission,
  hasRole,
  PERMISSIONS,
  ROLE_HIERARCHY,
};
