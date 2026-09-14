export const COMPLAINT_WORKFLOW_STATUSES = [
  { value: 'submitted', label: 'Generated', column: 'generated' },
  { value: 'under_investigation', label: 'Under Investigation', column: 'investigation' },
  { value: 'resolved', label: 'Resolved', column: 'resolved' },
  { value: 'dismissed', label: 'Dismissed', column: 'resolved' },
  { value: 'closed', label: 'Closed', column: 'resolved' },
];

export const BOARD_COLUMNS = [
  { key: 'submitted', label: 'Generated', status: 'submitted' },
  { key: 'under_investigation', label: 'Under Investigation', status: 'under_investigation' },
  { key: 'resolved', label: 'Resolved', status: 'resolved', includes: ['resolved', 'dismissed', 'closed'] },
];

export const COMPLAINT_CATEGORIES = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'misconduct', label: 'Misconduct' },
  { value: 'corruption', label: 'Corruption' },
  { value: 'discrimination', label: 'Discrimination' },
  { value: 'negligence', label: 'Negligence' },
  { value: 'service_failure', label: 'Service Failure' },
  { value: 'behavior', label: 'Behavior / Conduct' },
  { value: 'workplace_safety', label: 'Workplace Safety' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'other', label: 'Other (custom)' },
];

export const DEPARTMENT_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'program', label: 'Program' },
  { value: 'store', label: 'Store' },
  { value: 'procurements', label: 'Procurements' },
  { value: 'accounts_and_finance', label: 'Accounts & Finance' },
  { value: 'fund_raising', label: 'Fund Raising' },
  { value: 'it', label: 'IT' },
  { value: 'hr', label: 'HR' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'audio_video', label: 'Audio Video' },
  { value: 'meal', label: 'Meal' },
  { value: 'health', label: 'Health' },
  { value: 'ceo_office', label: 'CEO Office' },
];

export function getCategoryLabel(value, custom) {
  if (!value) return '—';
  if (value === 'other' && custom) return custom;
  return COMPLAINT_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function getStatusLabel(value) {
  return COMPLAINT_WORKFLOW_STATUSES.find((s) => s.value === value)?.label || value;
}

export function getDepartmentLabel(value) {
  return DEPARTMENT_OPTIONS.find((d) => d.value === value)?.label || value || '—';
}

export function formatComplaintCode(code) {
  return String(code || '').trim().toUpperCase();
}
