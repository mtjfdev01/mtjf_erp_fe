import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { AID_RESIDENT_TYPES, emptyResidentRow } from '../aidConstants';

/**
 * Resident — one line per house:
 * Type | (Rent) | Area | Details | +
 */
const AidResidentHousing = ({ value, onChange, title = 'Resident' }) => {
  const rows =
    Array.isArray(value?.resident_entries) && value.resident_entries.length
      ? value.resident_entries
      : value?.resident_type
        ? [
            emptyResidentRow({
              resident_type: value.resident_type || '',
              rented_amount: value.rented_amount ?? '',
              house_area_marla: value.house_area_marla ?? '',
              house_details: value.house_details || '',
            }),
          ]
        : [emptyResidentRow()];

  const patch = (partial) => onChange({ ...value, ...partial });

  const syncLegacy = (nextRows) => {
    const first = nextRows[0] || emptyResidentRow();
    return {
      resident_entries: nextRows,
      resident_type: first.resident_type || '',
      rented_amount: first.rented_amount ?? '',
      house_area_marla: first.house_area_marla ?? '',
      house_details: first.house_details || '',
    };
  };

  const setRows = (nextRows) => patch(syncLegacy(nextRows));

  const updateRow = (idx, partial) => {
    setRows(rows.map((row, i) => (i === idx ? { ...row, ...partial } : row)));
  };

  return (
    <div className="aid-resident-housing">
      {title ? <h4 className="aid-family-panel__title">{title}</h4> : null}
      <div className="aid-property-rows">
        {rows.map((row, idx) => {
          const isRented = row.resident_type === 'rented';
          return (
            <div key={`res-${idx}`} className="aid-property-inline">
              <label className="aid-property-inline__field aid-property-inline__field--type">
                {idx === 0 ? (
                  <span className="aid-property-inline__label">Type</span>
                ) : (
                  <span className="aid-property-inline__label aid-property-inline__label--ghost">
                    &nbsp;
                  </span>
                )}
                <select
                  className="aid-property-inline__control"
                  value={row.resident_type || ''}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    updateRow(idx, {
                      resident_type: nextType,
                      ...(nextType !== 'rented' ? { rented_amount: '' } : {}),
                    });
                  }}
                >
                  <option value="">—</option>
                  {AID_RESIDENT_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              {isRented ? (
                <label className="aid-property-inline__field aid-property-inline__field--area">
                  {idx === 0 ? (
                    <span className="aid-property-inline__label">Rent (PKR)</span>
                  ) : (
                    <span className="aid-property-inline__label aid-property-inline__label--ghost">
                      &nbsp;
                    </span>
                  )}
                  <input
                    className="aid-property-inline__control"
                    type="number"
                    min="0"
                    value={row.rented_amount ?? ''}
                    onChange={(e) =>
                      updateRow(idx, { rented_amount: e.target.value })
                    }
                    placeholder="0"
                  />
                </label>
              ) : null}

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
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.house_area_marla ?? ''}
                  onChange={(e) =>
                    updateRow(idx, { house_area_marla: e.target.value })
                  }
                  placeholder="Marla"
                />
              </label>

              <label className="aid-property-inline__field aid-property-inline__field--details">
                {idx === 0 ? (
                  <span className="aid-property-inline__label">
                    House details
                  </span>
                ) : (
                  <span className="aid-property-inline__label aid-property-inline__label--ghost">
                    &nbsp;
                  </span>
                )}
                <input
                  className="aid-property-inline__control"
                  type="text"
                  value={row.house_details || ''}
                  onChange={(e) =>
                    updateRow(idx, { house_details: e.target.value })
                  }
                  placeholder="Description / notes"
                />
              </label>

              <div className="aid-property-inline__actions">
                {rows.length > 1 ? (
                  <button
                    type="button"
                    className="aid-property-row__icon-btn aid-property-row__icon-btn--remove"
                    aria-label="Remove residence"
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
                    aria-label="Add residence"
                    title="Add residence"
                    onClick={() => setRows([...rows, emptyResidentRow()])}
                  >
                    <FiPlus />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AidResidentHousing;
