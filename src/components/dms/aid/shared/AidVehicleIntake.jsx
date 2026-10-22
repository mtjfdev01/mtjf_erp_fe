import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import {
  AID_VEHICLE_TYPES,
  AID_YES_NO,
  emptyVehicleRow,
} from '../aidConstants';

const selectValueOf = (vehicleType) => {
  const known = AID_VEHICLE_TYPES.some((t) => t.value === (vehicleType || ''));
  if (known || !vehicleType) return vehicleType || '';
  return 'other';
};

/**
 * Vehicle — one line when Yes:
 * Vehicle? | Type | (Specify if other) | +
 */
const AidVehicleIntake = ({ value, onChange, title = 'Vehicle' }) => {
  const hasVehicle = !!value?.has_vehicle;
  const rows =
    Array.isArray(value?.vehicle_entries) && value.vehicle_entries.length
      ? value.vehicle_entries
      : hasVehicle
        ? [
            emptyVehicleRow({
              vehicle_type: value?.vehicle_type || '',
            }),
          ]
        : [];

  const patch = (partial) => onChange({ ...value, ...partial });

  const syncLegacy = (nextRows, has) => {
    const first = has && nextRows[0] ? nextRows[0] : null;
    return {
      has_vehicle: !!has,
      vehicle_entries: has ? nextRows : [],
      vehicle_type: first?.vehicle_type || '',
    };
  };

  const setRows = (nextRows) => patch(syncLegacy(nextRows, true));

  const updateRow = (idx, partial) => {
    setRows(rows.map((row, i) => (i === idx ? { ...row, ...partial } : row)));
  };

  const onHasChange = (e) => {
    const yes = e.target.value === 'yes';
    if (yes) {
      const next = rows.length ? rows : [emptyVehicleRow()];
      patch(syncLegacy(next, true));
    } else {
      patch(syncLegacy([], false));
    }
  };

  return (
    <div className="aid-vehicle-intake">
      {title ? <h4 className="aid-family-panel__title">{title}</h4> : null}

      {!hasVehicle ? (
        <div className="aid-property-inline aid-property-inline--land-only">
          <label className="aid-property-inline__field">
            <span className="aid-property-inline__label">
              Do you have any vehicle?
            </span>
            <select
              className="aid-property-inline__control"
              value="no"
              onChange={onHasChange}
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
          {rows.map((row, idx) => {
            const selectValue = selectValueOf(row.vehicle_type);
            const isOther = selectValue === 'other';
            return (
              <div key={`veh-${idx}`} className="aid-property-inline">
                {idx === 0 ? (
                  <label className="aid-property-inline__field aid-property-inline__field--land">
                    <span className="aid-property-inline__label">Vehicle?</span>
                    <select
                      className="aid-property-inline__control"
                      value="yes"
                      onChange={onHasChange}
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
                    value={selectValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateRow(idx, {
                        vehicle_type: v === 'other' ? '' : v,
                      });
                    }}
                    required
                  >
                    <option value="">—</option>
                    {AID_VEHICLE_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>

                {isOther ? (
                  <label className="aid-property-inline__field aid-property-inline__field--details">
                    {idx === 0 ? (
                      <span className="aid-property-inline__label">
                        Specify
                      </span>
                    ) : (
                      <span className="aid-property-inline__label aid-property-inline__label--ghost">
                        &nbsp;
                      </span>
                    )}
                    <input
                      className="aid-property-inline__control"
                      type="text"
                      value={row.vehicle_type || ''}
                      onChange={(e) =>
                        updateRow(idx, { vehicle_type: e.target.value })
                      }
                      placeholder="e.g. Rickshaw"
                      required
                    />
                  </label>
                ) : (
                  <span className="aid-property-inline__field aid-property-inline__field--details" />
                )}

                <div className="aid-property-inline__actions">
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      className="aid-property-row__icon-btn aid-property-row__icon-btn--remove"
                      aria-label="Remove vehicle"
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
                      aria-label="Add vehicle"
                      title="Add vehicle"
                      onClick={() => setRows([...rows, emptyVehicleRow()])}
                    >
                      <FiPlus />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AidVehicleIntake;
