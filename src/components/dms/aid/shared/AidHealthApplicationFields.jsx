import React, { useMemo } from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import {
  AID_HEALTH_DURATION_UNITS,
  AID_HEALTH_NATURE_OF_ILLNESS,
  AID_HEALTH_PAYING_NOW,
  AID_HEALTH_PREFERRED_FACILITY,
  AID_HEALTH_SUPPORT_NEEDED,
  AID_HEALTH_TREATMENT_WHERE,
  calcHealthEstimatedTotal,
  emptyHealthMedicineRow,
  emptyHealthTestRow,
  healthDurationToMonths,
} from '../aidConstants';
import { useAidLang } from '../lang/AidLangContext';
import { aidOptionsForLang } from '../lang/aidUiCopy';

const fmtPkr = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('en-PK', { maximumFractionDigits: 0 });
};

const YesNoToggle = ({ value, onChange, disabled }) => {
  const { t } = useAidLang();
  if (disabled) {
    return (
      <span>
        {value === 'yes' ? t('yes') : value === 'no' ? t('no') : t('dash')}
      </span>
    );
  }
  return (
    <div className="aid-health-yn">
      <button
        type="button"
        className={`aid-health-yn__btn${value === 'yes' ? ' is-active' : ''}`}
        onClick={() => onChange('yes')}
      >
        {t('yes')}
      </button>
      <button
        type="button"
        className={`aid-health-yn__btn${value === 'no' ? ' is-active' : ''}`}
        onClick={() => onChange('no')}
      >
        {t('no')}
      </button>
    </div>
  );
};

const ChipMulti = ({ options, values, onChange, disabled }) => {
  const selected = Array.isArray(values) ? values : [];
  const toggle = (val) => {
    if (disabled || !onChange) return;
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };
  return (
    <div className="aid-health-chips">
      {options.map((opt) => {
        const on = selected.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`aid-health-chip${on ? ' is-active' : ''}`}
          >
            <input
              type="checkbox"
              checked={on}
              disabled={disabled}
              onChange={() => toggle(opt.value)}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
};

/**
 * Health aid — Application tab (after Application Summary).
 * Patient list comes from Family Tree / Beneficiary; name/relation/age reflect selection.
 */
const AidHealthApplicationFields = ({
  value,
  onChange,
  readOnly = false,
  /** [{ value, label, name, relation, age }] */
  patientOptions = [],
  /** SubProgram expected amount (PKR) for limit badge */
  subprogramLimit = null,
}) => {
  const { t, lang } = useAidLang();
  const dash = t('dash');
  const details = value || {};

  const natureOptions = useMemo(
    () => aidOptionsForLang(AID_HEALTH_NATURE_OF_ILLNESS, lang),
    [lang],
  );
  const whereOptions = useMemo(
    () => aidOptionsForLang(AID_HEALTH_TREATMENT_WHERE, lang),
    [lang],
  );
  const supportOptions = useMemo(
    () => aidOptionsForLang(AID_HEALTH_SUPPORT_NEEDED, lang),
    [lang],
  );
  const facilityOptions = useMemo(
    () => aidOptionsForLang(AID_HEALTH_PREFERRED_FACILITY, lang),
    [lang],
  );
  const payingOptions = useMemo(
    () => aidOptionsForLang(AID_HEALTH_PAYING_NOW, lang),
    [lang],
  );
  const unitOptions = useMemo(
    () => aidOptionsForLang(AID_HEALTH_DURATION_UNITS, lang),
    [lang],
  );

  const medicines =
    details.current_medicines?.length > 0
      ? details.current_medicines
      : readOnly
        ? []
        : [emptyHealthMedicineRow()];
  const tests =
    details.prescribed_tests?.length > 0
      ? details.prescribed_tests
      : readOnly
        ? []
        : [emptyHealthTestRow()];

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  const selectPatient = (key) => {
    const opt = patientOptions.find((o) => o.value === key);
    patch({
      patient_key: key,
      patient_name: opt?.name || '',
      patient_relation: opt?.relation || '',
      patient_age: opt?.age != null && opt.age !== '' ? String(opt.age) : '',
    });
  };

  const estimatedTotal = calcHealthEstimatedTotal(details);
  const limit =
    subprogramLimit != null && Number.isFinite(Number(subprogramLimit))
      ? Number(subprogramLimit)
      : null;
  const withinCap = limit == null || estimatedTotal <= limit;
  const overBy = limit != null ? Math.max(0, estimatedTotal - limit) : 0;
  const isMonthly = String(details.cost_basis || 'once') === 'monthly';
  const monthMult = healthDurationToMonths(
    details.duration_value,
    details.duration_unit,
  );
  const subCost = [
    details.cost_consultation,
    details.cost_diagnostics,
    details.cost_medicines,
    details.cost_procedure,
    details.cost_other,
  ].reduce((a, v) => {
    const n = Number(v);
    return a + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);

  const totalLabel = isMonthly
    ? `${t('healthEstimatedTotalMonthly')} (PKR ${fmtPkr(subCost)} × ${monthMult} ${
        monthMult > 1 ? t('months') : t('month')
      })`
    : t('healthEstimatedTotalCost');

  const labelOf = (opts, val) =>
    opts.find((o) => o.value === val)?.label || val || dash;

  if (readOnly) {
    const hasAny =
      details.patient_name ||
      details.nature_of_illness ||
      details.disease_condition ||
      details.support_needed?.length ||
      subCost > 0 ||
      details.how_know_mtjf ||
      details.alternative_if_not_approved;
    if (!hasAny) return null;

    return (
      <div className="aid-health-application" style={{ marginTop: 12 }}>
        <div className="aid-family-panel">
          <h4 className="aid-family-panel__title">{t('healthPatientCondition')}</h4>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {[
              details.patient_name
                ? `${t('patientName')}: ${details.patient_name}`
                : null,
              details.patient_relation
                ? `${t('patientRelation')}: ${details.patient_relation}`
                : null,
              details.patient_age
                ? `${t('patientAge')}: ${details.patient_age}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ') || dash}
          </p>
          <p style={{ fontSize: 13, margin: '8px 0 0' }}>
            <strong>{t('natureOfIllness')}:</strong>{' '}
            {labelOf(natureOptions, details.nature_of_illness)}
            {details.disease_condition
              ? ` · ${details.disease_condition}`
              : ''}
          </p>
          {(details.ill_since_years || details.ill_since_months) && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              {t('illSince')}: {details.ill_since_years || '0'} {t('years')} ·{' '}
              {details.ill_since_months || '0'} {t('months')}
            </p>
          )}
          {details.diagnosed_by_doctor === 'yes' && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              {[details.doctor_name, details.hospital_name]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
        {(details.currently_under_treatment ||
          medicines.some((m) => m.name) ||
          details.previous_treatment_history) && (
          <div className="aid-family-panel" style={{ marginTop: 12 }}>
            <h4 className="aid-family-panel__title">
              {t('healthCurrentTreatment')}
            </h4>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              {t('currentlyUnderTreatment')}:{' '}
              {details.currently_under_treatment === 'yes'
                ? `${t('yes')}${
                    details.treatment_where
                      ? ` · ${labelOf(whereOptions, details.treatment_where)}`
                      : ''
                  }`
                : details.currently_under_treatment === 'no'
                  ? t('no')
                  : dash}
            </p>
            {medicines
              .filter((m) => m.name)
              .map((m, i) => (
                <p key={i} style={{ fontSize: 13, margin: '4px 0 0' }}>
                  {m.name}
                  {m.dosage ? ` · ${m.dosage}` : ''}
                  {m.monthly_cost ? ` · PKR ${m.monthly_cost}` : ''}
                </p>
              ))}
            {details.previous_treatment_history && (
              <p style={{ fontSize: 13, margin: '8px 0 0' }}>
                {details.previous_treatment_history}
              </p>
            )}
          </div>
        )}
        <div className="aid-family-panel" style={{ marginTop: 12 }}>
          <h4 className="aid-family-panel__title">{t('healthSupportRequired')}</h4>
          <p style={{ fontSize: 13, margin: '4px 0 0' }}>
            {(details.support_needed || [])
              .map((v) => labelOf(supportOptions, v))
              .join(', ') || dash}
          </p>
          {tests
            .filter((row) => row.name)
            .map((row, i) => (
              <p key={i} style={{ fontSize: 13, margin: '4px 0 0' }}>
                {row.name}
                {row.estimated_cost ? ` · PKR ${row.estimated_cost}` : ''}
              </p>
            ))}
          {details.preferred_facility && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              {t('preferredFacility')}:{' '}
              {labelOf(facilityOptions, details.preferred_facility)}
            </p>
          )}
        </div>
        <div className="aid-family-panel" style={{ marginTop: 12 }}>
          <h4 className="aid-family-panel__title">{t('healthEstimatedCost')}</h4>
          <p style={{ fontSize: 13, margin: '4px 0 0' }}>
            {totalLabel}: <strong>PKR {fmtPkr(estimatedTotal)}</strong>
            {limit != null
              ? withinCap
                ? ` · ${t('healthWithinLimit', { n: fmtPkr(limit) })}`
                : ` · ${t('healthExceedsLimit', {
                    n: fmtPkr(limit),
                    over: fmtPkr(overBy),
                  })}`
              : ''}
          </p>
        </div>
        {(details.paying_now?.length ||
          details.has_sehat_card ||
          details.debt_due_to_illness) && (
          <div className="aid-family-panel" style={{ marginTop: 12 }}>
            <h4 className="aid-family-panel__title">
              {t('healthFinancialSupport')}
            </h4>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              {(details.paying_now || [])
                .map((v) => labelOf(payingOptions, v))
                .join(', ') || dash}
            </p>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              {t('hasSehatCard')}:{' '}
              {details.has_sehat_card === 'yes'
                ? t('yes')
                : details.has_sehat_card === 'no'
                  ? t('no')
                  : dash}
              {' · '}
              {t('medicalHelpOtherOrg')}:{' '}
              {details.medical_help_other_org === 'yes'
                ? t('yes')
                : details.medical_help_other_org === 'no'
                  ? t('no')
                  : dash}
            </p>
            {details.debt_due_to_illness && (
              <p style={{ fontSize: 13, margin: '4px 0 0' }}>
                {t('debtDueToIllness')}: PKR {details.debt_due_to_illness}
              </p>
            )}
          </div>
        )}
        {(details.patient_earning_member || details.caregiver) && (
          <div className="aid-family-panel" style={{ marginTop: 12 }}>
            <h4 className="aid-family-panel__title">
              {t('healthImpactHousehold')}
            </h4>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              {t('patientEarningMember')}:{' '}
              {details.patient_earning_member === 'yes'
                ? t('yes')
                : details.patient_earning_member === 'no'
                  ? t('no')
                  : dash}
              {(details.unable_work_years || details.unable_work_months) &&
                ` · ${t('unableToWorkSince')}: ${details.unable_work_years || 0}y / ${
                  details.unable_work_months || 0
                }m`}
            </p>
            {details.caregiver && (
              <p style={{ fontSize: 13, margin: '4px 0 0' }}>
                {t('whoTakesCare')}: {details.caregiver}
              </p>
            )}
          </div>
        )}
        {(details.how_know_mtjf || details.alternative_if_not_approved) && (
          <div className="aid-family-panel" style={{ marginTop: 12 }}>
            {details.how_know_mtjf && (
              <p style={{ fontSize: 13, margin: '4px 0 0' }}>
                <strong>{t('howKnowMtjf')}:</strong> {details.how_know_mtjf}
              </p>
            )}
            {details.alternative_if_not_approved && (
              <p style={{ fontSize: 13, margin: '8px 0 0' }}>
                <strong>{t('ifNotApprovedLabel')}</strong>{' '}
                {details.alternative_if_not_approved}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  const patientSelectOptions = [
    { value: '', label: t('selectFromFamilyTree') },
    ...patientOptions.map((o) => ({ value: o.value, label: o.label })),
  ];

  return (
    <div className="aid-health-application">
      {/* 1. Patient & Condition */}
      <div className="aid-family-panel aid-health-card" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">{t('healthPatientCondition')}</h4>
        <div className="form-grid-2">
          <FormSelect
            label={`${t('patient')} *`}
            value={details.patient_key || ''}
            onChange={(e) => selectPatient(e.target.value)}
            options={patientSelectOptions}
          />
          <FormSelect
            label={`${t('natureOfIllness')} *`}
            value={details.nature_of_illness || ''}
            onChange={(e) => patch({ nature_of_illness: e.target.value })}
            options={[{ value: '', label: dash }, ...natureOptions]}
          />
          <FormInput
            label={t('diseaseCondition')}
            value={details.disease_condition || ''}
            onChange={(e) => patch({ disease_condition: e.target.value })}
            placeholder={t('diseaseConditionPlaceholder')}
          />
        </div>
        {(details.patient_name ||
          details.patient_relation ||
          details.patient_age) && (
          <p className="aid-section-hint" style={{ marginTop: 8 }}>
            {[
              details.patient_name
                ? `${t('patientName')}: ${details.patient_name}`
                : null,
              details.patient_relation
                ? `${t('patientRelation')}: ${details.patient_relation}`
                : null,
              details.patient_age
                ? `${t('patientAge')}: ${details.patient_age}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        <div className="form-grid-2" style={{ marginTop: 8 }}>
          <FormInput
            label={t('illSinceYears')}
            type="number"
            min="0"
            value={details.ill_since_years ?? ''}
            onChange={(e) => patch({ ill_since_years: e.target.value })}
          />
          <FormInput
            label={t('months')}
            type="number"
            min="0"
            max="11"
            value={details.ill_since_months ?? ''}
            onChange={(e) => patch({ ill_since_months: e.target.value })}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <span className="form-label">{t('diagnosedByDoctor')}</span>
          <YesNoToggle
            value={details.diagnosed_by_doctor}
            onChange={(v) =>
              patch({
                diagnosed_by_doctor: v,
                ...(v !== 'yes'
                  ? { doctor_name: '', hospital_name: '' }
                  : {}),
              })
            }
          />
        </div>
        {details.diagnosed_by_doctor === 'yes' && (
          <div className="aid-health-nested form-grid-2" style={{ marginTop: 12 }}>
            <FormInput
              label={t('doctorName')}
              value={details.doctor_name || ''}
              onChange={(e) => patch({ doctor_name: e.target.value })}
            />
            <FormInput
              label={t('hospitalClinic')}
              value={details.hospital_name || ''}
              onChange={(e) => patch({ hospital_name: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* 2. Current Treatment */}
      <div className="aid-family-panel aid-health-card" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">{t('healthCurrentTreatment')}</h4>
        <div className="form-grid-2" style={{ alignItems: 'end' }}>
          <div>
            <span className="form-label">{t('currentlyUnderTreatment')}</span>
            <YesNoToggle
              value={details.currently_under_treatment}
              onChange={(v) =>
                patch({
                  currently_under_treatment: v,
                  ...(v !== 'yes' ? { treatment_where: '' } : {}),
                })
              }
            />
          </div>
          {details.currently_under_treatment === 'yes' && (
            <FormSelect
              label={t('treatmentWhere')}
              value={details.treatment_where || ''}
              onChange={(e) => patch({ treatment_where: e.target.value })}
              options={[{ value: '', label: dash }, ...whereOptions]}
            />
          )}
        </div>
        <div className="aid-health-row-head" style={{ marginTop: 16 }}>
          <span className="form-label" style={{ margin: 0 }}>
            {t('currentMedicines')}
          </span>
          <button
            type="button"
            className="aid-health-add-row"
            onClick={() =>
              patch({ current_medicines: [...medicines, emptyHealthMedicineRow()] })
            }
          >
            {t('addRow')}
          </button>
        </div>
        {medicines.map((row, idx) => (
          <div key={idx} className="aid-health-nested" style={{ marginTop: 10 }}>
            <div className="aid-health-nested__label">
              {t('medicineN', { n: idx + 1 })}
            </div>
            <div className="form-grid-2">
              <FormInput
                label={t('medicineName')}
                value={row.name || ''}
                onChange={(e) => {
                  const next = medicines.map((r, i) =>
                    i === idx ? { ...r, name: e.target.value } : r,
                  );
                  patch({ current_medicines: next });
                }}
              />
              <FormInput
                label={t('dosage')}
                value={row.dosage || ''}
                onChange={(e) => {
                  const next = medicines.map((r, i) =>
                    i === idx ? { ...r, dosage: e.target.value } : r,
                  );
                  patch({ current_medicines: next });
                }}
                placeholder={t('dosagePlaceholder')}
              />
              <FormInput
                label={t('monthlyCostPkr')}
                type="number"
                min="0"
                value={row.monthly_cost ?? ''}
                onChange={(e) => {
                  const next = medicines.map((r, i) =>
                    i === idx ? { ...r, monthly_cost: e.target.value } : r,
                  );
                  patch({ current_medicines: next });
                }}
              />
            </div>
            {medicines.length > 1 && (
              <button
                type="button"
                className="aid-mini-btn"
                style={{ marginTop: 8 }}
                onClick={() =>
                  patch({
                    current_medicines: medicines.filter((_, i) => i !== idx),
                  })
                }
              >
                {t('remove')}
              </button>
            )}
          </div>
        ))}
        <FormTextarea
          label={t('previousTreatmentHistory')}
          value={details.previous_treatment_history || ''}
          onChange={(e) =>
            patch({ previous_treatment_history: e.target.value })
          }
          rows={3}
        />
      </div>

      {/* 3. Support Required */}
      <div className="aid-family-panel aid-health-card" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">{t('healthSupportRequired')}</h4>
        <span className="form-label">{t('supportNeeded')}</span>
        <ChipMulti
          options={supportOptions}
          values={details.support_needed}
          onChange={(support_needed) => patch({ support_needed })}
        />
        <div className="aid-health-row-head" style={{ marginTop: 16 }}>
          <span className="form-label" style={{ margin: 0 }}>
            {t('prescribedTests')}
          </span>
          <button
            type="button"
            className="aid-health-add-row"
            onClick={() =>
              patch({
                prescribed_tests: [...tests, emptyHealthTestRow()],
              })
            }
          >
            {t('addRow')}
          </button>
        </div>
        {tests.map((row, idx) => (
          <div key={idx} className="aid-health-nested" style={{ marginTop: 10 }}>
            <div className="aid-health-nested__label">
              {t('testN', { n: idx + 1 })}
            </div>
            <div className="form-grid-2">
              <FormInput
                label={t('testName')}
                value={row.name || ''}
                onChange={(e) => {
                  const next = tests.map((r, i) =>
                    i === idx ? { ...r, name: e.target.value } : r,
                  );
                  patch({ prescribed_tests: next });
                }}
                placeholder={t('testNamePlaceholder')}
              />
              <FormInput
                label={t('estimatedCostPkr')}
                type="number"
                min="0"
                value={row.estimated_cost ?? ''}
                onChange={(e) => {
                  const next = tests.map((r, i) =>
                    i === idx ? { ...r, estimated_cost: e.target.value } : r,
                  );
                  patch({ prescribed_tests: next });
                }}
              />
            </div>
            {tests.length > 1 && (
              <button
                type="button"
                className="aid-mini-btn"
                style={{ marginTop: 8 }}
                onClick={() =>
                  patch({
                    prescribed_tests: tests.filter((_, i) => i !== idx),
                  })
                }
              >
                {t('remove')}
              </button>
            )}
          </div>
        ))}
        <FormSelect
          label={t('preferredFacility')}
          value={details.preferred_facility || ''}
          onChange={(e) => patch({ preferred_facility: e.target.value })}
          options={[{ value: '', label: dash }, ...facilityOptions]}
        />
      </div>

      {/* 4. Estimated Cost & Duration */}
      <div className="aid-family-panel aid-health-card" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">{t('healthEstimatedCost')}</h4>
        <p className="aid-section-hint" style={{ marginTop: 0 }}>
          {t('healthEstimatedCostHint')}
        </p>
        <div className="form-grid-2">
          <FormInput
            label={t('consultationFees')}
            type="number"
            min="0"
            value={details.cost_consultation ?? ''}
            onChange={(e) => patch({ cost_consultation: e.target.value })}
            placeholder="0"
          />
          <FormInput
            label={t('diagnosticTestsCost')}
            type="number"
            min="0"
            value={details.cost_diagnostics ?? ''}
            onChange={(e) => patch({ cost_diagnostics: e.target.value })}
            placeholder="0"
          />
          <FormInput
            label={t('medicinesCost')}
            type="number"
            min="0"
            value={details.cost_medicines ?? ''}
            onChange={(e) => patch({ cost_medicines: e.target.value })}
            placeholder="0"
          />
          <FormInput
            label={t('procedureSurgeryCost')}
            type="number"
            min="0"
            value={details.cost_procedure ?? ''}
            onChange={(e) => patch({ cost_procedure: e.target.value })}
            placeholder="0"
          />
          <FormInput
            label={t('otherTransportCost')}
            type="number"
            min="0"
            value={details.cost_other ?? ''}
            onChange={(e) => patch({ cost_other: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="form-grid-2" style={{ marginTop: 8, alignItems: 'end' }}>
          <div>
            <span className="form-label">{t('costBasis')}</span>
            <div className="aid-health-yn">
              <button
                type="button"
                className={`aid-health-yn__btn${
                  !isMonthly ? ' is-active' : ''
                }`}
                onClick={() => patch({ cost_basis: 'once' })}
              >
                {t('costBasisOnce')}
              </button>
              <button
                type="button"
                className={`aid-health-yn__btn${
                  isMonthly ? ' is-active' : ''
                }`}
                onClick={() => patch({ cost_basis: 'monthly' })}
              >
                {t('costBasisMonthly')}
              </button>
            </div>
          </div>
          <FormInput
            label={t('durationOfTreatment')}
            type="number"
            min="0"
            value={details.duration_value ?? ''}
            onChange={(e) => patch({ duration_value: e.target.value })}
            placeholder={t('durationOfTreatmentPlaceholder')}
          />
          <FormSelect
            label={t('unit')}
            value={details.duration_unit || 'months'}
            onChange={(e) => patch({ duration_unit: e.target.value })}
            options={unitOptions}
          />
        </div>
        <div
          className={`aid-health-total${withinCap ? '' : ' is-over'}`}
          style={{ marginTop: 12 }}
        >
          <div>
            <div className="aid-health-total__label">{totalLabel}</div>
            <div className="aid-health-total__amount">
              PKR {fmtPkr(estimatedTotal)}
            </div>
          </div>
          {limit != null && (
            <span
              className={`aid-health-cap-badge${
                withinCap ? ' is-ok' : ' is-over'
              }`}
            >
              {withinCap
                ? t('healthWithinLimit', { n: fmtPkr(limit) })
                : t('healthExceedsLimit', {
                    n: fmtPkr(limit),
                    over: fmtPkr(overBy),
                  })}
            </span>
          )}
        </div>
      </div>

      {/* 5. Financial & Other Support */}
      <div className="aid-family-panel aid-health-card" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">{t('healthFinancialSupport')}</h4>
        <span className="form-label">{t('whoPayingNow')}</span>
        <ChipMulti
          options={payingOptions}
          values={details.paying_now}
          onChange={(paying_now) => patch({ paying_now })}
        />
        <div className="form-grid-2" style={{ marginTop: 12, alignItems: 'end' }}>
          <div>
            <span className="form-label">{t('hasSehatCard')}</span>
            <YesNoToggle
              value={details.has_sehat_card}
              onChange={(v) => patch({ has_sehat_card: v })}
            />
          </div>
          <div>
            <span className="form-label">{t('medicalHelpOtherOrg')}</span>
            <YesNoToggle
              value={details.medical_help_other_org}
              onChange={(v) => patch({ medical_help_other_org: v })}
            />
          </div>
          <FormInput
            label={t('debtDueToIllness')}
            type="number"
            min="0"
            value={details.debt_due_to_illness ?? ''}
            onChange={(e) => patch({ debt_due_to_illness: e.target.value })}
          />
        </div>
      </div>

      {/* 6. Impact on Household */}
      <div className="aid-family-panel aid-health-card" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">{t('healthImpactHousehold')}</h4>
        <div className="form-grid-2" style={{ alignItems: 'end' }}>
          <div>
            <span className="form-label">{t('patientEarningMember')}</span>
            <YesNoToggle
              value={details.patient_earning_member}
              onChange={(v) => patch({ patient_earning_member: v })}
            />
          </div>
          <FormInput
            label={t('unableToWorkYears')}
            type="number"
            min="0"
            value={details.unable_work_years ?? ''}
            onChange={(e) => patch({ unable_work_years: e.target.value })}
          />
          <FormInput
            label={t('months')}
            type="number"
            min="0"
            max="11"
            value={details.unable_work_months ?? ''}
            onChange={(e) => patch({ unable_work_months: e.target.value })}
          />
        </div>
        <FormInput
          label={t('whoTakesCare')}
          value={details.caregiver || ''}
          onChange={(e) => patch({ caregiver: e.target.value })}
        />
      </div>

      {/* 7. Misc */}
      <div className="aid-family-panel aid-health-card" style={{ marginTop: 12 }}>
        <FormTextarea
          label={t('howKnowMtjf')}
          value={details.how_know_mtjf || ''}
          onChange={(e) => patch({ how_know_mtjf: e.target.value })}
          rows={3}
        />
        <FormTextarea
          label={t('alternativeIfNotApprovedTreatment')}
          value={details.alternative_if_not_approved || ''}
          onChange={(e) =>
            patch({ alternative_if_not_approved: e.target.value })
          }
          rows={3}
        />
      </div>
    </div>
  );
};

export default AidHealthApplicationFields;
