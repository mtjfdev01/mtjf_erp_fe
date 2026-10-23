import React, { useMemo } from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { AID_YES_NO } from '../aidConstants';
import { useAidLang } from '../lang/AidLangContext';
import { aidOptionsForLang } from '../lang/aidUiCopy';

/**
 * Financial Assistance aid type — Financial Condition on Application tab
 */
const AidFinancialAssistanceFields = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const { t, lang } = useAidLang();
  const dash = t('dash');
  const yesNoOptions = useMemo(
    () => aidOptionsForLang(AID_YES_NO, lang),
    [lang],
  );
  const details = value || {};
  const hasLoans = details.has_loans === 'yes';

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  if (readOnly) {
    const hasAny =
      details.monthly_household_income ||
      details.income_source ||
      details.monthly_expenses ||
      details.earning_members ||
      details.dependent_members ||
      details.has_loans ||
      details.amount_requested ||
      details.purpose ||
      details.how_managed_so_far ||
      details.alternative_if_not_approved;
    if (!hasAny) return null;

    return (
      <div className="aid-financial-assistance" style={{ marginTop: 12 }}>
        <div className="aid-family-panel">
          <h4 className="aid-family-panel__title">{t('financialCondition')}</h4>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {[
              details.monthly_household_income
                ? `Income PKR ${details.monthly_household_income}`
                : null,
              details.income_source ? `Source: ${details.income_source}` : null,
              details.monthly_expenses
                ? `Expenses PKR ${details.monthly_expenses}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ') || dash}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {t('earningMembers')}: {details.earning_members || dash} ·{' '}
            {t('dependentMembers')}: {details.dependent_members || dash}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {t('loansLabel')}{' '}
            {details.has_loans === 'yes'
              ? `${t('yes')}${
                  details.loan_amount ? ` · PKR ${details.loan_amount}` : ''
                }${details.loan_details ? ` · ${details.loan_details}` : ''}`
              : details.has_loans === 'no'
                ? t('no')
                : dash}
          </p>
          {(details.amount_requested || details.support_months) && (
            <p style={{ fontSize: 13, margin: '8px 0 0' }}>
              <strong>{t('requestedLabel')}</strong>{' '}
              {[
                details.amount_requested
                  ? `PKR ${details.amount_requested}`
                  : null,
                details.support_months
                  ? `${details.support_months} ${t('months')}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {details.purpose && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              <strong>{t('purposeLabel')}</strong> {details.purpose}
            </p>
          )}
          {details.how_managed_so_far && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              <strong>{t('howManagedLabel')}</strong>{' '}
              {details.how_managed_so_far}
            </p>
          )}
          {details.alternative_if_not_approved && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              <strong>{t('ifNotApprovedLabel')}</strong>{' '}
              {details.alternative_if_not_approved}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="aid-financial-assistance">
      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">{t('financialCondition')}</h4>
        <div className="form-grid-2">
          <FormInput
            label={t('monthlyHouseholdIncome')}
            type="number"
            min="0"
            value={details.monthly_household_income ?? ''}
            onChange={(e) =>
              patch({ monthly_household_income: e.target.value })
            }
          />
          <FormInput
            label={t('sourceOfIncome')}
            value={details.income_source || ''}
            onChange={(e) => patch({ income_source: e.target.value })}
            placeholder={t('incomeSourcePlaceholder')}
          />
          <FormInput
            label={t('monthlyExpenses')}
            type="number"
            min="0"
            value={details.monthly_expenses ?? ''}
            onChange={(e) => patch({ monthly_expenses: e.target.value })}
          />
          <FormInput
            label={t('earningMembers')}
            type="number"
            min="0"
            value={details.earning_members ?? ''}
            onChange={(e) => patch({ earning_members: e.target.value })}
          />
          <FormInput
            label={t('dependentMembers')}
            type="number"
            min="0"
            value={details.dependent_members ?? ''}
            onChange={(e) => patch({ dependent_members: e.target.value })}
          />
          <FormSelect
            label={t('hasOutstandingLoans')}
            value={details.has_loans || ''}
            onChange={(e) => {
              const next = e.target.value;
              patch({
                has_loans: next,
                ...(next !== 'yes'
                  ? { loan_amount: '', loan_details: '' }
                  : {}),
              });
            }}
            options={[{ value: '', label: dash }, ...yesNoOptions]}
          />
          {hasLoans && (
            <>
              <FormInput
                label={t('loanDebtAmount')}
                type="number"
                min="0"
                value={details.loan_amount ?? ''}
                onChange={(e) => patch({ loan_amount: e.target.value })}
              />
              <FormInput
                label={t('loanDetails')}
                value={details.loan_details || ''}
                onChange={(e) => patch({ loan_details: e.target.value })}
                placeholder={t('loanDetailsPlaceholder')}
              />
            </>
          )}
          <FormInput
            label={t('amountAssistanceRequested')}
            type="number"
            min="0"
            value={details.amount_requested ?? ''}
            onChange={(e) => patch({ amount_requested: e.target.value })}
          />
          <FormInput
            label={t('forHowManyMonths')}
            type="number"
            min="0"
            value={details.support_months ?? ''}
            onChange={(e) => patch({ support_months: e.target.value })}
          />
        </div>
        <FormTextarea
          label={t('purposeFinancialAssistance')}
          value={details.purpose || ''}
          onChange={(e) => patch({ purpose: e.target.value })}
          rows={2}
        />
        <FormTextarea
          label={t('howManagedSoFar')}
          value={details.how_managed_so_far || ''}
          onChange={(e) => patch({ how_managed_so_far: e.target.value })}
          rows={2}
        />
        <FormTextarea
          label={t('alternativeIfNotApproved')}
          value={details.alternative_if_not_approved || ''}
          onChange={(e) =>
            patch({ alternative_if_not_approved: e.target.value })
          }
          rows={2}
        />
      </div>
    </div>
  );
};

export default AidFinancialAssistanceFields;
