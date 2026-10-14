import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import AidUserAssignField from '../../shared/AidUserAssignField';
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
import AidFamilyMembersIntake from '../../shared/AidFamilyMembersIntake';
import { downloadAsPng } from '../../shared/downloadAsPng';
import {
  AID_REQUEST_TYPES,
  AID_WRITER_RELATIONS,
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
  emptyRelatedPersonBase,
  AID_FAMILY_HEAD_TYPES,
  formatCnicInput,
  formatPkPhoneInput,
  isValidCnic,
  isValidPkPhone,
  AID_VULNERABILITIES,
  resolveRelatedPersonKinship,
} from '../../aidConstants';
import '../../aid.css';

const emptyPerson = {
  full_name: '',
  father_or_husband_name: '',
  cnic: '',
  phone: '',
  city: '',
  address: '',
  gender: '',
  date_of_birth: '',
  marital_status: '',
  vulnerability: '',
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

const emptyRelative = () => ({ ...emptyPerson });

const familyHeadTypeLabel = (type) =>
  AID_FAMILY_HEAD_TYPES.find((t) => t.value === type)?.label || type || 'Family head';

const RelativeFields = ({
  title,
  value,
  onChange,
  genderHint,
  compact,
}) => (
  <div className={`aid-relative-block${compact ? ' aid-relative-block--compact' : ''}`}>
    {title ? <h4 className="aid-relative-block__title">{title}</h4> : null}
    <div className="form-grid-2">
      <FormInput
        label="Full name"
        value={value.full_name}
        onChange={(e) => onChange({ ...value, full_name: e.target.value })}
        placeholder={genderHint || undefined}
      />
      <FormInput
        label="CNIC (12345-1234567-1)"
        value={value.cnic}
        onChange={(e) =>
          onChange({ ...value, cnic: formatCnicInput(e.target.value) })
        }
        placeholder="36101-XXXXXXX-X"
        inputMode="numeric"
      />
      <FormInput
        label="Phone (03XXXXXXXXX)"
        value={value.phone}
        onChange={(e) =>
          onChange({ ...value, phone: formatPkPhoneInput(e.target.value) })
        }
        placeholder="03001234567"
        inputMode="numeric"
      />
      <FormSelect
        label="Gender"
        value={value.gender}
        onChange={(e) => onChange({ ...value, gender: e.target.value })}
        options={[{ value: '', label: '—' }, ...AID_GENDERS]}
      />
      <FormInput
        label="Date of birth"
        type="date"
        value={value.date_of_birth}
        onChange={(e) => onChange({ ...value, date_of_birth: e.target.value })}
      />
      <FormSelect
        label="Marital status"
        value={value.marital_status}
        onChange={(e) => onChange({ ...value, marital_status: e.target.value })}
        options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
      />
      <FormInput
        label="City"
        value={value.city}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
      />
      <label className="aid-toggle">
        <input
          type="checkbox"
          checked={value.is_alive !== false}
          onChange={(e) => onChange({ ...value, is_alive: e.target.checked })}
        />
        Alive
      </label>
    </div>
    <AidLiteracyFields value={value} onChange={onChange} />
    <FormTextarea
      label="Address"
      value={value.address}
      onChange={(e) => onChange({ ...value, address: e.target.value })}
      rows={2}
    />
  </div>
);

const cleanPersonPayload = (p) => {
  if (!p?.full_name?.trim()) return null;
  return {
    full_name: p.full_name.trim(),
    father_or_husband_name: p.father_or_husband_name?.trim() || undefined,
    cnic: p.cnic || undefined,
    phone: p.phone || undefined,
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
    has_land: !!p.has_land,
    property_type: p.has_land ? p.property_type || undefined : undefined,
    property_details: p.has_land
      ? p.property_details || undefined
      : undefined,
    resident_type: p.resident_type || undefined,
    resident_ownership_status: p.resident_ownership_status || undefined,
    resident_ownership_other: p.resident_ownership_other || undefined,
    rented_amount:
      p.resident_type === 'rented' && p.rented_amount !== ''
        ? p.rented_amount
        : undefined,
    house_area_marla:
      p.house_area_marla !== '' && p.house_area_marla != null
        ? p.house_area_marla
        : undefined,
    house_details: p.house_details || undefined,
    ...cleanLivestockEntries(p),
    has_vehicle: !!p.has_vehicle,
    vehicle_type:
      p.has_vehicle && p.vehicle_type?.trim()
        ? p.vehicle_type.trim()
        : undefined,
    necta_status: p.necta_status || undefined,
    necta_document_url: p.necta_document_url || undefined,
    necta_document_name: p.necta_document_name || undefined,
    bisp_status: p.bisp_status || undefined,
    is_alive: p.is_alive !== false,
    address: p.address || undefined,
    city: p.city || undefined,
  };
};

const AidApplicationAdd = () => {
  const navigate = useNavigate();
  const [writerIsSelf, setWriterIsSelf] = useState(true);
  const [beneficiaryMode, setBeneficiaryMode] = useState('new');
  const [writerMode, setWriterMode] = useState('new');
  const [beneficiaryId, setBeneficiaryId] = useState(null);
  const [existingBeneficiary, setExistingBeneficiary] = useState(null);
  const [writerId, setWriterId] = useState(null);
  const [beneficiary, setBeneficiary] = useState({ ...emptyPerson });
  const [writer, setWriter] = useState({ ...emptyPerson });
  const [form, setForm] = useState({
    title: '',
    request_summary: '',
    requested_aid_type: 'health',
    writer_relation: 'self',
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
  const [assignedUser, setAssignedUser] = useState(null);
  const [familyHeads, setFamilyHeads] = useState([emptyFamilyHeadRow('father')]);
  const [spouse, setSpouse] = useState(emptyRelative());
  /** Beneficiary tab — any relatives (children, siblings, parents, …). */
  const [beneficiaryMembers, setBeneficiaryMembers] = useState([]);
  /** Relative applicant is also the Family Head — prefills Family Head step. */
  const [applicantIsFamilyHead, setApplicantIsFamilyHead] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formTab, setFormTab] = useState('writer');
  const applicationCaptureRef = useRef(null);
  const zakatCaptureRef = useRef(null);
  const consentCaptureRef = useRef(null);
  const [pngDownloading, setPngDownloading] = useState(false);

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
    { id: 'writer', label: 'Applicant', hint: 'Who applied' },
    { id: 'family', label: 'Family Head', hint: 'Household' },
    { id: 'beneficiary', label: 'Beneficiary', hint: 'Person details' },
    { id: 'request', label: 'Application', hint: 'Need & aid type' },
    { id: 'zakat', label: 'Zakat', hint: 'Permission letter' },
    { id: 'consent', label: 'Consent', hint: 'Media consent' },
    { id: 'assignment', label: 'Assignment', hint: 'Case owner' },
  ];
  const stepIndex = FORM_TABS.findIndex((t) => t.id === formTab);
  const stepProgress = ((stepIndex + 1) / FORM_TABS.length) * 100;

  const beneficiaryGender =
    beneficiaryMode === 'existing'
      ? existingBeneficiary?.gender || ''
      : beneficiary.gender;
  const beneficiaryMarital =
    beneficiaryMode === 'existing'
      ? existingBeneficiary?.marital_status || ''
      : beneficiary.marital_status;

  const isMarried = beneficiaryMarital === 'married';
  const spouseLabel =
    beneficiaryGender === 'male'
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

  const mapWriterRelationToFamilyHeadType = (rel) => {
    const r = String(rel || '').toLowerCase();
    const allowed = new Set(AID_FAMILY_HEAD_TYPES.map((t) => t.value));
    if (allowed.has(r)) return r;
    if (r === 'spouse') return 'other';
    if (r === 'relative') return 'guardian';
    return 'other';
  };

  const mapWriterRelationToMemberType = (rel) => {
    const r = String(rel || '').toLowerCase();
    if (
      ['father', 'mother', 'spouse', 'guardian', 'brother', 'sister'].includes(r)
    ) {
      return r;
    }
    return 'other';
  };

  const personFieldsFromApplicant = () => {
    const src = writer || {};
    return {
      full_name: src.full_name || '',
      father_or_husband_name: src.father_or_husband_name || '',
      cnic: src.cnic || '',
      phone: src.phone || '',
      city: src.city || '',
      address: src.address || '',
      gender: src.gender || '',
      date_of_birth: src.date_of_birth || '',
      marital_status: src.marital_status || '',
      vulnerability: src.vulnerability || '',
      occupation: src.occupation || '',
      monthly_income: src.monthly_income || '',
      education_level: src.education_level || '',
      is_alive: src.is_alive !== false,
      has_disability: !!src.has_disability,
      disability_type: src.disability_type || '',
      literacy_status: src.literacy_status || '',
      literacy_category: src.literacy_category || '',
      student_class: src.student_class || '',
      student_class_type: src.student_class_type || '',
      student_class_name: src.student_class_name || '',
      existing_person_id: writerMode === 'existing' ? writerId : src.existing_person_id || null,
    };
  };

  const applyApplicantAsFamilyHead = (goToFamilyTab = true) => {
    const headType = mapWriterRelationToFamilyHeadType(form.writer_relation);
    const fields = personFieldsFromApplicant();
    setFamilyHeads((prev) => {
      const previousMembers = prev[0]?._family_members || [];
      const head = {
        ...emptyFamilyHeadRow(headType),
        ...fields,
        _relation_type: headType,
        _family_members: previousMembers,
        _from_applicant: true,
      };
      if (prev.length <= 1) return [head];
      return [head, ...prev.slice(1)];
    });
    if (goToFamilyTab) setFormTab('family');
  };

  useEffect(() => {
    if (isMarried) {
      setSpouse((p) => ({
        ...p,
        gender: p.gender || spouseDefaultGender,
        marital_status: p.marital_status || 'married',
      }));
    }
  }, [isMarried, spouseDefaultGender]);

  // Keep Family Head in sync while "applicant is family head" is on
  useEffect(() => {
    if (!applicantIsFamilyHead || writerIsSelf) return;
    applyApplicantAsFamilyHead(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writer, writerId, writerMode, form.writer_relation, applicantIsFamilyHead, writerIsSelf]);

  // Relative applicant (not Family Head) → also appear in beneficiary family members
  useEffect(() => {
    if (writerIsSelf || applicantIsFamilyHead) {
      setBeneficiaryMembers((list) => list.filter((m) => !m._from_applicant));
      return;
    }
    const relType = mapWriterRelationToMemberType(form.writer_relation);
    const fields = personFieldsFromApplicant();
    const row = {
      ...emptyRelatedPersonBase(),
      ...fields,
      relation_type: relType,
      _from_applicant: true,
    };
    setBeneficiaryMembers((list) => {
      const idx = list.findIndex((m) => m._from_applicant);
      if (idx >= 0) {
        const next = [...list];
        next[idx] = { ...next[idx], ...row, _from_applicant: true };
        return next;
      }
      return [...list, row];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writer, writerId, writerMode, form.writer_relation, writerIsSelf, applicantIsFamilyHead]);

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
      members.push({
        relation_type: relation,
        existing_person_id: Number(row.existing_person_id),
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
      const payload = cleanPersonPayload(head);
      const relation = head._relation_type || 'other';
      if (payload) members.push({ relation_type: relation, person: payload });
      for (const rel of head._family_members || []) {
        pushRelatedMember(members, rel, {
          notes: `Relative of ${familyHeadTypeLabel(relation).toLowerCase()} (${rel.relation_type || 'other'})`,
        });
      }
    }

    for (const rel of beneficiaryMembers) {
      pushRelatedMember(members, rel, {
        notes: rel._from_applicant
          ? `Relative applicant (${form.writer_relation || rel.relation_type || 'other'})`
          : `Beneficiary family member (${rel.relation_type || 'other'})`,
      });
    }

    if (isMarried) {
      const spousePayload = cleanPersonPayload(spouse);
      if (spouse.existing_person_id) {
        members.push({
          relation_type: 'spouse',
          existing_person_id: Number(spouse.existing_person_id),
        });
      } else if (spousePayload) {
        if (!spousePayload.gender && spouseDefaultGender) {
          spousePayload.gender = spouseDefaultGender;
        }
        if (!spousePayload.marital_status) {
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
      if (isMarried && !spouse.full_name.trim()) {
        throw new Error(
          `${spouseLabel} details are required for married beneficiaries`,
        );
      }
      const allGenericMembers = [
        ...beneficiaryMembers,
        ...familyHeads.flatMap((h) => h._family_members || []),
      ];
      for (const m of allGenericMembers) {
        if (!m.full_name?.trim()) {
          throw new Error(
            'Enter a name for every family member row (or remove empty ones)',
          );
        }
        if (!m.relation_type) {
          throw new Error('Select Type for every family member');
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
        throw new Error('Enter at least one Family Head (Father / Mother / Guardian…)');
      }
      const missingType = namedHeads.find((h) => !h._relation_type);
      if (missingType) {
        throw new Error('Select Type for each Family Head');
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

      const payload = {
        title: form.title || null,
        request_summary: form.request_summary || null,
        requested_aid_type: form.requested_aid_type,
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
        writer_relation: writerIsSelf ? 'self' : form.writer_relation,
        family_members: buildFamilyMembers(),
        ...(assignedUser?.id
          ? { assigned_to_user_id: Number(assignedUser.id) }
          : {}),
      };

      if (beneficiaryMode === 'existing') {
        if (!beneficiaryId) throw new Error('Select a beneficiary');
        payload.beneficiary_person_id = Number(beneficiaryId);
      } else {
        if (!beneficiary.full_name.trim()) throw new Error('Beneficiary name is required');
        if (!beneficiary.gender) throw new Error('Beneficiary gender is required');
        if (!beneficiary.marital_status) {
          throw new Error('Beneficiary marital status is required');
        }
        payload.beneficiary = {
          ...cleanPersonPayload(beneficiary),
          full_name: beneficiary.full_name.trim(),
        };
      }

      if (writerIsSelf) {
        payload.writer_relation = 'self';
      } else if (writerMode === 'existing') {
        if (!writerId) throw new Error('Select applicant');
        payload.writer_person_id = Number(writerId);
      } else {
        if (!writer.full_name.trim()) throw new Error('Applicant name is required');
        payload.writer = cleanPersonPayload(writer);
      }

      const res = await axiosInstance.post('/aid/applications', payload);
      const id = res.data?.data?.id;
      navigate(id ? `/dms/aid/applications/view/${id}` : '/dms/aid/applications/list');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create application');
    } finally {
      setSaving(false);
    }
  };

  const familyHint = useMemo(() => {
    const base =
      'Add Family Head entries and select type for each (Father / Mother / Guardian…). Under each head you can add any family members (children, siblings, …).';
    if (isMarried) {
      return `${base} Also add ${spouseLabel.toLowerCase()} if married.`;
    }
    return base;
  }, [isMarried, spouseLabel]);

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title="New Aid Application"
          backPath="/dms/aid/applications/list"
          onBackClick={() => navigate('/dms/aid/applications/list')}
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
                label="Aid type"
                name="requested_aid_type"
                value={form.requested_aid_type}
                onChange={(e) => {
                  const next = e.target.value;
                  setForm((p) => ({ ...p, requested_aid_type: next }));
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

          {formTab === 'zakat' && (
          <div className="form-section">
            <div className="aid-section-heading-row">
              <h3 className="form-section-heading">Zakat Permission Letter</h3>
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
            </div>
            <div ref={zakatCaptureRef} className="aid-png-capture">
              <AidZakatPermissionForm
                value={zakatPermission}
                onChange={setZakatPermission}
              />
            </div>
          </div>
          )}

          {formTab === 'consent' && (
          <div className="form-section">
            <div className="aid-section-heading-row">
              <h3 className="form-section-heading">Consent Form</h3>
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
            </div>
            <div ref={consentCaptureRef} className="aid-png-capture">
              <AidConsentForm
                value={consentForm}
                onChange={setConsentForm}
              />
            </div>
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

            {beneficiaryMode === 'existing' ? (
              <SearchableDropdown
                label="Search beneficiary"
                placeholder="Name, CNIC, phone…"
                onSearch={searchPeople}
                onSelect={async (item) => {
                  setBeneficiaryId(item.id);
                  try {
                    const res = await axiosInstance.get(`/aid/people/${item.id}`);
                    setExistingBeneficiary(res.data?.data?.person || item.raw || null);
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
            ) : (
              <div className="form-grid-2">
                <FormInput
                  label="Full name"
                  required
                  value={beneficiary.full_name}
                  onChange={(e) =>
                    setBeneficiary((p) => ({ ...p, full_name: e.target.value }))
                  }
                />
                <FormInput
                  label="CNIC (unique)"
                  value={beneficiary.cnic}
                  onChange={(e) =>
                    setBeneficiary((p) => ({ ...p, cnic: e.target.value }))
                  }
                  placeholder="Optional but unique if provided"
                />
                <FormInput
                  label="Phone"
                  value={beneficiary.phone}
                  onChange={(e) =>
                    setBeneficiary((p) => ({ ...p, phone: e.target.value }))
                  }
                />
                <FormInput
                  label="City"
                  value={beneficiary.city}
                  onChange={(e) =>
                    setBeneficiary((p) => ({ ...p, city: e.target.value }))
                  }
                />
                <FormSelect
                  label="Gender"
                  required
                  value={beneficiary.gender}
                  onChange={(e) =>
                    setBeneficiary((p) => ({ ...p, gender: e.target.value }))
                  }
                  options={[{ value: '', label: '—' }, ...AID_GENDERS]}
                />
                <FormSelect
                  label="Marital status"
                  required
                  value={beneficiary.marital_status}
                  onChange={(e) =>
                    setBeneficiary((p) => ({ ...p, marital_status: e.target.value }))
                  }
                  options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
                />
                <FormSelect
                  label="Vulnerability"
                  value={beneficiary.vulnerability || ''}
                  onChange={(e) =>
                    setBeneficiary((p) => ({
                      ...p,
                      vulnerability: e.target.value,
                    }))
                  }
                  options={[{ value: '', label: '—' }, ...AID_VULNERABILITIES]}
                />
                <FormInput
                  label="Date of birth"
                  type="date"
                  value={beneficiary.date_of_birth}
                  onChange={(e) =>
                    setBeneficiary((p) => ({ ...p, date_of_birth: e.target.value }))
                  }
                />
                <FormSelect
                  label="Disability"
                  value={beneficiary.has_disability ? 'yes' : 'no'}
                  onChange={(e) =>
                    setBeneficiary((p) => ({
                      ...p,
                      has_disability: e.target.value === 'yes',
                      disability_type:
                        e.target.value === 'yes' ? p.disability_type : '',
                    }))
                  }
                  options={AID_YES_NO}
                />
                {beneficiary.has_disability && (
                  <FormInput
                    label="Type of disability"
                    value={beneficiary.disability_type || ''}
                    onChange={(e) =>
                      setBeneficiary((p) => ({
                        ...p,
                        disability_type: e.target.value,
                      }))
                    }
                  />
                )}
                <div className="aid-span-2">
                  <FormTextarea
                    label="Address"
                    value={beneficiary.address}
                    onChange={(e) =>
                      setBeneficiary((p) => ({ ...p, address: e.target.value }))
                    }
                    rows={2}
                    placeholder="Full address"
                  />
                </div>
              </div>
            )}

            {beneficiaryMode !== 'existing' && (
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
                hint="Add any relative of the beneficiary (child, sibling, parent, spouse, …). Select Type first."
                rows={beneficiaryMembers}
                onChange={setBeneficiaryMembers}
                relationLabel="Type (relation to beneficiary)"
              />
            </div>
          </div>
          )}

          {formTab === 'family' && (
          <div className="form-section">
            <h3 className="form-section-heading">Family Head</h3>
            <p className="aid-section-hint">{familyHint}</p>

            {isMarried && (
              <div className="aid-family-panel">
                <RelativeFields
                  title={`${spouseLabel} (required)`}
                  value={spouse}
                  onChange={setSpouse}
                  genderHint={spouseLabel}
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
                    setFamilyHeads((p) => [...p, emptyFamilyHeadRow('guardian')])
                  }
                >
                  + Add family head
                </button>
              </div>
              {familyHeads.map((head, idx) => {
                const typeLabel = familyHeadTypeLabel(head._relation_type);
                return (
                  <div key={`fh-${idx}`} className="aid-repeat-item">
                    <div className="aid-repeat-item__head aid-repeat-item__head--select">
                      <FormSelect
                        label="Type"
                        value={head._relation_type || 'father'}
                        onChange={(e) => {
                          const type = e.target.value;
                          const preset = emptyFamilyHeadRow(type);
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    _relation_type: type,
                                    gender: row.gender || preset.gender,
                                  }
                                : row,
                            ),
                          );
                        }}
                        options={AID_FAMILY_HEAD_TYPES}
                        required
                      />
                      {familyHeads.length > 1 && (
                        <button
                          type="button"
                          className="aid-mini-btn aid-mini-btn--remove"
                          onClick={() =>
                            setFamilyHeads((list) =>
                              list.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {head._from_applicant ? (
                      <p className="aid-section-hint" style={{ marginTop: 0 }}>
                        Prefill from Applicant (relative who is also Family Head).
                        You can edit details below.
                      </p>
                    ) : null}
                    <AidFamilyHeadPersonalFields
                      title={`${typeLabel} — Primary Beneficiary / Family Head`}
                      value={head}
                      onChange={(next) =>
                        setFamilyHeads((list) =>
                          list.map((row, i) =>
                            i === idx
                              ? {
                                  ...next,
                                  _relation_type: row._relation_type,
                                  _family_members: row._family_members,
                                  _from_applicant: row._from_applicant,
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
                                    _from_applicant: row._from_applicant,
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
                                    _from_applicant: row._from_applicant,
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
                                    _from_applicant: row._from_applicant,
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
                                    _from_applicant: row._from_applicant,
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
                                    _from_applicant: row._from_applicant,
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
                                    _from_applicant: row._from_applicant,
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
                        hint="Add any relative of this family head (child, sibling, parent, …). Select Type first."
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
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {formTab === 'writer' && (
          <div className="form-section">
            <h3 className="form-section-heading">Applicant</h3>
            <label className="aid-toggle aid-toggle--block">
              <input
                type="checkbox"
                checked={writerIsSelf}
                onChange={(e) => {
                  const self = e.target.checked;
                  setWriterIsSelf(self);
                  if (self) {
                    setForm((p) => ({ ...p, writer_relation: 'self' }));
                    setApplicantIsFamilyHead(false);
                    setFamilyHeads((list) =>
                      list.map((h) =>
                        h._from_applicant ? { ...h, _from_applicant: false } : h,
                      ),
                    );
                  } else if (form.writer_relation === 'self') {
                    setForm((p) => ({ ...p, writer_relation: 'father' }));
                  }
                }}
              />
              Beneficiary is also the applicant
            </label>

            {!writerIsSelf && (
              <div className="aid-writer-fields">
                <div className="form-grid-2">
                  <FormSelect
                    label="Applicant relation to beneficiary"
                    value={form.writer_relation}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, writer_relation: e.target.value }))
                    }
                    options={AID_WRITER_RELATIONS.filter((r) => r.value !== 'self')}
                  />
                </div>
                <p className="aid-section-hint">
                  Relative applicants are also saved as a family member of the
                  beneficiary (linked by the relation above).
                </p>
                <label className="aid-toggle aid-toggle--block">
                  <input
                    type="checkbox"
                    checked={applicantIsFamilyHead}
                    onChange={(e) => {
                      const yes = e.target.checked;
                      setApplicantIsFamilyHead(yes);
                      if (yes) {
                        applyApplicantAsFamilyHead(true);
                      } else {
                        setFamilyHeads((list) =>
                          list.map((h) =>
                            h._from_applicant
                              ? { ...h, _from_applicant: false }
                              : h,
                          ),
                        );
                      }
                    }}
                  />
                  Relative applicant can be Family Head also
                </label>
                {applicantIsFamilyHead ? (
                  <p className="aid-section-hint">
                    Family Head is set from this applicant. Continue on the Family
                    Head step to review or add more relatives.
                  </p>
                ) : null}
                <label className="aid-toggle aid-toggle--block">
                  <input
                    type="checkbox"
                    checked={writerMode === 'existing'}
                    onChange={(e) =>
                      setWriterMode(e.target.checked ? 'existing' : 'new')
                    }
                  />
                  Link existing applicant
                </label>
                {writerMode === 'existing' ? (
                  <SearchableDropdown
                    label="Search applicant"
                    placeholder="Name, CNIC…"
                    onSearch={searchPeople}
                    onSelect={(item) => {
                      setWriterId(item.id);
                      const p = item.raw || {};
                      setWriter({
                        ...emptyPerson,
                        full_name: p.full_name || item.name || '',
                        father_or_husband_name: p.father_or_husband_name || '',
                        cnic: p.cnic || '',
                        phone: p.phone || '',
                        city: p.city || '',
                        address: p.address || '',
                        gender: p.gender || '',
                        date_of_birth: p.date_of_birth || '',
                        marital_status: p.marital_status || '',
                        occupation: p.occupation || '',
                        monthly_income: p.monthly_income || '',
                        education_level: p.education_level || '',
                        has_disability: !!p.has_disability,
                        disability_type: p.disability_type || '',
                        literacy_status: p.literacy_status || '',
                        literacy_category: p.literacy_category || '',
                        existing_person_id: item.id,
                      });
                    }}
                    onClear={() => {
                      setWriterId(null);
                      setWriter({ ...emptyPerson });
                    }}
                    displayKey="name"
                    minSearchLength={2}
                  />
                ) : (
                  <RelativeFields
                    title="Applicant details"
                    value={writer}
                    onChange={setWriter}
                    compact
                  />
                )}
              </div>
            )}
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
              Submit application
            </PrimaryButton>
          </div>
        </form>
      </div>
    </>
  );
};

export default AidApplicationAdd;
