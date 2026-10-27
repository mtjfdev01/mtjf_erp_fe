export const AID_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'manager_review', label: 'Manager Review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'ceo_approval_required', label: 'CEO approval required' },
  { value: 'successful', label: 'Successful' },
  { value: 'delivered', label: 'Delivered' },
];

/** Data-entry list pipeline cards (maps to API `stage` filter). Drafts use the Drafts board. */
export const AID_ENTRY_STAGES = [
  { id: 'incomplete', label: 'Incomplete', hint: 'Missing details' },
  { id: 'submitted', label: 'Submitted', hint: 'Awaiting investigator' },
  { id: 'investigation', label: 'Investigation', hint: 'Field visit due' },
  { id: 'manager_review', label: 'Manager Review', hint: 'With Program manager' },
  { id: 'pending_approval', label: 'Pending approval', hint: 'With committee' },
  { id: 'approved', label: 'Approved', hint: 'This month' },
  { id: 'returned', label: 'Returned', hint: 'Need correction' },
];

export function formatAidEntryStage(stage) {
  return AID_ENTRY_STAGES.find((s) => s.id === stage)?.label || stage || '—';
}

export function aidEntryStageTone(stage) {
  switch (stage) {
    case 'draft':
      return 'muted';
    case 'incomplete':
      return 'warn';
    case 'submitted':
      return 'info';
    case 'investigation':
      return 'warn';
    case 'manager_review':
      return 'warn';
    case 'pending_approval':
      return 'purple';
    case 'approved':
      return 'success';
    case 'returned':
      return 'danger';
    default:
      return 'muted';
  }
}

export function formatRelativeAidTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} d ago`;
  return d.toLocaleDateString();
}

export const AID_REQUEST_TYPES = [
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'ration', label: 'Ration' },
  { value: 'marriage_gift', label: 'Marriage Gift' },
  { value: 'financial_assistance', label: 'Financial Assistance' },
  { value: 'clean_water', label: 'Clean Water' },
  { value: 'apna_ghar', label: 'Apna Ghar' },
  { value: 'disaster_relief', label: 'Disaster Relief' },
  { value: 'kasb_skill_development', label: 'KASB Skill Development' },
  { value: 'seeds_of_change', label: 'Seeds of Change' },
  { value: 'aas_lab_diagnostics', label: 'AAS Lab & Diagnostics' },
  { value: 'community_services', label: 'Community Services' },
  { value: 'other', label: 'Other' },
];

/**
 * SubProgram catalog (project rates) — Expected Amount by Program + SubProgram.
 * Stored as aid_program under requested_aid_type (Program). amount / amount_max in PKR.
 */
export const AID_PROGRAMS = [
  {
    value: 'health_patient_care',
    aid_type: 'health',
    label: 'Patient Care Initiative',
    uom: 'Per Patient',
    amount: 10000,
    zakat: true,
    general: true,
    narration:
      'Includes consultancy fees, diagnostic tests, and the cost of medicines.',
  },
  {
    value: 'health_medical_support',
    aid_type: 'health',
    label: 'Medical Support Initiative',
    uom: 'Per Beneficiary',
    amount: 40000,
    zakat: true,
    general: true,
    narration:
      'Provides direct financial assistance for essential surgical procedures, paid straight to partner hospitals.',
  },
  {
    value: 'health_pwd_rehab',
    aid_type: 'health',
    label: 'Rehabilitation of PWDs',
    uom: 'Per Beneficiary',
    amount: 20000,
    zakat: true,
    general: true,
    narration:
      'Focuses on restoring independence/mobility by providing wheelchairs, crutches, walkers, etc.',
  },
  {
    value: 'education_scholarship',
    aid_type: 'education',
    label: 'Scholarship',
    uom: 'Per Student / Per Month',
    amount: 15000,
    zakat: true,
    general: true,
    narration:
      'Encompasses tuition fees, accommodation, food, and stationery costs.',
  },
  {
    value: 'education_dream_school',
    aid_type: 'education',
    label: 'Dream School',
    uom: 'Per School / Per Month',
    amount: 35000,
    zakat: true,
    general: true,
    narration:
      'Supports a school accommodating 40 students with a complete package (books, uniforms, shoes, etc.).',
  },
  {
    value: 'education_hafiz',
    aid_type: 'education',
    label: 'For Hafiz',
    uom: 'Per Student / Per Month',
    amount: 5000,
    zakat: true,
    general: true,
    narration:
      "Includes teacher's salary, operational expenses, and other essential costs.",
  },
  {
    value: 'education_alim',
    aid_type: 'education',
    label: 'For Alim',
    uom: 'Per Student / Per Month',
    amount: 18000,
    zakat: true,
    general: true,
    narration: 'Encompasses fees, boarding/lodging, and food expenses.',
  },
  {
    value: 'clean_water_hand_pump',
    aid_type: 'clean_water',
    label: 'Hand Pump',
    uom: 'Per Unit',
    amount: 70000,
    amount_max: 90000,
    zakat: true,
    general: true,
    narration:
      'Projects involving hand pumps cater to varying depths of water levels.',
  },
  {
    value: 'clean_water_afridev',
    aid_type: 'clean_water',
    label: 'Afridev Community Hand Pump',
    uom: 'Per Unit',
    amount: 125000,
    zakat: false,
    general: true,
    narration:
      'Recommended for areas with low water levels; designed for shallow depths.',
  },
  {
    value: 'clean_water_filtration_no_civil',
    aid_type: 'clean_water',
    label: 'Filtration Plant (without construction)',
    uom: 'Per Unit',
    amount: 1500000,
    zakat: false,
    general: true,
    narration:
      'RO filtration plant with community participation; excludes civil construction.',
  },
  {
    value: 'clean_water_filtration_full',
    aid_type: 'clean_water',
    label: 'Filtration Plant',
    uom: 'Per Unit',
    amount: 2500000,
    zakat: false,
    general: true,
    narration:
      'Solarized RO filtration plant including solar system, equipment, and civil construction.',
  },
  {
    value: 'clean_water_solar_submersible',
    aid_type: 'clean_water',
    label: 'Solar Submersible Pump',
    uom: 'Per Unit',
    amount: 250000,
    zakat: false,
    general: true,
    narration:
      'Plains: borehole, submersible pump, 4 solar panels, and water tanks.',
  },
  {
    value: 'clean_water_solar_turbine',
    aid_type: 'clean_water',
    label: 'Solar Submersible Pump / Turbine',
    uom: 'Per Unit',
    amount: 500000,
    zakat: false,
    general: true,
    narration:
      'Desert: borehole, pump/turbine, room, 8 solar panels, and water tanks.',
  },
  {
    value: 'kasb_empowering_woman',
    aid_type: 'kasb_skill_development',
    label: 'Empowering a Woman',
    uom: 'Per Beneficiary',
    amount: 100000,
    zakat: true,
    general: true,
    narration:
      'Recommended for woman-headed families to promote sustainable livelihoods.',
  },
  {
    value: 'marriage_gift_standard',
    aid_type: 'marriage_gift',
    label: 'Marriage Gift',
    uom: 'Per Beneficiary',
    amount: 150000,
    zakat: true,
    general: true,
    narration:
      'Support for deserving girls whose families cannot arrange marriage expenses.',
  },
  {
    value: 'ration_feed_family_month',
    aid_type: 'ration',
    label: 'Feed a Family for whole month',
    uom: 'Per Family',
    amount: 8500,
    zakat: true,
    general: true,
    narration:
      'Monthly ration of essential food items for deserving families.',
  },
];

export function getAidProgramsForType(aidType) {
  return AID_PROGRAMS.filter((p) => p.aid_type === aidType);
}

export function getAidProgram(programKey) {
  if (!programKey) return null;
  return AID_PROGRAMS.find((p) => p.value === programKey) || null;
}

/** Format PKR for display (e.g. 1500000 → "1,500,000"). */
export function formatPkrAmount(n) {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString('en-PK');
}

/** Expected amount label from catalog or stored min/max. */
export function formatExpectedAmount(programOrRow) {
  if (!programOrRow) return '—';
  const catalog =
    typeof programOrRow === 'string'
      ? getAidProgram(programOrRow)
      : programOrRow.aid_program
        ? getAidProgram(programOrRow.aid_program)
        : programOrRow;
  const min =
    catalog?.amount ??
    programOrRow.expected_amount ??
    programOrRow.amount ??
    null;
  const max =
    catalog?.amount_max ??
    programOrRow.expected_amount_max ??
    programOrRow.amount_max ??
    null;
  if (min == null && max == null) return '—';
  if (max != null && Number(max) !== Number(min)) {
    return `PKR ${formatPkrAmount(min)} – ${formatPkrAmount(max)}`;
  }
  return `PKR ${formatPkrAmount(min)}`;
}

export function formatAidProgramLabel(programKey) {
  const p = getAidProgram(programKey);
  return p?.label || programKey || '—';
}

/** Resolve expected amount fields when Program / SubProgram changes. */
export function resolveExpectedAmountFields(aidType, programKey) {
  const programs = getAidProgramsForType(aidType);
  let key = programKey || '';
  if (programs.length === 1) key = programs[0].value;
  if (key && !programs.some((p) => p.value === key)) key = '';
  const prog = getAidProgram(key);
  return {
    aid_program: prog?.value || '',
    expected_amount: prog?.amount ?? null,
    expected_amount_max: prog?.amount_max ?? null,
  };
}

/** Intake — how the case entered data entry. */
export const AID_CASE_SOURCES = [
  { value: 'walk_in', label: 'Walk-in at office' },
  { value: 'field_survey', label: 'Field survey' },
  { value: 'referral', label: 'Referral (donor / staff)' },
  { value: 'call_center', label: 'Call center' },
];

/** Education History — Class dropdown starting from Matric */
export const AID_EDUCATION_HISTORY_CLASSES = [
  { value: 'matric', label: 'Matric' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'mphil', label: 'MPhil' },
  { value: 'phd', label: 'PhD' },
  { value: 'other', label: 'Other' },
];

/** Scholarship — Current Degree starting from Intermediate */
export const AID_SCHOLARSHIP_DEGREES = [
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'mphil', label: 'MPhil' },
  { value: 'phd', label: 'PhD' },
  { value: 'other', label: 'Other' },
];

export const AID_SCHOLARSHIP_CLASS_MODES = [
  { value: 'annual', label: 'Annual' },
  { value: 'semester', label: 'Semester' },
];

export const emptyEducationHistoryRow = () => ({
  class_level: '',
  board_institute: '',
  year: '',
  marks_obtained: '',
  total_marks: '',
  percentage: '',
  attachment_url: '',
  attachment_name: '',
});

export const emptyScholarshipRow = () => ({
  current_degree: '',
  institute_name: '',
  city: '',
  annual_fee: '',
  start_date: '',
  end_date: '',
  total_years: '',
  class_mode: '',
});

export const emptyEducationDetails = () => ({
  education_history: [emptyEducationHistoryRow()],
  scholarships: [emptyScholarshipRow()],
  income_source_before: '',
  continue_education_if_not_approved: '',
});

export function calcEducationPercentage(obtained, total) {
  const o = Number(obtained);
  const t = Number(total);
  if (!Number.isFinite(o) || !Number.isFinite(t) || t <= 0) return '';
  return String(Math.round((o / t) * 10000) / 100);
}

/** Monthly Ration Program — Application tab special structure */
export const emptyRationDetails = () => ({
  persons_male: '',
  persons_female: '',
  persons_kids: '',
  family_had_wheat: '',
  wheat_quantity_kg: '',
  how_know_mtjf: '',
  ration_arrangements_before: '',
  support_years: '',
  support_months: '',
  alternative_if_not_approved: '',
});

/** Marriage Gift — default available item */
export const emptyMarriageGiftItem = (name = '') => ({ name });

/** Marriage Gift — Application tab special structure */
export const emptyMarriageGiftDetails = () => ({
  date_of_marriage: '',
  already_married_nikah: '',
  nikah_date: '',
  bride_groom_relationship: '',
  earlier_children_marriage_expenses: '',
  items: [emptyMarriageGiftItem('Paiti set')],
  others: '',
});

/** Financial Assistance — Financial Condition section */
export const emptyFinancialAssistanceDetails = () => ({
  monthly_household_income: '',
  income_source: '',
  monthly_expenses: '',
  earning_members: '',
  dependent_members: '',
  has_loans: '',
  loan_amount: '',
  loan_details: '',
  amount_requested: '',
  support_months: '',
  purpose: '',
  how_managed_so_far: '',
  alternative_if_not_approved: '',
});

/** Clean Water survey beneficiary row */
export const emptyCleanWaterSurveyBeneficiary = () => ({
  name: '',
  phone: '',
  cnic: '',
  family_members: '',
});

/**
 * Clean Water / Water Program survey (EN/UR).
 * No signature capture — paper form fields only.
 */
export const emptyCleanWaterDetails = () => ({
  lang: 'ur',
  application_no: '',
  applicant_name: '',
  village: '',
  union_council: '',
  tehsil_district: '',
  province: '',
  gps_coordinates: '',
  area_type: '',
  tds_ppm: '',
  beneficiary_population: '',
  beneficiary_households: '',
  water_problems: '',
  drainage_plan: '',
  project_name: '',
  water_level_ft: '',
  boring_depth_ft: '',
  machine_pipe_length_ft: '',
  construction_by: '',
  survey_beneficiaries: [
    emptyCleanWaterSurveyBeneficiary(),
    emptyCleanWaterSurveyBeneficiary(),
    emptyCleanWaterSurveyBeneficiary(),
  ],
  /** Legacy Application-tab fields (kept for older rows) */
  existing_source_of_water: '',
  distance_from_home: '',
  duration_without_clean_water: '',
  location_of_project: '',
  community_contribution_amount: '',
});

/** Zakat Permission Letter — religion options */
export const AID_ZAKAT_RELIGIONS = [
  { value: 'muslim', label: 'Muslim' },
  { value: 'christian', label: 'Christian' },
  { value: 'hindu', label: 'Hindu' },
  { value: 'sikh', label: 'Sikh' },
  { value: 'other', label: 'Other' },
];

/** Zakat Permission Letter — assets / eligibility (all applications) */
export const emptyZakatPermission = () => ({
  form_date: '',
  application_no: '',
  applicant_name: '',
  age: '',
  education: '',
  religion: 'muslim',
  cnic: '',
  phone: '',
  gold: '',
  silver: '',
  cash: '',
  commercial_goods: '',
  surplus_items: '',
  loan: '',
  zakat_eligible: '',
  declaration_accepted: false,
  /** SecuGen thumb capture — null until device capture succeeds */
  applicant_thumb: null,
  /** ePad VP9801 signature — null until device capture succeeds */
  applicant_signature: null,
  lang: 'ur',
});

export function calcZakatAssetTotal(details) {
  const d = details || {};
  const keys = ['gold', 'silver', 'cash', 'commercial_goods', 'surplus_items'];
  return keys.reduce((sum, k) => {
    const n = Number(d[k]);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export function calcZakatNetAfterLoan(details) {
  const total = calcZakatAssetTotal(details);
  const loan = Number(details?.loan);
  const loanAmt = Number.isFinite(loan) ? loan : 0;
  return Math.max(0, total - loanAmt);
}

/** Media / donor Consent Form (کنسنٹ فارم) — all applications */
export const emptyConsentForm = () => ({
  form_date: '',
  application_no: '',
  full_name: '',
  parentage_or_spouse: '',
  cnic: '',
  sector: '',
  consent_accepted: false,
  applicant_thumb: null,
  applicant_signature: null,
  lang: 'ur',
});

export const AID_WRITER_RELATIONS = [
  { value: 'self', label: 'Self (beneficiary)' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'relative', label: 'Relative' },
  { value: 'other', label: 'Other' },
];

export const AID_MARITAL_STATUS = [
  { value: 'single', label: 'Single', labelUr: 'غیر شادی شدہ' },
  { value: 'engaged', label: 'Engaged', labelUr: 'منگنی' },
  { value: 'married', label: 'Married', labelUr: 'شادی شدہ' },
  { value: 'widow', label: 'Widow', labelUr: 'بیوہ' },
  { value: 'widower', label: 'Widower', labelUr: 'بیوہ مرد' },
  { value: 'divorced', label: 'Divorced', labelUr: 'مطلقہ' },
  { value: 'separated', label: 'Separated', labelUr: 'علیحدہ' },
  { value: 'khula', label: 'Khula', labelUr: 'خلع' },
  { value: 'abandoned', label: 'Abandoned', labelUr: 'متروکہ' },
];

/** Legacy stored values → display label (kept for older records). */
const AID_MARITAL_STATUS_LEGACY = {
  widowed: 'Widow',
};

/** Beneficiary vulnerability categories */
export const AID_VULNERABILITIES = [
  { value: 'poor', label: 'Poor' },
  { value: 'extreme_poor', label: 'Extreme Poor' },
  { value: 'widow', label: 'Widow' },
  { value: 'widows', label: 'Widows' },
  { value: 'widower', label: 'Widower' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'divorced_women', label: 'Divorced Women' },
  { value: 'orphan', label: 'Orphan' },
  { value: 'orphans', label: 'Orphans' },
  { value: 'disable', label: 'Disable' },
  { value: 'people_with_disabilities', label: 'People with Disabilities' },
  { value: 'indigent', label: 'Indigent' },
  { value: 'abandoned_women', label: 'Abandoned Women' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'women_headed_households', label: 'Women-Headed Households' },
  { value: 'elderly_no_support', label: 'Elderly with No Support' },
  { value: 'chronic_illness', label: 'Chronic Illness' },
  { value: 'daily_wage_laborers', label: 'Daily Wage Laborers' },
  { value: 'idps', label: 'Internally Displaced Persons (IDPs)' },
  { value: 'religious_minorities', label: 'Religious Minorities in Need' },
  { value: 'desert_area_inhabitants', label: 'Desert Area Inhabitants' },
  { value: 'unemployed_youth', label: 'Unemployed Youth' },
  { value: 'students_ultra_poor', label: 'Students from Ultra-Poor Families' },
  { value: 'malnourished_families', label: 'Malnourished Families' },
  { value: 'natural_disaster_victims', label: 'Victims of Natural Disasters' },
  { value: 'other', label: 'Other' },
];

/** Chip multi-select on Family Head personal card (subset). */
export const AID_VULNERABILITY_CHIPS = [
  { value: 'widow', label: 'Widow' },
  { value: 'widower', label: 'Widower' },
  { value: 'orphan', label: 'Orphan' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'indigent', label: 'Indigent' },
  { value: 'elderly_no_support', label: 'Elderly No Support' },
  { value: 'chronic_illness', label: 'Chronic Illness' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'other', label: 'Other' },
];

export function parseVulnerabilityList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinVulnerabilityList(values) {
  if (!Array.isArray(values) || !values.length) return '';
  return values.filter(Boolean).join(',');
}

export function formatVulnerability(value) {
  const list = parseVulnerabilityList(value);
  if (!list.length) return '—';
  return list
    .map(
      (v) =>
        AID_VULNERABILITIES.find((o) => o.value === v)?.label ||
        AID_VULNERABILITY_CHIPS.find((o) => o.value === v)?.label ||
        v,
    )
    .join(', ');
}

/** Profession options (Family Head personal card). */
export const AID_PROFESSIONS = [
  { value: 'labourer', label: 'Labourer' },
  { value: 'skilled_laborer', label: 'Skilled Labourer' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'job', label: 'Job / Employee' },
  { value: 'business', label: 'Business' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'housewife', label: 'Housewife' },
  { value: 'student', label: 'Student' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' },
];

/**
 * Literacy (education) shown on Family Head personal card.
 * Maps to education_level; "Post-Graduate" = masters.
 */
export const AID_LITERACY_EDUCATION_OPTIONS = [
  { value: 'none', label: 'None / Illiterate' },
  { value: 'primary', label: 'Primary' },
  { value: 'middle', label: 'Middle' },
  { value: 'matric', label: 'Matric' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'bachelors', label: 'Graduate' },
  { value: 'masters', label: 'Post-Graduate' },
  { value: 'religious', label: 'Religious education' },
  { value: 'other', label: 'Other' },
];

export const AID_EDUCATION_LEVELS = [
  { value: 'none', label: 'None / illiterate' },
  { value: 'primary', label: 'Primary' },
  { value: 'middle', label: 'Middle' },
  { value: 'matric', label: 'Matric' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's+" },
  { value: 'religious', label: 'Religious education' },
  { value: 'other', label: 'Other' },
];

/** Digits only, max 13 → display as 12345-1234567-1 */
export function formatCnicInput(raw) {
  const digits = String(raw || '')
    .replace(/\D/g, '')
    .slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function isValidCnic(value) {
  if (!value) return true;
  const formatted = formatCnicInput(value);
  return /^\d{5}-\d{7}-\d{1}$/.test(formatted);
}

/** PK mobile: digits only, max 11, prefer 03XXXXXXXXX */
export function formatPkPhoneInput(raw) {
  return String(raw || '')
    .replace(/\D/g, '')
    .slice(0, 11);
}

export function isValidPkPhone(value) {
  if (!value) return true;
  return /^03\d{9}$/.test(String(value).trim());
}

export function calcAgeFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 150 ? age : null;
}

/** Literacy root — Educated / UnEducated (per intake diagram). */
export const AID_LITERACY_STATUS = [
  { value: 'educated', label: 'Educated' },
  { value: 'uneducated', label: 'UnEducated' },
];

/** Educated → Student | Job | Self Employed | Business | Others */
export const AID_LITERACY_CATEGORIES_EDUCATED = [
  { value: 'student', label: 'Student' },
  { value: 'job', label: 'Job' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'business', label: 'Business' },
  { value: 'others', label: 'Others' },
];

/** UnEducated → Skilled Laborer | Laborer | Self Employed | Others */
export const AID_LITERACY_CATEGORIES_UNEDUCATED = [
  { value: 'skilled_laborer', label: 'Skilled Laborer' },
  { value: 'laborer', label: 'Laborer' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'others', label: 'Others' },
];

/** Student → Class options */
export const AID_STUDENT_CLASSES = [
  { value: 'nursery', label: 'Nursery' },
  { value: 'kg', label: 'KG' },
  { value: '1', label: '1st' },
  { value: '2', label: '2nd' },
  { value: '3', label: '3rd' },
  { value: '4', label: '4th' },
  { value: '5', label: '5th' },
  { value: '6', label: '6th' },
  { value: '7', label: '7th' },
  { value: '8', label: '8th' },
  { value: '9', label: '9th' },
  { value: '10', label: '10th / Matric' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'other', label: 'Other' },
];

/** Student → type of class */
export const AID_STUDENT_CLASS_TYPES = [
  { value: 'science', label: 'Science' },
  { value: 'arts', label: 'Arts' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'medical', label: 'Medical' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' },
];

const LITERACY_CATEGORY_LABELS = Object.fromEntries([
  ...AID_LITERACY_CATEGORIES_EDUCATED,
  ...AID_LITERACY_CATEGORIES_UNEDUCATED,
].map((o) => [o.value, o.label]));

export const AID_YES_NO = [
  { value: 'yes', label: 'Yes', labelUr: 'ہاں' },
  { value: 'no', label: 'No', labelUr: 'نہیں' },
];

/** Property type when Do you have land? = Yes */
export const AID_PROPERTY_TYPES = [
  { value: 'agri', label: 'Agri', labelUr: 'زراعتی' },
  { value: 'commercial', label: 'Commercial', labelUr: 'تجارتی' },
  {
    value: 'residential_ownership',
    label: 'Residential Unit',
    labelUr: 'رہائشی یونٹ',
  },
  { value: 'plot', label: 'Plot', labelUr: 'پلاٹ' },
  { value: 'others', label: 'Others', labelUr: 'دیگر' },
];

export const emptyPropertyRow = (overrides = {}) => ({
  property_type: '',
  property_area: '',
  property_details: '',
  ...overrides,
});

export const emptyPropertyOwnershipFields = () => ({
  has_land: false,
  property_type: '',
  property_area: '',
  property_details: '',
  property_entries: [],
});

export function formatPropertyOwnershipSummary(person) {
  if (!person || person.has_land == null) return '';
  if (!person.has_land) return 'Land: No';
  const entries = Array.isArray(person.property_entries)
    ? person.property_entries.filter(
        (r) => r?.property_type || r?.property_area || r?.property_details,
      )
    : [];
  if (entries.length) {
    const bits = entries.map((r) => {
      const type =
        AID_PROPERTY_TYPES.find((t) => t.value === r.property_type)?.label ||
        r.property_type ||
        '—';
      const parts = [type];
      if (r.property_area) parts.push(String(r.property_area));
      if (r.property_details) parts.push(String(r.property_details));
      return parts.join(' · ');
    });
    return `Land: Yes · ${bits.join(' | ')}`;
  }
  const type =
    AID_PROPERTY_TYPES.find((t) => t.value === person.property_type)?.label ||
    person.property_type ||
    '—';
  const parts = [`Land: Yes · Type: ${type}`];
  if (person.property_area) parts.push(`Area: ${person.property_area}`);
  if (person.property_details) parts.push(person.property_details);
  return parts.join(' · ');
}

/** Resident type: Own House | Rented | Sham Lot */
export const AID_RESIDENT_TYPES = [
  { value: 'own_house', label: 'Own House' },
  { value: 'rented', label: 'Rented' },
  { value: 'sham_lot', label: 'Sham Lot' },
];

export const emptyResidentRow = (overrides = {}) => ({
  resident_type: '',
  resident_ownership_status: '',
  resident_ownership_other: '',
  rented_amount: '',
  house_area_marla: '',
  house_details: '',
  ...overrides,
});

export const emptyResidentHousingFields = () => ({
  resident_type: '',
  resident_ownership_status: '',
  resident_ownership_other: '',
  rented_amount: '',
  house_area_marla: '',
  house_details: '',
  resident_entries: [],
});

export const AID_LIVESTOCK_ANIMALS = [
  { value: 'goat', label: 'Goat' },
  { value: 'cow', label: 'Cow' },
  { value: 'buffalo', label: 'Buffalo' },
];

export const AID_LIVESTOCK_OWNERSHIP = [
  { value: 'personal', label: 'Personal' },
  { value: 'sharing', label: 'Sharing' },
];

export const emptyLivestockRow = () => ({
  animal_type: 'goat',
  quantity: '',
  ownership: 'personal',
  owner_name: '',
  owner_contact: '',
});

export const emptyLivestockFields = () => ({
  has_livestock: false,
  livestock_entries: [],
});

export const AID_VEHICLE_TYPES = [
  { value: 'motorcycle', label: 'Motorcycle', labelUr: 'موٹر سائیکل' },
  { value: 'car', label: 'Car', labelUr: 'کار' },
  { value: 'van', label: 'Van / Suzuki', labelUr: 'وین / سوزوکی' },
  { value: 'truck', label: 'Truck', labelUr: 'ٹرک' },
  { value: 'tractor', label: 'Tractor', labelUr: 'ٹریکٹر' },
  { value: 'bicycle', label: 'Bicycle', labelUr: 'سائیکل' },
  { value: 'rickshaw', label: 'Rickshaw', labelUr: 'رکشہ' },
  { value: 'other', label: 'Other (specify)', labelUr: 'دیگر (وضاحت)' },
];

export const emptyVehicleRow = (overrides = {}) => ({
  vehicle_type: '',
  quantity: '',
  details: '',
  ...overrides,
});

export const emptyVehicleFields = () => ({
  has_vehicle: false,
  vehicle_type: '',
  vehicle_entries: [],
});

export function formatVehicleSummary(person) {
  if (!person || person.has_vehicle == null) return '';
  if (!person.has_vehicle) return 'Vehicle: No';
  const entries = Array.isArray(person.vehicle_entries)
    ? person.vehicle_entries.filter((r) => r?.vehicle_type)
    : [];
  if (entries.length) {
    const labels = entries.map((r) => {
      const t = r.vehicle_type || '';
      const typeLabel =
        AID_VEHICLE_TYPES.find((x) => x.value === t)?.label || t || '—';
      const qty = r.quantity != null && r.quantity !== '' ? ` ×${r.quantity}` : '';
      const details = r.details ? ` (${r.details})` : '';
      return `${typeLabel}${qty}${details}`;
    });
    return `Vehicle: Yes · ${labels.join(' | ')}`;
  }
  const t = person.vehicle_type || '';
  const label =
    AID_VEHICLE_TYPES.find((x) => x.value === t)?.label || t || '—';
  return `Vehicle: Yes · ${label}`;
}

export const AID_NECTA_STATUS = [
  { value: 'clear', label: 'Clear', labelUr: 'کلیر' },
  { value: 'not_clear', label: 'Not Clear', labelUr: 'غیر کلیر' },
];

export const AID_BISP_STATUS = [
  { value: 'eligible', label: 'Eligible', labelUr: 'اہل' },
  { value: 'not_eligible', label: 'Not Eligible', labelUr: 'غیر اہل' },
];

export const emptyEligibilityStatusFields = () => ({
  necta_status: '',
  necta_document_url: '',
  necta_document_name: '',
  bisp_status: '',
});

export function formatEligibilityStatusSummary(person) {
  if (!person) return '';
  const parts = [];
  if (person.necta_status) {
    const n =
      AID_NECTA_STATUS.find((x) => x.value === person.necta_status)?.label ||
      person.necta_status;
    parts.push(`NECTA: ${n}`);
  }
  if (person.necta_document_url) parts.push('NECTA doc attached');
  if (person.bisp_status) {
    const b =
      AID_BISP_STATUS.find((x) => x.value === person.bisp_status)?.label ||
      person.bisp_status;
    parts.push(`BISP: ${b}`);
  }
  return parts.join(' · ');
}

export function formatLivestockSummary(person) {
  if (!person || person.has_livestock == null) return '';
  if (!person.has_livestock) return 'Livestock: No';
  const entries = Array.isArray(person.livestock_entries)
    ? person.livestock_entries
    : [];
  if (!entries.length) return 'Livestock: Yes';
  const animalLabel = (t) =>
    AID_LIVESTOCK_ANIMALS.find((a) => a.value === t)?.label || t;
  const ownLabel = (o) =>
    AID_LIVESTOCK_OWNERSHIP.find((x) => x.value === o)?.label || o;
  return entries
    .map((row) => {
      const bits = [
        `${animalLabel(row.animal_type)} × ${row.quantity ?? '—'}`,
        ownLabel(row.ownership),
      ];
      if (row.ownership === 'sharing' && row.owner_name) {
        bits.push(`Owner: ${row.owner_name}`);
      }
      if (row.ownership === 'sharing' && row.owner_contact) {
        bits.push(row.owner_contact);
      }
      return bits.join(' · ');
    })
    .join('; ');
}

export function formatResidentHousingSummary(person) {
  if (!person) return '';
  const entries = Array.isArray(person.resident_entries)
    ? person.resident_entries.filter((r) => r?.resident_type)
    : [];
  const formatOne = (row) => {
    const typeLabel =
      AID_RESIDENT_TYPES.find((t) => t.value === row.resident_type)?.label ||
      row.resident_type;
    const parts = [typeLabel];
    if (row.resident_ownership_status) {
      parts.push(row.resident_ownership_status);
    }
    if (row.resident_ownership_other) parts.push(row.resident_ownership_other);
    if (
      row.resident_type === 'rented' &&
      row.rented_amount != null &&
      row.rented_amount !== ''
    ) {
      parts.push(`Rent PKR ${row.rented_amount}`);
    }
    if (row.house_area_marla != null && row.house_area_marla !== '') {
      parts.push(`${row.house_area_marla} Marla`);
    }
    if (row.house_details) parts.push(row.house_details);
    return parts.join(' · ');
  };
  if (entries.length) {
    return `Resident: ${entries.map(formatOne).join(' | ')}`;
  }
  if (!person.resident_type) return '';
  return `Resident: ${formatOne(person)}`;
}

export const emptyLiteracyFields = () => ({
  literacy_status: '',
  literacy_category: '',
  student_class: '',
  student_class_type: '',
  student_class_name: '',
  monthly_income: '',
  has_disability: false,
  disability_type: '',
  disability_certificate_url: '',
  disability_certificate_name: '',
});

/** Household dependency (related-person / family member card). */
export const AID_HOUSEHOLD_DEPENDENCY = [
  { value: 'dependent_on_family_head', label: 'Dependent on Family Head' },
  { value: 'dependent_on_beneficiary', label: 'Dependent on Beneficiary' },
  { value: 'self_supporting', label: 'Self Supporting' },
  { value: 'earning_member', label: 'Earning Member' },
  { value: 'other', label: 'Other' },
];

/** Children — Type (relation) options. */
export const AID_CHILD_RELATIONS = [
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'child', label: 'Child' },
  { value: 'grandchild', label: 'Grandchild' },
];

/** Shared empty person fields for related individuals. */
export const emptyRelatedPersonBase = () => ({
  full_name: '',
  father_or_husband_name: '',
  name_urdu: '',
  caste: '',
  gender: '',
  date_of_birth: '',
  cnic: '',
  cnic_expiry: '',
  phone: '',
  phone_alternate: '',
  photo_url: '',
  photo_name: '',
  marital_status: '',
  occupation: '',
  monthly_income: '',
  education_level: '',
  necta_status: '',
  vulnerability: '',
  household_dependency: '',
  has_disability: false,
  disability_type: '',
  disability_certificate_url: '',
  disability_certificate_name: '',
  existing_person_id: null,
  relation_type: '',
  province: '',
  district: '',
  tehsil: '',
  union_council: '',
  landmark: '',
  city: '',
  address: '',
  current_address: '',
  ...emptyLiteracyFields(),
  ...emptyResidentHousingFields(),
});

export const emptyChildRow = () => ({
  ...emptyRelatedPersonBase(),
  relation_type: 'child',
  relation_with_beneficiary: 'child',
});

/** Relation with beneficiary — Brothers / Sisters (single marital flow). */
export const AID_SIBLING_RELATIONS = [
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'step_brother', label: 'Step Brother' },
  { value: 'step_sister', label: 'Step Sister' },
  { value: 'half_brother', label: 'Half Brother' },
  { value: 'half_sister', label: 'Half Sister' },
  { value: 'sibling', label: 'Sibling' },
];

export const emptySiblingRow = () => ({
  ...emptyRelatedPersonBase(),
  relation_type: 'brother',
  relation_with_beneficiary: 'brother',
});

export function mapSiblingRelationToKinship(relation) {
  const r = String(relation || '').toLowerCase();
  if (r.includes('sister')) return 'sister';
  if (r.includes('brother')) return 'brother';
  return 'sibling';
}

/** Relation with FAMILY HEAD for sponsored dependents. */
export const AID_DEPENDENT_RELATIONS = [
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'child', label: 'Child' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'nephew', label: 'Nephew' },
  { value: 'niece', label: 'Niece' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'in_law', label: 'In-law' },
  { value: 'other', label: 'Other' },
];

/**
 * Full type list for standardized "add any related person" flows
 * (parents / children / siblings / extended).
 */
export const AID_RELATED_PERSON_TYPES = [
  { value: 'father', label: 'Father (Parent)', labelUr: 'والد' },
  { value: 'mother', label: 'Mother (Parent)', labelUr: 'والدہ' },
  { value: 'spouse', label: 'Spouse', labelUr: 'شریک حیات' },
  { value: 'son', label: 'Son (Child)', labelUr: 'بیٹا' },
  { value: 'daughter', label: 'Daughter (Child)', labelUr: 'بیٹی' },
  { value: 'child', label: 'Child', labelUr: 'بچہ' },
  { value: 'brother', label: 'Brother (Sibling)', labelUr: 'بھائی' },
  { value: 'sister', label: 'Sister (Sibling)', labelUr: 'بہن' },
  { value: 'sibling', label: 'Sibling', labelUr: 'بہن بھائی' },
  { value: 'step_brother', label: 'Step Brother', labelUr: 'سوتیلا بھائی' },
  { value: 'step_sister', label: 'Step Sister', labelUr: 'سوتیلی بہن' },
  { value: 'uncle', label: 'Uncle', labelUr: 'چچا / ماموں' },
  { value: 'aunt', label: 'Aunt', labelUr: 'چچی / خالہ' },
  { value: 'cousin', label: 'Cousin', labelUr: 'کزن' },
  { value: 'grandfather', label: 'Grandfather', labelUr: 'دادا' },
  { value: 'grandmother', label: 'Grandmother', labelUr: 'دادی' },
  {
    value: 'maternal_grandfather',
    label: 'Maternal Grandfather',
    labelUr: 'نانا',
  },
  {
    value: 'maternal_grandmother',
    label: 'Maternal Grandmother',
    labelUr: 'نانی',
  },
  { value: 'grandchild', label: 'Grandchild', labelUr: 'پوتا / پوتی' },
  { value: 'guardian', label: 'Guardian', labelUr: 'سرپرست' },
  { value: 'in_law', label: 'In-law', labelUr: 'سسرال' },
  { value: 'other', label: 'Other', labelUr: 'دیگر' },
];

export const emptyDependentRow = () => ({
  ...emptyRelatedPersonBase(),
  relation_type: 'other',
  relation_with_family_head: 'other',
  household_dependency: 'dependent_on_family_head',
});

/** Resolve kinship edge type from any related-person row. */
export function resolveRelatedPersonKinship(row) {
  const raw =
    row?.relation_type ||
    row?.relation_with_beneficiary ||
    row?.relation_with_family_head ||
    '';
  const r = String(raw || '').toLowerCase();
  if (r.includes('sister')) return 'sister';
  if (r.includes('brother')) return 'brother';
  if (r === 'nephew' || r === 'niece') return 'cousin';
  if (r === 'son' || r === 'daughter' || r === 'child') return r;
  if (
    [
      'father',
      'mother',
      'spouse',
      'sibling',
      'uncle',
      'aunt',
      'cousin',
      'grandfather',
      'grandmother',
      'maternal_grandfather',
      'maternal_grandmother',
      'grandchild',
      'guardian',
      'custody_holder',
      'in_law',
      'other',
    ].includes(r)
  ) {
    return r;
  }
  return 'other';
}

/** Map dependent relation to kinship edge type (closest supported enum). */
export function mapDependentRelationToKinship(relation) {
  const r = String(relation || '').toLowerCase();
  const allowed = new Set([
    'son',
    'daughter',
    'child',
    'brother',
    'sister',
    'sibling',
    'uncle',
    'aunt',
    'cousin',
    'father',
    'mother',
    'guardian',
    'in_law',
    'other',
  ]);
  if (r === 'nephew' || r === 'niece') return 'cousin';
  if (allowed.has(r)) return r;
  return 'other';
}

export function literacyCategoriesFor(status) {
  if (status === 'educated') return AID_LITERACY_CATEGORIES_EDUCATED;
  if (status === 'uneducated') return AID_LITERACY_CATEGORIES_UNEDUCATED;
  return [];
}

/** Human-readable literacy line for views (Educated → Job → income, etc.). */
export function formatLiteracySummary(person) {
  if (!person) return '';
  const status = String(person.literacy_status || '').toLowerCase();
  if (!status) return '';
  const statusLabel =
    status === 'educated'
      ? 'Educated'
      : status === 'uneducated'
        ? 'UnEducated'
        : status;
  const cat = String(person.literacy_category || '').toLowerCase();
  const catLabel = LITERACY_CATEGORY_LABELS[cat] || cat;
  const parts = [statusLabel];
  if (catLabel) parts.push(catLabel);
  if (status === 'educated' && cat === 'student') {
    const studentBits = [
      person.student_class,
      person.student_class_type,
      person.student_class_name,
    ].filter(Boolean);
    if (studentBits.length) parts.push(studentBits.join(' / '));
  }
  if (
    (cat === 'job' || cat === 'skilled_laborer') &&
    person.monthly_income
  ) {
    parts.push(`Income PKR ${person.monthly_income}`);
  } else if (person.monthly_income && !cat) {
    parts.push(`Income PKR ${person.monthly_income}`);
  }
  return parts.join(' · ');
}

export function ageFromDob(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? String(age) : '';
}

export const AID_KINSHIP_TYPES = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'child', label: 'Child' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'maternal_grandfather', label: 'Maternal Grandfather' },
  { value: 'maternal_grandmother', label: 'Maternal Grandmother' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'custody_holder', label: 'Custody holder' },
  { value: 'in_law', label: 'In-law' },
  { value: 'other', label: 'Other' },
];

/** Direct blood relations for Family Head Type dropdown (Guardian is appended separately). */
export const AID_FAMILY_HEAD_BLOOD_TYPES = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
];

/** Shown as Subtype when Family Head Type = Guardian */
export const AID_FAMILY_HEAD_GUARDIAN_SUBTYPES = [
  { value: 'spouse', label: 'Husband' },
  { value: 'step_brother', label: 'Step Brother' },
  { value: 'step_sister', label: 'Step Sister' },
  { value: 'half_brother', label: 'Half Brother' },
  { value: 'half_sister', label: 'Half Sister' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'nephew', label: 'Nephew' },
  { value: 'niece', label: 'Niece' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'maternal_grandfather', label: 'Maternal Grandfather' },
  { value: 'maternal_grandmother', label: 'Maternal Grandmother' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'custody_holder', label: 'Custody holder' },
  { value: 'in_law', label: 'In-law' },
  { value: 'other', label: 'Other' },
];

/** Default Type dropdown: Self + blood relations + Guardian at the end */
export const AID_FAMILY_HEAD_TYPE_OPTIONS = [
  { value: 'self', label: 'Self' },
  ...AID_FAMILY_HEAD_BLOOD_TYPES,
  { value: 'guardian', label: 'Guardian' },
];

/** Full lookup list (labels, hydrate, gender hints) */
export const AID_FAMILY_HEAD_TYPES = [
  { value: 'self', label: 'Self' },
  ...AID_FAMILY_HEAD_BLOOD_TYPES,
  { value: 'guardian', label: 'Guardian' },
  ...AID_FAMILY_HEAD_GUARDIAN_SUBTYPES,
];

export const AID_FAMILY_HEAD_SELF_TYPE = 'self';

export const AID_FAMILY_HEAD_BLOOD_TYPE_VALUES = new Set(
  AID_FAMILY_HEAD_BLOOD_TYPES.map((t) => t.value),
);
export const AID_FAMILY_HEAD_GUARDIAN_SUBTYPE_VALUES = new Set(
  AID_FAMILY_HEAD_GUARDIAN_SUBTYPES.map((t) => t.value),
);

const FAMILY_HEAD_FEMALE_TYPES = new Set([
  'mother',
  'daughter',
  'sister',
  'step_sister',
  'half_sister',
  'aunt',
  'niece',
  'grandmother',
  'maternal_grandmother',
]);

const FAMILY_HEAD_MALE_TYPES = new Set([
  'father',
  'spouse',
  'son',
  'brother',
  'step_brother',
  'half_brother',
  'uncle',
  'nephew',
  'grandfather',
  'maternal_grandfather',
]);

export const emptyFamilyHeadRow = (relationType = 'father') => ({
  full_name: '',
  father_or_husband_name: '',
  name_urdu: '',
  caste: '',
  cnic: '',
  cnic_expiry: '',
  phone: '',
  phone_alternate: '',
  photo_url: '',
  photo_name: '',
  city: '',
  address: '',
  current_address: '',
  province: '',
  district: '',
  tehsil: '',
  union_council: '',
  landmark: '',
  gender: FAMILY_HEAD_FEMALE_TYPES.has(relationType)
    ? 'female'
    : FAMILY_HEAD_MALE_TYPES.has(relationType)
      ? 'male'
      : '',
  date_of_birth: '',
  marital_status: '',
  vulnerability: '',
  occupation: '',
  monthly_income: '',
  education_level: '',
  is_alive: true,
  has_disability: false,
  disability_type: '',
  disability_certificate_url: '',
  disability_certificate_name: '',
  ...emptyLiteracyFields(),
  ...emptyPropertyOwnershipFields(),
  ...emptyResidentHousingFields(),
  ...emptyLivestockFields(),
  ...emptyVehicleFields(),
  ...emptyEligibilityStatusFields(),
  _relation_type: relationType,
  /** Generic relatives of this family head (children, siblings, …). */
  _family_members: [],
});

/** Quick-add family tree sections on person view */
export const AID_FAMILY_SECTIONS = [
  {
    key: 'parents',
    title: 'Parents',
    empty: 'No parents recorded.',
    relations: [
      { value: 'father', label: 'Father' },
      { value: 'mother', label: 'Mother' },
    ],
    defaultRelation: 'father',
  },
  {
    key: 'spouse',
    title: 'Spouse',
    empty: 'No spouse recorded.',
    relations: [{ value: 'spouse', label: 'Spouse' }],
    defaultRelation: 'spouse',
  },
  {
    key: 'children',
    title: 'Children',
    empty: 'No children recorded.',
    relations: [
      { value: 'son', label: 'Son' },
      { value: 'daughter', label: 'Daughter' },
      { value: 'child', label: 'Child' },
    ],
    defaultRelation: 'son',
  },
  {
    key: 'brothers',
    title: 'Brothers',
    empty: 'No brothers recorded.',
    relations: [{ value: 'brother', label: 'Brother' }],
    defaultRelation: 'brother',
  },
  {
    key: 'sisters',
    title: 'Sisters',
    empty: 'No sisters recorded.',
    relations: [{ value: 'sister', label: 'Sister' }],
    defaultRelation: 'sister',
  },
  {
    key: 'grandparents',
    title: 'Grandparents',
    empty: 'No grandparents recorded.',
    relations: [
      { value: 'grandfather', label: 'Grandfather' },
      { value: 'grandmother', label: 'Grandmother' },
      { value: 'maternal_grandfather', label: 'Maternal Grandfather' },
      { value: 'maternal_grandmother', label: 'Maternal Grandmother' },
    ],
    defaultRelation: 'grandfather',
  },
  {
    key: 'grandchildren',
    title: 'Grandchildren',
    empty: 'No grandchildren recorded.',
    relations: [{ value: 'grandchild', label: 'Grandchild' }],
    defaultRelation: 'grandchild',
  },
  {
    key: 'extended',
    title: 'Extended / other',
    empty: 'No extended relatives recorded.',
    relations: [
      { value: 'uncle', label: 'Uncle' },
      { value: 'aunt', label: 'Aunt' },
      { value: 'cousin', label: 'Cousin' },
      { value: 'guardian', label: 'Guardian' },
      { value: 'custody_holder', label: 'Custody holder' },
      { value: 'in_law', label: 'In-law' },
      { value: 'other', label: 'Other' },
    ],
    defaultRelation: 'uncle',
  },
];

export const AID_DELIVERY_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const AID_CEO_OPTIONS = [
  { value: 'approved', label: 'Approve' },
  { value: 'rejected', label: 'Reject' },
];

export const AID_GENDERS = [
  { value: 'male', label: 'Male', labelUr: 'مرد' },
  { value: 'female', label: 'Female', labelUr: 'عورت' },
  { value: 'other', label: 'Other', labelUr: 'دیگر' },
];

export const AID_ATTACHMENT_CONTEXTS = [
  { value: 'profile', label: 'Profile' },
  { value: 'verification', label: 'Verification' },
  { value: 'delivery', label: 'Delivery / handover' },
  { value: 'site_visit', label: 'Site visit' },
  { value: 'mepco_bill', label: 'Mepco Bill' },
  { value: 'cnic', label: 'CNICs' },
  { value: 'bay_form', label: 'Bay Forms' },
  { value: 'death_certificate', label: 'Death Certificates' },
  { value: 'marriage_certificate', label: 'Marriage Certificates' },
  { value: 'education_certificate', label: 'Education Certificates' },
  { value: 'e_stamp_paper', label: 'E-Stamp Paper' },
  { value: 'zakat', label: 'Zakat form' },
  { value: 'consent', label: 'Consent form' },
];

/** Optional application-intake document slots (create form Attachments tab). */
export const AID_APPLICATION_DOC_TYPES = [
  { value: 'mepco_bill', label: 'Mepco Bill', multiple: false },
  {
    value: 'cnic',
    label: 'CNICs',
    labelUr: 'شناختی کارڈ',
    multiple: true,
    frontBack: true,
  },
  { value: 'bay_form', label: 'Bay Forms', multiple: true },
  { value: 'death_certificate', label: 'Death Certificates', multiple: true },
  { value: 'marriage_certificate', label: 'Marriage Certificates', multiple: true },
  { value: 'education_certificate', label: 'Education Certificates', multiple: true },
  { value: 'e_stamp_paper', label: 'E-Stamp Paper', multiple: false },
];

/** Normalize a docs slot to a list of { file?, name?, url?, side?, pair? }. */
export function normalizeApplicationDocSlot(slot) {
  if (!slot) return [];
  if (Array.isArray(slot)) return slot.filter(Boolean);
  if (slot.files && Array.isArray(slot.files)) return slot.files.filter(Boolean);
  if (slot.file || slot.name || slot.url) return [slot];
  return [];
}

/**
 * Group CNIC files into front/back pairs for the intake UI.
 * Returns at least one empty pair when there are no files.
 */
export function cnicFilesToPairs(files) {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!list.length) return [{ front: null, back: null }];

  const hasMeta = list.some(
    (f) => f?.side === 'front' || f?.side === 'back' || f?.pair != null,
  );

  if (hasMeta) {
    const byPair = new Map();
    list.forEach((f, i) => {
      const pairIdx =
        f.pair != null && Number.isFinite(Number(f.pair))
          ? Number(f.pair)
          : i;
      if (!byPair.has(pairIdx)) byPair.set(pairIdx, { front: null, back: null });
      const row = byPair.get(pairIdx);
      const side = String(f.side || '').toLowerCase();
      if (side === 'back') row.back = f;
      else row.front = f;
    });
    return Array.from(byPair.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, row]) => row);
  }

  // Legacy flat list: treat consecutive files as front, back, front, back…
  const pairs = [];
  for (let i = 0; i < list.length; i += 2) {
    pairs.push({
      front: list[i] || null,
      back: list[i + 1] || null,
    });
  }
  return pairs.length ? pairs : [{ front: null, back: null }];
}

/** Flatten front/back pairs back into a files array with side/pair metadata. */
export function cnicPairsToFiles(pairs) {
  const out = [];
  (pairs || []).forEach((pair, pairIdx) => {
    if (pair?.front) {
      out.push({ ...pair.front, side: 'front', pair: pairIdx });
    }
    if (pair?.back) {
      out.push({ ...pair.back, side: 'back', pair: pairIdx });
    }
  });
  return out;
}

export const AID_VERIFICATION_CHECKLIST = [
  { key: 'site_visit', label: 'Site Visit', required: true },
  {
    key: 'identity_confirmed',
    label: 'Beneficiary identity confirmed (name / CNIC)',
    required: true,
  },
  {
    key: 'address_confirmed',
    label: 'Residence / address confirmed',
    required: true,
  },
  {
    key: 'family_confirmed',
    label: 'Family composition confirmed (parents / spouse / kids / siblings)',
    required: true,
  },
  { key: 'need_verified', label: 'Aid need verified as genuine', required: true },
  {
    key: 'livelihood_reviewed',
    label: 'Profession / monthly income situation reviewed',
    required: true,
  },
  {
    key: 'duplicates_reviewed',
    label: 'Duplicate / prior-aid flags reviewed',
    required: true,
  },
  {
    key: 'eligible_recommended',
    label: 'Case recommended for CEO approval',
    required: true,
  },
];

export function formatAidStatus(status) {
  return AID_STATUS_OPTIONS.find((o) => o.value === status)?.label || status || '—';
}

export function formatAidRequestType(type) {
  return AID_REQUEST_TYPES.find((o) => o.value === type)?.label || type || '—';
}

/** Program + SubProgram label for lists (e.g. "Health · Patient Care Initiative"). */
export function formatAidTypeWithProgram(aidType, programKey) {
  const typeLabel = formatAidRequestType(aidType);
  const prog = getAidProgram(programKey);
  if (!prog) return typeLabel;
  return `${typeLabel} · ${prog.label}`;
}

export function formatAidCaseSource(source) {
  return AID_CASE_SOURCES.find((o) => o.value === source)?.label || source || '—';
}

export function formatMaritalStatus(status) {
  if (!status) return '—';
  const key = String(status).toLowerCase();
  if (AID_MARITAL_STATUS_LEGACY[key]) return AID_MARITAL_STATUS_LEGACY[key];
  return AID_MARITAL_STATUS.find((o) => o.value === key)?.label || status || '—';
}

export function formatEducation(level) {
  return AID_EDUCATION_LEVELS.find((o) => o.value === level)?.label || level || '—';
}

export function aidStatusTone(status) {
  switch (status) {
    case 'successful':
    case 'delivered':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'incomplete':
    case 'ceo_approval_required':
    case 'manager_review':
      return 'warn';
    case 'under_review':
    case 'submitted':
      return 'info';
    case 'draft':
      return 'muted';
    default:
      return 'muted';
  }
}

export function personAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}
