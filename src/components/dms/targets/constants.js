export const TARGET_TYPES = [
  { value: 'donation_amount', label: 'Donation Amount' },
  { value: 'donation_box_collection', label: 'Donation Box Collection Amount' },
];

export const targetTypeLabel = (value) =>
  TARGET_TYPES.find((t) => t.value === value)?.label || value || '—';

export const TARGET_PERIOD_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'six_months', label: 'Six months' },
  { value: 'yearly', label: 'Complete yearly' },
];

export const targetPeriodTypeLabel = (value) =>
  TARGET_PERIOD_TYPES.find((type) => type.value === value)?.label ||
  value ||
  'Monthly';

export const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const monthLabel = (m) =>
  MONTH_OPTIONS.find((o) => o.value === Number(m))?.label || String(m || '—');

export const periodStartOptions = (type) => {
  if (type === 'quarterly') {
    return [
      { value: 1, label: 'Q1 · January–March' },
      { value: 4, label: 'Q2 · April–June' },
      { value: 7, label: 'Q3 · July–September' },
      { value: 10, label: 'Q4 · October–December' },
    ];
  }
  if (type === 'six_months') {
    return [
      { value: 1, label: 'First half · January–June' },
      { value: 7, label: 'Second half · July–December' },
    ];
  }
  if (type === 'yearly') return [{ value: 1, label: 'January–December' }];
  return MONTH_OPTIONS;
};

export const formatTargetPeriod = (target) => {
  if (target?.period_start && target?.period_end) {
    const format = (value) =>
      new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString(
        'en-US',
        { month: 'short', year: 'numeric' },
      );
    return `${format(target.period_start)} – ${format(target.period_end)}`;
  }
  return `${monthLabel(target?.period_month)} ${target?.period_year || ''}`.trim();
};

export const formatTargetAmount = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return `PKR ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

export const userDisplayName = (user) => {
  if (!user) return '—';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return name || user.email || `User #${user.id}`;
};
