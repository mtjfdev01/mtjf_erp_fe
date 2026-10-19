import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import {
  AID_LIVESTOCK_ANIMALS,
  AID_LIVESTOCK_OWNERSHIP,
  AID_YES_NO,
  emptyLivestockRow,
} from '../aidConstants';

/**
 * Livestock — one line when Yes:
 * Livestock? | Type | Qty | Ownership | (Owner / Contact if sharing) | +
 */
const AidLivestockIntake = ({ value, onChange, title = 'Livestock' }) => {
  const hasLivestock = !!value?.has_livestock;
  const rows =
    Array.isArray(value?.livestock_entries) && value.livestock_entries.length
      ? value.livestock_entries
      : hasLivestock
        ? [emptyLivestockRow()]
        : [];

  const patch = (partial) => onChange({ ...value, ...partial });

  const setRows = (nextRows) =>
    patch({ has_livestock: true, livestock_entries: nextRows });

  const updateRow = (idx, partial) => {
    setRows(rows.map((row, i) => (i === idx ? { ...row, ...partial } : row)));
  };

  const onHasChange = (e) => {
    const yes = e.target.value === 'yes';
    patch({
      has_livestock: yes,
      livestock_entries: yes
        ? rows.length
          ? rows
          : [emptyLivestockRow()]
        : [],
    });
  };

  return (
    <div className="aid-livestock-intake">
      {title ? <h4 className="aid-family-panel__title">{title}</h4> : null}

      {!hasLivestock ? (
        <div className="aid-property-inline aid-property-inline--land-only">
          <label className="aid-property-inline__field">
            <span className="aid-property-inline__label">
              Do you have livestock?
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
            const sharing = row.ownership === 'sharing';
            return (
              <div key={`live-${idx}`} className="aid-property-inline">
                {idx === 0 ? (
                  <label className="aid-property-inline__field aid-property-inline__field--land">
                    <span className="aid-property-inline__label">
                      Livestock?
                    </span>
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
                    value={row.animal_type || 'goat'}
                    onChange={(e) =>
                      updateRow(idx, { animal_type: e.target.value })
                    }
                    required
                  >
                    {AID_LIVESTOCK_ANIMALS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="aid-property-inline__field aid-property-inline__field--area">
                  {idx === 0 ? (
                    <span className="aid-property-inline__label">
                      Qty <span className="required-mark">*</span>
                    </span>
                  ) : (
                    <span className="aid-property-inline__label aid-property-inline__label--ghost">
                      &nbsp;
                    </span>
                  )}
                  <input
                    className="aid-property-inline__control"
                    type="number"
                    min="1"
                    max="9999"
                    value={
                      row.quantity === '' || row.quantity == null
                        ? ''
                        : String(row.quantity)
                    }
                    onChange={(e) =>
                      updateRow(idx, { quantity: e.target.value })
                    }
                    required
                  />
                </label>

                <label className="aid-property-inline__field aid-property-inline__field--type">
                  {idx === 0 ? (
                    <span className="aid-property-inline__label">Ownership</span>
                  ) : (
                    <span className="aid-property-inline__label aid-property-inline__label--ghost">
                      &nbsp;
                    </span>
                  )}
                  <select
                    className="aid-property-inline__control"
                    value={row.ownership || 'personal'}
                    onChange={(e) => {
                      const ownership = e.target.value;
                      updateRow(idx, {
                        ownership,
                        ...(ownership !== 'sharing'
                          ? { owner_name: '', owner_contact: '' }
                          : {}),
                      });
                    }}
                  >
                    {AID_LIVESTOCK_OWNERSHIP.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>

                {sharing ? (
                  <>
                    <label className="aid-property-inline__field aid-property-inline__field--details">
                      {idx === 0 ? (
                        <span className="aid-property-inline__label">
                          Owner name
                        </span>
                      ) : (
                        <span className="aid-property-inline__label aid-property-inline__label--ghost">
                          &nbsp;
                        </span>
                      )}
                      <input
                        className="aid-property-inline__control"
                        type="text"
                        value={row.owner_name || ''}
                        onChange={(e) =>
                          updateRow(idx, { owner_name: e.target.value })
                        }
                        placeholder="Owner"
                      />
                    </label>
                    <label className="aid-property-inline__field aid-property-inline__field--area">
                      {idx === 0 ? (
                        <span className="aid-property-inline__label">
                          Contact
                        </span>
                      ) : (
                        <span className="aid-property-inline__label aid-property-inline__label--ghost">
                          &nbsp;
                        </span>
                      )}
                      <input
                        className="aid-property-inline__control"
                        type="text"
                        value={row.owner_contact || ''}
                        onChange={(e) =>
                          updateRow(idx, { owner_contact: e.target.value })
                        }
                        placeholder="03…"
                      />
                    </label>
                  </>
                ) : null}

                <div className="aid-property-inline__actions">
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      className="aid-property-row__icon-btn aid-property-row__icon-btn--remove"
                      aria-label="Remove animal"
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
                      aria-label="Add animal"
                      title="Add animal"
                      onClick={() => setRows([...rows, emptyLivestockRow()])}
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

export default AidLivestockIntake;
