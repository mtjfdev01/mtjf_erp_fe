import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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
import AidChildrenIntake from '../../shared/AidChildrenIntake';
import AidSiblingsIntake from '../../shared/AidSiblingsIntake';
import AidDependentsIntake from '../../shared/AidDependentsIntake';
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
  AID_FAMILY_HEAD_TYPES,
  AID_VULNERABILITIES,
  mapSiblingRelationToKinship,
  mapDependentRelationToKinship,
} from '../../aidConstants';
import '../../aid.css';

const emptyPerson = {
  full_name: '',
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
  education_level: '',
  is_alive: true,
  has_disability: false,
  disability_type: '',
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
        label="CNIC"
        value={value.cnic}
        onChange={(e) => onChange({ ...value, cnic: e.target.value })}
      />
      <FormInput
        label="Phone"
        value={value.phone}
        onChange={(e) => onChange({ ...value, phone: e.target.value })}
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
    cnic: p.cnic || undefined,
    phone: p.phone || undefined,
    gender: p.gender || undefined,
    date_of_birth: p.date_of_birth || undefined,
    marital_status: p.marital_status || undefined,
    vulnerability: p.vulnerability || undefined,
    occupation: p.occupation || p.literacy_category || undefined,
    monthly_income: p.monthly_income || undefined,
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
  const [siblings, setSiblings] = useState([{ ...emptyRelative(), _genderRole: 'brother' }]);
  const [childrenRows, setChildrenRows] = useState([]);
  const [siblingRows, setSiblingRows] = useState([]);
  const [familyHeadHasDependents, setFamilyHeadHasDependents] = useState(false);
  const [familyHeadDependents, setFamilyHeadDependents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formTab, setFormTab] = useState('request');

  const FORM_TABS = [
    { id: 'request', label: 'Application', hint: 'Need & aid type' },
    { id: 'zakat', label: 'Zakat', hint: 'Permission letter' },
    { id: 'consent', label: 'Consent', hint: 'Media consent' },
    { id: 'assignment', label: 'Assignment', hint: 'Case owner' },
    { id: 'beneficiary', label: 'Beneficiary', hint: 'Person details' },
    { id: 'family', label: 'Family Head', hint: 'Household' },
    { id: 'writer', label: 'Applicant', hint: 'Who applied' },
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
  const isSingle = beneficiaryMarital === 'single';
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

  useEffect(() => {
    if (!isMarried) {
      setChildrenRows([]);
    } else {
      setSpouse((p) => ({
        ...p,
        gender: p.gender || spouseDefaultGender,
        marital_status: p.marital_status || 'married',
      }));
    }
    if (!isSingle) {
      setSiblingRows([]);
    }
  }, [isMarried, isSingle, spouseDefaultGender]);

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

  const buildFamilyMembers = () => {
    const members = [];
    for (const head of familyHeads) {
      const payload = cleanPersonPayload(head);
      const relation = head._relation_type || 'other';
      if (payload) members.push({ relation_type: relation, person: payload });
      if (head._has_dependents) {
        for (const dep of head._dependents || []) {
          const depPayload = cleanPersonPayload(dep);
          if (!depPayload) continue;
          const depRelation = mapDependentRelationToKinship(
            dep.relation_with_family_head,
          );
          members.push({
            relation_type: depRelation,
            person: depPayload,
            notes: `Dependent under ${familyHeadTypeLabel(relation).toLowerCase()} sponsorship (${dep.relation_with_family_head || depRelation})`,
          });
        }
      }
    }
    if (isSingle) {
      for (const s of siblingRows) {
        const payload = cleanPersonPayload(s);
        if (!payload) continue;
        const relation = mapSiblingRelationToKinship(s.relation_with_beneficiary);
        if (!payload.gender && relation === 'sister') payload.gender = 'female';
        if (!payload.gender && relation === 'brother') payload.gender = 'male';
        const notes =
          s.relation_with_beneficiary &&
          !['brother', 'sister'].includes(s.relation_with_beneficiary)
            ? `Relation: ${s.relation_with_beneficiary}`
            : undefined;
        members.push({
          relation_type: relation,
          person: payload,
          notes,
        });
      }
    } else {
      for (const s of siblings) {
        const payload = cleanPersonPayload(s);
        if (!payload) continue;
        const relation =
          s._genderRole === 'sister' || payload.gender === 'female'
            ? 'sister'
            : s._genderRole === 'brother' || payload.gender === 'male'
              ? 'brother'
              : 'sibling';
        if (!payload.gender && relation === 'sister') payload.gender = 'female';
        if (!payload.gender && relation === 'brother') payload.gender = 'male';
        members.push({ relation_type: relation, person: payload });
      }
    }
    if (isMarried) {
      const spousePayload = cleanPersonPayload(spouse);
      if (spousePayload) {
        if (!spousePayload.gender && spouseDefaultGender) {
          spousePayload.gender = spouseDefaultGender;
        }
        if (!spousePayload.marital_status) spousePayload.marital_status = 'married';
        members.push({ relation_type: 'spouse', person: spousePayload });
      }
      for (const child of childrenRows) {
        const payload = cleanPersonPayload(child);
        if (!payload) continue;
        const relation =
          payload.gender === 'female'
            ? 'daughter'
            : payload.gender === 'male'
              ? 'son'
              : 'child';
        members.push({ relation_type: relation, person: payload });
      }
    }

    if (familyHeadHasDependents) {
      for (const dep of familyHeadDependents) {
        const payload = cleanPersonPayload(dep);
        if (!payload) continue;
        const relation = mapDependentRelationToKinship(
          dep.relation_with_family_head,
        );
        members.push({
          relation_type: relation,
          person: payload,
          notes: `Dependent under family head sponsorship (${dep.relation_with_family_head || relation})`,
        });
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
        throw new Error(`${spouseLabel} details are required for married beneficiaries`);
      }
      if (isMarried) {
        const incompleteChild = childrenRows.find(
          (c) => c.full_name?.trim() && !c.literacy_status,
        );
        if (incompleteChild) {
          throw new Error('Set Literacy for each child that has a name');
        }
        const namedKids = childrenRows.filter((c) => c.full_name?.trim());
        if (childrenRows.length > 0 && namedKids.length !== childrenRows.length) {
          throw new Error('Enter a name for every child row (or set No. of children to 0)');
        }
      }
      if (isSingle && siblingRows.length > 0) {
        const named = siblingRows.filter((s) => s.full_name?.trim());
        if (named.length !== siblingRows.length) {
          throw new Error(
            'Enter a name for every sibling row (or set No. of siblings to 0)',
          );
        }
        const missingRel = siblingRows.find((s) => !s.relation_with_beneficiary);
        if (missingRel) {
          throw new Error('Select Relation with beneficiary for each sibling');
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
    if (isMarried) {
      return `Select Family Head type (Father / Mother / Guardian…) and add ${spouseLabel.toLowerCase()} if married.`;
    }
    if (isSingle) {
      return 'Select Family Head type (Father / Mother / Guardian…). Brothers/sisters are on the Beneficiary tab.';
    }
    return 'Add Family Head entries and select type for each (Father / Mother / Guardian…).';
  }, [isMarried, isSingle, spouseLabel]);

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
            <h3 className="form-section-heading">Application</h3>
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
          )}

          {formTab === 'zakat' && (
          <div className="form-section">
            <h3 className="form-section-heading">Zakat Permission Letter</h3>
            <AidZakatPermissionForm
              value={zakatPermission}
              onChange={setZakatPermission}
            />
          </div>
          )}

          {formTab === 'consent' && (
          <div className="form-section">
            <h3 className="form-section-heading">Consent Form</h3>
            <AidConsentForm
              value={consentForm}
              onChange={setConsentForm}
            />
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

            {isMarried && (
              <div className="aid-family-panel" style={{ marginTop: 12 }}>
                <AidChildrenIntake
                  title="Children (if married)"
                  childrenRows={childrenRows}
                  onChange={setChildrenRows}
                />
              </div>
            )}

            {isSingle && (
              <div className="aid-family-panel" style={{ marginTop: 12 }}>
                <AidSiblingsIntake
                  title="Siblings — Brothers / Sisters (if single)"
                  siblingRows={siblingRows}
                  onChange={setSiblingRows}
                />
              </div>
            )}

            <div className="aid-family-panel" style={{ marginTop: 12 }}>
              <AidDependentsIntake
                title="Family head — others under sponsorship / dependents"
                hasDependents={familyHeadHasDependents}
                onHasDependentsChange={setFamilyHeadHasDependents}
                rows={familyHeadDependents}
                onChange={setFamilyHeadDependents}
                relationLabel="Relation with FAMILY HEAD"
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
                    <RelativeFields
                      title={typeLabel}
                      value={head}
                      onChange={(next) =>
                        setFamilyHeads((list) =>
                          list.map((row, i) =>
                            i === idx
                              ? {
                                  ...next,
                                  _relation_type: row._relation_type,
                                  _has_dependents: row._has_dependents,
                                  _dependents: row._dependents,
                                }
                              : row,
                          ),
                        )
                      }
                      compact
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
                                    _has_dependents: row._has_dependents,
                                    _dependents: row._dependents,
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
                                    _has_dependents: row._has_dependents,
                                    _dependents: row._dependents,
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
                                    _has_dependents: row._has_dependents,
                                    _dependents: row._dependents,
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
                                    _has_dependents: row._has_dependents,
                                    _dependents: row._dependents,
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
                                    _has_dependents: row._has_dependents,
                                    _dependents: row._dependents,
                                  }
                                : row,
                            ),
                          )
                        }
                        title={`${typeLabel} — NECTA / BISP`}
                      />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <AidDependentsIntake
                        title={`${typeLabel} — others under sponsorship / dependents`}
                        hasDependents={!!head._has_dependents}
                        onHasDependentsChange={(yes) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    _has_dependents: yes,
                                    _dependents: yes
                                      ? row._dependents?.length
                                        ? row._dependents
                                        : []
                                      : [],
                                  }
                                : row,
                            ),
                          )
                        }
                        rows={head._dependents || []}
                        onChange={(deps) =>
                          setFamilyHeads((list) =>
                            list.map((row, i) =>
                              i === idx ? { ...row, _dependents: deps } : row,
                            ),
                          )
                        }
                        relationLabel="Relation with FAMILY HEAD"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {!isSingle && (
            <div className="aid-family-panel">
              <div className="aid-family-panel__head">
                <h4 className="aid-family-panel__title">Siblings</h4>
                <div className="aid-family-panel__actions">
                  <button
                    type="button"
                    className="aid-mini-btn aid-mini-btn--brother"
                    onClick={() =>
                      setSiblings((p) => [
                        ...p,
                        { ...emptyRelative(), gender: 'male', _genderRole: 'brother' },
                      ])
                    }
                  >
                    + Brother
                  </button>
                  <button
                    type="button"
                    className="aid-mini-btn aid-mini-btn--sister"
                    onClick={() =>
                      setSiblings((p) => [
                        ...p,
                        { ...emptyRelative(), gender: 'female', _genderRole: 'sister' },
                      ])
                    }
                  >
                    + Sister
                  </button>
                </div>
              </div>
              {siblings.map((s, idx) => (
                <div key={`s-${idx}`} className="aid-repeat-item">
                  <div className="aid-repeat-item__head aid-repeat-item__head--select">
                    <FormSelect
                      label="Sibling type"
                      value={s._genderRole || 'brother'}
                      onChange={(e) => {
                        const role = e.target.value;
                        setSiblings((list) =>
                          list.map((row, i) =>
                            i === idx
                              ? {
                                  ...row,
                                  _genderRole: role,
                                  gender:
                                    role === 'sister'
                                      ? 'female'
                                      : role === 'brother'
                                        ? 'male'
                                        : row.gender,
                                }
                              : row,
                          ),
                        );
                      }}
                      options={[
                        { value: 'brother', label: 'Brother' },
                        { value: 'sister', label: 'Sister' },
                        { value: 'sibling', label: 'Sibling' },
                      ]}
                    />
                    <button
                      type="button"
                      className="aid-mini-btn aid-mini-btn--remove"
                      onClick={() =>
                        setSiblings((list) => list.filter((_, i) => i !== idx))
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <RelativeFields
                    value={s}
                    onChange={(next) =>
                      setSiblings((list) =>
                        list.map((row, i) =>
                          i === idx ? { ...next, _genderRole: row._genderRole } : row,
                        ),
                      )
                    }
                    compact
                  />
                </div>
              ))}
            </div>
            )}
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
                  setWriterIsSelf(e.target.checked);
                  if (e.target.checked) {
                    setForm((p) => ({ ...p, writer_relation: 'self' }));
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
                    onSelect={(item) => setWriterId(item.id)}
                    onClear={() => setWriterId(null)}
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
