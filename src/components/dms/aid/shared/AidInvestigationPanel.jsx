import React from 'react';

const STATUSES = [
  { value: 'verified', label: 'Verified' },
  { value: 'mismatch', label: 'Mismatch' },
  { value: 'not_checked', label: 'Not checked' },
];

export const normalizeInvestigationEntry = (value) => {
  if (value === true || value === 'verified') {
    return { status: 'verified', note: '' };
  }
  if (value === 'mismatch') {
    return { status: 'mismatch', note: '' };
  }
  if (value && typeof value === 'object') {
    const statusRaw = String(value.status || '').toLowerCase();
    const status =
      statusRaw === 'verified' || statusRaw === 'mismatch'
        ? statusRaw
        : value.checked === true
          ? 'verified'
          : 'not_checked';
    return {
      status,
      note: String(value.note || value.notes || value.found || ''),
    };
  }
  return { status: 'not_checked', note: '' };
};

export const emptyInvestigationState = (items = []) =>
  Object.fromEntries(
    (items || []).map((item) => [
      item.key,
      normalizeInvestigationEntry(null),
    ]),
  );

export const mergeInvestigationState = (items = [], saved = {}) => {
  const base = emptyInvestigationState(items);
  if (!saved || typeof saved !== 'object') return base;
  for (const item of items) {
    if (saved[item.key] !== undefined) {
      base[item.key] = normalizeInvestigationEntry(saved[item.key]);
    }
  }
  return base;
};

export const isInvestigationComplete = (items = [], state = {}) =>
  (items || []).every((item) => {
    const entry = normalizeInvestigationEntry(state[item.key]);
    const allowMismatch = item.allow_mismatch !== false && item.kind !== 'process';
    if (!allowMismatch) return entry.status === 'verified';
    if (!item.required) {
      if (entry.status === 'mismatch') {
        return String(entry.note || '').trim().length >= 3;
      }
      return true;
    }
    if (entry.status === 'verified') return true;
    if (entry.status === 'mismatch') {
      return String(entry.note || '').trim().length >= 3;
    }
    return false;
  });

/**
 * Dynamic field investigation — Verified / Mismatch / Not checked per declared claim.
 */
const AidInvestigationPanel = ({
  items = [],
  value = {},
  onChange,
  disabled = false,
  title = 'Verify what was declared',
  hint = 'Each claim from intake, checked on site. A mismatch needs a note.',
}) => {
  const list = Array.isArray(items) ? items : [];
  const claims = list.filter((i) => i.kind !== 'process');
  const process = list.filter((i) => i.kind === 'process');

  const setEntry = (key, next) => {
    onChange({
      ...value,
      [key]: {
        ...normalizeInvestigationEntry(value[key]),
        ...next,
      },
    });
  };

  const renderRow = (item) => {
    const entry = normalizeInvestigationEntry(value[item.key]);
    const allowMismatch =
      item.allow_mismatch !== false && item.kind !== 'process';
    const statuses = allowMismatch
      ? STATUSES
      : STATUSES.filter((s) => s.value !== 'mismatch');

    return (
      <div
        key={item.key}
        className={`aid-invest-row${
          entry.status === 'mismatch' ? ' aid-invest-row--mismatch' : ''
        }${entry.status === 'verified' ? ' aid-invest-row--ok' : ''}`}
      >
        <div className="aid-invest-row__main">
          <div className="aid-invest-row__label">
            {item.label}
            {item.required ? (
              <span className="aid-invest-row__req"> *</span>
            ) : null}
          </div>
          {item.declared ? (
            <div className="aid-invest-row__declared">
              <span className="aid-invest-row__declared-k">Declared</span>
              {item.declared}
            </div>
          ) : (
            <div className="aid-invest-row__declared aid-invest-row__declared--muted">
              Process check — confirm on site
            </div>
          )}
          {entry.status === 'mismatch' && entry.note ? (
            <div className="aid-invest-row__found">Found: {entry.note}</div>
          ) : null}
          {entry.status === 'mismatch' && !disabled ? (
            <label className="aid-invest-row__note">
              <span>Found (required)</span>
              <textarea
                rows={2}
                value={entry.note}
                disabled={disabled}
                placeholder="What did you find on site?"
                onChange={(e) =>
                  setEntry(item.key, { status: 'mismatch', note: e.target.value })
                }
              />
            </label>
          ) : null}
        </div>
        <div className="aid-invest-status" role="group" aria-label={item.label}>
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              disabled={disabled}
              className={`aid-invest-status__btn aid-invest-status__btn--${s.value}${
                entry.status === s.value ? ' is-active' : ''
              }`}
              onClick={() =>
                setEntry(item.key, {
                  status: s.value,
                  note: s.value === 'mismatch' ? entry.note : '',
                })
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (!list.length) {
    return (
      <section className="aid-investigation">
        <h3 className="aid-investigation__title">{title}</h3>
        <p className="aid-section-hint">No investigation claims available yet.</p>
      </section>
    );
  }

  return (
    <section className="aid-investigation">
      <h3 className="aid-investigation__title">{title}</h3>
      {hint ? <p className="aid-investigation__hint">{hint}</p> : null}

      {claims.length > 0 ? (
        <div className="aid-invest-list">{claims.map(renderRow)}</div>
      ) : null}

      {process.length > 0 ? (
        <>
          <h4 className="aid-investigation__sub">Field process</h4>
          <div className="aid-invest-list">{process.map(renderRow)}</div>
        </>
      ) : null}
    </section>
  );
};

export default AidInvestigationPanel;
