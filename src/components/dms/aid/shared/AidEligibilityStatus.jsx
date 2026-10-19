import React from 'react';
import { AID_BISP_STATUS, AID_NECTA_STATUS } from '../aidConstants';

/**
 * NECTA / BISP — single line: NECTA status | BISP eligible (no attachments)
 */
const AidEligibilityStatus = ({
  value,
  onChange,
  title = 'NECTA / BISP',
}) => {
  const patch = (partial) => onChange({ ...value, ...partial });

  return (
    <div className="aid-eligibility-status">
      {title ? <h4 className="aid-family-panel__title">{title}</h4> : null}
      <div className="aid-property-inline">
        <label className="aid-property-inline__field aid-property-inline__field--type">
          <span className="aid-property-inline__label">NECTA status</span>
          <select
            className="aid-property-inline__control"
            value={value?.necta_status || ''}
            onChange={(e) => patch({ necta_status: e.target.value })}
          >
            <option value="">—</option>
            {AID_NECTA_STATUS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="aid-property-inline__field aid-property-inline__field--type">
          <span className="aid-property-inline__label">BISP eligible</span>
          <select
            className="aid-property-inline__control"
            value={value?.bisp_status || ''}
            onChange={(e) => patch({ bisp_status: e.target.value })}
          >
            <option value="">—</option>
            {AID_BISP_STATUS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default AidEligibilityStatus;
