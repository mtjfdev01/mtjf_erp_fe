export const ORGANIZATION_OPTIONS = [
  { value: 'mtj_foundation', label: 'MTJ Foundation' },
  { value: 'aslab', label: 'Aslab' },
  { value: 'education_system', label: 'Education System' },
];

export const COMPLAINANT_TYPE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'patient', label: 'Patient' },
  { value: 'visitor', label: 'Visitor' },
];

export const CATEGORY_OPTIONS = [
  { value: 'staff_behavior', label: 'Staff behaviour' },
  { value: 'report_delay', label: 'Report delay' },
  { value: 'test_quality', label: 'Test quality' },
  { value: 'wrong_test_billing', label: 'Wrong test billing' },
  { value: 'overcharging', label: 'Overcharging' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'system_software', label: 'System or software' },
  { value: 'other', label: 'Other' },
];

export const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export const ASLAB_BRANCH_OPTIONS = [
  { value: 'lahore', label: 'Lahore' },
  { value: 'multan', label: 'Multan' },
  { value: 'bahawalpur', label: 'Bahawalpur' },
  { value: 'rahim_yar_khan', label: 'Rahim Yar Khan' },
  { value: 'sahiwal', label: 'Sahiwal' },
  { value: 'faisalabad', label: 'Faisalabad' },
  { value: 'sargodha', label: 'Sargodha' },
  { value: 'gujranwala', label: 'Gujranwala' },
  { value: 'sialkot', label: 'Sialkot' },
  { value: 'rawalpindi', label: 'Rawalpindi' },
  { value: 'islamabad', label: 'Islamabad' },
  { value: 'other', label: 'Other' },
];

export const labelFor = (options, value) => {
  if (!value) return '-';
  const hit = options.find((o) => o.value === value);
  return hit?.label || String(value).replace(/_/g, ' ');
};
