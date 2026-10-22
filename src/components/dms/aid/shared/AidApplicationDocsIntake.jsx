import React from 'react';
import {
  AID_APPLICATION_DOC_TYPES,
  normalizeApplicationDocSlot,
} from '../aidConstants';
import { useAidLang } from '../lang/AidLangContext';

/**
 * Optional application document uploads (create / edit intake).
 * value: {
 *   [context]: { file, name, url? }           // single-file slots
 *            | { files: [{ file, name, url? }] } // multi-file slots
 * }
 */
const AidApplicationDocsIntake = ({
  value = {},
  onChange,
  disabled = false,
}) => {
  const { t, lang } = useAidLang();

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

  const docTitle = (doc) =>
    lang === 'ur' && doc.labelUr ? doc.labelUr : doc.label;

  return (
    <div className="aid-app-docs">
      <p className="aid-section-hint">
        {t('docsHint')} {t('docsHintDetail')}
      </p>
      <div className="aid-app-docs__grid">
        {AID_APPLICATION_DOC_TYPES.map((doc) => {
          const files = normalizeApplicationDocSlot(value[doc.value]);
          return (
            <div key={doc.value} className="aid-app-docs__slot">
              <div className="aid-app-docs__slot-head">
                <strong>{docTitle(doc)}</strong>
                <span>
                  {doc.multiple ? t('multiple') : t('optional')}
                </span>
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

              {!disabled && (doc.multiple || files.length === 0) ? (
                <label className="aid-app-docs__upload">
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AidApplicationDocsIntake;
