import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import { PrimaryButton } from '../../../../common/buttons';
import SearchableDropdown from '../../../../common/SearchableDropdown';
import AidUserAssignField, {
  toAssignableAidUser,
} from '../../shared/AidUserAssignField';
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
import AidZakatPermissionForm from '../../shared/AidZakatPermissionForm';
import AidConsentForm from '../../shared/AidConsentForm';
import AidCollapsibleSection from '../../shared/AidCollapsibleSection';
import AidFamilyMembersIntake from '../../shared/AidFamilyMembersIntake';
import AidFamilyTreePanel from '../../shared/AidFamilyTreePanel';
import AidApplicantCheckbox from '../../shared/AidApplicantCheckbox';
import AidApplicationDocsIntake from '../../shared/AidApplicationDocsIntake';
import { downloadAsPng } from '../../shared/downloadAsPng';
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
  emptyZakatPermission,
  emptyConsentForm,
  emptyFamilyHeadRow,
  AID_FAMILY_HEAD_TYPES,
  AID_FAMILY_HEAD_TYPE_OPTIONS,
  AID_FAMILY_HEAD_GUARDIAN_SUBTYPES,
  AID_FAMILY_HEAD_BLOOD_TYPE_VALUES,
  AID_FAMILY_HEAD_GUARDIAN_SUBTYPE_VALUES,
  calcAgeFromDob,
  formatCnicInput,
  formatPkPhoneInput,
  isValidCnic,
  isValidPkPhone,
  resolveRelatedPersonKinship,
} from '../../aidConstants';
import '../../aid.css';

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
  province: '',
  district: '',
  tehsil: '',
  union_council: '',
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
      return { vehicle_type };
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

const toFamilyHeadType = (relation) => {
  const r = String(relation || '').toLowerCase();
  if (HEAD_TYPE_VALUES.has(r)) return r;
  if (r === 'husband') return 'spouse';
  return 'other';
};

/** Primary Type DD value: blood relation, or "guardian" when subtype / guardian. */
const familyHeadPrimaryType = (relationType) => {
  const t = String(relationType || 'father').toLowerCase();
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
    province: p.province || '',
    district: p.district || '',
    tehsil: p.tehsil || '',
    union_council: p.union_council || '',
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

const RelativeFields = ({ title, value, onChange, compact }) => (
  <div
    className={`aid-relative-block${compact ? ' aid-relative-block--compact' : ''}`}
  >
    {/* Same personal field set as Family Head / Beneficiary — optional for relatives */}
    <AidFamilyHeadPersonalFields
      title={title || 'Identity'}
      subtitle="Optional. CNIC is checked against the family registry as you type."
      contactTitle="Contact & address"
      contactSubtitle="Optional. The investigator visits this address; add a landmark."
      fieldsRequired={false}
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
          Alive
        </label>
      }
    />
    <AidLiteracyFields value={value} onChange={onChange} />
  </div>
);

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
    photo_url: p.photo_url || undefined,
    photo_name: p.photo_name || undefined,
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
    ...cleanPropertyEntries(p),
    ...cleanResidentEntries(p),
    ...cleanLivestockEntries(p),
    ...cleanVehicleEntries(p),
    necta_status: p.necta_status || undefined,
    necta_document_url: p.necta_document_url || undefined,
    necta_document_name: p.necta_document_name || undefined,
    bisp_status: p.bisp_status || undefined,
    is_alive: p.is_alive !== false,
    address: p.address || undefined,
    city: p.city || p.district || undefined,
    province: p.province || undefined,
    district: p.district || undefined,
    tehsil: p.tehsil || undefined,
    union_council: p.union_council || undefined,
  };
};

const AidApplicationAdd = () => {
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
  const [zakatPermission, setZakatPermission] = useState(emptyZakatPermission());
  const [consentForm, setConsentForm] = useState(emptyConsentForm());
  const [applicationDocs, setApplicationDocs] = useState({});
  const [assignedUser, setAssignedUser] = useState(null);
  const [familyHeads, setFamilyHeads] = useState([
    {
      ...emptyFamilyHeadRow('father'),
      is_applicant: false,
      is_beneficiary: false,
    },
  ]);
  const [spouse, setSpouse] = useState(emptyRelative());
  /** Beneficiary tab — any relatives (children, siblings, parents, …). */
  const [beneficiaryMembers, setBeneficiaryMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);
  const [error, setError] = useState('');
  const [formTab, setFormTab] = useState('family');
  const applicationCaptureRef = useRef(null);
  const zakatCaptureRef = useRef(null);
  const consentCaptureRef = useRef(null);
  const [pngDownloading, setPngDownloading] = useState(false);

  const hydrateFromApplication = useCallback(async (appId) => {
    setLoadingEdit(true);
    setError('');
    try {
      const appRes = await axiosInstance.get(`/aid/applications/${appId}`);
      const app = appRes.data?.data || appRes.data;
      if (!app?.id) throw new Error('Application not found');

      const closed =
        app.status === 'rejected' || app.status === 'delivered';
      if (closed) {
        throw new Error('This application is closed and cannot be edited');
      }

      const benId =
        app.beneficiary?.id || app.beneficiary_person_id || null;
      let personDetail = null;
      if (benId) {
        try {
          const peopleRes = await axiosInstance.get(`/aid/people/${benId}`);
          personDetail = peopleRes.data?.data || null;
        } catch {
          personDetail = null;
        }
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
      setZakatPermission(
        app.zakat_permission
          ? { ...emptyZakatPermission(), ...app.zakat_permission }
          : emptyZakatPermission(),
      );
      setConsentForm(
        app.consent_form
          ? { ...emptyConsentForm(), ...app.consent_form }
          : emptyConsentForm(),
      );
      setAssignedUser(
        app.assigned_to ? toAssignableAidUser(app.assigned_to) : null,
      );

      const tree = personDetail?.family_tree || {};
      const parents = tree.parents || [];
      const spouseRows = tree.spouse || [];

      if (parents.length > 0) {
        const heads = parents.map((row) => {
          const rel = toFamilyHeadType(row.relation);
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
        setFamilyHeads([
          mapPersonToForm(beneficiaryPerson, {
            _relation_type: 'father',
            is_beneficiary: true,
            is_applicant: isWriterSelf,
            _family_members: [],
          }),
        ]);
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
      } else {
        setSpouse(emptyRelative());
      }

      const memberKeys = [
        'children',
        'brothers',
        'sisters',
        'siblings',
        'extended',
        'grandparents',
        'grandchildren',
      ];
      const members = [];
      for (const key of memberKeys) {
        for (const row of tree[key] || []) {
          if (!row?.person) continue;
          const rel = String(row.relation || 'other').toLowerCase();
          members.push(
            mapPersonToForm(row.person, {
              relation_type: HEAD_TYPE_VALUES.has(rel) ? rel : 'other',
              is_applicant:
                !isWriterSelf && Number(row.person.id) === Number(writerId),
            }),
          );
        }
      }
      setBeneficiaryMembers(members);
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

  useEffect(() => {
    if (isEdit) {
      hydrateFromApplication(editId);
    }
  }, [isEdit, editId, hydrateFromApplication]);

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
    { id: 'family', label: 'Family Registration', hint: 'Household' },
    { id: 'beneficiary', label: 'Beneficiary', hint: 'Person details' },
    { id: 'family_tree', label: 'Family Tree', hint: 'Household map' },
    { id: 'request', label: 'Application', hint: 'Need & program' },
    { id: 'attachments', label: 'Attachments', hint: 'Docs & forms' },
    { id: 'assignment', label: 'Assignment', hint: 'Case owner' },
  ];
  const stepIndex = FORM_TABS.findIndex((t) => t.id === formTab);
  const stepProgress = ((stepIndex + 1) / FORM_TABS.length) * 100;

  /** Family Head marked as the beneficiary (single-person household). */
  const headAsBeneficiary =
    familyHeads.find((h) => h.is_beneficiary) || null;

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
      ? 'Husband (late / optional)'
      : maritalKey === 'widower'
        ? 'Wife (late / optional)'
        : beneficiaryGender === 'male'
          ? 'Wife'
          : beneficiaryGender === 'female'
            ? 'Husband'
            : 'Spouse';
  const spouseDefaultGender =
    beneficiaryGender === 'male'
      ? 'female'
      : beneficiaryGender === 'female'
        ? 'male'
        : '';

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
    setBeneficiary((b) => ({
      ...b,
      is_applicant: kind === 'beneficiary',
    }));
    setSpouse((s) => ({
      ...s,
      is_applicant: kind === 'spouse',
    }));
    setFamilyHeads((heads) =>
      heads.map((h, i) => ({
        ...h,
        is_applicant: kind === 'family_head' && target.idx === i,
        _family_members: (h._family_members || []).map((m, mi) => ({
          ...m,
          is_applicant:
            kind === 'head_member' &&
            target.headIdx === i &&
            target.idx === mi,
        })),
      })),
    );
    setBeneficiaryMembers((list) =>
      list.map((m, i) => ({
        ...m,
        is_applicant: kind === 'beneficiary_member' && target.idx === i,
      })),
    );
  };

  /** Exactly one beneficiary source: Beneficiary tab or one Family Head. */
  const markBeneficiary = (target) => {
    const kind = target?.kind || 'form';
    setFamilyHeads((heads) =>
      heads.map((h, i) => ({
        ...h,
        is_beneficiary: kind === 'family_head' && target.idx === i,
      })),
    );
    if (kind === 'family_head') {
      // Family head is beneficiary — clear applicant on the separate beneficiary form
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
        pushRelatedMember(members, rel, {
          notes: rel.is_applicant
            ? `Applicant / relative of ${familyHeadTypeLabel(uiType).toLowerCase()} (${rel.relation_type || 'other'})`
            : `Relative of ${familyHeadTypeLabel(uiType).toLowerCase()} (${rel.relation_type || 'other'})`,
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
        zakat_permission: zakatPermission,
        consent_form: consentForm,
        writer_relation: 'self',
        family_members: buildFamilyMembers(),
        ...(assignedUser?.id
          ? { assigned_to_user_id: Number(assignedUser.id) }
          : {}),
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
          if (isEdit) {
            payload.beneficiary = {
              ...cleanPersonPayload(beneficiaryHead),
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
          if (isEdit) {
            const writerPayload = cleanPersonPayload(person);
            if (writerPayload) payload.writer = writerPayload;
          }
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
        toast.success('Application created');
      }

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
              uploads.push({
                context,
                file: item.file,
                description:
                  list.length > 1 ? `${context} (${i + 1})` : context,
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
      }
      navigate(
        savedId
          ? `/dms/aid/applications/entry/view/${savedId}`
          : '/dms/aid/applications/entry/list',
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          (isEdit
            ? 'Failed to update application'
            : 'Failed to create application'),
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

  if (loadingEdit) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader
            title="Edit Aid Application"
            backPath="/dms/aid/applications/entry/list"
            onBackClick={() => navigate('/dms/aid/applications/entry/list')}
            showAdd={false}
          />
          <p>Loading application…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={isEdit ? 'Edit Aid Application' : 'New Aid Application'}
          backPath="/dms/aid/applications/entry/list"
          onBackClick={() => navigate('/dms/aid/applications/entry/list')}
          showAdd={false}
        />

        {error && (
          <div className="status-message status-message--error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="form aid-application-form">
          <div className="aid-steps" role="navigation" aria-label="Application steps">
            <div className="aid-steps__meta">
              <span className="aid-steps__meta-label">
                Step {stepIndex + 1} of {FORM_TABS.length}
              </span>
              <span className="aid-steps__meta-pct">
                {Math.round(stepProgress)}% complete
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
              <h3 className="form-section-heading">Application</h3>
              <button
                type="button"
                className="aid-png-download-btn"
                title="Download as PNG"
                aria-label="Download Application as PNG"
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
                label="Title"
                name="title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Short need title"
              />
              <FormSelect
                label="Program"
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
                }}
                options={AID_REQUEST_TYPES}
              />
              {getAidProgramsForType(form.requested_aid_type).length > 0 ? (
                <FormSelect
                  label="SubProgram"
                  name="aid_program"
                  value={form.aid_program || ''}
                  required
                  onChange={(e) => {
                    const amt = resolveExpectedAmountFields(
                      form.requested_aid_type,
                      e.target.value,
                    );
                    setForm((p) => ({
                      ...p,
                      aid_program: amt.aid_program,
                      expected_amount: amt.expected_amount,
                      expected_amount_max: amt.expected_amount_max,
                    }));
                  }}
                  options={[
                    { value: '', label: 'Select SubProgram…' },
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
                <label className="form-label">Expected Amount</label>
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
                    : '—'}
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
                    Select a Program and SubProgram to see the expected amount.
                  </p>
                )}
              </div>
            </div>
            <div className="aid-field-spaced">
              <FormTextarea
                label={
                  form.requested_aid_type === 'ration'
                    ? 'Application'
                    : 'Application summary'
                }
                name="request_summary"
                value={form.request_summary}
                onChange={(e) =>
                  setForm((p) => ({ ...p, request_summary: e.target.value }))
                }
                rows={form.requested_aid_type === 'ration' ? 6 : 3}
                placeholder="Describe the need…"
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

          {formTab === 'attachments' && (
          <div className="form-section">
            <h3 className="form-section-heading">Attachments</h3>
            <AidApplicationDocsIntake
              value={applicationDocs}
              onChange={setApplicationDocs}
              disabled={saving}
            />

            <AidCollapsibleSection
              className="aid-family-panel"
              title="Zakat Permission Letter"
              hint="Optional — click to fill or review"
              actions={
                <button
                  type="button"
                  className="aid-png-download-btn"
                  title="Download as PNG"
                  aria-label="Download Zakat form as PNG"
                  disabled={pngDownloading}
                  onClick={() =>
                    handleDownloadPng(zakatCaptureRef, 'zakat-permission-letter')
                  }
                >
                  <FiDownload size={18} />
                </button>
              }
            >
              <div ref={zakatCaptureRef} className="aid-png-capture">
                <AidZakatPermissionForm
                  value={zakatPermission}
                  onChange={setZakatPermission}
                />
              </div>
            </AidCollapsibleSection>

            <AidCollapsibleSection
              className="aid-family-panel"
              title="Consent Form"
              hint="Optional — click to fill or review"
              actions={
                <button
                  type="button"
                  className="aid-png-download-btn"
                  title="Download as PNG"
                  aria-label="Download Consent form as PNG"
                  disabled={pngDownloading}
                  onClick={() =>
                    handleDownloadPng(consentCaptureRef, 'consent-form')
                  }
                >
                  <FiDownload size={18} />
                </button>
              }
            >
              <div ref={consentCaptureRef} className="aid-png-capture">
                <AidConsentForm
                  value={consentForm}
                  onChange={setConsentForm}
                />
              </div>
            </AidCollapsibleSection>
          </div>
          )}

          {formTab === 'assignment' && (
          <div className="form-section">
            <h3 className="form-section-heading">Assignment</h3>
            <AidUserAssignField
              value={assignedUser}
              onChange={setAssignedUser}
              hint="Optional — assign a fund-raising staff member to handle this case."
            />
          </div>
          )}

          {formTab === 'beneficiary' && (
          <div className="form-section">
            <h3 className="form-section-heading">Beneficiary</h3>
            {headAsBeneficiary ? (
              <>
                <p className="aid-section-hint">
                  Beneficiary is set from Family Head (
                  {familyHeadTypeLabel(headAsBeneficiary._relation_type)}
                  ). Other details stay on the Family Head step; set date of
                  birth here if needed. You can still add family members below.
                </p>
                <div
                  className="aid-family-panel"
                  style={{ marginTop: 12, maxWidth: '22rem' }}
                >
                  <div className="aid-fh-personal__dob-label-row">
                    <span className="aid-fh-personal__dob-label">
                      Date of birth (beneficiary){' '}
                      <span className="required-mark">*</span>
                    </span>
                    {calcAgeFromDob(headAsBeneficiary.date_of_birth) != null ? (
                      <span className="aid-fh-personal__age">
                        Age: {calcAgeFromDob(headAsBeneficiary.date_of_birth)}{' '}
                        yrs
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
                label="Beneficiary is the applicant"
                hint="Uncheck by selecting applicant on Family Head or a family member."
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
              Link existing person in system
            </label>
            )}

            {headAsBeneficiary ? null : beneficiaryMode === 'existing' ? (
              <>
                <SearchableDropdown
                  label="Search beneficiary"
                  placeholder="Name, CNIC, phone…"
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
                        Date of birth (beneficiary)
                      </span>
                      {calcAgeFromDob(existingBeneficiary.date_of_birth) !=
                      null ? (
                        <span className="aid-fh-personal__age">
                          Age:{' '}
                          {calcAgeFromDob(existingBeneficiary.date_of_birth)}{' '}
                          yrs
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
                  title="Identity of beneficiary"
                  subtitle="CNIC is checked against the family registry as you type, to catch repeat or duplicate applications."
                  contactTitle="Contact & address"
                  contactSubtitle="The investigator visits this address; add a landmark."
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
                  <h4 className="aid-family-panel__title">
                    Literacy (beneficiary / family head)
                  </h4>
                  <AidLiteracyFields
                    value={beneficiary}
                    onChange={setBeneficiary}
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidPropertyOwnership
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title="Property ownership (beneficiary)"
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidResidentHousing
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title="Resident (beneficiary)"
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidLivestockIntake
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title="Livestock (beneficiary)"
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidVehicleIntake
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title="Vehicle (beneficiary)"
                  />
                </div>
                <div className="aid-family-panel" style={{ marginTop: 12 }}>
                  <AidEligibilityStatus
                    value={beneficiary}
                    onChange={setBeneficiary}
                    title="NECTA / BISP (beneficiary)"
                  />
                </div>
              </>
            )}

            <div className="aid-family-panel" style={{ marginTop: 12 }}>
              <AidFamilyMembersIntake
                title="Beneficiary — family members"
                hint="Add any relative. Select Type first. Mark one as applicant if they applied."
                rows={beneficiaryMembers}
                onChange={setBeneficiaryMembers}
                relationLabel="Type (relation to beneficiary)"
                onMarkApplicant={(sel) => {
                  if (sel.kind === 'member') {
                    markApplicant({ kind: 'beneficiary_member', idx: sel.idx });
                  } else {
                    markApplicant({ kind: 'beneficiary' });
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

            {showSpouseSection && (
              <div className="aid-family-panel">
                <AidApplicantCheckbox
                  checked={!!spouse.is_applicant}
                  onChange={(yes) => {
                    if (yes) markApplicant({ kind: 'spouse' });
                    else markApplicant({ kind: 'beneficiary' });
                  }}
                  label={`${spouseLabel} is the applicant`}
                />
                <RelativeFields
                  title={`${spouseLabel} (optional)`}
                  value={spouse}
                  onChange={(next) =>
                    setSpouse({ ...next, is_applicant: spouse.is_applicant })
                  }
                  compact
                />
              </div>
            )}

            <div className="aid-family-panel">
              <div className="aid-family-panel__head">
                <h4 className="aid-family-panel__title">
                  Family Head <span>(select type for each)</span>
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
                  + Add family head
                </button>
              </div>
              {familyHeads.map((head, idx) => {
                const primaryType = familyHeadPrimaryType(head._relation_type);
                const subtype = familyHeadSubtype(head._relation_type);
                const typeLabel =
                  primaryType === 'guardian'
                    ? subtype
                      ? `Guardian — ${familyHeadTypeLabel(subtype)}`
                      : 'Guardian'
                    : familyHeadTypeLabel(primaryType);
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
                            label="Case source"
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
                          label="Type"
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
                            label="Subtype"
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
                              { value: '', label: 'Select subtype…' },
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
                            Remove
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
                        label="Applicant"
                        hint="This Family Head submitted the application"
                      />
                      <AidApplicantCheckbox
                        checked={!!head.is_beneficiary}
                        variant="beneficiary"
                        onChange={(yes) => {
                          if (yes) markBeneficiary({ kind: 'family_head', idx });
                          else markBeneficiary({ kind: 'form' });
                        }}
                        label="Beneficiary"
                        hint="Single-person family — this head is the beneficiary"
                      />
                    </div>
                    <AidFamilyHeadPersonalFields
                      title={`Identity of family head${
                        head.is_beneficiary || head.is_applicant
                          ? ` — ${typeLabel} (${[
                              head.is_beneficiary ? 'Beneficiary' : null,
                              head.is_applicant ? 'Applicant' : null,
                            ]
                              .filter(Boolean)
                              .join(' + ')})`
                          : ` — ${typeLabel}`
                      }`}
                      subtitle="CNIC is checked against the family registry as you type, to catch repeat or duplicate applications."
                      contactTitle="Contact & address"
                      contactSubtitle="The investigator visits this address; add a landmark."
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
                      <h4 className="aid-family-panel__title">
                        {typeLabel} — literacy detail
                      </h4>
                      <AidLiteracyFields
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
                      />
                    </div>
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
                        title={`${typeLabel} — property ownership`}
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
                        title={`${typeLabel} — resident`}
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
                        title={`${typeLabel} — livestock`}
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
                        title={`${typeLabel} — vehicle`}
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidEligibilityStatus
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
                        title={`${typeLabel} — NECTA / BISP`}
                      />
                    </div>
                    <div className="aid-family-panel" style={{ marginTop: 12 }}>
                      <AidFamilyMembersIntake
                        title={`${typeLabel} — family members`}
                        hint="Relatives under this family head. Mark one as applicant if they applied."
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
                        relationLabel="Type (relation to family head)"
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
                  title="Previous"
                  aria-label="Previous"
                  onClick={() => {
                    const idx = FORM_TABS.findIndex((t) => t.id === formTab);
                    setFormTab(FORM_TABS[idx - 1].id);
                  }}
                >
                  <FiChevronLeft size={22} />
                </button>
              )}
              {FORM_TABS.findIndex((t) => t.id === formTab) < FORM_TABS.length - 1 && (
                <button
                  type="button"
                  className="aid-nav-icon-btn aid-nav-icon-btn--next"
                  title="Next"
                  aria-label="Next"
                  onClick={() => {
                    const idx = FORM_TABS.findIndex((t) => t.id === formTab);
                    setFormTab(FORM_TABS[idx + 1].id);
                  }}
                >
                  <FiChevronRight size={22} />
                </button>
              )}
            </div>
            <PrimaryButton type="submit" loading={saving} loadingText="Saving…">
              {isEdit ? 'Save changes' : 'Submit application'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </>
  );
};

export default AidApplicationAdd;
