'use strict';

/**
 * Attribute-Based Access Control (ABAC) Middleware
 *
 * Extends RBAC with fine-grained, context-aware access control.
 * Rules are evaluated based on: subject (user), resource, action, environment.
 *
 * Example policies:
 *   - Accountant can only edit journals for their own branch
 *   - Billing staff can only access invoices from today
 *   - Department head can approve PRs only for their department
 */

/**
 * ABAC Policy evaluator factory.
 *
 * @param {Function} policyFn - async (req, resource) => boolean
 * @param {Function} [resourceLoader] - async (req) => resource
 */
function abacPolicy(policyFn, resourceLoader = null) {
  return async (req, res, next) => {
    try {
      let resource = null;
      if (resourceLoader) {
        resource = await resourceLoader(req);
        if (!resource) {
          return res.status(404).json({ success: false, error: 'Resource not found.' });
        }
      }

      const allowed = await policyFn(req, resource);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Access denied by policy.',
          code: 'ABAC_DENIED',
        });
      }

      if (resource) req.resource = resource;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── Common ABAC Policies ─────────────────────────────────────────────────────

/**
 * Branch isolation — user can only access records in their branch.
 */
const branchIsolation = abacPolicy(async (req, resource) => {
  const user = req.user;
  if (!user) return false;
  if (user.roles.includes('admin') || user.roles.includes('cfo') || user.roles.includes('auditor')) return true;

  const userBranch = user.branchId;
  if (!userBranch) return true; // No branch restriction for users without branch

  const resourceBranch = resource?.branch_id || req.query.branchId || req.body?.branchId;
  if (!resourceBranch) return true; // No branch on resource — allow

  return userBranch === resourceBranch;
});

/**
 * Department isolation.
 */
const departmentIsolation = abacPolicy(async (req, resource) => {
  const user = req.user;
  if (!user) return false;
  if (user.roles.includes('admin') || user.roles.includes('cfo')) return true;

  const userDept = user.departmentId;
  if (!userDept) return true;

  const resourceDept = resource?.department_id || req.query.departmentId;
  if (!resourceDept) return true;

  return userDept === resourceDept;
});

/**
 * Own records only — user can only access their own records.
 */
function ownRecordOnly(userIdField = 'created_by') {
  return abacPolicy(async (req, resource) => {
    const user = req.user;
    if (!user) return false;
    if (user.roles.includes('admin') || user.roles.includes('cfo') || user.roles.includes('auditor')) return true;

    if (!resource) return true;
    return resource[userIdField] === user.id;
  });
}

/**
 * Amount-based policy — restrict high-value actions to senior roles.
 */
function amountPolicy(field, maxAmount, allowedRoles) {
  return abacPolicy(async (req, resource) => {
    const user = req.user;
    if (!user) return false;

    const amount = parseFloat(req.body?.[field] || resource?.[field] || 0);
    if (amount <= maxAmount) return true;

    return allowedRoles.some((role) => user.roles.includes(role));
  });
}

module.exports = {
  abacPolicy,
  branchIsolation,
  departmentIsolation,
  ownRecordOnly,
  amountPolicy,
};
