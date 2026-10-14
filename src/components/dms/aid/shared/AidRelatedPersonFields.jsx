import React, { useEffect, useRef, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import AidLiteracyFields from './AidLiteracyFields';
import {
  AID_GENDERS,
  AID_HOUSEHOLD_DEPENDENCY,
  AID_MARITAL_STATUS,
  AID_PROFESSIONS,
  ageFromDob,
  calcAgeFromDob,
  formatCnicInput,
  formatPkPhoneInput,
} from '../aidConstants';

/**
 * Standardized person card for any related individual (sibling / child / dependent / …).
 * Type (relation) first, then screenshot fields + existing literacy tree.
 * Optional CNIC lookup links an existing person instead of creating a duplicate.
 */
const AidRelatedPersonFields = ({
  value,
  onChange,
  relationOptions = [],
  relationKey = 'relation_type',
  relationLabel = 'Type (relation)',
  showLiteracy = true,
  cardTitle,
}) => {
  const patch = (partial) => onChange({ ...value, ...partial });
  const ageYrs = calcAgeFromDob(value?.date_of_birth);
  const ageLabel = ageFromDob(value?.date_of_birth);
  const [lookupHint, setLookupHint] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const lookupTimer = useRef(null);

  const relationValue =
    value?.[relationKey] ||
    value?.relation_type ||
    value?.relation_with_beneficiary ||
    value?.relation_with_family_head ||
    '';

  const setRelation = (next) => {
    const partial = {
      [relationKey]: next,
      relation_type: next,
    };
    if (relationKey !== 'relation_with_beneficiary') {
      partial.relation_with_beneficiary = next;
    }
    if (relationKey !== 'relation_with_family_head') {
      partial.relation_with_family_head = next;
    }
    const lower = String(next || '').toLowerCase();
    if (!value?.gender) {
      if (
        lower.includes('sister') ||
        lower.includes('daughter') ||
        lower === 'mother' ||
        lower === 'aunt' ||
        lower === 'grandmother' ||
        lower === 'niece'
      ) {
        partial.gender = 'female';
      } else if (
        lower.includes('brother') ||
        lower.includes('son') ||
        lower === 'father' ||
        lower === 'uncle' ||
        lower === 'grandfather' ||
        lower === 'nephew'
      ) {
        partial.gender = 'male';
      }
    }
    patch(partial);
  };

  const applyExistingPerson = (person) => {
    if (!person?.id) return;
    patch({
      existing_person_id: person.id,
      full_name: person.full_name || value.full_name || '',
      father_or_husband_name:
        person.father_or_husband_name || value.father_or_husband_name || '',
      cnic: formatCnicInput(person.cnic || value.cnic || ''),
      phone: formatPkPhoneInput(person.phone || value.phone || ''),
      gender: person.gender || value.gender || '',
      date_of_birth: person.date_of_birth || value.date_of_birth || '',
      marital_status: person.marital_status || value.marital_status || '',
      occupation: person.occupation || value.occupation || '',
      monthly_income:
        person.monthly_income != null && person.monthly_income !== ''
          ? String(person.monthly_income)
          : value.monthly_income || '',
      household_dependency:
        person.household_dependency || value.household_dependency || '',
      has_disability: !!person.has_disability,
      disability_type: person.disability_type || '',
      literacy_status: person.literacy_status || value.literacy_status || '',
      literacy_category: person.literacy_category || value.literacy_category || '',
      student_class: person.student_class || value.student_class || '',
      student_class_type: person.student_class_type || value.student_class_type || '',
      student_class_name: person.student_class_name || value.student_class_name || '',
    });
    setLookupHint(`Linked existing person #${person.id} — ${person.full_name}`);
  };

  const lookupByCnic = async (formattedCnic) => {
    const digits = String(formattedCnic || '').replace(/\D/g, '');
    if (digits.length !== 13) {
      setLookupHint('');
      if (value?.existing_person_id) patch({ existing_person_id: null });
      return;
    }
    setLookingUp(true);
    try {
      const res = await axiosInstance.get('/aid/people', {
        params: { search: digits, page: 1, pageSize: 10 },
      });
      const rows = res.data?.data || [];
      const hit = rows.find(
        (p) => String(p.cnic || '').replace(/\D/g, '') === digits,
      );
      if (hit) {
        applyExistingPerson(hit);
      } else {
        if (value?.existing_person_id) patch({ existing_person_id: null });
        setLookupHint('No existing record — a new person will be created on save');
      }
    } catch {
      setLookupHint('');
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(() => () => {
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
  }, []);

  const onCnicChange = (raw) => {
    const formatted = formatCnicInput(raw);
    patch({ cnic: formatted, existing_person_id: null });
    setLookupHint('');
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(() => lookupByCnic(formatted), 450);
  };

  return (
    <div className="aid-related-person">
      {cardTitle ? (
        <div className="aid-related-person__title">{cardTitle}</div>
      ) : null}

      <div className="aid-related-person__grid">
        {relationOptions?.length ? (
          <div className="aid-related-person__field--full">
            <FormSelect
              label={relationLabel}
              value={relationValue}
              onChange={(e) => setRelation(e.target.value)}
              options={[{ value: '', label: 'Select type…' }, ...relationOptions]}
              required
            />
          </div>
        ) : null}

        <div className="aid-related-person__field--full">
          <FormInput
            label="CNIC / B-Form Number (format: 12345-1234567-1)"
            value={formatCnicInput(value?.cnic || '')}
            onChange={(e) => onCnicChange(e.target.value)}
            placeholder="Enter CNIC to search existing record..."
            inputMode="numeric"
            autoComplete="off"
          />
          {lookingUp ? (
            <p className="aid-related-person__hint">Searching…</p>
          ) : lookupHint ? (
            <p
              className={`aid-related-person__hint${
                value?.existing_person_id ? ' is-linked' : ''
              }`}
            >
              {lookupHint}
            </p>
          ) : null}
        </div>

        <FormInput
          label="Full Name"
          required
          value={value?.full_name || ''}
          onChange={(e) => patch({ full_name: e.target.value })}
          placeholder="e.g. Rukhsana Bibi / رخصانہ بی بی"
        />
        <FormInput
          label="Father / Husband Name"
          value={value?.father_or_husband_name || ''}
          onChange={(e) => patch({ father_or_husband_name: e.target.value })}
          placeholder="e.g. Ahmed Ali"
        />

        <FormSelect
          label="Gender"
          value={value?.gender || ''}
          onChange={(e) => patch({ gender: e.target.value })}
          options={[{ value: '', label: '—' }, ...AID_GENDERS]}
        />
        <div className="aid-related-person__dob">
          <div className="aid-related-person__dob-label-row">
            <span className="aid-related-person__dob-label">Date of Birth</span>
            {ageYrs != null ? (
              <span className="aid-related-person__age">Age: {ageYrs} yrs</span>
            ) : ageLabel ? (
              <span className="aid-related-person__age">Age: {ageLabel} yrs</span>
            ) : null}
          </div>
          <FormInput
            label=""
            type="date"
            value={value?.date_of_birth || ''}
            onChange={(e) => patch({ date_of_birth: e.target.value })}
          />
        </div>

        <FormSelect
          label="Profession"
          value={value?.occupation || ''}
          onChange={(e) => patch({ occupation: e.target.value })}
          options={[{ value: '', label: '—' }, ...AID_PROFESSIONS]}
        />
        <FormInput
          label="Monthly Income (PKR)"
          type="number"
          min="0"
          value={value?.monthly_income ?? ''}
          onChange={(e) => patch({ monthly_income: e.target.value })}
          placeholder="0"
        />

        <FormSelect
          label="Household Dependency"
          value={value?.household_dependency || ''}
          onChange={(e) => patch({ household_dependency: e.target.value })}
          options={[{ value: '', label: '—' }, ...AID_HOUSEHOLD_DEPENDENCY]}
        />
        <FormSelect
          label="Marital Status"
          value={value?.marital_status || ''}
          onChange={(e) => patch({ marital_status: e.target.value })}
          options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
        />

        <FormInput
          label="Contact Number (03XXXXXXXXX)"
          value={formatPkPhoneInput(value?.phone || '')}
          onChange={(e) =>
            patch({ phone: formatPkPhoneInput(e.target.value) })
          }
          placeholder="03001234567"
          inputMode="numeric"
        />
      </div>

      <label className="aid-related-person__disability">
        <span>Has Disability</span>
        <input
          type="checkbox"
          checked={!!value?.has_disability}
          onChange={(e) =>
            patch({
              has_disability: e.target.checked,
              disability_type: e.target.checked
                ? value?.disability_type || ''
                : '',
            })
          }
        />
      </label>
      {value?.has_disability ? (
        <FormInput
          label="Disability Type / Medical Detail"
          value={value?.disability_type || ''}
          onChange={(e) => patch({ disability_type: e.target.value })}
          placeholder="e.g. Physical - Leg Impairment, Visual, Hearing"
        />
      ) : null}

      {showLiteracy ? (
        <div className="aid-related-person__literacy">
          <AidLiteracyFields value={value} onChange={onChange} />
        </div>
      ) : null}
    </div>
  );
};

export default AidRelatedPersonFields;
