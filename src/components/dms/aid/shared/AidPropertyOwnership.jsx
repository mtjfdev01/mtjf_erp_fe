import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import {
  AID_PROPERTY_TYPES,
  AID_YES_NO,
  emptyPropertyRow,
} from '../aidConstants';

/**
 * Property ownership — single horizontal line when Yes:
 * Do you have land? | Type | Area | Details | +
 */
const AidPropertyOwnership = ({
  value,
  onChange,
  title = 'Property ownership',
}) => {
  const hasLand = !!value?.has_land;
  const rows =
    Array.isArray(value?.property_entries) && value.property_entries.length
      ? value.property_entries
      : hasLand
        ? [
            emptyPropertyRow({
              property_type: value?.property_type || '',
              property_area: value?.property_area || '',
              property_details: value?.property_details || '',
            }),
          ]
        : [];

  const patch = (partial) => onChange({ ...value, ...partial });

  const syncLegacy = (nextRows, has) => {
    const first = has && nextRows[0] ? nextRows[0] : null;
    return {
      has_land: !!has,
      property_entries: has ? nextRows : [],
      property_type: first?.property_type || '',
      property_area: first?.property_area || '',
      property_details: first?.property_details || '',
    };
  };

  const setRows = (nextRows) => patch(syncLegacy(nextRows, true));

  const updateRow = (idx, partial) => {
    setRows(rows.map((row, i) => (i === idx ? { ...row, ...partial } : row)));
  };

  const onHasLandChange = (e) => {
    const yes = e.target.value === 'yes';
    if (yes) {
      const next = rows.length > 0 ? rows : [emptyPropertyRow()];
      patch(syncLegacy(next, true));
    } else {
      patch(syncLegacy([], false));
    }
  };

  return (
    <div className="aid-property-ownership">
      {title ? <h4 className="aid-family-panel__title">{title}</h4> : null}

      {!hasLand ? (
        <div className="aid-property-inline aid-property-inline--land-only">
          <label className="aid-property-inline__field">
            <span className="aid-property-inline__label">Do you have land?</span>
            <select
              className="aid-property-inline__control"
              value="no"
              onChange={onHasLandChange}
            >
              {AID_YES_NO.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <div className="aid-property-rows">
          {rows.map((row, idx) => (
            <div key={`prop-${idx}`} className="aid-property-inline">
              {idx === 0 ? (
                <label className="aid-property-inline__field aid-property-inline__field--land">
                  <span className="aid-property-inline__label">
                    Do you have land?
                  </span>
                  <select
                    className="aid-property-inline__control"
                    value="yes"
                    onChange={onHasLandChange}
                  >
                    {AID_YES_NO.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span
                  className="aid-property-inline__field aid-property-inline__field--land"
                  aria-hidden
                />
              )}

              <label className="aid-property-inline__field aid-property-inline__field--type">
                {idx === 0 ? (
                  <span className="aid-property-inline__label">
                    Type <span className="required-mark">*</span>
                  </span>
                ) : (
                  <span className="aid-property-inline__label aid-property-inline__label--ghost">
                    &nbsp;
                  </span>
                )}
                <select
                  className="aid-property-inline__control"
                  value={row.property_type || ''}
                  onChange={(e) =>
                    updateRow(idx, { property_type: e.target.value })
                  }
                  required
                >
                  <option value="">—</option>
                  {AID_PROPERTY_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="aid-property-inline__field aid-property-inline__field--area">
                {idx === 0 ? (
                  <span className="aid-property-inline__label">Area</span>
                ) : (
                  <span className="aid-property-inline__label aid-property-inline__label--ghost">
                    &nbsp;
                  </span>
                )}
                <input
                  className="aid-property-inline__control"
                  type="text"
                  value={row.property_area || ''}
                  onChange={(e) =>
                    updateRow(idx, { property_area: e.target.value })
                  }
                  placeholder="e.g. 5 marla"
                />
              </label>

              <label className="aid-property-inline__field aid-property-inline__field--details">
                {idx === 0 ? (
                  <span className="aid-property-inline__label">
                    Property details
                  </span>
                ) : (
                  <span className="aid-property-inline__label aid-property-inline__label--ghost">
                    &nbsp;
                  </span>
                )}
                <input
                  className="aid-property-inline__control"
                  type="text"
                  value={row.property_details || ''}
                  onChange={(e) =>
                    updateRow(idx, { property_details: e.target.value })
                  }
                  placeholder="Location / notes"
                />
              </label>

              <div className="aid-property-inline__actions">
                {rows.length > 1 ? (
                  <button
                    type="button"
                    className="aid-property-row__icon-btn aid-property-row__icon-btn--remove"
                    aria-label="Remove property"
                    title="Remove"
                    onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                  >
                    <FiX />
                  </button>
                ) : null}
                {idx === rows.length - 1 ? (
                  <button
                    type="button"
                    className="aid-property-row__icon-btn aid-property-row__icon-btn--add"
                    aria-label="Add property"
                    title="Add property"
                    onClick={() => setRows([...rows, emptyPropertyRow()])}
                  >
                    <FiPlus />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AidPropertyOwnership;
