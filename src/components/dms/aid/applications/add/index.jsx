import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiPrinter,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import { PrimaryButton } from '../../../../common/buttons';
import { ClearButton } from '../../../../common/filters';
import SearchableDropdown from '../../../../common/SearchableDropdown';
import AidLiteracyFields from '../../shared/AidLiteracyFields';
import AidFamilyHeadPersonalFields from '../../shared/AidFamilyHeadPersonalFields';
import AidPropertyOwnership from '../../shared/AidPropertyOwnership';
import AidResidentHousing from '../../shared/AidResidentHousing';
import AidLivestockIntake from '../../shared/AidLivestockIntake';
import AidVehicleIntake from '../../shared/AidVehicleIntake';
import AidEligibilityStatus from '../../shared/AidEligibilityStatus';
import AidEducationApplicationFields from '../../shared/AidEducationApplicationFields';
import AidRationApplicationFields from '../../shared/AidRationApplicationFields';
import AidMarriageGiftApplicationFields from '../../shared/AidMarriageGiftApplicationFields';
import AidFinancialAssistanceFields from '../../shared/AidFinancialAssistanceFields';
import AidCleanWaterSurveyForm from '../../shared/AidCleanWaterSurveyForm';
import AidZakatPermissionForm from '../../shared/AidZakatPermissionForm';
import AidConsentForm from '../../shared/AidConsentForm';
import AidWheelchairConsentForm from '../../shared/AidWheelchairConsentForm';
import AidMarriageGiftConsentForm from '../../shared/AidMarriageGiftConsentForm';
import AidCollapsibleSection from '../../shared/AidCollapsibleSection';
import AidFamilyMembersIntake from '../../shared/AidFamilyMembersIntake';
import AidFamilyTreePanel from '../../shared/AidFamilyTreePanel';
import AidApplicantCheckbox from '../../shared/AidApplicantCheckbox';
import AidApplicationDocsIntake from '../../shared/AidApplicationDocsIntake';
import { downloadAsPng } from '../../shared/downloadAsPng';
import { printAidElement } from '../../shared/printAidElement';
import { AidLangProvider, useAidLang } from '../../lang/AidLangContext';
import AidLangToggle from '../../lang/AidLangToggle';
import {
  saveAidFormDraft,
  loadAidFormDraft,
  clearAidFormDraft,
} from '../../../../../offline/aidOffline';
import { dispatchListDataChanged } from '../../../../../hooks/useListAutoRefresh';
import {
  AID_REQUEST_TYPES,
  AID_CASE_SOURCES,
  getAidProgramsForType,
  resolveExpectedAmountFields,
  formatExpectedAmount,
  getAidProgram,
  AID_MARITAL_STATUS,
  AID_GENDERS,
  AID_YES_NO,
  emptyLiteracyFields,
  emptyPropertyOwnershipFields,
  emptyResidentHousingFields,
  emptyLivestockFields,
  emptyVehicleFields,
  emptyEligibilityStatusFields,
  emptyEducationDetails,
  emptyRationDetails,
  emptyMarriageGiftDetails,
  emptyFinancialAssistanceDetails,
  emptyCleanWaterDetails,
  emptyZakatPermission,
  emptyConsentForm,
  emptyWheelchairConsentForm,
  emptyMarriageGiftConsentForm,
  isWheelchairConsentProgram,
  isMarriageGiftConsentProgram,
  resolveConsentVariant,
  emptyConsentForVariant,
  hasAidBiometric,
  cloneAidBiometric,
  resolveAidFormSubjectPerson,
  applicationDocsFromAttachments,
  emptyFamilyHeadRow,
  AID_FAMILY_HEAD_TYPES,
  AID_FAMILY_HEAD_TYPE_OPTIONS,
  AID_FAMILY_HEAD_GUARDIAN_SUBTYPES,
  AID_FAMILY_HEAD_BLOOD_TYPE_VALUES,
  AID_FAMILY_HEAD_GUARDIAN_SUBTYPE_VALUES,
  AID_FAMILY_HEAD_SELF_TYPE,
  calcAgeFromDob,
  formatCnicInput,
  formatPkPhoneInput,
  formatEducation,
  isValidCnic,
  isValidPkPhone,
  resolveRelatedPersonKinship,
} from '../../aidConstants';
import '../../aid.css';

/** Copy uploaded / pending photo fields between linked roles. */
const personPhotoFields = (p) => ({
  photo_url: p?.photo_url || '',
  photo_name: p?.photo_name || '',
  _photo_preview: p?._photo_preview || '',
  _photo_file: p?._photo_file || null,
});

const personHasPhoto = (p) =>
  !!(
    String(p?.photo_url || '').trim() ||
    String(p?._photo_preview || '').trim() ||
    p?._photo_file
  );

const withPhotoFrom = (target, source) => {
  if (!personHasPhoto(source) || personHasPhoto(target)) return target;
  return { ...target, ...personPhotoFields(source) };
};

const emptyPerson = {
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
  gender: '',
  date_of_birth: '',
  marital_status: '',
  vulnerability: '',
  is_applicant: false,
  occupation: '',
  monthly_income: '',
  household_dependency: '',
  education_level: '',
  is_alive: true,
  has_disability: false,
  disability_type: '',
  disability_certificate_url: '',
  disability_certificate_name: '',
  existing_person_id: null,
  ...emptyLiteracyFields(),
  ...emptyPropertyOwnershipFields(),
  ...emptyResidentHousingFields(),
  ...emptyLivestockFields(),
  ...emptyVehicleFields(),
  ...emptyEligibilityStatusFields(),
};

const cleanLivestockEntries = (p) => {
  if (!p?.has_livestock) return { has_livestock: false, livestock_entries: undefined };
  const rows = (p.livestock_entries || [])
    .map((row) => {
      const qty = Number(row.quantity);
      if (!row.animal_type || !Number.isFinite(qty) || qty <= 0) return null;
      const entry = {
        animal_type: row.animal_type,
        quantity: Math.floor(qty),
        ownership: row.ownership || 'personal',
      };
      if (entry.ownership === 'sharing') {
        if (row.owner_name?.trim()) entry.owner_name = row.owner_name.trim();
        if (row.owner_contact?.trim()) {
          entry.owner_contact = row.owner_contact.trim();
        }
      }
      return entry;
    })
    .filter(Boolean);
  return {
    has_livestock: true,
    livestock_entries: rows.length ? rows : undefined,
  };
};

const cleanPropertyEntries = (p) => {
  if (!p?.has_land) {
    return {
      has_land: false,
      property_type: undefined,
      property_area: undefined,
      property_details: undefined,
      property_entries: undefined,
    };
  }
  const raw =
    Array.isArray(p.property_entries) && p.property_entries.length
      ? p.property_entries
      : [
          {
            property_type: p.property_type || '',
            property_area: p.property_area || '',
            property_details: p.property_details || '',
          },
        ];
  const rows = raw
    .map((row) => {
      const property_type = String(row?.property_type || '').trim();
      const property_area = String(row?.property_area || '').trim();
      const property_details = String(row?.property_details || '').trim();
      if (!property_type && !property_area && !property_details) return null;
      return {
        property_type: property_type || undefined,
        property_area: property_area || undefined,
        property_details: property_details || undefined,
      };
    })
    .filter(Boolean);
  const first = rows[0] || null;
  return {
    has_land: true,
    property_type: first?.property_type || undefined,
    property_area: first?.property_area || undefined,
    property_details: first?.property_details || undefined,
    property_entries: rows.length ? rows : undefined,
  };
};

const cleanResidentEntries = (p) => {
  const raw =
    Array.isArray(p?.resident_entries) && p.resident_entries.length
      ? p.resident_entries
      : p?.resident_type
        ? [
            {
              resident_type: p.resident_type || '',
              resident_ownership_status: p.resident_ownership_status || '',
              resident_ownership_other: p.resident_ownership_other || '',
              rented_amount: p.rented_amount ?? '',
              house_area_marla: p.house_area_marla ?? '',
              house_details: p.house_details || '',
            },
          ]
        : [];
  const rows = raw
    .map((row) => {
      const resident_type = String(row?.resident_type || '').trim();
      if (!resident_type) return null;
      const entry = {
        resident_type,
        resident_ownership_status:
          String(row?.resident_ownership_status || '').trim() || undefined,
        resident_ownership_other:
          String(row?.resident_ownership_other || '').trim() || undefined,
        house_area_marla:
          row?.house_area_marla !== '' && row?.house_area_marla != null
            ? row.house_area_marla
            : undefined,
        house_details: String(row?.house_details || '').trim() || undefined,
      };
      if (resident_type === 'rented' && row?.rented_amount !== '' && row?.rented_amount != null) {
        entry.rented_amount = row.rented_amount;
      }
      return entry;
    })
    .filter(Boolean);
  const first = rows[0] || null;
  if (!first) {
    return {
      resident_type: undefined,
      resident_ownership_status: undefined,
      resident_ownership_other: undefined,
      rented_amount: undefined,
      house_area_marla: undefined,
      house_details: undefined,
      resident_entries: undefined,
    };
  }
  return {
    resident_type: first.resident_type,
    resident_ownership_status: first.resident_ownership_status,
    resident_ownership_other: first.resident_ownership_other,
    rented_amount: first.rented_amount,
    house_area_marla: first.house_area_marla,
    house_details: first.house_details,
    resident_entries: rows,
  };
};

const cleanVehicleEntries = (p) => {
  if (!p?.has_vehicle) {
    return {
      has_vehicle: false,
      vehicle_type: undefined,
      vehicle_entries: undefined,
    };
  }
  const raw =
    Array.isArray(p.vehicle_entries) && p.vehicle_entries.length
      ? p.vehicle_entries
      : [{ vehicle_type: p.vehicle_type || '' }];
  const rows = raw
    .map((row) => {
      const vehicle_type = String(row?.vehicle_type || '').trim();
      if (!vehicle_type) return null;
      const qty = Number(row?.quantity);
      const details = String(row?.details || '').trim();
      const entry = { vehicle_type };
      if (Number.isFinite(qty) && qty > 0) {
        entry.quantity = Math.floor(qty);
      }
      if (details) entry.details = details;
      return entry;
    })
    .filter(Boolean);
  const first = rows[0] || null;
  return {
    has_vehicle: true,
    vehicle_type: first?.vehicle_type || undefined,
    vehicle_entries: rows.length ? rows : undefined,
  };
};

const emptyRelative = () => ({ ...emptyPerson });

const familyHeadTypeLabel = (type) =>
  AID_FAMILY_HEAD_TYPES.find((t) => t.value === type)?.label || type || 'Family head';

const HEAD_TYPE_VALUES = new Set(AID_FAMILY_HEAD_TYPES.map((t) => t.value));

const FAMILY_TREE_BUCKETS = [
  'parents',
  'spouse',
  'children',
  'brothers',
  'sisters',
  'siblings',
  'grandparents',
  'grandchildren',
  'extended',
];

const toFamilyHeadType = (relation) => {
  const r = String(relation || '').toLowerCase();
  if (HEAD_TYPE_VALUES.has(r)) return r;
  if (r === 'husband') return 'spouse';
  return 'other';
};

/** Flatten ego family_tree buckets into kinship rows (with person). */
const flattenFamilyTreeRows = (tree) => {
  const rows = [];
  for (const key of FAMILY_TREE_BUCKETS) {
    for (const row of tree?.[key] || []) {
      if (row?.person?.id) rows.push(row);
    }
  }
  return rows;
};

/** Prefer type from intake notes: "Family head (Son)" / "Applicant / Family head (Father)". */
const parseFamilyHeadTypeFromNotes = (notes) => {
  const m = String(notes || '').match(/family\s*head\s*\(([^)]+)\)/i);
  if (!m) return null;
  const raw = m[1].trim().toLowerCase();
  const byValue = AID_FAMILY_HEAD_TYPES.find(
    (t) => String(t.value).toLowerCase() === raw,
  );
  if (byValue) return byValue.value;
  const byLabel = AID_FAMILY_HEAD_TYPES.find(
    (t) => String(t.label).toLowerCase() === raw,
  );
  if (byLabel) return byLabel.value;
  return toFamilyHeadType(raw);
};

/**
 * Members saved under a head use notes like
 * "Relative of father (son)" / "Applicant / relative of Father (daughter)".
 */
const parseRelativeOfHeadKey = (notes) => {
  // "Relative of Father (father) (son)" → prefer parenthetical head value, else label text
  const withValue = String(notes || '').match(
    /relative of\s+[^(/]*\(([^)]+)\)/i,
  );
  if (withValue) return withValue[1].trim().toLowerCase();
  const m = String(notes || '').match(/relative of\s+([^(,/]+)/i);
  if (!m) return null;
  return m[1].trim().toLowerCase();
};

const familyHeadMatchKey = (relationType) => {
  const value = String(relationType || '').toLowerCase();
  const label = String(familyHeadTypeLabel(relationType) || '').toLowerCase();
  return { value, label };
};

/** Primary Type DD value: self, blood relation, or "guardian" when subtype / guardian. */
const familyHeadPrimaryType = (relationType) => {
  const t = String(relationType || 'father').toLowerCase();
  if (t === AID_FAMILY_HEAD_SELF_TYPE) return AID_FAMILY_HEAD_SELF_TYPE;
  if (AID_FAMILY_HEAD_BLOOD_TYPE_VALUES.has(t)) return t;
  return 'guardian';
};

/** Subtype when primary is Guardian (Husband, custody, in-law, other). */
const familyHeadSubtype = (relationType) => {
  const t = String(relationType || '').toLowerCase();
  if (AID_FAMILY_HEAD_GUARDIAN_SUBTYPE_VALUES.has(t)) return t;
  return '';
};

/** Map API person → intake form row. */
const mapPersonToForm = (p, extras = {}) => {
  if (!p) return { ...emptyPerson, ...extras };
  const sliceDate = (v) => (v ? String(v).slice(0, 10) : '');
  return {
    ...emptyPerson,
    full_name: p.full_name || '',
    father_or_husband_name: p.father_or_husband_name || '',
    name_urdu: p.name_urdu || '',
    caste: p.caste || '',
    cnic: p.cnic || '',
    cnic_expiry: sliceDate(p.cnic_expiry),
    phone: p.phone || '',
    phone_alternate: p.phone_alternate || '',
    photo_url: p.photo_url || '',
    photo_name: p.photo_name || '',
    city: p.city || '',
    address: p.address || '',
    current_address: p.current_address || '',
    thumb_impression: p.thumb_impression || null,
    signature: p.signature || null,
    province: p.province || '',
    district: p.district || '',
    tehsil: p.tehsil || '',
    union_council: p.union_council || '',
    landmark: p.landmark || '',
    gender: p.gender || '',
    date_of_birth: sliceDate(p.date_of_birth),
    marital_status: p.marital_status || '',
    vulnerability: p.vulnerability || '',
    occupation: p.occupation || '',
    monthly_income: p.monthly_income ?? '',
    household_dependency: p.household_dependency || '',
    education_level: p.education_level || '',
    literacy_status: p.literacy_status || '',
    literacy_category: p.literacy_category || '',
    student_class: p.student_class || '',
    student_class_type: p.student_class_type || '',
    student_class_name: p.student_class_name || '',
    is_alive: p.is_alive !== false,
    has_disability: !!p.has_disability,
    disability_type: p.disability_type || '',
    disability_certificate_url: p.disability_certificate_url || '',
    disability_certificate_name: p.disability_certificate_name || '',
    has_land: !!p.has_land,
    property_type: p.property_type || '',
    property_area: p.property_area || '',
    property_details: p.property_details || '',
    property_entries: Array.isArray(p.property_entries)
      ? p.property_entries
      : p.has_land && (p.property_type || p.property_details || p.property_area)
        ? [
            {
              property_type: p.property_type || '',
              property_area: p.property_area || '',
              property_details: p.property_details || '',
            },
          ]
        : [],
    resident_type: p.resident_type || '',
    resident_ownership_status: p.resident_ownership_status || '',
    resident_ownership_other: p.resident_ownership_other || '',
    rented_amount: p.rented_amount ?? '',
    house_area_marla: p.house_area_marla ?? '',
    house_details: p.house_details || '',
    resident_entries: Array.isArray(p.resident_entries)
      ? p.resident_entries
      : p.resident_type
        ? [
            {
              resident_type: p.resident_type || '',
              resident_ownership_status: p.resident_ownership_status || '',
              resident_ownership_other: p.resident_ownership_other || '',
              rented_amount: p.rented_amount ?? '',
              house_area_marla: p.house_area_marla ?? '',
              house_details: p.house_details || '',
            },
          ]
        : [],
    has_livestock: !!p.has_livestock,
    livestock_entries: Array.isArray(p.livestock_entries)
      ? p.livestock_entries
      : [],
    has_vehicle: !!p.has_vehicle,
    vehicle_type: p.vehicle_type || '',
    vehicle_entries: Array.isArray(p.vehicle_entries)
      ? p.vehicle_entries
      : p.has_vehicle && p.vehicle_type
        ? [{ vehicle_type: p.vehicle_type }]
        : [],
    necta_status: p.necta_status || '',
    necta_document_url: p.necta_document_url || '',
    necta_document_name: p.necta_document_name || '',
    bisp_status: p.bisp_status || '',
    existing_person_id: p.id || null,
    is_applicant: false,
    is_beneficiary: false,
    ...extras,
  };
};

/** Map family relation → API writer_relation enum. */
const mapRelationToWriterRelation = (rel) => {
  const r = String(rel || '').toLowerCase();
  if (r === 'self') return 'self';
  if (['father', 'mother', 'spouse', 'guardian', 'relative', 'other'].includes(r)) {
    return r;
  }
  if (
    [
      'brother',
      'sister',
      'step_brother',
      'step_sister',
      'half_brother',
      'half_sister',
      'sibling',
      'son',
      'daughter',
      'child',
      'uncle',
      'aunt',
      'cousin',
      'nephew',
      'niece',
      'grandfather',
      'grandmother',
      'maternal_grandfather',
      'maternal_grandmother',
      'grandchild',
      'husband',
    ].includes(r)
  ) {
    return 'relative';
  }
  if (r === 'custody_holder' || r === 'in_law') return 'other';
  return 'relative';
};

/** True when optional relative/spouse has any real data (not just empty shell). */
const personHasEnteredDetails = (p) => {
  if (!p || typeof p !== 'object') return false;
  if (p.existing_person_id) return true;
  if (p.is_applicant) return true;
  const keys = [
    'full_name',
    'name_urdu',
    'cnic',
    'phone',
    'father_or_husband_name',
    'photo_url',
    '_photo_preview',
    'date_of_birth',
    'caste',
    'address',
    'current_address',
    'city',
  ];
  return keys.some((k) => String(p[k] || '').trim().length > 0);
};

const RelativeFields = ({ title, value, onChange, compact }) => {
  const { t } = useAidLang();
  return (
    <div
      className={`aid-relative-block${compact ? ' aid-relative-block--compact' : ''}`}
    >
      <AidFamilyHeadPersonalFields
        title={title || t('identity')}
        subtitle={t('identityOptionalSubtitle')}
        contactTitle={t('contactAddress')}
        contactSubtitle={t('contactOptionalSubtitle')}
        fieldsRequired={false}
        showSidebar={false}
        value={value}
        onChange={onChange}
        afterGrid={
          <label className="aid-toggle" style={{ alignSelf: 'end' }}>
            <input
              type="checkbox"
              checked={value?.is_alive !== false}
              onChange={(e) =>
                onChange({ ...value, is_alive: e.target.checked })
              }
            />
            {t('alive')}
          </label>
        }
      />
      <AidLiteracyFields value={value} onChange={onChange} />
    </div>
  );
};

const cleanPersonPayload = (p) => {
  if (!p?.full_name?.trim()) return null;
  return {
    full_name: p.full_name.trim(),
    father_or_husband_name: p.father_or_husband_name?.trim() || undefined,
    name_urdu: p.name_urdu?.trim() || undefined,
    caste: p.caste?.trim() || undefined,
    cnic: p.cnic || undefined,
    cnic_expiry: p.cnic_expiry || undefined,
    phone: p.phone || undefined,
    phone_alternate: p.phone_alternate?.trim() || undefined,
    photo_url: p._photo_cleared
      ? null
      : p.photo_url || undefined,
    photo_name: p._photo_cleared
      ? null
      : p.photo_name || undefined,
    gender: p.gender || undefined,
    date_of_birth: p.date_of_birth || undefined,
    marital_status: p.marital_status || undefined,
    vulnerability: p.vulnerability || undefined,
    occupation: p.occupation || p.literacy_category || undefined,
    monthly_income: p.monthly_income || undefined,
    household_dependency: p.household_dependency || undefined,
    education_level: p.education_level || undefined,
    literacy_status: p.literacy_status || undefined,
    literacy_category: p.literacy_category || undefined,
    student_class: p.student_class || undefined,
    student_class_type: p.student_class_type || undefined,
    student_class_name: p.student_class_name || undefined,
    has_disability: !!p.has_disability,
    disability_type: p.has_disability ? p.disability_type || undefined : undefined,
    disability_certificate_url: p.has_disability
      ? p.disability_certificate_url || undefined
      : undefined,
    disability_certificate_name: p.has_disability
      ? p.disability_certificate_name || undefined
      : undefined,
    ...cleanPropertyEntries(p),
    ...cleanResidentEntries(p),
    ...cleanLivestockEntries(p),
    ...cleanVehicleEntries(p),
    necta_status: p.necta_status || undefined,
    necta_document_url: p.necta_document_url || undefined,
    necta_document_name: p.necta_document_name || undefined,
    bisp_status: p.bisp_status || undefined,
    is_alive: p.is_alive !== false,
    address: p.address?.trim() || undefined,
    current_address: p.current_address?.trim() || undefined,
    thumb_impression: hasAidBiometric(p.thumb_impression)
      ? p.thumb_impression
      : undefined,
    signature: hasAidBiometric(p.signature) ? p.signature : undefined,
    city: p.city || p.district || undefined,
    province: p.province || undefined,
    district: p.district || undefined,
    tehsil: p.tehsil || undefined,
    union_council: p.union_council || undefined,
    landmark: p.landmark || undefined,
  };
};

const AidApplicationAddInner = () => {
  const { t, lang, rtl } = useAidLang();
  const navigate = useNavigate();
  const { id: editIdParam } = useParams();
  const editId = editIdParam ? Number(editIdParam) : null;
  const isEdit = Number.isFinite(editId) && editId > 0;

  const [beneficiaryMode, setBeneficiaryMode] = useState('new');
  const [beneficiaryId, setBeneficiaryId] = useState(null);
  const [existingBeneficiary, setExistingBeneficiary] = useState(null);
  const [beneficiary, setBeneficiary] = useState({
    ...emptyPerson,
    is_applicant: true,
  });
  const [form, setForm] = useState(() => {
    const amt = resolveExpectedAmountFields('health', '');
    return {
      title: '',
      request_summary: '',
      requested_aid_type: 'health',
      case_source: 'walk_in',
      aid_program: amt.aid_program,
      expected_amount: amt.expected_amount,
      expected_amount_max: amt.expected_amount_max,
    };
  });
  const [educationDetails, setEducationDetails] = useState(
    emptyEducationDetails(),
  );
  const [rationDetails, setRationDetails] = useState(emptyRationDetails());
  const [marriageGiftDetails, setMarriageGiftDetails] = useState(
    emptyMarriageGiftDetails(),
  );
  const [financialAssistanceDetails, setFinancialAssistanceDetails] = useState(
    emptyFinancialAssistanceDetails(),
  );
  const [cleanWaterDetails, setCleanWaterDetails] = useState(
    emptyCleanWaterDetails(),
  );
  const [zakatPermission, setZakatPermission] = useState(emptyZakatPermission());
  const [consentForm, setConsentForm] = useState(emptyConsentForm());
  const [applicationDocs, setApplicationDocs] = useState({});
  const [missingDocuments, setMissingDocuments] = useState([]);
  const [familyHeads, setFamilyHeads] = useState([
    {
      ...emptyFamilyHeadRow('father'),
      is_applicant: false,
      is_beneficiary: false,
    },
  ]);
  const [spouse, setSpouse] = useState(emptyRelative());
  /** Empty optional spouse stays collapsed until Add or existing data. */
  const [spouseFormOpen, setSpouseFormOpen] = useState(false);
  /** Beneficiary tab — any relatives (children, siblings, parents, …). */
  const [beneficiaryMembers, setBeneficiaryMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);
  const [editStatus, setEditStatus] = useState(null);
  const [error, setError] = useState('');
  const [formTab, setFormTab] = useState('family');
  const applicationCaptureRef = useRef(null);
  const zakatCaptureRef = useRef(null);
  const consentCaptureRef = useRef(null);
  const [pngDownloading, setPngDownloading] = useState(false);
  const [offlineDraftReady, setOfflineDraftReady] = useState(false);
  /** Server `updated_at` at last hydrate — gates local draft restore on edit. */
  const baseUpdatedAtRef = useRef('');
  const isDraftEdit =
    isEdit &&
    (editStatus === 'draft' || editStatus === 'incomplete_docs');
  const draftsListPath = '/dms/aid/applications/drafts/list';
  const offlineFormKey = `aid_form_${isEdit ? editId : 'new'}`;

  const applyLocalDraftSnapshot = useCallback((snap) => {
    if (!snap || typeof snap !== 'object') return;
    if (snap.form) setForm(snap.form);
    if (snap.beneficiary) setBeneficiary(snap.beneficiary);
    if (snap.familyHeads) setFamilyHeads(snap.familyHeads);
    if (snap.spouse) setSpouse(snap.spouse);
    if (snap.beneficiaryMembers) setBeneficiaryMembers(snap.beneficiaryMembers);
    if (snap.formTab) setFormTab(snap.formTab);
    if (snap.educationDetails) setEducationDetails(snap.educationDetails);
    if (snap.rationDetails) setRationDetails(snap.rationDetails);
    if (snap.marriageGiftDetails) setMarriageGiftDetails(snap.marriageGiftDetails);
    if (snap.financialAssistanceDetails) {
      setFinancialAssistanceDetails(snap.financialAssistanceDetails);
    }
    if (snap.cleanWaterDetails) setCleanWaterDetails(snap.cleanWaterDetails);
    if (snap.zakatPermission) setZakatPermission(snap.zakatPermission);
    if (snap.consentForm) setConsentForm(snap.consentForm);
    if (snap.applicationDocs) setApplicationDocs(snap.applicationDocs);
    if (Array.isArray(snap.missingDocuments)) {
      setMissingDocuments(snap.missingDocuments);
    }
    if (snap.beneficiaryMode) setBeneficiaryMode(snap.beneficiaryMode);
    if (snap.beneficiaryId != null) setBeneficiaryId(snap.beneficiaryId);
    if (snap.existingBeneficiary !== undefined) {
      setExistingBeneficiary(snap.existingBeneficiary);
    }
    if (snap.spouseFormOpen != null) setSpouseFormOpen(!!snap.spouseFormOpen);
    if (snap.editStatus) setEditStatus(snap.editStatus);
  }, []);

  const resetFormToBlank = useCallback(() => {
    const amt = resolveExpectedAmountFields('health', '');
    setBeneficiaryMode('new');
    setBeneficiaryId(null);
    setExistingBeneficiary(null);
    setBeneficiary({ ...emptyPerson, is_applicant: true });
    setForm({
      title: '',
      request_summary: '',
      requested_aid_type: 'health',
      case_source: 'walk_in',
      aid_program: amt.aid_program,
      expected_amount: amt.expected_amount,
      expected_amount_max: amt.expected_amount_max,
    });
    setEducationDetails(emptyEducationDetails());
    setRationDetails(emptyRationDetails());
    setMarriageGiftDetails(emptyMarriageGiftDetails());
    setFinancialAssistanceDetails(emptyFinancialAssistanceDetails());
    setCleanWaterDetails(emptyCleanWaterDetails());
    setZakatPermission(emptyZakatPermission());
    setConsentForm(emptyConsentForm());
    setApplicationDocs({});
    setMissingDocuments([]);
    setFamilyHeads([
      {
        ...emptyFamilyHeadRow('father'),
        is_applicant: false,
        is_beneficiary: false,
      },
    ]);
    setSpouse(emptyRelative());
    setSpouseFormOpen(false);
    setBeneficiaryMembers([]);
    setFormTab('family');
    setError('');
  }, []);

  // Autosave full intake state locally only (no API) — same idea as persisted filters
  useEffect(() => {
    if (!offlineDraftReady) return undefined;
    if (isEdit && loadingEdit) return undefined;
    const t = setTimeout(() => {
      saveAidFormDraft(offlineFormKey, {
        form,
        formTab,
        beneficiary,
        familyHeads,
        spouse,
        beneficiaryMembers,
        educationDetails,
        rationDetails,
        marriageGiftDetails,
        financialAssistanceDetails,
        cleanWaterDetails,
        zakatPermission,
        consentForm,
        applicationDocs,
        missingDocuments,
        beneficiaryMode,
        beneficiaryId,
        existingBeneficiary,
        spouseFormOpen,
        editStatus,
        // Marks edit snapshots safe to re-apply after server hydrate (tab switch)
        capturedAfterHydrate: isEdit ? true : undefined,
        baseUpdatedAt: isEdit ? baseUpdatedAtRef.current || undefined : undefined,
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [
    offlineDraftReady,
    offlineFormKey,
    isEdit,
    loadingEdit,
    form,
    formTab,
    beneficiary,
    familyHeads,
    spouse,
    beneficiaryMembers,
    educationDetails,
    rationDetails,
    marriageGiftDetails,
    financialAssistanceDetails,
    cleanWaterDetails,
    zakatPermission,
    consentForm,
    applicationDocs,
    missingDocuments,
    beneficiaryMode,
    beneficiaryId,
    existingBeneficiary,
    spouseFormOpen,
    editStatus,
  ]);

  const hydrateFromApplication = useCallback(async (appId) => {
    setLoadingEdit(true);
    setError('');
    try {
      const appRes = await axiosInstance.get(`/aid/applications/${appId}`);
      const app = appRes.data?.data || appRes.data;
      if (!app?.id) throw new Error('Application not found');

      setEditStatus(app.status || null);
      baseUpdatedAtRef.current = app.updated_at ? String(app.updated_at) : '';

      const closed =
        app.status === 'rejected' || app.status === 'delivered';
      if (closed) {
        throw new Error('This application is closed and cannot be edited');
      }

      const benId =
        app.beneficiary?.id || app.beneficiary_person_id || null;
      // Prefer family_tree embedded on application findOne; fall back to people detail
      let personDetail =
        app.family_tree != null
          ? {
              person: app.beneficiary || null,
              family_tree: app.family_tree || {},
              family_counts: app.family_counts || {},
              kinship: app.kinship || [],
            }
          : null;
      if (benId && app.family_tree == null) {
        try {
          const peopleRes = await axiosInstance.get(`/aid/people/${benId}`);
          personDetail = peopleRes.data?.data || null;
        } catch (err) {
          throw new Error(
            err?.response?.data?.message ||
              'Failed to load beneficiary family tree — cannot safely edit without family data',
          );
        }
      }
      if (benId && (!personDetail || personDetail.family_tree == null)) {
        throw new Error(
          'Beneficiary family tree missing — cannot safely edit without family data',
        );
      }

      const beneficiaryPerson =
        personDetail?.person || app.beneficiary || null;
      const writer = app.writer || null;
      const writerId = writer?.id || app.writer_person_id || null;
      const beneficiaryPersonId = beneficiaryPerson?.id || benId;
      const isWriterSelf =
        !writerId ||
        Number(writerId) === Number(beneficiaryPersonId) ||
        String(app.writer_relation || '').toLowerCase() === 'self';

      const aidType = app.requested_aid_type || 'health';
      const resolved = resolveExpectedAmountFields(
        aidType,
        app.aid_program || '',
      );
      setForm({
        title: app.title || '',
        request_summary: app.request_summary || '',
        requested_aid_type: aidType,
        case_source: app.case_source || 'walk_in',
        aid_program: app.aid_program || resolved.aid_program || '',
        expected_amount:
          app.expected_amount != null && app.expected_amount !== ''
            ? Number(app.expected_amount)
            : resolved.expected_amount,
        expected_amount_max:
          app.expected_amount_max != null && app.expected_amount_max !== ''
            ? Number(app.expected_amount_max)
            : resolved.expected_amount_max,
      });
      setEducationDetails(
        app.education_details
          ? { ...emptyEducationDetails(), ...app.education_details }
          : emptyEducationDetails(),
      );
      setRationDetails(
        app.ration_details
          ? { ...emptyRationDetails(), ...app.ration_details }
          : emptyRationDetails(),
      );
      setMarriageGiftDetails(
        app.marriage_gift_details
          ? { ...emptyMarriageGiftDetails(), ...app.marriage_gift_details }
          : emptyMarriageGiftDetails(),
      );
      setFinancialAssistanceDetails(
        app.financial_assistance_details
          ? {
              ...emptyFinancialAssistanceDetails(),
              ...app.financial_assistance_details,
            }
          : emptyFinancialAssistanceDetails(),
      );
      setCleanWaterDetails(
        app.clean_water_details
          ? { ...emptyCleanWaterDetails(), ...app.clean_water_details }
          : emptyCleanWaterDetails(),
      );
      setZakatPermission(
        app.zakat_permission
          ? { ...emptyZakatPermission(), ...app.zakat_permission }
          : emptyZakatPermission(),
      );
      setConsentForm(() => {
        const variant = resolveConsentVariant(
          app.requested_aid_type,
          app.aid_program,
        );
        if (app.consent_form) {
          const fromStored =
            app.consent_form.variant ||
            (variant !== 'media' ? variant : 'media');
          return {
            ...emptyConsentForVariant(fromStored),
            ...app.consent_form,
            variant: app.consent_form.variant || fromStored,
          };
        }
        return emptyConsentForVariant(variant);
      });

      const fromAppMissing = Array.isArray(app.missing_documents)
        ? app.missing_documents.map((k) => String(k).toLowerCase())
        : [];
      const fromAttachMissing = (app.attachments || [])
        .filter((a) => a?.is_missing && a?.context)
        .map((a) => String(a.context).toLowerCase());
      setMissingDocuments([
        ...new Set([...fromAppMissing, ...fromAttachMissing]),
      ]);
      setApplicationDocs(applicationDocsFromAttachments(app.attachments || []));

      const tree = personDetail?.family_tree || {};
      const spouseRows = tree.spouse || [];
      const rowRelation = (row) =>
        String(row?.relation_type || row?.relation || '').toLowerCase();
      const isFamilyHeadRow = (row) => {
        const notes = String(row?.notes || '').toLowerCase();
        if (notes.includes('family head')) return true;
        // Legacy father/mother edges without notes still count as heads
        return ['father', 'mother'].includes(rowRelation(row));
      };

      // Deduplicate all kinship rows by person id (prefer family-head-marked rows)
      const byPersonId = new Map();
      for (const row of flattenFamilyTreeRows(tree)) {
        const pid = Number(row?.person?.id);
        if (!Number.isFinite(pid) || pid <= 0) continue;
        const prev = byPersonId.get(pid);
        if (!prev || (isFamilyHeadRow(row) && !isFamilyHeadRow(prev))) {
          byPersonId.set(pid, row);
        }
      }
      const uniqueRows = Array.from(byPersonId.values());
      const headSourceRows = uniqueRows.filter(isFamilyHeadRow);
      const headPersonIds = new Set(
        headSourceRows
          .map((r) => Number(r?.person?.id))
          .filter((id) => Number.isFinite(id) && id > 0),
      );
      const spousePersonIds = new Set(
        (spouseRows || [])
          .map((r) => Number(r?.person?.id))
          .filter((id) => Number.isFinite(id) && id > 0),
      );

      let heads = [];
      if (headSourceRows.length > 0) {
        heads = headSourceRows.map((row) => {
          const fromNotes = parseFamilyHeadTypeFromNotes(row.notes);
          const rel =
            fromNotes || toFamilyHeadType(rowRelation(row)) || 'other';
          const pid = row.person?.id;
          return mapPersonToForm(row.person, {
            _relation_type: rel,
            is_beneficiary: Number(pid) === Number(beneficiaryPersonId),
            is_applicant:
              !isWriterSelf && Number(pid) === Number(writerId),
            _family_members: [],
          });
        });
        setFamilyHeads(heads);
        const benIsHead = heads.some((h) => h.is_beneficiary);
        if (benIsHead) {
          setBeneficiary({ ...emptyPerson, is_applicant: false });
          setBeneficiaryMode('new');
          setBeneficiaryId(null);
          setExistingBeneficiary(null);
        } else {
          setBeneficiary(
            mapPersonToForm(beneficiaryPerson, {
              is_applicant: isWriterSelf,
            }),
          );
          setBeneficiaryMode('new');
          setBeneficiaryId(beneficiaryPersonId);
          setExistingBeneficiary(beneficiaryPerson);
        }
      } else {
        heads = [
          mapPersonToForm(beneficiaryPerson, {
            _relation_type: 'father',
            is_beneficiary: true,
            is_applicant: isWriterSelf,
            _family_members: [],
          }),
        ];
        setFamilyHeads(heads);
        setBeneficiary({ ...emptyPerson, is_applicant: false });
        setBeneficiaryMode('new');
        setBeneficiaryId(beneficiaryPersonId);
        setExistingBeneficiary(beneficiaryPerson);
      }

      if (spouseRows[0]?.person) {
        const sp = spouseRows[0].person;
        setSpouse(
          mapPersonToForm(sp, {
            marital_status: sp.marital_status || 'married',
            is_applicant:
              !isWriterSelf && Number(sp.id) === Number(writerId),
          }),
        );
        setSpouseFormOpen(true);
      } else {
        setSpouse(emptyRelative());
        setSpouseFormOpen(false);
      }

      // Nest relatives under the Family Head they were saved with; else beneficiary list
      const membersForBeneficiary = [];
      const findHeadIndexForNotes = (notes) => {
        const key = parseRelativeOfHeadKey(notes);
        if (!key) return -1;
        return heads.findIndex((h) => {
          const { value, label } = familyHeadMatchKey(h._relation_type);
          return key === value || key === label;
        });
      };

      for (const row of uniqueRows) {
        const pid = Number(row?.person?.id);
        if (!Number.isFinite(pid) || pid <= 0) continue;
        if (headPersonIds.has(pid)) continue;
        if (spousePersonIds.has(pid)) continue;
        if (
          Number(pid) === Number(beneficiaryPersonId) &&
          !isFamilyHeadRow(row)
        ) {
          continue;
        }

        const rel = resolveRelatedPersonKinship({
          relation_type: rowRelation(row) || 'other',
        });
        const member = mapPersonToForm(row.person, {
          relation_type: rel,
          is_applicant:
            !isWriterSelf && Number(pid) === Number(writerId),
        });

        const headIdx = findHeadIndexForNotes(row.notes);
        if (headIdx >= 0) {
          heads[headIdx] = {
            ...heads[headIdx],
            _family_members: [
              ...(heads[headIdx]._family_members || []),
              member,
            ],
          };
        } else {
          membersForBeneficiary.push(member);
        }
      }
      setFamilyHeads(heads.map((h) => ({ ...h })));
      setBeneficiaryMembers(membersForBeneficiary);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load application for edit',
      );
    } finally {
      setLoadingEdit(false);
    }
  }, []);

  // Bootstrap: new → local draft; edit → server hydrate, then only same-revision local in-progress draft
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await loadAidFormDraft(offlineFormKey);
        if (cancelled) return;
        if (isEdit) {
          await hydrateFromApplication(editId);
          if (cancelled) return;
          const serverUpdatedAt = baseUpdatedAtRef.current || '';
          // Restore tab-switch work only when it was based on the same server revision
          if (
            snap?.capturedAfterHydrate &&
            serverUpdatedAt &&
            String(snap.baseUpdatedAt || '') === serverUpdatedAt
          ) {
            applyLocalDraftSnapshot(snap);
          } else if (snap?.capturedAfterHydrate) {
            // Stale local draft would wipe newer server data — drop it
            await clearAidFormDraft(offlineFormKey).catch(() => {});
          }
        } else if (snap) {
          applyLocalDraftSnapshot(snap);
        }
      } finally {
        if (!cancelled) setOfflineDraftReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per form key / edit id
  }, [offlineFormKey, isEdit, editId]);

  const handleClearForm = useCallback(async () => {
    if (!window.confirm(t('clearFormConfirm'))) return;
    await clearAidFormDraft(offlineFormKey).catch(() => {});
    if (isEdit) {
      resetFormToBlank();
      setLoadingEdit(true);
      setOfflineDraftReady(false);
      await hydrateFromApplication(editId);
      setOfflineDraftReady(true);
    } else {
      resetFormToBlank();
    }
    toast.info(t('clearForm'));
  }, [
    t,
    offlineFormKey,
    isEdit,
    editId,
    resetFormToBlank,
    hydrateFromApplication,
  ]);

  const handleDownloadPng = async (ref, fileName) => {
    if (!ref?.current || pngDownloading) return;
    setPngDownloading(true);
    try {
      await downloadAsPng(ref.current, fileName);
    } catch (err) {
      toast.error(err?.message || 'Failed to download PNG');
    } finally {
      setPngDownloading(false);
    }
  };

  const FORM_TABS = [
    { id: 'family', label: t('tabFamily'), hint: t('tabFamilyHint') },
    { id: 'beneficiary', label: t('tabBeneficiary'), hint: t('tabBeneficiaryHint') },
    { id: 'family_tree', label: t('tabFamilyTree'), hint: t('tabFamilyTreeHint') },
    { id: 'request', label: t('tabRequest'), hint: t('tabRequestHint') },
    ...(form.requested_aid_type === 'clean_water'
      ? [{ id: 'survey', label: t('tabSurvey'), hint: t('tabSurveyHint') }]
      : []),
    { id: 'attachments', label: t('tabAttachments'), hint: t('tabAttachmentsHint') },
  ];
  const stepIndex = FORM_TABS.findIndex((t) => t.id === formTab);
  const stepProgress = ((stepIndex + 1) / FORM_TABS.length) * 100;

  /** Family Head marked as the beneficiary (single-person household). */
  const headAsBeneficiary =
    familyHeads.find((h) => h.is_beneficiary) || null;

  /** Person marked Applicant (writer). */
  const zakatApplicantPerson = useMemo(() => {
    if (beneficiary.is_applicant) return beneficiary;
    if (spouse.is_applicant) return spouse;
    const head = familyHeads.find((h) => h.is_applicant);
    if (head) return head;
    const bm = beneficiaryMembers.find((m) => m.is_applicant);
    if (bm) return bm;
    for (let i = 0; i < familyHeads.length; i += 1) {
      const m = (familyHeads[i]._family_members || []).find(
        (row) => row.is_applicant,
      );
      if (m) return m;
    }
    return headAsBeneficiary || beneficiary;
  }, [
    beneficiary,
    spouse,
    familyHeads,
    beneficiaryMembers,
    headAsBeneficiary,
  ]);

  const beneficiaryPersonForForms = useMemo(
    () =>
      headAsBeneficiary ||
      (beneficiaryMode === 'existing' ? existingBeneficiary : beneficiary),
    [
      headAsBeneficiary,
      beneficiaryMode,
      existingBeneficiary,
      beneficiary,
    ],
  );

  /**
   * Zakat / Consent form subject: beneficiary for all programs,
   * applicant for Marriage Gift. Thumb + signature come from this person.
   */
  const formSubjectPerson = useMemo(
    () =>
      resolveAidFormSubjectPerson({
        aidType: form.requested_aid_type,
        aidProgram: form.aid_program,
        beneficiary: beneficiaryPersonForForms,
        applicant: zakatApplicantPerson,
      }),
    [
      form.requested_aid_type,
      form.aid_program,
      beneficiaryPersonForForms,
      zakatApplicantPerson,
    ],
  );

  const formSubjectPersonId = useMemo(() => {
    const p = formSubjectPerson;
    const id = Number(p?.existing_person_id || p?.id || 0);
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [formSubjectPerson]);

  const persistFormSubjectBiometrics = useCallback(
    async (partial) => {
      if (!formSubjectPersonId || !partial) return;
      const payload = {};
      if (partial.thumb_impression !== undefined) {
        payload.thumb_impression = partial.thumb_impression;
      }
      if (partial.signature !== undefined) {
        payload.signature = partial.signature;
      }
      if (!Object.keys(payload).length) return;
      try {
        await axiosInstance.patch(
          `/aid/people/${formSubjectPersonId}`,
          payload,
        );
      } catch {
        /* non-blocking — form still keeps local capture */
      }
    },
    [formSubjectPersonId],
  );

  const handleZakatBiometricSaved = useCallback(
    (field, capture) => {
      if (field === 'applicant_thumb') {
        persistFormSubjectBiometrics({
          thumb_impression: cloneAidBiometric(capture),
        });
      } else if (field === 'applicant_signature') {
        persistFormSubjectBiometrics({
          signature: cloneAidBiometric(capture),
        });
      }
    },
    [persistFormSubjectBiometrics],
  );

  const handleConsentBiometricSaved = useCallback(
    (field, capture) => {
      if (
        field === 'applicant_thumb' ||
        field === 'receiver_thumb'
      ) {
        persistFormSubjectBiometrics({
          thumb_impression: cloneAidBiometric(capture),
        });
      } else if (
        field === 'applicant_signature' ||
        field === 'receiver_signature'
      ) {
        persistFormSubjectBiometrics({
          signature: cloneAidBiometric(capture),
        });
      }
    },
    [persistFormSubjectBiometrics],
  );

  useEffect(() => {
    const person = formSubjectPerson;
    if (!person) return;
    const age = calcAgeFromDob(person.date_of_birth);
    const eduLabel = formatEducation(person.education_level);
    const education =
      eduLabel && eduLabel !== '—'
        ? eduLabel
        : person.education_level ||
          person.student_class ||
          person.literacy_category ||
          '';
    const today = new Date().toISOString().slice(0, 10);
    const thumb =
      cloneAidBiometric(person.thumb_impression) || null;
    const signature = cloneAidBiometric(person.signature) || null;
    setZakatPermission((prev) => {
      // Prefill empty slots only — never wipe hydrated / user-entered letter fields
      const next = {
        ...prev,
        form_date: prev.form_date || today,
        applicant_name: prev.applicant_name || person.full_name || '',
        age: prev.age || (age != null ? String(age) : ''),
        education: prev.education || education || '',
        cnic: prev.cnic || formatCnicInput(person.cnic || ''),
        phone: prev.phone || formatPkPhoneInput(person.phone || ''),
        applicant_thumb: hasAidBiometric(prev.applicant_thumb)
          ? prev.applicant_thumb
          : thumb,
        applicant_signature: hasAidBiometric(prev.applicant_signature)
          ? prev.applicant_signature
          : signature,
      };
      if (
        next.form_date === prev.form_date &&
        next.applicant_name === prev.applicant_name &&
        next.age === prev.age &&
        next.education === prev.education &&
        next.cnic === prev.cnic &&
        next.phone === prev.phone &&
        next.applicant_thumb === prev.applicant_thumb &&
        next.applicant_signature === prev.applicant_signature
      ) {
        return prev;
      }
      return next;
    });
  }, [formSubjectPerson]);

  /** Prefill media consent from form subject (beneficiary, or applicant for MG). */
  useEffect(() => {
    if (
      isWheelchairConsentProgram(form.aid_program) ||
      isMarriageGiftConsentProgram(
        form.requested_aid_type,
        form.aid_program,
      )
    ) {
      return;
    }
    const person = formSubjectPerson;
    if (!person) return;
    const today = new Date().toISOString().slice(0, 10);
    const thumb = cloneAidBiometric(person.thumb_impression);
    const signature = cloneAidBiometric(person.signature);
    setConsentForm((prev) => {
      if (prev?.variant && prev.variant !== 'media') return prev;
      const next = {
        ...emptyConsentForm(),
        ...prev,
        variant: 'media',
        form_date: prev.form_date || today,
        full_name: prev.full_name || person.full_name || '',
        parentage_or_spouse:
          prev.parentage_or_spouse || person.father_or_husband_name || '',
        cnic: prev.cnic || formatCnicInput(person.cnic || ''),
        applicant_thumb: hasAidBiometric(prev.applicant_thumb)
          ? prev.applicant_thumb
          : thumb,
        applicant_signature: hasAidBiometric(prev.applicant_signature)
          ? prev.applicant_signature
          : signature,
      };
      if (
        next.form_date === prev.form_date &&
        next.full_name === prev.full_name &&
        next.parentage_or_spouse === prev.parentage_or_spouse &&
        next.cnic === prev.cnic &&
        next.applicant_thumb === prev.applicant_thumb &&
        next.applicant_signature === prev.applicant_signature
      ) {
        return prev;
      }
      return next;
    });
  }, [
    form.aid_program,
    form.requested_aid_type,
    formSubjectPerson,
  ]);

  /** Prefill wheelchair affidavit from applicant + beneficiary; biometrics from subject. */
  useEffect(() => {
    if (!isWheelchairConsentProgram(form.aid_program)) return;
    const applicant = zakatApplicantPerson;
    const bene = beneficiaryPersonForForms;
    if (!applicant && !bene) return;
    const today = new Date().toISOString().slice(0, 10);
    const ageSrc = bene || applicant;
    const age = calcAgeFromDob(ageSrc?.date_of_birth);
    const subject = formSubjectPerson || bene || applicant;
    const thumb = cloneAidBiometric(subject?.thumb_impression);
    const signature = cloneAidBiometric(subject?.signature);
    setConsentForm((prev) => {
      if (prev?.variant && prev.variant !== 'wheelchair') return prev;
      const next = {
        ...emptyWheelchairConsentForm(),
        ...prev,
        variant: 'wheelchair',
        form_date: prev.form_date || today,
        applicant_name: applicant?.full_name || prev.applicant_name || '',
        applicant_cnic: formatCnicInput(
          applicant?.cnic || prev.applicant_cnic || '',
        ),
        beneficiary_name: bene?.full_name || prev.beneficiary_name || '',
        beneficiary_cnic: formatCnicInput(
          bene?.cnic || prev.beneficiary_cnic || '',
        ),
        mobile: formatPkPhoneInput(
          bene?.phone || applicant?.phone || prev.mobile || '',
        ),
        age: age != null ? String(age) : prev.age || '',
        applicant_thumb: hasAidBiometric(prev.applicant_thumb)
          ? prev.applicant_thumb
          : thumb,
        applicant_signature: hasAidBiometric(prev.applicant_signature)
          ? prev.applicant_signature
          : signature,
      };
      if (
        next.form_date === prev.form_date &&
        next.applicant_name === prev.applicant_name &&
        next.applicant_cnic === prev.applicant_cnic &&
        next.beneficiary_name === prev.beneficiary_name &&
        next.beneficiary_cnic === prev.beneficiary_cnic &&
        next.mobile === prev.mobile &&
        next.age === prev.age &&
        next.applicant_thumb === prev.applicant_thumb &&
        next.applicant_signature === prev.applicant_signature
      ) {
        return prev;
      }
      return next;
    });
  }, [
    form.aid_program,
    zakatApplicantPerson,
    beneficiaryPersonForForms,
    formSubjectPerson,
  ]);

  /** Prefill marriage gift receipt — applicant data + biometrics on applicant. */
  useEffect(() => {
    if (
      !isMarriageGiftConsentProgram(
        form.requested_aid_type,
        form.aid_program,
      )
    ) {
      return;
    }
    const applicant = zakatApplicantPerson;
    const bride = beneficiaryPersonForForms;
    if (!applicant && !bride) return;
    const today = new Date().toISOString().slice(0, 10);
    const thumb = cloneAidBiometric(applicant?.thumb_impression);
    const signature = cloneAidBiometric(applicant?.signature);
    setConsentForm((prev) => {
      if (prev?.variant && prev.variant !== 'marriage_gift') return prev;
      const next = {
        ...emptyMarriageGiftConsentForm(),
        ...prev,
        variant: 'marriage_gift',
        form_date: prev.form_date || today,
        bride_name: bride?.full_name || prev.bride_name || '',
        bride_cnic: formatCnicInput(bride?.cnic || prev.bride_cnic || ''),
        applicant_name: applicant?.full_name || prev.applicant_name || '',
        parentage_or_spouse:
          applicant?.father_or_husband_name ||
          prev.parentage_or_spouse ||
          '',
        applicant_cnic: formatCnicInput(
          applicant?.cnic || prev.applicant_cnic || '',
        ),
        receiver_thumb: hasAidBiometric(prev.receiver_thumb)
          ? prev.receiver_thumb
          : thumb,
        receiver_signature: hasAidBiometric(prev.receiver_signature)
          ? prev.receiver_signature
          : signature,
      };
      if (
        next.form_date === prev.form_date &&
        next.bride_name === prev.bride_name &&
        next.bride_cnic === prev.bride_cnic &&
        next.applicant_name === prev.applicant_name &&
        next.parentage_or_spouse === prev.parentage_or_spouse &&
        next.applicant_cnic === prev.applicant_cnic &&
        next.receiver_thumb === prev.receiver_thumb &&
        next.receiver_signature === prev.receiver_signature
      ) {
        return prev;
      }
      return next;
    });
  }, [
    form.requested_aid_type,
    form.aid_program,
    zakatApplicantPerson,
    beneficiaryPersonForForms,
  ]);

  const beneficiaryGender = headAsBeneficiary
    ? headAsBeneficiary.gender || ''
    : beneficiaryMode === 'existing'
      ? existingBeneficiary?.gender || ''
      : beneficiary.gender;
  const beneficiaryMarital = headAsBeneficiary
    ? headAsBeneficiary.marital_status || ''
    : beneficiaryMode === 'existing'
      ? existingBeneficiary?.marital_status || ''
      : beneficiary.marital_status;

  const isMarried = beneficiaryMarital === 'married';
  const maritalKey = String(beneficiaryMarital || '').toLowerCase();
  /** Wife / Husband / late spouse — optional; never block submit if empty. */
  const showSpouseSection = [
    'married',
    'widow',
    'widower',
    'widowed',
  ].includes(maritalKey);
  const spouseLabel =
    maritalKey === 'widow' || maritalKey === 'widowed'
      ? t('husbandLate')
      : maritalKey === 'widower'
        ? t('wifeLate')
        : beneficiaryGender === 'male'
          ? t('wife')
          : beneficiaryGender === 'female'
            ? t('husband')
            : t('spouse');
  const spouseDefaultGender =
    beneficiaryGender === 'male'
      ? 'female'
      : beneficiaryGender === 'female'
        ? 'male'
        : '';
  const spouseHasDetails = personHasEnteredDetails(spouse);
  const spousePanelVisible =
    showSpouseSection &&
    (spouseFormOpen || spouseHasDetails || !!spouse.is_applicant);

  useEffect(() => {
    if (spouseHasDetails || spouse.is_applicant) {
      setSpouseFormOpen(true);
    }
  }, [spouseHasDetails, spouse.is_applicant]);

  useEffect(() => {
    // Marital status no longer implies spouse — collapse empty optional form
    if (!showSpouseSection) {
      setSpouseFormOpen(false);
    }
  }, [showSpouseSection]);

  /** Exactly one applicant: beneficiary, spouse, family head, or a family member. */
  const markApplicant = (target) => {
    const kind = target?.kind || 'beneficiary';
    if (kind === 'none') {
      setBeneficiary((b) => ({ ...b, is_applicant: false }));
      setSpouse((s) => ({ ...s, is_applicant: false }));
      setFamilyHeads((heads) =>
        heads.map((h) => ({
          ...h,
          is_applicant: false,
          _family_members: (h._family_members || []).map((m) => ({
            ...m,
            is_applicant: false,
          })),
        })),
      );
      setBeneficiaryMembers((list) =>
        list.map((m) => ({ ...m, is_applicant: false })),
      );
      return;
    }
    // When family head / member becomes applicant, carry over photo from beneficiary if needed
    const photoSource = beneficiary;
    setBeneficiary((b) => ({
      ...b,
      is_applicant: kind === 'beneficiary',
    }));
    setSpouse((s) => ({
      ...s,
      is_applicant: kind === 'spouse',
    }));
    setFamilyHeads((heads) =>
      heads.map((h, i) => {
        const isTarget = kind === 'family_head' && target.idx === i;
        let next = {
          ...h,
          is_applicant: isTarget,
          _family_members: (h._family_members || []).map((m, mi) => {
            const memberTarget =
              kind === 'head_member' &&
              target.headIdx === i &&
              target.idx === mi;
            const member = {
              ...m,
              is_applicant: memberTarget,
            };
            return memberTarget ? withPhotoFrom(member, photoSource) : member;
          }),
        };
        if (isTarget) next = withPhotoFrom(next, photoSource);
        return next;
      }),
    );
    setBeneficiaryMembers((list) =>
      list.map((m, i) => {
        const isTarget = kind === 'beneficiary_member' && target.idx === i;
        const next = { ...m, is_applicant: isTarget };
        return isTarget ? withPhotoFrom(next, photoSource) : next;
      }),
    );
  };

  /** Exactly one beneficiary source: Beneficiary form, Family Head, or a family member. */
  const markBeneficiary = (target) => {
    const kind = target?.kind || 'form';
    const prevHead = familyHeads.find((h) => h.is_beneficiary) || null;
    const photoSource =
      kind === 'form' && prevHead ? prevHead : beneficiary;

    setFamilyHeads((heads) =>
      heads.map((h, i) => {
        const isTarget = kind === 'family_head' && target.idx === i;
        let next = {
          ...h,
          is_beneficiary: isTarget,
          _family_members: (h._family_members || []).map((m, mi) => {
            const memberTarget =
              kind === 'head_member' &&
              target.headIdx === i &&
              target.idx === mi;
            const member = {
              ...m,
              is_beneficiary: memberTarget,
            };
            return memberTarget ? withPhotoFrom(member, photoSource) : member;
          }),
        };
        if (isTarget) next = withPhotoFrom(next, photoSource);
        return next;
      }),
    );
    setBeneficiaryMembers((list) =>
      list.map((m, i) => {
        const isTarget = kind === 'beneficiary_member' && target.idx === i;
        const next = { ...m, is_beneficiary: isTarget };
        return isTarget ? withPhotoFrom(next, photoSource) : next;
      }),
    );
    if (kind === 'form') {
      // Returning to beneficiary form — keep photo from previous head if form empty
      setBeneficiary((b) => withPhotoFrom({ ...b }, photoSource));
    }
    if (
      kind === 'family_head' ||
      kind === 'head_member' ||
      kind === 'beneficiary_member'
    ) {
      // Someone else is beneficiary — clear applicant on the separate beneficiary form
      setBeneficiary((b) => ({ ...b, is_applicant: false }));
    }
  };

  useEffect(() => {
    if (showSpouseSection) {
      setSpouse((p) => ({
        ...p,
        gender: p.gender || spouseDefaultGender,
        marital_status:
          p.marital_status || (isMarried ? 'married' : p.marital_status || ''),
      }));
    }
  }, [showSpouseSection, isMarried, spouseDefaultGender]);

  const searchPeople = async (term) => {
    const q = String(term || '').trim();
    if (q.length < 2) return [];
    try {
      const res = await axiosInstance.get('/aid/people', {
        params: { search: q, page: 1, pageSize: 30 },
      });
      return (res.data?.data || []).map((p) => ({
        id: p.id,
        name: p.full_name,
        email: p.cnic || p.phone || '',
        raw: p,
      }));
    } catch {
      return [];
    }
  };

  const pushRelatedMember = (members, row, opts = {}) => {
    const relation =
      opts.relation || resolveRelatedPersonKinship(row) || 'other';
    const notes = opts.notes;
    if (row?.existing_person_id) {
      const payload = cleanPersonPayload(row);
      members.push({
        relation_type: relation,
        existing_person_id: Number(row.existing_person_id),
        ...(payload ? { person: payload } : {}),
        notes,
      });
      return;
    }
    const payload = cleanPersonPayload(row);
    if (!payload) return;
    if (!payload.gender && relation === 'sister') payload.gender = 'female';
    if (!payload.gender && relation === 'brother') payload.gender = 'male';
    if (!payload.gender && relation === 'daughter') payload.gender = 'female';
    if (!payload.gender && relation === 'son') payload.gender = 'male';
    if (!payload.gender && relation === 'mother') payload.gender = 'female';
    if (!payload.gender && relation === 'father') payload.gender = 'male';
    members.push({ relation_type: relation, person: payload, notes });
  };

  const buildFamilyMembers = () => {
    const members = [];
    for (const head of familyHeads) {
      const uiType = head._relation_type || 'other';
      const relation = resolveRelatedPersonKinship({
        relation_type: uiType,
      });
      // When Family Head is also the beneficiary (single-person household),
      // do not add them again as a relative of themselves.
      if (!head.is_beneficiary) {
        const payload = cleanPersonPayload(head);
        if (payload || head.existing_person_id) {
          const genderHint = emptyFamilyHeadRow(uiType).gender;
          if (payload && !payload.gender && genderHint) {
            payload.gender = genderHint;
          }
          const roles = [
            head.is_applicant ? 'Applicant' : null,
            'Family head',
          ]
            .filter(Boolean)
            .join(' / ');
          if (head.existing_person_id) {
            members.push({
              relation_type: relation,
              existing_person_id: Number(head.existing_person_id),
              ...(payload ? { person: payload } : {}),
              notes: `${roles} (${familyHeadTypeLabel(uiType)})`,
            });
          } else if (payload) {
            members.push({
              relation_type: relation,
              person: payload,
              notes: `${roles} (${familyHeadTypeLabel(uiType)})`,
            });
          }
        }
      }
      for (const rel of head._family_members || []) {
        // Include both label + value so edit hydrate can nest members under the same head
        const headKey = `${familyHeadTypeLabel(uiType)} (${uiType})`;
        pushRelatedMember(members, rel, {
          notes: rel.is_applicant
            ? `Applicant / relative of ${headKey} (${rel.relation_type || 'other'})`
            : `Relative of ${headKey} (${rel.relation_type || 'other'})`,
        });
      }
    }

    for (const rel of beneficiaryMembers) {
      pushRelatedMember(members, rel, {
        notes: rel.is_applicant
          ? `Applicant / beneficiary family member (${rel.relation_type || 'other'})`
          : `Beneficiary family member (${rel.relation_type || 'other'})`,
      });
    }

    if (showSpouseSection) {
      const spousePayload = cleanPersonPayload(spouse);
      if (spouse.existing_person_id) {
        members.push({
          relation_type: 'spouse',
          existing_person_id: Number(spouse.existing_person_id),
          ...(spousePayload ? { person: spousePayload } : {}),
        });
      } else if (spousePayload) {
        if (!spousePayload.gender && spouseDefaultGender) {
          spousePayload.gender = spouseDefaultGender;
        }
        if (!spousePayload.marital_status && isMarried) {
          spousePayload.marital_status = 'married';
        }
        members.push({ relation_type: 'spouse', person: spousePayload });
      }
    }

    return members;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (spouse.is_applicant && !spouse.full_name?.trim() && !spouse.existing_person_id) {
        throw new Error(
          `${spouseLabel} name is required when marked as applicant`,
        );
      }
      const allGenericMembers = [
        ...beneficiaryMembers,
        ...familyHeads.flatMap((h) => h._family_members || []),
      ];
      // Relatives (sons, siblings, etc.) are optional — only validate rows that have a name.
      for (const m of allGenericMembers) {
        if (!m.full_name?.trim()) {
          if (m.is_applicant) {
            throw new Error(
              'Family member name is required when marked as applicant',
            );
          }
          continue;
        }
        if (m.cnic && !isValidCnic(m.cnic)) {
          throw new Error(
            'Family member CNIC must be 13 digits as 12345-1234567-1',
          );
        }
        if (m.phone && !isValidPkPhone(m.phone)) {
          throw new Error(
            'Family member contact must be 11 digits starting with 03',
          );
        }
      }
      const namedHeads = familyHeads.filter((h) => h.full_name?.trim());
      if (!namedHeads.length) {
        throw new Error(
          'Enter at least one Family Head (Father / Mother / Son / Daughter / Brother / Sister, or Guardian)',
        );
      }
      const missingType = namedHeads.find((h) => !h._relation_type);
      if (missingType) {
        throw new Error('Select Type for each Family Head');
      }
      const missingGuardianSubtype = namedHeads.find(
        (h) =>
          familyHeadPrimaryType(h._relation_type) === 'guardian' &&
          !familyHeadSubtype(h._relation_type),
      );
      if (missingGuardianSubtype) {
        throw new Error(
          'Select Subtype for each Guardian Family Head',
        );
      }
      const badCnic = namedHeads.find((h) => h.cnic && !isValidCnic(h.cnic));
      if (badCnic) {
        throw new Error(
          'Family Head CNIC must be 13 digits as 12345-1234567-1',
        );
      }
      const badPhone = namedHeads.find((h) => h.phone && !isValidPkPhone(h.phone));
      if (badPhone) {
        throw new Error(
          'Family Head contact must be 11 digits starting with 03',
        );
      }
      const missingDob = namedHeads.find((h) => !h.date_of_birth);
      if (missingDob) {
        throw new Error('Enter Date of Birth for each Family Head');
      }

      const beneficiaryHead = familyHeads.find((h) => h.is_beneficiary) || null;

      const resolveApplicant = () => {
        // Single-person family: Family Head is both beneficiary and applicant
        if (beneficiaryHead?.is_applicant) {
          return { kind: 'self' };
        }
        if (!beneficiaryHead && beneficiary.is_applicant) {
          return { kind: 'self' };
        }
        if (spouse.is_applicant) {
          return { kind: 'spouse', person: spouse, relation: 'spouse' };
        }
        const headIdx = familyHeads.findIndex((h) => h.is_applicant);
        if (headIdx >= 0) {
          const head = familyHeads[headIdx];
          return {
            kind: 'family_head',
            person: head,
            relation: mapRelationToWriterRelation(head._relation_type),
          };
        }
        const bmIdx = beneficiaryMembers.findIndex((m) => m.is_applicant);
        if (bmIdx >= 0) {
          const m = beneficiaryMembers[bmIdx];
          return {
            kind: 'member',
            person: m,
            relation: mapRelationToWriterRelation(m.relation_type),
          };
        }
        for (let hi = 0; hi < familyHeads.length; hi += 1) {
          const members = familyHeads[hi]._family_members || [];
          const mi = members.findIndex((m) => m.is_applicant);
          if (mi >= 0) {
            const m = members[mi];
            return {
              kind: 'member',
              person: m,
              relation: mapRelationToWriterRelation(m.relation_type),
            };
          }
        }
        return { kind: 'self' };
      };

      const applicant = resolveApplicant();

      const programsForType = getAidProgramsForType(form.requested_aid_type);
      if (programsForType.length > 0 && !form.aid_program) {
        throw new Error('Select a SubProgram for the chosen Program');
      }
      const amountFields = resolveExpectedAmountFields(
        form.requested_aid_type,
        form.aid_program,
      );

      const payload = {
        title: form.title || null,
        request_summary: form.request_summary || null,
        case_source: form.case_source || 'walk_in',
        requested_aid_type: form.requested_aid_type,
        aid_program: amountFields.aid_program || null,
        expected_amount: amountFields.expected_amount,
        expected_amount_max: amountFields.expected_amount_max,
        ...(form.requested_aid_type === 'education'
          ? { education_details: educationDetails }
          : {}),
        ...(form.requested_aid_type === 'ration'
          ? { ration_details: rationDetails }
          : {}),
        ...(form.requested_aid_type === 'marriage_gift'
          ? { marriage_gift_details: marriageGiftDetails }
          : {}),
        ...(form.requested_aid_type === 'financial_assistance'
          ? { financial_assistance_details: financialAssistanceDetails }
          : {}),
        ...(form.requested_aid_type === 'clean_water'
          ? { clean_water_details: cleanWaterDetails }
          : {}),
        zakat_permission: zakatPermission,
        consent_form: consentForm,
        missing_documents: missingDocuments,
        writer_relation: 'self',
        family_members: buildFamilyMembers(),
      };

      const validatePerson = (person, label) => {
        if (!person?.full_name?.trim() && !person?.existing_person_id) {
          throw new Error(`${label} name is required`);
        }
        if (!person.gender) throw new Error(`${label} gender is required`);
        if (!person.marital_status) {
          throw new Error(`${label} marital status is required`);
        }
        if (!person.date_of_birth) {
          throw new Error(`${label} date of birth is required`);
        }
        if (!String(person.address || '').trim()) {
          throw new Error(`${label} address as per CNIC is required`);
        }
        if (!String(person.current_address || '').trim()) {
          throw new Error(`${label} current address is required`);
        }
        if (person.cnic && !isValidCnic(person.cnic)) {
          throw new Error(
            `${label} CNIC must be 13 digits as 12345-1234567-1`,
          );
        }
        if (person.phone && !isValidPkPhone(person.phone)) {
          throw new Error(
            `${label} contact must be 11 digits starting with 03`,
          );
        }
      };

      if (beneficiaryHead) {
        validatePerson(beneficiaryHead, 'Beneficiary (Family Head)');
        if (beneficiaryHead.existing_person_id) {
          payload.beneficiary_person_id = Number(
            beneficiaryHead.existing_person_id,
          );
          // Always send person fields (incl. photo_url) so create+existing updates the profile
          const headPayload = cleanPersonPayload(beneficiaryHead);
          if (headPayload) {
            payload.beneficiary = {
              ...headPayload,
              full_name: beneficiaryHead.full_name.trim(),
            };
          }
        } else {
          payload.beneficiary = {
            ...cleanPersonPayload(beneficiaryHead),
            full_name: beneficiaryHead.full_name.trim(),
          };
        }
      } else if (beneficiaryMode === 'existing' && !isEdit) {
        if (!beneficiaryId) throw new Error('Select a beneficiary');
        payload.beneficiary_person_id = Number(beneficiaryId);
        const dob = existingBeneficiary?.date_of_birth
          ? String(existingBeneficiary.date_of_birth).slice(0, 10)
          : '';
        if (dob) {
          await axiosInstance.patch(`/aid/people/${beneficiaryId}`, {
            date_of_birth: dob,
          });
        }
      } else {
        validatePerson(beneficiary, 'Beneficiary');
        const benPayload = {
          ...cleanPersonPayload(beneficiary),
          full_name: beneficiary.full_name.trim(),
        };
        if (isEdit && (beneficiary.existing_person_id || beneficiaryId)) {
          payload.beneficiary_person_id = Number(
            beneficiary.existing_person_id || beneficiaryId,
          );
          payload.beneficiary = benPayload;
        } else {
          payload.beneficiary = benPayload;
        }
      }

      if (applicant.kind === 'self') {
        payload.writer_relation = 'self';
        if (isEdit) {
          const selfId =
            payload.beneficiary_person_id ||
            beneficiaryHead?.existing_person_id ||
            beneficiary.existing_person_id ||
            beneficiaryId;
          if (selfId) payload.writer_person_id = Number(selfId);
        }
      } else {
        const person = applicant.person || {};
        if (!person.full_name?.trim() && !person.existing_person_id) {
          throw new Error(
            'Enter applicant details (name) for the selected applicant',
          );
        }
        if (person.cnic && !isValidCnic(person.cnic)) {
          throw new Error(
            'Applicant CNIC must be 13 digits as 12345-1234567-1',
          );
        }
        if (person.phone && !isValidPkPhone(person.phone)) {
          throw new Error(
            'Applicant contact must be 11 digits starting with 03',
          );
        }
        payload.writer_relation = applicant.relation || 'relative';
        if (person.existing_person_id) {
          payload.writer_person_id = Number(person.existing_person_id);
          const writerPayload = cleanPersonPayload(person);
          if (writerPayload) payload.writer = writerPayload;
        } else if (isEdit) {
          const writerPayload = cleanPersonPayload(person);
          if (!writerPayload) {
            throw new Error('Applicant name is required');
          }
          const created = await axiosInstance.post(
            '/aid/people',
            writerPayload,
          );
          const newWriterId =
            created.data?.data?.id || created.data?.id;
          if (!newWriterId) {
            throw new Error('Failed to create applicant person');
          }
          payload.writer_person_id = Number(newWriterId);
        } else {
          const writerPayload = cleanPersonPayload(person);
          if (!writerPayload) {
            throw new Error('Applicant name is required');
          }
          payload.writer = writerPayload;
        }
      }

      let savedId = editId;
      if (isEdit) {
        // Create flow uses beneficiary_person_id; update uses nested beneficiary + writer_person_id
        delete payload.beneficiary_person_id;
        await axiosInstance.patch(`/aid/applications/${editId}`, payload);
        toast.success('Application updated');
      } else {
        const res = await axiosInstance.post('/aid/applications', payload);
        savedId = res.data?.data?.id;
        toast.success('Saved as draft — open Data Entry to consider for verification');
      }
      try {
        await clearAidFormDraft(offlineFormKey);
      } catch {
        /* ignore */
      }

      dispatchListDataChanged('aid');

      if (savedId) {
        const uploads = [];
        for (const [context, slot] of Object.entries(applicationDocs || {})) {
          const list = Array.isArray(slot?.files)
            ? slot.files
            : Array.isArray(slot)
              ? slot
              : slot?.file
                ? [slot]
                : [];
          list.forEach((item, i) => {
            if (item?.file) {
              const side = String(item.side || '').toLowerCase();
              const pair =
                item.pair != null && Number.isFinite(Number(item.pair))
                  ? Number(item.pair) + 1
                  : null;
              let description = context;
              if (side === 'front' || side === 'back') {
                description = pair
                  ? `${context} #${pair} (${side})`
                  : `${context} (${side})`;
              } else if (list.length > 1) {
                description = `${context} (${i + 1})`;
              }
              uploads.push({
                context,
                file: item.file,
                description,
              });
            }
          });
        }
        for (const item of uploads) {
          const fd = new FormData();
          fd.append('file', item.file);
          fd.append('context', item.context);
          fd.append('description', item.description);
          await axiosInstance.post(
            `/aid/applications/${savedId}/attachments/upload`,
            fd,
            { headers: { 'Content-Type': 'multipart/form-data' } },
          );
        }

        // Persist thumb/signature onto the form-subject person for reuse
        try {
          const appRes = await axiosInstance.get(
            `/aid/applications/${savedId}`,
          );
          const savedApp = appRes.data?.data || appRes.data;
          const isMg = isMarriageGiftConsentProgram(
            savedApp?.requested_aid_type || form.requested_aid_type,
            savedApp?.aid_program || form.aid_program,
          );
          const subjectId = Number(
            isMg
              ? savedApp?.writer_person_id ||
                  savedApp?.writer?.id ||
                  formSubjectPersonId
              : savedApp?.beneficiary_person_id ||
                  savedApp?.beneficiary?.id ||
                  formSubjectPersonId,
          );
          if (Number.isFinite(subjectId) && subjectId > 0) {
            const thumb =
              cloneAidBiometric(zakatPermission?.applicant_thumb) ||
              cloneAidBiometric(consentForm?.applicant_thumb) ||
              cloneAidBiometric(consentForm?.receiver_thumb);
            const signature =
              cloneAidBiometric(zakatPermission?.applicant_signature) ||
              cloneAidBiometric(consentForm?.applicant_signature) ||
              cloneAidBiometric(consentForm?.receiver_signature);
            const bioPayload = {};
            if (thumb) bioPayload.thumb_impression = thumb;
            if (signature) bioPayload.signature = signature;
            if (Object.keys(bioPayload).length) {
              await axiosInstance.patch(
                `/aid/people/${subjectId}`,
                bioPayload,
              );
            }
          }
        } catch {
          /* non-blocking */
        }
      }
      const goDrafts = !isEdit || isDraftEdit;
      navigate(
        savedId
          ? goDrafts
            ? `/dms/aid/applications/drafts/view/${savedId}`
            : `/dms/aid/applications/entry/view/${savedId}`
          : goDrafts
            ? draftsListPath
            : '/dms/aid/applications/entry/list',
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          (isEdit
            ? 'Failed to update application'
            : 'Failed to save draft'),
      );
    } finally {
      setSaving(false);
    }
  };

  const familyHint = useMemo(() => {
    const base =
      'Add Family Head entries and select type: Father, Mother, Son, Daughter, Brother, Sister, or Guardian (with subtype). Under each head you can add any family members.';
    if (showSpouseSection) {
      return `${base} You may optionally add ${spouseLabel.toLowerCase()} details.`;
    }
    return base;
  }, [showSpouseSection, spouseLabel]);

  const formBackPath =
    !isEdit || isDraftEdit
      ? draftsListPath
      : '/dms/aid/applications/entry/list';
  const formTitle = !isEdit
    ? t('newApplication')
    : isDraftEdit
      ? t('editApplication')
      : t('editAidApplication');
  const submitLabel = !isEdit
    ? t('saveAsDraft')
    : isDraftEdit
      ? t('saveDraft')
      : t('saveChanges');

  if (loadingEdit) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader
            title={t('editApplication')}
            backPath={draftsListPath}
            onBackClick={() => navigate(draftsListPath)}
            showAdd={false}
            rightElement={<AidLangToggle />}
          />
          <p>{t('loadingApplication')}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={formTitle}
          backPath={formBackPath}
          onBackClick={() => navigate(formBackPath)}
          showAdd={false}
          rightElement={<AidLangToggle />}
        />

        {error && (
          <div className="status-message status-message--error">{error}</div>
        )}

        {!isEdit || isDraftEdit ? (
          <p className="aid-section-hint" style={{ marginBottom: 12 }}>
            {t('draftHint')}
          </p>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className={`form aid-application-form${rtl ? ' aid-application-form--rtl' : ''}`}
          dir={rtl ? 'rtl' : 'ltr'}
          lang={lang}
        >
          <div
            className="aid-steps"
            role="navigation"
            aria-label={t('applicationSteps')}
          >
            <div className="aid-steps__meta">
              <span className="aid-steps__meta-label">
                {t('stepOf', { n: stepIndex + 1, total: FORM_TABS.length })}
              </span>
              <span className="aid-steps__meta-pct">
                {t('pctComplete', { n: Math.round(stepProgress) })}
              </span>
            </div>
            <div
              className="aid-steps__track"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={FORM_TABS.length}
              aria-valuenow={stepIndex + 1}
              aria-valuetext={FORM_TABS[stepIndex]?.label}
            >
              <div
                className="aid-steps__fill"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
            <ol className="aid-steps__list">
              {FORM_TABS.map((t, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <li
                    key={t.id}
                    className={[
                      'aid-steps__item',
                      done ? 'aid-steps__item--done' : '',
                      active ? 'aid-steps__item--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <button
                      type="button"
                      className="aid-steps__btn"
                      aria-current={active ? 'step' : undefined}
                      onClick={() => setFormTab(t.id)}
                    >
                      <span className="aid-steps__marker" aria-hidden="true">
                        {done ? <FiCheck size={11} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="aid-steps__copy">
                        <span className="aid-steps__label">{t.label}</span>
                        <span className="aid-steps__hint">{t.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {formTab === 'request' && (
          <div className="form-section">
            <div className="aid-section-heading-row">
              <h3 className="form-section-heading">{t('application')}</h3>
              <button
                type="button"
                className="aid-png-download-btn"
                title={t('downloadPng')}
                aria-label={t('downloadPng')}
                disabled={pngDownloading}
                onClick={() =>
                  handleDownloadPng(applicationCaptureRef, 'aid-application')
                }
              >
                <FiDownload size={18} />
              </button>
            </div>
            <div ref={applicationCaptureRef} className="aid-png-capture">
            <div className="form-grid-2">
              <FormInput
                label={t('title')}
                name="title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder={t('titlePlaceholder')}
              />
              <FormSelect
                label={t('program')}
                name="requested_aid_type"
                value={form.requested_aid_type}
                onChange={(e) => {
                  const next = e.target.value;
                  const amt = resolveExpectedAmountFields(next, '');
                  setForm((p) => ({
                    ...p,
                    requested_aid_type: next,
                    aid_program: amt.aid_program,
                    expected_amount: amt.expected_amount,
                    expected_amount_max: amt.expected_amount_max,
                  }));
                  if (next === 'education') {
                    setEducationDetails((prev) =>
                      prev?.education_history?.length
                        ? prev
                        : emptyEducationDetails(),
                    );
                  }
                  if (next === 'ration') {
                    setRationDetails((prev) =>
                      prev?.family_had_wheat != null
                        ? prev
                        : emptyRationDetails(),
                    );
                  }
                  if (next === 'marriage_gift') {
                    setMarriageGiftDetails((prev) =>
                      prev?.items?.length ? prev : emptyMarriageGiftDetails(),
                    );
                  }
                  if (next === 'financial_assistance') {
                    setFinancialAssistanceDetails((prev) =>
                      prev?.monthly_household_income != null
                        ? prev
                        : emptyFinancialAssistanceDetails(),
                    );
                  }
                  if (next === 'clean_water') {
                    setCleanWaterDetails((prev) =>
                      prev?.applicant_name != null ||
                      prev?.village != null ||
                      prev?.existing_source_of_water
                        ? prev
                        : emptyCleanWaterDetails(),
                    );
                  } else if (formTab === 'survey') {
                    setFormTab('request');
                  }
                  setConsentForm((prev) => {
                    const nextVariant = resolveConsentVariant(
                      next,
                      amt.aid_program,
                    );
                    if ((prev?.variant || 'media') === nextVariant) return prev;
                    // Keep thumbs/signatures/declarations when switching consent variant
                    return {
                      ...emptyConsentForVariant(nextVariant),
                      ...prev,
                      variant: nextVariant,
                      lang: prev?.lang || lang,
                    };
                  });
                }}
                options={AID_REQUEST_TYPES}
              />
              {getAidProgramsForType(form.requested_aid_type).length > 0 ? (
                <FormSelect
                  label={t('subProgram')}
                  name="aid_program"
                  value={form.aid_program || ''}
                  required
                  onChange={(e) => {
                    const amt = resolveExpectedAmountFields(
                      form.requested_aid_type,
                      e.target.value,
                    );
                    const nextProgram = amt.aid_program;
                    setForm((p) => ({
                      ...p,
                      aid_program: nextProgram,
                      expected_amount: amt.expected_amount,
                      expected_amount_max: amt.expected_amount_max,
                    }));
                    setConsentForm((prev) => {
                      const nextVariant = resolveConsentVariant(
                        form.requested_aid_type,
                        nextProgram,
                      );
                      if ((prev?.variant || 'media') === nextVariant) return prev;
                      return {
                        ...emptyConsentForVariant(nextVariant),
                        ...prev,
                        variant: nextVariant,
                        lang: prev?.lang || lang,
                      };
                    });
                  }}
                  options={[
                    { value: '', label: t('selectSubProgram') },
                    ...getAidProgramsForType(form.requested_aid_type).map(
                      (p) => ({
                        value: p.value,
                        label: p.label,
                      }),
                    ),
                  ]}
                />
              ) : null}
              <div className="form-group">
                <label className="form-label">{t('expectedAmount')}</label>
                <div
                  className="form-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 42,
                    background: 'var(--color-bg-secondary, #f8fafc)',
                    fontWeight: 600,
                  }}
                >
                  {form.aid_program || form.expected_amount != null
                    ? formatExpectedAmount({
                        aid_program: form.aid_program,
                        expected_amount: form.expected_amount,
                        expected_amount_max: form.expected_amount_max,
                      })
                    : t('dash')}
                </div>
                {getAidProgram(form.aid_program)?.uom ? (
                  <p className="aid-section-hint" style={{ marginTop: 6 }}>
                    {getAidProgram(form.aid_program).uom}
                    {getAidProgram(form.aid_program)?.narration
                      ? ` — ${getAidProgram(form.aid_program).narration}`
                      : ''}
                  </p>
                ) : (
                  <p className="aid-section-hint" style={{ marginTop: 6 }}>
                    {t('expectedAmountHint')}
                  </p>
                )}
              </div>
            </div>
            <div className="aid-field-spaced">
              <FormTextarea
                label={
                  form.requested_aid_type === 'ration'
                    ? t('application')
                    : t('needDescription')
                }
                name="request_summary"
                value={form.request_summary}
                onChange={(e) =>
                  setForm((p) => ({ ...p, request_summary: e.target.value }))
                }
                rows={form.requested_aid_type === 'ration' ? 6 : 3}
                placeholder={t('needPlaceholder')}
              />
            </div>
            {form.requested_aid_type === 'education' && (
              <AidEducationApplicationFields
                value={educationDetails}
                onChange={setEducationDetails}
              />
            )}
            {form.requested_aid_type === 'ration' && (
              <AidRationApplicationFields
                value={rationDetails}
                onChange={setRationDetails}
              />
            )}
            {form.requested_aid_type === 'marriage_gift' && (
              <AidMarriageGiftApplicationFields
                value={marriageGiftDetails}
                onChange={setMarriageGiftDetails}
              />
            )}
            {form.requested_aid_type === 'financial_assistance' && (
              <AidFinancialAssistanceFields
                value={financialAssistanceDetails}
                onChange={setFinancialAssistanceDetails}
              />
            )}
            </div>
          </div>
          )}

          {formTab === 'survey' &&
            form.requested_aid_type === 'clean_water' && (
              <div className="form-section">
                <h3 className="form-section-heading">{t('tabSurvey')}</h3>
                <AidCleanWaterSurveyForm
                  value={cleanWaterDetails}
                  onChange={setCleanWaterDetails}
                  uiLang={lang}
                  applicationNo={
                    isEdit ? editId : undefined
                  }
                />
              </div>
            )}

          {formTab === 'attachments' && (
          <div className="form-section">
            <h3 className="form-section-heading">{t('attachments')}</h3>
            <AidApplicationDocsIntake
              value={applicationDocs}
              onChange={setApplicationDocs}
              missingKeys={missingDocuments}
              onRemoveSaved={
                isEdit
                  ? async (attachmentId) => {
                      await axiosInstance.delete(
                        `/aid/applications/attachments/${attachmentId}`,
                      );
                    }
                  : undefined
              }
              onToggleMissing={async (key) => {
                const k = String(key || '').toLowerCase();
                if (!k) return;
                const next = missingDocuments.includes(k)
                  ? missingDocuments.filter((x) => x !== k)
                  : [...missingDocuments, k];
                setMissingDocuments(next);
                if (isEdit && editId) {
                  try {
                    await axiosInstance.patch(
                      `/aid/applications/${editId}/missing-documents`,
                      { missing_documents: next },
                    );
                    setEditStatus(
                      next.length ? 'incomplete_docs' : editStatus,
                    );
                    if (next.length) {
                      toast.info('Status set to Incomplete Docs');
                    }
                  } catch (err) {
                    toast.error(
                      err.response?.data?.message ||
                        err.message ||
                        'Failed to update missing documents',
                    );
                  }
                }
              }}
              disabled={saving}
            />

            <AidCollapsibleSection
              className="aid-family-panel"
              title={t('zakatLetter')}
              hint={t('formsAutoAttached')}
              actions={
                <span className="aid-form-export-actions">
                  <button
                    type="button"
                    className="aid-png-download-btn"
                    title={t('printForm')}
                    aria-label={t('printForm')}
                    onClick={() => printAidElement(zakatCaptureRef.current)}
                  >
                    <FiPrinter size={18} />
                  </button>
                  <button
                    type="button"
                    className="aid-png-download-btn"
                    title={t('downloadPng')}
                    aria-label={t('downloadPng')}
                    disabled={pngDownloading}
                    onClick={() =>
                      handleDownloadPng(
                        zakatCaptureRef,
                        'zakat-permission-letter',
                      )
                    }
                  >
                    <FiDownload size={18} />
                  </button>
                </span>
              }
            >
              <div ref={zakatCaptureRef} className="aid-png-capture">
                <AidZakatPermissionForm
                  value={zakatPermission}
                  onChange={setZakatPermission}
                  onBiometricSaved={handleZakatBiometricSaved}
                  uiLang={lang}
                />
              </div>
            </AidCollapsibleSection>

            <AidCollapsibleSection
              className="aid-family-panel"
              title={
                resolveConsentVariant(
                  form.requested_aid_type,
                  form.aid_program,
                ) === 'wheelchair'
                  ? t('wheelchairConsentForm')
                  : resolveConsentVariant(
                        form.requested_aid_type,
                        form.aid_program,
                      ) === 'marriage_gift'
                    ? t('marriageGiftConsentForm')
                    : t('consentForm')
              }
              hint={t('formsAutoAttached')}
              actions={
                <span className="aid-form-export-actions">
                  <button
                    type="button"
                    className="aid-png-download-btn"
                    title={t('printForm')}
                    aria-label={t('printForm')}
                    onClick={() => printAidElement(consentCaptureRef.current)}
                  >
                    <FiPrinter size={18} />
                  </button>
                  <button
                    type="button"
                    className="aid-png-download-btn"
                    title={t('downloadPng')}
                    aria-label={t('downloadPng')}
                    disabled={pngDownloading}
                    onClick={() => {
                      const v = resolveConsentVariant(
                        form.requested_aid_type,
                        form.aid_program,
                      );
                      handleDownloadPng(
                        consentCaptureRef,
                        v === 'wheelchair'
                          ? 'wheelchair-consent-form'
                          : v === 'marriage_gift'
                            ? 'marriage-gift-consent-form'
                            : 'consent-form',
                      );
                    }}
                  >
                    <FiDownload size={18} />
                  </button>
                </span>
              }
            >
              <div ref={consentCaptureRef} className="aid-png-capture">
                {resolveConsentVariant(
                  form.requested_aid_type,
                  form.aid_program,
                ) === 'wheelchair' ? (
                  <AidWheelchairConsentForm
                    value={consentForm}
                    onChange={setConsentForm}
                    onBiometricSaved={handleConsentBiometricSaved}
                    uiLang={lang}
                  />
                ) : resolveConsentVariant(
                    form.requested_aid_type,
                    form.aid_program,
                  ) === 'marriage_gift' ? (
                  <AidMarriageGiftConsentForm
                    value={consentForm}
                    onChange={setConsentForm}
                    onBiometricSaved={handleConsentBiometricSaved}
                    uiLang={lang}
                  />
                ) : (
                  <AidConsentForm
                    value={consentForm}
                    onChange={setConsentForm}
                    onBiometricSaved={handleConsentBiometricSaved}
                    uiLang={lang}
                  />
                )}
              </div>
            </AidCollapsibleSection>
          </div>
          )}

          {formTab === 'beneficiary' && (
          <div className="form-section">
            <h3 className="form-section-heading">{t('beneficiary')}</h3>
            {headAsBeneficiary ? (
              <>
                <p className="aid-section-hint">
                  {t('beneficiaryFromHead')} (
                  {familyHeadTypeLabel(headAsBeneficiary._relation_type)})
                </p>
                <div
                  className="aid-family-panel"
                  style={{ marginTop: 12, maxWidth: '22rem' }}
                >
                  <div className="aid-fh-personal__dob-label-row">
                    <span className="aid-fh-personal__dob-label">
                      {t('dobBeneficiary')}{' '}
                      <span className="required-mark">*</span>
                    </span>
                    {calcAgeFromDob(headAsBeneficiary.date_of_birth) != null ? (
                      <span className="aid-fh-personal__age">
                        {t('ageYrs', {
                          n: calcAgeFromDob(headAsBeneficiary.date_of_birth),
                        })}
                      </span>
                    ) : null}
                  </div>
                  <FormInput
                    label=""
                    type="date"
                    required
                    value={headAsBeneficiary.date_of_birth || ''}
                    onChange={(e) => {
                      const date_of_birth = e.target.value;
                      setFamilyHeads((list) =>
                        list.map((h) =>
                          h.is_beneficiary ? { ...h, date_of_birth } : h,
                        ),
                      );
                    }}
                  />
                </div>
              </>
            ) : (
              <AidApplicantCheckbox
                checked={!!beneficiary.is_applicant}
                onChange={(yes) => {
                  if (yes) markApplicant({ kind: 'beneficiary' });
                }}
                label={t('beneficiaryIsApplicant')}
                hint={t('beneficiaryIsApplicantHint')}
              />
            )}
            {!headAsBeneficiary && (
            <label className="aid-toggle aid-toggle--block">
              <input
                type="checkbox"
                checked={beneficiaryMode === 'existing'}
                onChange={(e) => {
                  setBeneficiaryMode(e.target.checked ? 'existing' : 'new');
                  if (!e.target.checked) setExistingBeneficiary(null);
                }}
              />
              {lang === 'ur'
                ? 'موجودہ شخص سے لنک کریں'
                : 'Link existing person in system'}
            </label>
            )}

            {headAsBeneficiary ? null : beneficiaryMode === 'existing' ? (
              <>
                <SearchableDropdown
                  label={t('searchBeneficiary')}
                  placeholder={t('searchBeneficiaryPlaceholder')}
                  onSearch={searchPeople}
                  onSelect={async (item) => {
                    setBeneficiaryId(item.id);
                    try {
                      const res = await axiosInstance.get(
                        `/aid/people/${item.id}`,
                      );
                      setExistingBeneficiary(
                        res.data?.data?.person || item.raw || null,
                      );
                    } catch {
                      setExistingBeneficiary(item.raw || null);
                    }
                  }}
                  onClear={() => {
                    setBeneficiaryId(null);
                    setExistingBeneficiary(null);
                  }}
                  displayKey="name"
                  minSearchLength={2}
                />
                {existingBeneficiary ? (
                  <div
                    className="aid-family-panel"
                    style={{ marginTop: 12, maxWidth: '22rem' }}
                  >
                    <div className="aid-fh-personal__dob-label-row">
                      <span className="aid-fh-personal__dob-label">
                        {t('dobBeneficiary')}
                      </span>
                      {calcAgeFromDob(existingBeneficiary.date_of_birth) !=
                      null ? (
                        <span className="aid-fh-personal__age">
                          {t('ageYrs', {
                            n: calcAgeFromDob(
                              existingBeneficiary.date_of_birth,
                            ),
                          })}
                        </span>
                      ) : null}
                    </div>
                    <FormInput
                      label=""
                      type="date"
                      value={
                        existingBeneficiary.date_of_birth
                          ? String(existingBeneficiary.date_of_birth).slice(
                              0,
                              10,
                            )
                          : ''
                      }
                      onChange={(e) =>
                        setExistingBeneficiary((p) => ({
                          ...p,
                          date_of_birth: e.target.value,
                        }))
                      }
                    />
                    <p className="aid-section-hint" style={{ marginTop: 8 }}>
                      Changing DOB here updates the linked person when you
                      submit.
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <AidFamilyHeadPersonalFields
                  title={t('identityBeneficiary')}
                  subtitle={t('identityBeneficiarySubtitle')}
                  contactTitle={t('contactAddress')}
                  contactSubtitle={t('contactAddressSubtitle')}
                  showResidenceFields={false}
                  value={beneficiary}
                  onChange={(next) =>
                    setBeneficiary({
                      ...next,
                      is_applicant: beneficiary.is_applicant,
                    })
                  }
                />
              </>
            )}

            {!headAsBeneficiary && beneficiaryMode !== 'existing' && (
              <>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidPropertyOwnership
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title={t('propertyBeneficiary')}
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidResidentHousing
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title={t('residentBeneficiary')}
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidLivestockIntake
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title={t('livestockBeneficiary')}
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidVehicleIntake
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title={t('vehicleBeneficiary')}
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidEligibilityStatus
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title={t('nectaBispBeneficiary')}
                  />
                </div>
              </>
            )}

            <div className="aid-family-panel" style={{ marginTop: 12 }}>
              <AidFamilyMembersIntake
                title={t('beneficiaryMembers')}
                hint={t('beneficiaryMembersHint')}
                rows={beneficiaryMembers}
                onChange={setBeneficiaryMembers}
                relationLabel={t('relationToBeneficiary')}
                onMarkApplicant={(sel) => {
                  if (sel.kind === 'member') {
                    markApplicant({ kind: 'beneficiary_member', idx: sel.idx });
                  } else {
                    markApplicant({ kind: 'beneficiary' });
                  }
                }}
                onMarkBeneficiary={(sel) => {
                  if (sel.kind === 'member') {
                    markBeneficiary({
                      kind: 'beneficiary_member',
                      idx: sel.idx,
                    });
                  } else {
                    markBeneficiary({ kind: 'form' });
                  }
                }}
              />
            </div>
          </div>
          )}

          {formTab === 'family_tree' && (
            <div className="form-section">
              <AidFamilyTreePanel
                familyHeads={familyHeads}
                spouse={spouse}
                beneficiaryMembers={beneficiaryMembers}
                beneficiary={
                  headAsBeneficiary ||
                  (beneficiaryMode === 'existing'
                    ? existingBeneficiary
                    : beneficiary)
                }
                headAsBeneficiary={headAsBeneficiary}
              />
            </div>
          )}

          {formTab === 'family' && (
          <div className="form-section">
            {/* <h3 className="form-section-heading">Family Head</h3>
            <p className="aid-section-hint">{familyHint}</p>
            <p className="aid-section-hint">
              For a single-person family, check both Applicant and Beneficiary
              on the Family Head. Otherwise mark Applicant / Beneficiary as
              needed (spouse or family members can also be the applicant).
            </p> */}

            {showSpouseSection && !spousePanelVisible ? (
              <div className="aid-family-panel aid-family-panel--optional-add">
                <button
                  type="button"
                  className="aid-mini-btn aid-mini-btn--add"
                  onClick={() => {
                    setSpouse((s) => ({
                      ...s,
                      gender: s.gender || spouseDefaultGender,
                      marital_status:
                        s.marital_status ||
                        (isMarried ? 'married' : s.marital_status || ''),
                    }));
                    setSpouseFormOpen(true);
                  }}
                >
                  + {t('addOptionalRelative', { name: spouseLabel })}
                </button>
              </div>
            ) : null}

            {spousePanelVisible ? (
              <div className="aid-family-panel">
                <div className="aid-family-panel__head">
                  <h4 className="aid-family-panel__title">
                    {t('optionalSection', { name: spouseLabel })}
                  </h4>
                  <button
                    type="button"
                    className="aid-mini-btn aid-mini-btn--remove"
                    onClick={() => {
                      const wasApplicant = !!spouse.is_applicant;
                      setSpouse(emptyRelative());
                      setSpouseFormOpen(false);
                      if (wasApplicant) {
                        markApplicant({ kind: 'beneficiary' });
                      }
                    }}
                  >
                    {t('remove')}
                  </button>
                </div>
                <AidApplicantCheckbox
                  checked={!!spouse.is_applicant}
                  onChange={(yes) => {
                    if (yes) markApplicant({ kind: 'spouse' });
                    else markApplicant({ kind: 'beneficiary' });
                  }}
                  label={t('isApplicant', { name: spouseLabel })}
                />
                <RelativeFields
                  title={t('identity')}
                  value={spouse}
                  onChange={(next) =>
                    setSpouse({ ...next, is_applicant: spouse.is_applicant })
                  }
                  compact
                />
              </div>
            ) : null}

            <div className="aid-family-panel">
              <div className="aid-family-panel__head">
                <h4 className="aid-family-panel__title">
                  {t('familyHeadSelect')}
                </h4>
                <button
                  type="button"
                  className="aid-mini-btn aid-mini-btn--add"
                  onClick={() =>
                    setFamilyHeads((p) => [
                      ...p,
                      {
                        ...emptyFamilyHeadRow('father'),
                        is_applicant: false,
                        is_beneficiary: false,
                      },
                    ])
                  }
                >
                  + {t('addFamilyHead')}
                </button>
              </div>
              {familyHeads.map((head, idx) => {
                const primaryType = familyHeadPrimaryType(head._relation_type);
                const subtype = familyHeadSubtype(head._relation_type);
                return (
                  <div key={`fh-${idx}`} className="aid-repeat-item">
                    <div
                      className={`aid-role-check-row${
                        idx === 0
                          ? ' aid-role-check-row--inline4'
                          : ' aid-role-check-row--inline3'
                      }`}
                    >
                      {idx === 0 ? (
                        <div className="aid-role-check-row__type">
                          <FormSelect
                            label={t('caseSource')}
                            name="case_source"
                            value={form.case_source || 'walk_in'}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                case_source: e.target.value,
                              }))
                            }
                            options={AID_CASE_SOURCES}
                          />
                        </div>
                      ) : null}
                      <div className="aid-role-check-row__type">
                        <FormSelect
                          label={t('type')}
                          value={primaryType}
                          onChange={(e) => {
                            const type = e.target.value;
                            const nextRelation =
                              type === 'guardian' ? 'guardian' : type;
                            const preset = emptyFamilyHeadRow(nextRelation);
                            setFamilyHeads((list) =>
                              list.map((row, i) =>
                                i === idx
                                  ? {
                                      ...row,
                                      _relation_type: nextRelation,
                                      gender: row.gender || preset.gender,
                                    }
                                  : row,
                              ),
                            );
                          }}
                          options={AID_FAMILY_HEAD_TYPE_OPTIONS}
                          required
                        />
                        {primaryType === 'guardian' ? (
                          <FormSelect
                            label={t('subtype')}
                            value={subtype}
                            onChange={(e) => {
                              const next = e.target.value || 'guardian';
                              const preset = emptyFamilyHeadRow(next);
                              setFamilyHeads((list) =>
                                list.map((row, i) =>
                                  i === idx
                                    ? {
                                        ...row,
                                        _relation_type: next,
                                        gender: row.gender || preset.gender,
                                      }
                                    : row,
                                ),
                              );
                            }}
                            options={[
                              { value: '', label: t('selectSubtype') },
                              ...AID_FAMILY_HEAD_GUARDIAN_SUBTYPES,
                            ]}
                            required
                          />
                        ) : null}
                        {familyHeads.length > 1 && (
                          <button
                            type="button"
                            className="aid-mini-btn aid-mini-btn--remove"
                            onClick={() => {
                              const wasApplicant =
                                familyHeads[idx]?.is_applicant;
                              const wasBeneficiary =
                                familyHeads[idx]?.is_beneficiary;
                              setFamilyHeads((list) =>
                                list.filter((_, i) => i !== idx),
                              );
                              if (wasApplicant) {
                                markApplicant({ kind: 'beneficiary' });
                              }
                              if (wasBeneficiary) {
                                markBeneficiary({ kind: 'form' });
                              }
                            }}
                          >
                            {t('remove')}
                          </button>
                        )}
                      </div>
                      <AidApplicantCheckbox
                        checked={!!head.is_applicant}
                        variant="applicant"
                        onChange={(yes) => {
                          if (yes) markApplicant({ kind: 'family_head', idx });
                          else if (head.is_beneficiary) {
                            // Keep single-person household; clear applicant only
                            markApplicant({ kind: 'none' });
                          } else {
                            markApplicant({ kind: 'beneficiary' });
                          }
                        }}
                        label={t('applicant')}
                        hint={t('applicantHeadHint')}
                      />
                      <AidApplicantCheckbox
                        checked={!!head.is_beneficiary}
                        variant="beneficiary"
                        onChange={(yes) => {
                          if (yes) markBeneficiary({ kind: 'family_head', idx });
                          else markBeneficiary({ kind: 'form' });
                        }}
                        label={t('beneficiary')}
                        hint={t('beneficiaryHeadHint')}
                      />
                    </div>
                    <AidFamilyHeadPersonalFields
                      title={`${t('identityFamilyHead')}${
                        head.is_beneficiary || head.is_applicant
                          ? ` (${[
                              head.is_beneficiary ? t('beneficiary') : null,
                              head.is_applicant ? t('applicant') : null,
                            ]
                              .filter(Boolean)
                              .join(' + ')})`
                          : ''
                      }`}
                      subtitle={t('identityBeneficiarySubtitle')}
                      contactTitle={t('contactAddress')}
                      contactSubtitle={t('contactAddressSubtitle')}
                      showResidenceFields={false}
                      value={head}
                      onChange={(next) =>
                        setFamilyHeads((list) =>
                          list.map((row, i) =>
                            i === idx
                              ? {
                                  ...next,
                                  _relation_type: row._relation_type,
                                  _family_members: row._family_members,
                                  is_applicant: row.is_applicant,
                                  is_beneficiary: row.is_beneficiary,
                                }
                              : row,
                          ),
                        )
                      }
                    />
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidPropertyOwnership
                        value={head}
                        onChange={(next) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    ...next,
                                    _relation_type: row._relation_type,
                                    _family_members: row._family_members,
                                    is_applicant: row.is_applicant,
                                    is_beneficiary: row.is_beneficiary,
                                  }
                                : row,
                            ),
                          )
                        }
                        title={t('propertyHead')}
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidResidentHousing
                        value={head}
                        onChange={(next) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    ...next,
                                    _relation_type: row._relation_type,
                                    _family_members: row._family_members,
                                    is_applicant: row.is_applicant,
                                    is_beneficiary: row.is_beneficiary,
                                  }
                                : row,
                            ),
                          )
                        }
                        title={t('residentHead')}
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidLivestockIntake
                        value={head}
                        onChange={(next) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    ...next,
                                    _relation_type: row._relation_type,
                                    _family_members: row._family_members,
                                    is_applicant: row.is_applicant,
                                    is_beneficiary: row.is_beneficiary,
                                  }
                                : row,
                            ),
                          )
                        }
                        title={t('livestockHead')}
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidVehicleIntake
                        value={head}
                        onChange={(next) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    ...next,
                                    _relation_type: row._relation_type,
                                    _family_members: row._family_members,
                                    is_applicant: row.is_applicant,
                                    is_beneficiary: row.is_beneficiary,
                                  }
                                : row,
                            ),
                          )
                        }
                        title={t('vehicleHead')}
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidFamilyMembersIntake
                        title={t('familyMembersHead')}
                        hint={t('familyMembersHeadHint')}
                        rows={head._family_members || []}
                        onChange={(members) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? { ...row, _family_members: members }
                                : row,
                            ),
                          )
                        }
                        relationLabel={t('relationToHead')}
                        onMarkApplicant={(sel) => {
                          if (sel.kind === 'member') {
                            markApplicant({
                              kind: 'head_member',
                              headIdx: idx,
                              idx: sel.idx,
                            });
                          } else {
                            markApplicant({ kind: 'beneficiary' });
                          }
                        }}
                        onMarkBeneficiary={(sel) => {
                          if (sel.kind === 'member') {
                            markBeneficiary({
                              kind: 'head_member',
                              headIdx: idx,
                              idx: sel.idx,
                            });
                          } else {
                            markBeneficiary({ kind: 'form' });
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          <div className="form-actions aid-form-actions">
            <div className="aid-form-nav">
              {FORM_TABS.findIndex((t) => t.id === formTab) > 0 && (
                <button
                  type="button"
                  className="aid-nav-icon-btn aid-nav-icon-btn--prev"
                  title={t('previous')}
                  aria-label={t('previous')}
                  onClick={() => {
                    const idx = FORM_TABS.findIndex((tab) => tab.id === formTab);
                    setFormTab(FORM_TABS[idx - 1].id);
                  }}
                >
                  {rtl ? <FiChevronRight size={22} /> : <FiChevronLeft size={22} />}
                </button>
              )}
              {FORM_TABS.findIndex((tab) => tab.id === formTab) <
                FORM_TABS.length - 1 && (
                <button
                  type="button"
                  className="aid-nav-icon-btn aid-nav-icon-btn--next"
                  title={t('next')}
                  aria-label={t('next')}
                  onClick={() => {
                    const idx = FORM_TABS.findIndex((tab) => tab.id === formTab);
                    setFormTab(FORM_TABS[idx + 1].id);
                  }}
                >
                  {rtl ? <FiChevronLeft size={22} /> : <FiChevronRight size={22} />}
                </button>
              )}
            </div>
            <div className="aid-form-actions__submit">
              <ClearButton
                onClick={handleClearForm}
                text={t('clearForm')}
                disabled={saving || loadingEdit}
              />
              <PrimaryButton type="submit" loading={saving} loadingText={t('saving')}>
                {submitLabel}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

const AidApplicationAdd = () => (
  <AidLangProvider>
    <AidApplicationAddInner />
  </AidLangProvider>
);

export default AidApplicationAdd;
