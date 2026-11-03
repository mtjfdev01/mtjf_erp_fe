import React, { useMemo } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { AID_RESIDENT_TYPES, emptyResidentRow } from '../aidConstants';
import { useAidLang } from '../lang/AidLangContext';
import { aidOptionsForLang } from '../lang/aidUiCopy';

/**
 * Resident — one line per house:
 * Type | Ownership | Other | (Rent) | Area | Details | +
 */
const AidResidentHousing = ({ value, onChange, title }) => {
  const { t, lang } = useAidLang();
  const panelTitle = title ?? t('resident');
  const residentTypes = useMemo(
    () => aidOptionsForLang(AID_RESIDENT_TYPES, lang),
    [lang],
  );

  const rows =
    Array.isArray(value?.resident_entries) && value.resident_entries.length
      ? value.resident_entries
      : value?.resident_type
        ? [
            emptyResidentRow({
              resident_type: value.resident_type || '',
              resident_ownership_status: value.resident_ownership_status || '',
              resident_ownership_other: value.resident_ownership_other || '',
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
      resident_ownership_status: first.resident_ownership_status || '',
      resident_ownership_other: first.resident_ownership_other || '',
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
      {panelTitle ? (
        <h4 className="aid-family-panel__title">{panelTitle}</h4>
      ) : null}
      <div className="aid-property-rows">
        {rows.map((row, idx) => {
          const isRented = row.resident_type === 'rented';
          return (
            <div key={`res-${idx}`} className="aid-property-inline">
              <label className="aid-property-inline__field aid-property-inline__field--type">
                {idx === 0 ? (
                  <span className="aid-property-inline__label">{t('type')}</span>
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
                  <option value="">{t('dash')}</option>
                  {residentTypes.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="aid-property-inline__field aid-property-inline__field--area">
                {idx === 0 ? (
                  <span className="aid-property-inline__label">Ownership</span>
                ) : (
                  <span className="aid-property-inline__label aid-property-inline__label--ghost">
                    &nbsp;
                  </span>
                )}
                <input
                  className="aid-property-inline__control"
                  type="text"
                  value={row.resident_ownership_status || ''}
                  onChange={(e) =>
                    updateRow(idx, {
                      resident_ownership_status: e.target.value,
                    })
                  }
                  placeholder="Status"
                />
              </label>

              <label className="aid-property-inline__field aid-property-inline__field--area">
                {idx === 0 ? (
                  <span className="aid-property-inline__label">Other</span>
                ) : (
                  <span className="aid-property-inline__label aid-property-inline__label--ghost">
                    &nbsp;
                  </span>
                )}
                <input
                  className="aid-property-inline__control"
                  type="text"
                  value={row.resident_ownership_other || ''}
                  onChange={(e) =>
                    updateRow(idx, { resident_ownership_other: e.target.value })
                  }
                  placeholder="Optional"
                />
              </label>

              {isRented ? (
                <label className="aid-property-inline__field aid-property-inline__field--area">
                  {idx === 0 ? (
                    <span className="aid-property-inline__label">
                      {t('rentPkr')}
                    </span>
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
                  <span className="aid-property-inline__label">{t('area')}</span>
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
                  placeholder={t('marla')}
                />
              </label>

              <label className="aid-property-inline__field aid-property-inline__field--details">
                {idx === 0 ? (
                  <span className="aid-property-inline__label">
                    {t('houseDetails')}
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
                  placeholder={t('houseDescPlaceholder')}
                />
              </label>

              <div className="aid-property-inline__actions">
                {rows.length > 1 ? (
                  <button
                    type="button"
                    className="aid-property-row__icon-btn aid-property-row__icon-btn--remove"
                    aria-label={t('removeResidence')}
                    title={t('remove')}
                    onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                  >
                    <FiX />
                  </button>
                ) : null}
                {idx === rows.length - 1 ? (
                  <button
                    type="button"
                    className="aid-property-row__icon-btn aid-property-row__icon-btn--add"
                    aria-label={t('addResidence')}
                    title={t('addResidence')}
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
