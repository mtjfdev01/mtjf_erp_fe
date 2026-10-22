import React, { useMemo } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import {
  AID_LIVESTOCK_ANIMALS,
  AID_LIVESTOCK_OWNERSHIP,
  AID_YES_NO,
  emptyLivestockRow,
} from '../aidConstants';
import { useAidLang } from '../lang/AidLangContext';
import { aidOptionsForLang } from '../lang/aidUiCopy';

/**
 * Livestock — one line when Yes:
 * Livestock? | Type | Qty | Ownership | (Owner / Contact if sharing) | +
 */
const AidLivestockIntake = ({ value, onChange, title }) => {
  const { t, lang } = useAidLang();
  const panelTitle = title ?? t('livestock');
  const yesNoOptions = useMemo(
    () => aidOptionsForLang(AID_YES_NO, lang),
    [lang],
  );
  const animalTypes = useMemo(
    () => aidOptionsForLang(AID_LIVESTOCK_ANIMALS, lang),
    [lang],
  );
  const ownershipOptions = useMemo(
    () => aidOptionsForLang(AID_LIVESTOCK_OWNERSHIP, lang),
    [lang],
  );

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
      {panelTitle ? (
        <h4 className="aid-family-panel__title">{panelTitle}</h4>
      ) : null}

      {!hasLivestock ? (
        <div className="aid-property-inline aid-property-inline--land-only">
          <label className="aid-property-inline__field">
            <span className="aid-property-inline__label">
              {t('haveLivestock')}
            </span>
            <select
              className="aid-property-inline__control"
              value="no"
              onChange={onHasChange}
            >
              {yesNoOptions.map((o) => (
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
                      {t('livestockQ')}
                    </span>
                    <select
                      className="aid-property-inline__control"
                      value="yes"
                      onChange={onHasChange}
                    >
                      {yesNoOptions.map((o) => (
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
                      {t('type')} <span className="required-mark">*</span>
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
                    {animalTypes.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="aid-property-inline__field aid-property-inline__field--area">
                  {idx === 0 ? (
                    <span className="aid-property-inline__label">
                      {t('qty')} <span className="required-mark">*</span>
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
                    <span className="aid-property-inline__label">
                      {t('ownership')}
                    </span>
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
                    {ownershipOptions.map((o) => (
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
                          {t('ownerName')}
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
                        placeholder={t('ownerName')}
                      />
                    </label>
                    <label className="aid-property-inline__field aid-property-inline__field--area">
                      {idx === 0 ? (
                        <span className="aid-property-inline__label">
                          {t('contact')}
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
                      aria-label={t('removeAnimal')}
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
                      aria-label={t('addAnimal')}
                      title={t('addAnimal')}
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
