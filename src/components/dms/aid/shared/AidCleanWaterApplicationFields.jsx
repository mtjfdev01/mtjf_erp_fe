import React from 'react';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';

/**
 * Clean Water aid type — Application tab special structure
 */
const AidCleanWaterApplicationFields = ({
  value,
  onChange,
  readOnly = false,
}) => {
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
          <h4 className="aid-family-panel__title">Clean Water Program</h4>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            <strong>Existing source of water:</strong>{' '}
            {details.existing_source_of_water || '—'}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            <strong>Distance from home:</strong>{' '}
            {details.distance_from_home || '—'}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            <strong>Duration without clean water:</strong>{' '}
            {details.duration_without_clean_water || '—'}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            <strong>Location of project:</strong>{' '}
            {details.location_of_project || '—'}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            <strong>Community contribution:</strong>{' '}
            {details.community_contribution_amount
              ? `PKR ${details.community_contribution_amount}`
              : '—'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aid-clean-water-application">
      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">Clean Water Program</h4>
        <div className="form-grid-2">
          <FormInput
            label="Existing source of water"
            value={details.existing_source_of_water || ''}
            onChange={(e) =>
              patch({ existing_source_of_water: e.target.value })
            }
            placeholder="e.g., well, tanker, canal…"
          />
          <FormInput
            label="Distance from home"
            value={details.distance_from_home || ''}
            onChange={(e) => patch({ distance_from_home: e.target.value })}
            placeholder="e.g., 2 km"
          />
          <FormInput
            label="Duration without clean water"
            value={details.duration_without_clean_water || ''}
            onChange={(e) =>
              patch({ duration_without_clean_water: e.target.value })
            }
            placeholder="e.g., 6 months"
          />
          <FormInput
            label="Community contribution (Amount)"
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
            label="Location of project"
            value={details.location_of_project || ''}
            onChange={(e) => patch({ location_of_project: e.target.value })}
            rows={2}
            placeholder="Village / area / landmark…"
          />
        </div>
      </div>
    </div>
  );
};

export default AidCleanWaterApplicationFields;
