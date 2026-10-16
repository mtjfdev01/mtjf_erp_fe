import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import {
  AID_GENDERS,
  AID_LITERACY_EDUCATION_OPTIONS,
  AID_MARITAL_STATUS,
  AID_NECTA_STATUS,
  AID_PROFESSIONS,
  AID_VULNERABILITY_CHIPS,
  calcAgeFromDob,
  formatCnicInput,
  formatPkPhoneInput,
  joinVulnerabilityList,
  parseVulnerabilityList,
} from '../aidConstants';

/**
 * Shared personal info card — Family Head, Beneficiary, and Family Members.
 */
const AidFamilyHeadPersonalFields = ({
  value,
  onChange,
  title = 'Primary Beneficiary / Family Head',
  subtitle = 'The family head acts as the root beneficiary for this household file. All relationships and kinship links will reference this person.',
  showTitle = true,
  cnicLabel = 'CNIC NUMBER (FORMAT: 12345-1234567-1)',
  cnicPlaceholder = '36101-XXXXXXX-X (Auto-formats dashes)',
  onCnicChange,
  cnicHint = '',
  cnicLookingUp = false,
  beforeFields = null,
  afterGrid = null,
  embedded = false,
}) => {
  const patch = (partial) => onChange({ ...value, ...partial });
  const age = calcAgeFromDob(value?.date_of_birth);
  const selectedVulns = parseVulnerabilityList(value?.vulnerability);

  const toggleVulnerability = (chipValue) => {
    const next = selectedVulns.includes(chipValue)
      ? selectedVulns.filter((v) => v !== chipValue)
      : [...selectedVulns, chipValue];
    patch({ vulnerability: joinVulnerabilityList(next) });
  };

  const handleCnicChange = (raw) => {
    const formatted = formatCnicInput(raw);
    if (onCnicChange) {
      onCnicChange(formatted);
      return;
    }
    patch({ cnic: formatted });
  };

  return (
    <div
      className={`aid-fh-personal${embedded ? ' aid-fh-personal--embedded' : ''}`}
    >
      {showTitle ? (
        <header className="aid-fh-personal__header">
          <h4 className="aid-fh-personal__title">{title}</h4>
          {subtitle ? (
            <p className="aid-fh-personal__subtitle">{subtitle}</p>
          ) : null}
        </header>
      ) : null}

      {beforeFields}

      <div className="aid-fh-personal__field aid-fh-personal__field--full">
        <FormInput
          label={cnicLabel}
          value={formatCnicInput(value?.cnic || '')}
          onChange={(e) => handleCnicChange(e.target.value)}
          placeholder={cnicPlaceholder}
          inputMode="numeric"
          autoComplete="off"
        />
        {cnicLookingUp ? (
          <p className="aid-fh-personal__cnic-hint">Searching…</p>
        ) : cnicHint ? (
          <p
            className={`aid-fh-personal__cnic-hint${
              value?.existing_person_id ? ' is-linked' : ''
            }`}
          >
            {cnicHint}
          </p>
        ) : null}
      </div>

      <div className="aid-fh-personal__grid">
        <FormInput
          label="Full Name (Urdu or English)"
          required
          value={value?.full_name || ''}
          onChange={(e) => patch({ full_name: e.target.value })}
          placeholder="e.g. Ahmed Ali / احمد علی"
        />
        <FormInput
          label="Father or Husband Name (Urdu or English)"
          value={value?.father_or_husband_name || ''}
          onChange={(e) => patch({ father_or_husband_name: e.target.value })}
          placeholder="e.g. Muhammad Din / محمد دین"
        />

        <FormSelect
          label="Gender"
          value={value?.gender || ''}
          onChange={(e) => patch({ gender: e.target.value })}
          options={[{ value: '', label: '—' }, ...AID_GENDERS]}
        />
        <div className="aid-fh-personal__dob">
          <div className="aid-fh-personal__dob-label-row">
            <span className="aid-fh-personal__dob-label">
              Date of Birth <span className="required">*</span>
            </span>
            {age != null ? (
              <span className="aid-fh-personal__age">
                Calculated Age: {age} yrs
              </span>
            ) : null}
          </div>
          <FormInput
            label=""
            type="date"
            required
            value={value?.date_of_birth || ''}
            onChange={(e) => patch({ date_of_birth: e.target.value })}
          />
        </div>

        <FormInput
          label="Primary Contact Number (03XXXXXXXXX)"
          value={formatPkPhoneInput(value?.phone || '')}
          onChange={(e) => patch({ phone: formatPkPhoneInput(e.target.value) })}
          placeholder="03001234567"
          inputMode="numeric"
          autoComplete="tel"
        />
        <FormSelect
          label="Marital Status"
          value={value?.marital_status || ''}
          onChange={(e) => patch({ marital_status: e.target.value })}
          options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
        />

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
          placeholder="e.g. 20000"
        />

        <FormSelect
          label="Literacy"
          value={value?.education_level || ''}
          onChange={(e) => patch({ education_level: e.target.value })}
          options={[
            { value: '', label: '—' },
            ...AID_LITERACY_EDUCATION_OPTIONS,
          ]}
        />
        <FormSelect
          label="NACTA Clearance Status"
          value={value?.necta_status || ''}
          onChange={(e) => patch({ necta_status: e.target.value })}
          options={[{ value: '', label: '—' }, ...AID_NECTA_STATUS]}
        />

        {afterGrid}
      </div>

      <div className="aid-fh-personal__vuln">
        <p className="aid-fh-personal__vuln-label">
          Vulnerability Categories (Select all that apply)
        </p>
        <div className="aid-fh-personal__chips" role="group">
          {AID_VULNERABILITY_CHIPS.map((chip) => {
            const active = selectedVulns.includes(chip.value);
            return (
              <button
                key={chip.value}
                type="button"
                className={`aid-fh-chip${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => toggleVulnerability(chip.value)}
              >
                {active ? '✓ ' : '+ '}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="aid-fh-personal__disability">
        <label className="aid-fh-personal__disability-check">
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
          <span className="aid-fh-personal__disability-copy">
            <strong>Has Physical or Mental Disability</strong>
            <small>
              Enables disability grant evaluation and special equipment
              distribution
            </small>
          </span>
        </label>
        {value?.has_disability ? (
          <FormInput
            label="Disability Type / Medical Detail"
            value={value?.disability_type || ''}
            onChange={(e) => patch({ disability_type: e.target.value })}
            placeholder="e.g. Physical - Leg Impairment, Visual, Hearing, Spinal"
          />
        ) : null}
      </div>
    </div>
  );
};

export default AidFamilyHeadPersonalFields;
