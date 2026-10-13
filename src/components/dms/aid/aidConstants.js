export const AID_STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'ceo_approval_required', label: 'CEO approval required' },
  { value: 'successful', label: 'Successful' },
  { value: 'delivered', label: 'Delivered' },
];

export const AID_REQUEST_TYPES = [
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'clean_water', label: 'Clean Water' },
  { value: 'apna_ghar', label: 'Apna Ghar' },
  { value: 'disaster_relief', label: 'Disaster Relief' },
  { value: 'kasb_skill_development', label: 'KASB Skill Development' },
  { value: 'seeds_of_change', label: 'Seeds of Change' },
  { value: 'aas_lab_diagnostics', label: 'AAS Lab & Diagnostics' },
  { value: 'community_services', label: 'Community Services' },
  { value: 'other', label: 'Other' },
];

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
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'separated', label: 'Separated' },
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
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const emptyLiteracyFields = () => ({
  literacy_status: '',
  literacy_category: '',
  student_class: '',
  student_class_type: '',
  student_class_name: '',
  monthly_income: '',
  has_disability: false,
  disability_type: '',
});

export const emptyChildRow = () => ({
  full_name: '',
  gender: '',
  date_of_birth: '',
  cnic: '',
  marital_status: '',
  has_disability: false,
  disability_type: '',
  ...emptyLiteracyFields(),
});

/** Relation with beneficiary — Brothers / Sisters (single marital flow). */
export const AID_SIBLING_RELATIONS = [
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'step_brother', label: 'Step Brother' },
  { value: 'step_sister', label: 'Step Sister' },
  { value: 'half_brother', label: 'Half Brother' },
  { value: 'half_sister', label: 'Half Sister' },
];

export const emptySiblingRow = () => ({
  full_name: '',
  gender: '',
  date_of_birth: '',
  cnic: '',
  marital_status: '',
  relation_with_beneficiary: 'brother',
  ...emptyLiteracyFields(),
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

export const emptyDependentRow = () => ({
  full_name: '',
  gender: '',
  date_of_birth: '',
  cnic: '',
  marital_status: '',
  has_disability: false,
  disability_type: '',
  relation_with_family_head: 'other',
  ...emptyLiteracyFields(),
});

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
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'custody_holder', label: 'Custody holder' },
  { value: 'in_law', label: 'In-law' },
  { value: 'other', label: 'Other' },
];

/** Family Head tab — who stands as family head / caretaker relative to beneficiary */
export const AID_FAMILY_HEAD_TYPES = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'other', label: 'Other' },
];

export const emptyFamilyHeadRow = (relationType = 'father') => ({
  full_name: '',
  cnic: '',
  phone: '',
  city: '',
  address: '',
  gender:
    relationType === 'mother' ||
    relationType === 'grandmother' ||
    relationType === 'aunt'
      ? 'female'
      : relationType === 'father' ||
          relationType === 'grandfather' ||
          relationType === 'uncle'
        ? 'male'
        : '',
  date_of_birth: '',
  marital_status: '',
  occupation: '',
  education_level: '',
  is_alive: true,
  ...emptyLiteracyFields(),
  _relation_type: relationType,
  _has_dependents: false,
  _dependents: [],
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
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const AID_ATTACHMENT_CONTEXTS = [
  { value: 'profile', label: 'Profile (CNIC, bill, etc.)' },
  { value: 'verification', label: 'Verification' },
  { value: 'delivery', label: 'Delivery / handover' },
];

export const AID_VERIFICATION_CHECKLIST = [
  { key: 'home_visited', label: 'Home / field visit completed', required: true },
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

export function formatMaritalStatus(status) {
  return AID_MARITAL_STATUS.find((o) => o.value === status)?.label || status || '—';
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
    case 'ceo_approval_required':
      return 'warn';
    case 'under_review':
      return 'info';
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
