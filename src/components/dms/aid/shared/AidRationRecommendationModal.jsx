import React, { useEffect, useState } from 'react';
import {
  AID_RATION_REC_OPTIONS,
  emptyRecommendation,
  isRecommendationComplete,
  normalizeRationOptions,
} from './AidInvestigationPanel';

/**
 * Popup to edit ration package recommendation (Full / Half / Monthly / Alternate + remarks).
 * mode: 'manager' | 'ceo'
 */
const AidRationRecommendationModal = ({
  open,
  application = null,
  mode = 'ceo',
  busy = false,
  error = '',
  onClose,
  onSave,
  onApprove,
}) => {
  const [draft, setDraft] = useState(emptyRecommendation());

  useEffect(() => {
    if (!open || !application) return;
    const rec = application.investigation_recommendation || {};
    setDraft({
      ...emptyRecommendation(),
      decision: 'approve_as_requested',
      remarks: rec.remarks || '',
      ration_options: normalizeRationOptions(rec.ration_options),
    });
  }, [open, application]);

  if (!open || !application) return null;

  const selected = normalizeRationOptions(draft.ration_options);
  const complete = isRecommendationComplete(draft, { rationOverride: true });
  const remarksLabel =
    mode === 'manager' ? 'Manager remarks' : 'CEO remarks';
  const appNo = application.application_no || `#${application.id}`;
  const beneficiary = application.beneficiary?.full_name || '';

  const buildBody = () => ({
    decision: 'approve_as_requested',
    amount: null,
    period_months: null,
    remarks: String(draft.remarks || '').trim(),
    found_monthly_income: null,
    ration_options: selected,
  });

  const toggleOption = (value) => {
    setDraft((prev) => {
      const cur = normalizeRationOptions(prev.ration_options);
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      return {
        ...prev,
        ration_options: next,
        decision: 'approve_as_requested',
        amount: '',
        period_months: null,
        found_monthly_income: '',
      };
    });
  };

  return (
    <div className="aid-rec-modal" role="dialog" aria-modal="true">
      <div className="aid-rec-modal__backdrop" onClick={busy ? undefined : onClose} />
      <div className="aid-rec-modal__panel">
        <header className="aid-rec-modal__head">
          <div>
            <h4>Ration recommendation</h4>
            <p className="aid-rec-modal__meta">
              {appNo}
              {beneficiary ? ` · ${beneficiary}` : ''}
            </p>
          </div>
          <button
            type="button"
            className="aid-rec-modal__x"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="aid-rec-modal__body">
          <div className="aid-rec-card aid-rec-card--modal">
            <p className="aid-section-hint" style={{ marginTop: 0 }}>
              Select package options and add remarks only.
            </p>
            <div className="aid-rec-options aid-rec-options--checks">
              {AID_RATION_REC_OPTIONS.map((opt) => {
                const on = selected.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`aid-rec-option${on ? ' is-active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={busy}
                      onChange={() => toggleOption(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
            <label className="aid-rec-field">
              <span>{remarksLabel}</span>
              <textarea
                rows={3}
                disabled={busy}
                placeholder="Remarks…"
                value={draft.remarks}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, remarks: e.target.value }))
                }
              />
            </label>
          </div>
          {error ? <p className="aid-rec-modal__error">{error}</p> : null}
        </div>

        <footer className="aid-rec-modal__actions">
          <button
            type="button"
            className="secondary-btn"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          {typeof onSave === 'function' ? (
            <button
              type="button"
              className="secondary-btn secondary-btn--save"
              disabled={busy || !complete}
              onClick={() => onSave(buildBody())}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          ) : null}
          {mode === 'manager' && typeof onApprove === 'function' ? (
            <button
              type="button"
              className="primary-btn"
              disabled={busy || !complete}
              onClick={() => onApprove(buildBody())}
            >
              {busy ? 'Submitting…' : 'Submit to CEO'}
            </button>
          ) : null}
          {mode === 'ceo' && typeof onApprove === 'function' ? (
            <button
              type="button"
              className="primary-btn"
              disabled={busy || !complete}
              onClick={() => onApprove(buildBody())}
            >
              {busy ? 'Approving…' : 'Save & approve'}
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
};

export default AidRationRecommendationModal;
