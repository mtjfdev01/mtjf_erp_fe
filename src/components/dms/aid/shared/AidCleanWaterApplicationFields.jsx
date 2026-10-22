import React from 'react';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import { useAidLang } from '../lang/AidLangContext';

/**
 * Clean Water aid type — Application tab special structure
 */
const AidCleanWaterApplicationFields = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const { t } = useAidLang();
  const dash = t('dash');
  const details = value || {};

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  if (readOnly) {
    const hasAny =
      details.existing_source_of_water ||
      details.distance_from_home ||
      details.duration_without_clean_water ||
      details.location_of_project ||
      details.community_contribution_amount;
    if (!hasAny) return null;

    return (
      <div className="aid-clean-water" style={{ marginTop: 12 }}>
        <div className="aid-family-panel">
          <h4 className="aid-family-panel__title">{t('cleanWaterProgram')}</h4>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            <strong>{t('existingWaterSource')}:</strong>{' '}
            {details.existing_source_of_water || dash}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            <strong>{t('distanceFromHome')}:</strong>{' '}
            {details.distance_from_home || dash}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            <strong>{t('durationWithoutWater')}:</strong>{' '}
            {details.duration_without_clean_water || dash}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            <strong>{t('projectLocation')}:</strong>{' '}
            {details.location_of_project || dash}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            <strong>{t('communityContribution')}:</strong>{' '}
            {details.community_contribution_amount
              ? `PKR ${details.community_contribution_amount}`
              : dash}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aid-clean-water-application">
      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">{t('cleanWaterProgram')}</h4>
        <div className="form-grid-2">
          <FormInput
            label={t('existingWaterSource')}
            value={details.existing_source_of_water || ''}
            onChange={(e) =>
              patch({ existing_source_of_water: e.target.value })
            }
            placeholder={t('waterSourcePlaceholder')}
          />
          <FormInput
            label={t('distanceFromHome')}
            value={details.distance_from_home || ''}
            onChange={(e) => patch({ distance_from_home: e.target.value })}
            placeholder={t('distancePlaceholder')}
          />
          <FormInput
            label={t('durationWithoutWater')}
            value={details.duration_without_clean_water || ''}
            onChange={(e) =>
              patch({ duration_without_clean_water: e.target.value })
            }
            placeholder={t('durationPlaceholder')}
          />
          <FormInput
            label={t('communityContribution')}
            type="number"
            min="0"
            step="1"
            value={details.community_contribution_amount ?? ''}
            onChange={(e) =>
              patch({ community_contribution_amount: e.target.value })
            }
            placeholder="PKR"
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <FormTextarea
            label={t('projectLocation')}
            value={details.location_of_project || ''}
            onChange={(e) => patch({ location_of_project: e.target.value })}
            rows={2}
            placeholder={t('projectLocationPlaceholder')}
          />
        </div>
      </div>
    </div>
  );
};

export default AidCleanWaterApplicationFields;
