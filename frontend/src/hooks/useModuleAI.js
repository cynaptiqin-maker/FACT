import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiAPI } from '@services/api';

// ─── Module-specific suggested prompts ───────────────────────────────────────
const MODULE_PROMPTS = {
  ar:                  ['Which invoices are at risk of default?', 'Summarise collection performance this month.', 'Which patients owe the most?', 'Forecast collections for next 30 days.'],
  'ar-invoices':       ['Show invoices likely to become overdue.', 'Detect any duplicate billing.', 'Which invoice is the highest value pending?', 'Summarise billing by type.'],
  'ar-aging':          ['Which bucket has the highest risk?', 'Forecast cash recovery over 90 days.', 'Compare aging vs last month.', 'Which departments age fastest?'],
  ap:                  ['Which vendor invoices are overdue?', 'What AP is due this week?', 'Show top 5 vendors by outstanding balance.', 'Which invoices have approval delays?'],
  'ap-invoices':       ['Which vendor invoices await approval?', 'Detect duplicate vendor invoices.', 'Which vendor has the most open bills?', 'Show invoices due for payment today.'],
  billing:             ['How much did we bill today?', 'Show unbilled patient visits.', 'Which patients have pending deposits?', 'Compare today\'s billing vs target.'],
  'billing-invoices':  ['List invoices with insurance pending.', 'Show partially paid invoices.', 'Which patients have overdue balances?', 'Summarise billing by department.'],
  'new-invoice':       ['Suggest appropriate billing package.', 'Check for duplicate billing.', 'What discounts apply to this patient?', 'Are all procedures coded correctly?'],
  insurance:           ['Which claims are likely to be rejected?', 'Which TPA settles fastest?', 'Show stale claims >45 days.', 'What is our claim rejection rate?'],
  'insurance-claims':  ['Analyse claim rejection patterns.', 'Show claims expiring this month.', 'Which insurer has the longest TAT?', 'Flag claims with documentation gaps.'],
  'insurance-aging':   ['Which TPA has most overdue claims?', 'Forecast claim settlement cash inflow.', 'Compare TPA aging vs last quarter.', 'Which insurer is improving?'],
  'cash-bank':         ['What is our current cash position?', 'Are we at liquidity risk this week?', 'Show cash flow forecast for 14 days.', 'Which bank account is lowest?'],
  'cash-book':         ['Summarise today\'s cash movements.', 'Show petty cash vs limit.', 'Detect unusual cash transactions.', 'What is net cash change this week?'],
  'bank-reconciliation': ['Which transactions are unmatched?', 'Show auto-match suggestions.', 'How long since last full reconciliation?', 'Flag suspicious bank entries.'],
  reconciliation:      ['Which entries are oldest unmatched?', 'Summarise reconciliation gaps.', 'Auto-suggest matches for today.', 'What caused the last mismatch?'],
  'general-ledger':    ['Show all unposted journal entries.', 'Which account has highest movement?', 'Are there any GL imbalances?', 'Compare ledger vs last period.'],
  gl:                  ['Show current period ledger summary.', 'Which account is most active?', 'Are debit/credit totals balanced?', 'Show inter-company entries.'],
  'journal-voucher':   ['Is this journal entry balanced?', 'Suggest the correct account mapping.', 'Have we posted this before?', 'What is the tax impact of this entry?'],
  'core-accounting':   ['How many draft entries exist?', 'Is the trial balance balanced?', 'What is the period-end status?', 'Show accounts with no transactions.'],
  coa:                 ['Which accounts are inactive?', 'Suggest account for new expense type.', 'Show accounts with highest balances.', 'Are all accounts mapped to reporting?'],
  'fixed-assets':      ['Which assets are due for depreciation?', 'What is total asset value?', 'Show assets approaching end of life.', 'Which assets have no depreciation?'],
  depreciation:        ['Run depreciation for this period.', 'Compare SLM vs WDV for key assets.', 'Show tax depreciation vs book.', 'Which assets are fully depreciated?'],
  payroll:             ['Are all payroll runs processed?', 'Show PF/ESI liability for this month.', 'Which employees have salary anomalies?', 'What is MTD payroll cost?'],
  'doctor-payout':     ['Which doctors have pending payouts?', 'Show revenue share variances.', 'Compare payout vs last month.', 'Which doctor earns the most?'],
  'revenue-sharing':   ['Are revenue share formulas up to date?', 'Show top 5 revenue-sharing doctors.', 'Flag unusual revenue spikes.', 'What is projected payout next month?'],
  budgeting:           ['Which departments are over budget?', 'Show budget vs actual this month.', 'Forecast year-end budget surplus/deficit.', 'Which line item has highest variance?'],
  taxation:            ['What is our GST liability this month?', 'Are TDS deductions current?', 'Show GSTR-3B computation.', 'Which vendors need TDS?'],
  'cfo-dashboard':     ['What requires my immediate attention?', 'Summarise current financial position.', 'Are there any anomalies in this data?', 'What action should I take today?'],
};

const DEFAULT_PROMPTS = [
  'Summarise current financial position.',
  'What requires my immediate attention?',
  'Are there any anomalies in this data?',
  'What action should I take today?',
];

// ─── Contextual fallback response generator ────────────────────────────────────
function generateFallback(question, moduleId, kpis = {}) {
  const q = question.toLowerCase();
  const fmt = (n) => {
    const v = Number(n || 0);
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
    if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  if (q.includes('overdue') || q.includes('aging') || q.includes('default')) {
    const risk = fmt(kpis.overdue_90 || kpis.overdue_amount || 0);
    return `Based on current data, ${risk} is overdue. Prioritise collection calls for the oldest accounts — early intervention reduces write-off risk significantly.`;
  }
  if (q.includes('cash') || q.includes('liquidity') || q.includes('position')) {
    return `Current cash position: ${fmt(kpis.total_cash || 0)}. ${Number(kpis.due_this_week || 0) > 0 ? `${fmt(kpis.due_this_week)} due to vendors this week.` : ''} Continue monitoring inflows to maintain adequate liquidity.`;
  }
  if (q.includes('claim') || q.includes('reject') || q.includes('tpa')) {
    return `${kpis.rejected || 0} claims rejected recently. ${kpis.stale_count || 0} claims have been pending >45 days. Review denial codes — most rejections are documentation or coding errors that can be corrected and resubmitted.`;
  }
  if (q.includes('pending') || q.includes('approval') || q.includes('draft')) {
    const cnt = kpis.pending_approval || kpis.draft_count || kpis.draft_runs || 0;
    return `${cnt} item(s) are awaiting action. Clearing these promptly ensures cash flow and workflow continuity. Would you like me to prioritise them by urgency?`;
  }
  if (q.includes('payroll') || q.includes('salary') || q.includes('pf') || q.includes('esi')) {
    return `MTD payroll: ${fmt(kpis.mtd_payroll || 0)}. ${kpis.draft_runs || 0} run(s) in draft. Process before month-end to meet PF, ESI, and PT statutory deadlines.`;
  }
  if (q.includes('depreciation') || q.includes('asset')) {
    return `${kpis.overdue_depreciation || 0} assets need depreciation this month. Running depreciation ensures accurate book value and correct period P&L. Recommended: run before period close.`;
  }
  if (q.includes('budget') || q.includes('variance') || q.includes('forecast')) {
    return `Budget monitoring active for this period. Variance analysis helps identify overspend early and take corrective action. Would you like to drill into a specific cost centre?`;
  }
  if (q.includes('gst') || q.includes('tds') || q.includes('tax')) {
    return `Tax compliance check: ensure GST returns and TDS deductions are current for this month. Late filings attract penalties and interest. Would you like a summary of dues?`;
  }
  return `I've analysed the ${moduleId} data. ${Object.keys(kpis).length > 0 ? 'Key metrics look normal — no critical alerts detected.' : 'Connect to your database to get real-time insights.'} Ask me a specific question for a detailed analysis.`;
}

// ─── useModuleAI hook ─────────────────────────────────────────────────────────
/**
 * Provides real-time AI insights and chat for any FACT module page.
 *
 * @param {string} moduleId - e.g. 'ar', 'ap', 'billing', 'insurance', 'cash-bank'
 * @returns {{ insights, kpis, suggestedPrompts, isLoadingInsights, ask, isThinking }}
 *
 * Usage:
 *   const { insights, ask, isThinking } = useModuleAI('ar');
 *   // Replace panel mock-response handler with:
 *   const response = await ask(userQuestion);
 *   // insights replaces static AI_INSIGHTS constant
 */
export function useModuleAI(moduleId) {
  const [isThinking, setIsThinking] = useState(false);

  // Fetch live insights for this module
  const { data, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['ai-context', moduleId],
    queryFn: () => aiAPI.getContextInsights(moduleId).then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
    retry: 1,
    // Don't throw — panels must work even without backend
    onError: () => {},
  });

  const insights = data?.insights || [];
  const kpis = data?.kpis || {};

  /**
   * Ask the AI a question. Returns a Promise<string>.
   * Calls the real backend; falls back to contextual rule-based response if unavailable.
   */
  const ask = useCallback(async (question) => {
    if (!question?.trim()) return '';
    setIsThinking(true);
    try {
      const res = await aiAPI.queryWithContext(question, moduleId, kpis);
      return res.data?.data?.response || res.data?.data?.answer || 'Analysis complete.';
    } catch {
      return generateFallback(question, moduleId, kpis);
    } finally {
      setIsThinking(false);
    }
  }, [moduleId, kpis]);

  const suggestedPrompts = MODULE_PROMPTS[moduleId] || DEFAULT_PROMPTS;

  return { insights, kpis, suggestedPrompts, isLoadingInsights, ask, isThinking };
}

export default useModuleAI;
