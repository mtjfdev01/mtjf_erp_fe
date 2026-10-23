import React, { useMemo } from 'react';
import { AID_BISP_STATUS, AID_NECTA_STATUS } from '../aidConstants';
import { useAidLang } from '../lang/AidLangContext';
import { aidOptionsForLang } from '../lang/aidUiCopy';

/**
 * NECTA / BISP — single line: NECTA status | BISP eligible (no attachments)
 */
const AidEligibilityStatus = ({ value, onChange, title }) => {
  const { t, lang } = useAidLang();
  const panelTitle = title ?? t('nectaBisp');
  const nectaOptions = useMemo(
    () => aidOptionsForLang(AID_NECTA_STATUS, lang),
    [lang],
  );
  const bispOptions = useMemo(
    () => aidOptionsForLang(AID_BISP_STATUS, lang),
    [lang],
  );

  const patch = (partial) => onChange({ ...value, ...partial });

  return (
    <div className="aid-eligibility-status">
      {panelTitle ? (
        <h4 className="aid-family-panel__title">{panelTitle}</h4>
      ) : null}
      <div className="aid-property-inline">
        <label className="aid-property-inline__field aid-property-inline__field--type">
          <span className="aid-property-inline__label">{t('nectaStatus')}</span>
          <select
            className="aid-property-inline__control"
            value={value?.necta_status || ''}
            onChange={(e) => patch({ necta_status: e.target.value })}
          >
            <option value="">{t('dash')}</option>
            {nectaOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="aid-property-inline__field aid-property-inline__field--type">
          <span className="aid-property-inline__label">{t('bispEligible')}</span>
          <select
            className="aid-property-inline__control"
            value={value?.bisp_status || ''}
            onChange={(e) => patch({ bisp_status: e.target.value })}
          >
            <option value="">{t('dash')}</option>
            {bispOptions.map((o) => (
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
