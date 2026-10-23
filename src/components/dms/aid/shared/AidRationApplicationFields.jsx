import React, { useMemo } from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { AID_YES_NO } from '../aidConstants';
import { useAidLang } from '../lang/AidLangContext';
import { aidOptionsForLang } from '../lang/aidUiCopy';

/**
 * Ration aid type — Application tab special structure
 * (Monthly Ration Program intake)
 */
const AidRationApplicationFields = ({
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
  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  const hadWheat = details.family_had_wheat === 'yes';
  const totalPersons = [details.persons_male, details.persons_female, details.persons_kids]
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n >= 0)
    .reduce((a, b) => a + b, 0);

  if (readOnly) {
    const hasAny =
      details.persons_male ||
      details.persons_female ||
      details.persons_kids ||
      details.family_had_wheat ||
      details.how_know_mtjf ||
      details.ration_arrangements_before ||
      details.support_years ||
      details.support_months ||
      details.alternative_if_not_approved;
    if (!hasAny) return null;

    const duration = [
      details.support_years
        ? `${details.support_years} ${t('yrShort')}`
        : null,
      details.support_months
        ? `${details.support_months} ${t('moShort')}`
        : null,
    ]
      .filter(Boolean)
      .join(' ');

    const wheatLabel =
      details.family_had_wheat === 'yes'
        ? details.wheat_quantity_kg
          ? `${t('yes')} · ${details.wheat_quantity_kg} KG`
          : t('yes')
        : details.family_had_wheat === 'no'
          ? t('no')
          : dash;
    const wheatTone =
      details.family_had_wheat === 'yes'
        ? 'success'
        : details.family_had_wheat === 'no'
          ? 'muted'
          : 'muted';

    return (
      <div className="aid-ration-card">
        <div className="aid-ration-card__banner" aria-hidden />
        <div className="aid-ration-card__head">
          <div>
            <p className="aid-ration-card__eyebrow">{t('programDetail')}</p>
            <h4 className="aid-ration-card__title">{t('monthlyRationProgram')}</h4>
          </div>
          {duration ? (
            <div className="aid-ration-card__duration">
              <span>{t('requestedDuration')}</span>
              <strong>{duration}</strong>
            </div>
          ) : null}
        </div>

        <div className="aid-ration-card__stats">
          <div className="aid-ration-stat">
            <em>{t('male')}</em>
            <strong>{details.persons_male || '0'}</strong>
          </div>
          <div className="aid-ration-stat">
            <em>{t('female')}</em>
            <strong>{details.persons_female || '0'}</strong>
          </div>
          <div className="aid-ration-stat">
            <em>{t('kids')}</em>
            <strong>{details.persons_kids || '0'}</strong>
          </div>
          <div className="aid-ration-stat aid-ration-stat--total">
            <em>{t('totalPersonsLabel')}</em>
            <strong>{totalPersons || '0'}</strong>
          </div>
          <div className={`aid-ration-stat aid-ration-stat--${wheatTone}`}>
            <em>{t('familyHadWheat')}</em>
            <strong>{wheatLabel}</strong>
          </div>
        </div>

        <div className="aid-ration-card__notes">
          {details.how_know_mtjf ? (
            <div className="aid-ration-note">
              <span>{t('howKnowMtjfRo')}</span>
              <p>{details.how_know_mtjf}</p>
            </div>
          ) : null}
          {details.ration_arrangements_before ? (
            <div className="aid-ration-note">
              <span>{t('rationArrangementsBeforeRo')}</span>
              <p>{details.ration_arrangements_before}</p>
            </div>
          ) : null}
          {details.alternative_if_not_approved ? (
            <div className="aid-ration-note aid-ration-note--warn">
              <span>{t('ifNotApprovedAlternative')}</span>
              <p>{details.alternative_if_not_approved}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="aid-ration-application">
      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">{t('rationPersons')}</h4>
        <div className="form-grid-2">
          <FormInput
            label={t('male')}
            type="number"
            min="0"
            value={details.persons_male ?? ''}
            onChange={(e) => patch({ persons_male: e.target.value })}
          />
          <FormInput
            label={t('female')}
            type="number"
            min="0"
            value={details.persons_female ?? ''}
            onChange={(e) => patch({ persons_female: e.target.value })}
          />
          <FormInput
            label={t('kids')}
            type="number"
            min="0"
            value={details.persons_kids ?? ''}
            onChange={(e) => patch({ persons_kids: e.target.value })}
          />
        </div>
        {totalPersons > 0 && (
          <p className="aid-section-hint" style={{ marginTop: 6 }}>
            {t('total', { n: totalPersons })}
          </p>
        )}
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <div className="form-grid-2">
          <FormSelect
            label={t('hadWheat')}
            value={details.family_had_wheat || ''}
            onChange={(e) => {
              const next = e.target.value;
              patch({
                family_had_wheat: next,
                ...(next !== 'yes' ? { wheat_quantity_kg: '' } : {}),
              });
            }}
            options={[{ value: '', label: dash }, ...yesNoOptions]}
          />
          {hadWheat && (
            <FormInput
              label={t('wheatKg')}
              type="number"
              min="0"
              step="0.1"
              value={details.wheat_quantity_kg ?? ''}
              onChange={(e) => patch({ wheat_quantity_kg: e.target.value })}
            />
          )}
        </div>
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <FormTextarea
          label={t('howKnowMtjf')}
          value={details.how_know_mtjf || ''}
          onChange={(e) => patch({ how_know_mtjf: e.target.value })}
          rows={2}
        />
        <FormTextarea
          label={t('rationArrangementsBefore')}
          value={details.ration_arrangements_before || ''}
          onChange={(e) =>
            patch({ ration_arrangements_before: e.target.value })
          }
          rows={2}
        />
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">{t('rationDuration')}</h4>
        <div className="form-grid-2">
          <FormInput
            label={t('years')}
            type="number"
            min="0"
            value={details.support_years ?? ''}
            onChange={(e) => patch({ support_years: e.target.value })}
          />
          <FormInput
            label={t('months')}
            type="number"
            min="0"
            max="11"
            value={details.support_months ?? ''}
            onChange={(e) => patch({ support_months: e.target.value })}
          />
        </div>
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <FormTextarea
          label={t('alternativeIfNotRation')}
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

export default AidRationApplicationFields;
