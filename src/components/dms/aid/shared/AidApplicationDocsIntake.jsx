import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiPlus, FiX } from 'react-icons/fi';
import {
  AID_APPLICATION_DOC_TYPES,
  normalizeApplicationDocSlot,
  cnicFilesToPairs,
  cnicPairsToFiles,
} from '../aidConstants';
import { useAidLang } from '../lang/AidLangContext';

/**
 * Optional application document uploads (create / edit intake).
 * value: {
 *   [context]: { file, name, url? }           // single-file slots
 *            | { files: [{ file, name, url?, side?, pair? }] } // multi-file slots
 * }
 * missingKeys: string[] of context keys flagged missing → Incomplete Docs
 */
const AidApplicationDocsIntake = ({
  value = {},
  onChange,
  missingKeys = [],
  onToggleMissing,
  disabled = false,
}) => {
  const { t, lang } = useAidLang();
  const missingSet = new Set(
    (Array.isArray(missingKeys) ? missingKeys : []).map((k) =>
      String(k || '').toLowerCase(),
    ),
  );
  const filledCnicPairs = cnicFilesToPairs(
    normalizeApplicationDocSlot(value.cnic),
  );
  const [cnicPairCount, setCnicPairCount] = useState(
    () => Math.max(1, filledCnicPairs.length),
  );

  useEffect(() => {
    const n = cnicFilesToPairs(normalizeApplicationDocSlot(value.cnic)).length;
    setCnicPairCount((prev) => Math.max(prev, n, 1));
  }, [value.cnic]);

  const setSlot = (key, next) => {
    if (disabled || !onChange) return;
    onChange({ ...value, [key]: next });
  };

  const addFiles = (doc, fileList) => {
    const incoming = Array.from(fileList || []).filter(Boolean);
    if (!incoming.length) return;
    const mapped = incoming.map((file) => ({ file, name: file.name }));
    if (doc.multiple) {
      const prev = normalizeApplicationDocSlot(value[doc.value]);
      setSlot(doc.value, { files: [...prev, ...mapped] });
    } else {
      setSlot(doc.value, mapped[0]);
    }
  };

  const removeAt = (doc, idx) => {
    if (doc.multiple) {
      const next = normalizeApplicationDocSlot(value[doc.value]).filter(
        (_, i) => i !== idx,
      );
      setSlot(doc.value, next.length ? { files: next } : null);
    } else {
      setSlot(doc.value, null);
    }
  };

  const getCnicPairs = () => {
    const pairs = cnicFilesToPairs(normalizeApplicationDocSlot(value.cnic));
    const padded = pairs.map((p) => ({ ...p }));
    while (padded.length < cnicPairCount) {
      padded.push({ front: null, back: null });
    }
    return padded.slice(0, Math.max(cnicPairCount, 1));
  };

  const setCnicPairs = (pairs) => {
    const files = cnicPairsToFiles(pairs);
    setSlot('cnic', files.length ? { files } : null);
  };

  const setCnicSide = (pairIdx, side, file) => {
    const pairs = getCnicPairs().map((p) => ({ ...p }));
    while (pairs.length <= pairIdx) {
      pairs.push({ front: null, back: null });
    }
    pairs[pairIdx] = {
      ...pairs[pairIdx],
      [side]: file ? { file, name: file.name, side, pair: pairIdx } : null,
    };
    setCnicPairCount(Math.max(cnicPairCount, pairs.length, 1));
    setCnicPairs(pairs);
  };

  const addCnicPair = () => {
    setCnicPairCount((n) => n + 1);
  };

  const removeCnicPair = (pairIdx) => {
    const pairs = getCnicPairs().filter((_, i) => i !== pairIdx);
    const next = pairs.length ? pairs : [{ front: null, back: null }];
    setCnicPairCount(Math.max(1, next.length));
    setCnicPairs(next);
  };

  const docTitle = (doc) =>
    lang === 'ur' && doc.labelUr ? doc.labelUr : doc.label;

  const renderMissingToggle = (docKey) => {
    if (!onToggleMissing) return null;
    const isMissing = missingSet.has(String(docKey).toLowerCase());
    return (
      <button
        type="button"
        className={`aid-app-docs__missing-btn${isMissing ? ' is-on' : ''}`}
        title={
          isMissing
            ? 'Clear missing flag'
            : 'Mark as missing (Incomplete Docs)'
        }
        aria-label={
          isMissing
            ? `Clear missing for ${docKey}`
            : `Mark ${docKey} as missing`
        }
        aria-pressed={isMissing}
        disabled={disabled}
        onClick={() => onToggleMissing(docKey)}
      >
        <FiAlertTriangle aria-hidden size={15} />
        <span>{isMissing ? 'Missing' : 'Mark missing'}</span>
      </button>
    );
  };

  const renderSideSlot = (pairIdx, side, slot) => {
    const label = side === 'front' ? t('cnicFront') : t('cnicBack');
    const fileLabel = slot?.name || slot?.file?.name || '';
    return (
      <div className="aid-app-docs__side">
        <span className="aid-app-docs__side-label">{label}</span>
        {slot ? (
          <div className="aid-app-docs__file aid-app-docs__file--side">
            {slot?.url ? (
              <a href={slot.url} target="_blank" rel="noreferrer">
                {fileLabel || label}
              </a>
            ) : (
              <span>{fileLabel || label}</span>
            )}
            {!disabled ? (
              <button
                type="button"
                className="aid-mini-btn aid-mini-btn--remove"
                onClick={() => setCnicSide(pairIdx, side, null)}
              >
                {t('remove')}
              </button>
            ) : null}
          </div>
        ) : !disabled ? (
          <label className="aid-app-docs__upload">
            <span>{t('chooseFile')}</span>
            <input
              type="file"
              disabled={disabled}
              accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setCnicSide(pairIdx, side, file);
                e.target.value = '';
              }}
            />
          </label>
        ) : (
          <span className="aid-app-docs__side-empty">—</span>
        )}
      </div>
    );
  };

  const renderFrontBackSlot = (doc) => {
    const pairs = getCnicPairs();
    const canRemovePair =
      pairs.length > 1 || pairs.some((p) => p.front || p.back);
    const isMissing = missingSet.has(String(doc.value).toLowerCase());

    return (
      <div
        key={doc.value}
        className={`aid-app-docs__slot aid-app-docs__slot--cnic${isMissing ? ' is-missing' : ''}`}
      >
        <div className="aid-app-docs__slot-head">
          <strong>{docTitle(doc)}</strong>
          <div className="aid-app-docs__slot-head-right">
            {renderMissingToggle(doc.value)}
            <span>{t('frontBack')}</span>
          </div>
        </div>

        <div className="aid-app-docs__pairs">
          {pairs.map((pair, pairIdx) => (
            <div key={`cnic-pair-${pairIdx}`} className="aid-app-docs__pair">
              <div className="aid-app-docs__pair-head">
                <span className="aid-app-docs__pair-title">
                  {t('cnicPair', { n: pairIdx + 1 })}
                </span>
                {!disabled && canRemovePair ? (
                  <button
                    type="button"
                    className="aid-app-docs__pair-remove"
                    title={t('remove')}
                    aria-label={t('remove')}
                    onClick={() => removeCnicPair(pairIdx)}
                  >
                    <FiX size={16} />
                  </button>
                ) : null}
              </div>
              <div className="aid-app-docs__pair-sides">
                {renderSideSlot(pairIdx, 'front', pair.front)}
                {renderSideSlot(pairIdx, 'back', pair.back)}
              </div>
            </div>
          ))}
        </div>

        {!disabled ? (
          <button
            type="button"
            className="aid-app-docs__add-pair"
            onClick={addCnicPair}
            title={t('addCnicPair')}
            aria-label={t('addCnicPair')}
          >
            <FiPlus size={18} />
            <span>{t('addCnicPair')}</span>
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="aid-app-docs">
      <p className="aid-section-hint">
        {t('docsHint')} {t('docsHintDetail')} Use the warning icon on a slot to
        mark that document as missing (status → Incomplete Docs).
      </p>
      <div className="aid-app-docs__grid">
        {AID_APPLICATION_DOC_TYPES.map((doc) => {
          if (doc.frontBack) {
            return renderFrontBackSlot(doc);
          }

          const files = normalizeApplicationDocSlot(value[doc.value]);
          const isMissing = missingSet.has(String(doc.value).toLowerCase());
          const showUpload =
            !disabled && (doc.multiple || files.length === 0);
          return (
            <div
              key={doc.value}
              className={`aid-app-docs__slot${isMissing ? ' is-missing' : ''}`}
            >
              <div className="aid-app-docs__slot-row">
                <strong className="aid-app-docs__slot-title">
                  {docTitle(doc)}
                </strong>
                {showUpload ? (
                  <label className="aid-app-docs__upload aid-app-docs__upload--inline">
                    <span>
                      {doc.multiple
                        ? files.length
                          ? t('addMoreFiles')
                          : t('chooseFiles')
                        : t('chooseFile')}
                    </span>
                    <input
                      type="file"
                      disabled={disabled}
                      multiple={!!doc.multiple}
                      accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                      onChange={(e) => {
                        addFiles(doc, e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                ) : null}
                <div className="aid-app-docs__slot-head-right">
                  {renderMissingToggle(doc.value)}
                  <span>
                    {doc.multiple ? t('multiple') : t('optional')}
                  </span>
                </div>
              </div>

              {files.length ? (
                <ul className="aid-app-docs__file-list">
                  {files.map((slot, idx) => {
                    const label =
                      slot?.name ||
                      slot?.file?.name ||
                      t('fileN', { n: idx + 1 });
                    return (
                      <li
                        key={`${doc.value}-${idx}-${label}`}
                        className="aid-app-docs__file"
                      >
                        {slot?.url ? (
                          <a href={slot.url} target="_blank" rel="noreferrer">
                            {label}
                          </a>
                        ) : (
                          <span>{label}</span>
                        )}
                        {!disabled ? (
                          <button
                            type="button"
                            className="aid-mini-btn aid-mini-btn--remove"
                            onClick={() => removeAt(doc, idx)}
                          >
                            {t('remove')}
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AidApplicationDocsIntake;
