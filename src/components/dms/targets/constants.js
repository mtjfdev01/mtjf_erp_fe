export const TARGET_TYPES = [
  { value: 'donation_amount', label: 'Donation Amount' },
  { value: 'donation_box_collection', label: 'Donation Box Collection Amount' },
];

export const targetTypeLabel = (value) =>
  TARGET_TYPES.find((t) => t.value === value)?.label || value || '—';

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
