import React, { useEffect, useState } from 'react';
import {
  AID_RATION_REC_OPTIONS,
  AID_RECOMMENDATION_DECISIONS,
  emptyRecommendation,
  formatRecommendationDecision,
  getRationLayerDecision,
  isRecommendationComplete,
  normalizeRationOptions,
  resolveManagerRecommendation,
} from './AidInvestigationPanel';

const formatPackageLabel = (rec) => {
  const opts = normalizeRationOptions(rec?.ration_options);
  if (!opts.length) return '—';
  return opts
    .map((v) => AID_RATION_REC_OPTIONS.find((o) => o.value === v)?.label || v)
    .join(', ');
};

/**
 * Popup to edit ration package recommendation (Full / Half / Monthly / Alternate + remarks).
 * mode: 'manager' | 'ceo'
 * CEO mode shows Manager Recommendation (read-only) + Final Recommendation editor.
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
    const layer = getRationLayerDecision(rec);
    setDraft({
      ...emptyRecommendation(),
      decision: layer || '',
      remarks: rec.remarks || '',
      ration_options: normalizeRationOptions(rec.ration_options),
    });
  }, [open, application]);

  if (!open || !application) return null;

  const selected = normalizeRationOptions(draft.ration_options);
  const layerDecision = getRationLayerDecision(draft);
  const complete = isRecommendationComplete(draft, { rationOverride: true });
  const remarksLabel =
    mode === 'manager' ? 'Manager remarks' : 'Final remarks';
  const appNo = application.application_no || `#${application.id}`;
  const beneficiary = application.beneficiary?.full_name || '';
  const managerRec = resolveManagerRecommendation(
    application.investigation_recommendation,
  );
  const managerDecision = managerRec
    ? getRationLayerDecision(managerRec)
    : '';

  const buildBody = () => {
    const notRecommend = layerDecision === 'not_recommend';
    return {
      decision: notRecommend ? 'not_recommend' : 'recommend',
      amount: null,
      period_months: null,
      remarks: String(draft.remarks || '').trim(),
      found_monthly_income: null,
      ration_options: notRecommend ? [] : selected,
    };
  };

  const setDecision = (value) => {
    if (value === 'not_recommend') {
      setDraft((prev) => ({
        ...prev,
        decision: 'not_recommend',
        ration_options: [],
        amount: '',
        period_months: null,
        found_monthly_income: '',
      }));
      return;
    }
    setDraft((prev) => ({
      ...prev,
      decision: 'recommend',
      amount: '',
      period_months: null,
      found_monthly_income: '',
    }));
  };

  const toggleOption = (value) => {
    setDraft((prev) => {
      const cur = normalizeRationOptions(prev.ration_options);
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      return {
        ...prev,
        ration_options: next,
        decision: 'recommend',
        amount: '',
        period_months: null,
        found_monthly_income: '',
      };
    });
  };

  return (
    <div className="aid-rec-modal" role="dialog" aria-modal="true">
      <div
        className="aid-rec-modal__backdrop"
        onClick={busy ? undefined : onClose}
      />
      <div className="aid-rec-modal__panel">
        <header className="aid-rec-modal__head">
          <div>
            <h4>
              {mode === 'ceo' ? 'Final recommendation' : 'Ration recommendation'}
            </h4>
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
          {mode === 'ceo' && managerRec ? (
            <div className="aid-rec-card aid-rec-card--modal aid-rec-card--manager">
              <h5 className="aid-rec-card__title">Manager Recommendation</h5>
              <div className="aid-rec-view-row">
                <span className="aid-rec-view-label">Decision</span>
                <strong
                  className={
                    managerDecision === 'not_recommend'
                      ? 'aid-rec-view-value is-bad'
                      : 'aid-rec-view-value'
                  }
                >
                  {managerDecision
                    ? formatRecommendationDecision(managerDecision)
                    : '—'}
                </strong>
              </div>
              {managerDecision !== 'not_recommend' ? (
                <div className="aid-rec-view-row">
                  <span className="aid-rec-view-label">Package</span>
                  <strong className="aid-rec-view-value">
                    {formatPackageLabel(managerRec)}
                  </strong>
                </div>
              ) : null}
              <div className="aid-rec-view-row aid-rec-view-row--block">
                <span className="aid-rec-view-label">Remarks</span>
                <p className="aid-rec-view-remarks">
                  {String(managerRec.remarks || '').trim() || '—'}
                </p>
              </div>
            </div>
          ) : null}

          <div className="aid-rec-card aid-rec-card--modal">
            {mode === 'ceo' ? (
              <h5 className="aid-rec-card__title">Final Recommendation</h5>
            ) : null}
            <p className="aid-section-hint" style={{ marginTop: 0 }}>
              {mode === 'ceo' && managerDecision === 'not_recommend'
                ? 'Manager selected Not Recommend — you may still Recommend and approve.'
                : 'Choose Recommend or Not Recommend first.'}
            </p>
            <div className="aid-rec-options">
              {AID_RECOMMENDATION_DECISIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`aid-rec-option${
                    layerDecision === opt.value ? ' is-active' : ''
                  }${
                    opt.value === 'not_recommend'
                      ? ' aid-rec-option--reject'
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name={`aid-ration-modal-decision-${mode}`}
                    value={opt.value}
                    checked={layerDecision === opt.value}
                    disabled={busy}
                    onChange={() => setDecision(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {layerDecision === 'not_recommend' ? (
              <label className="aid-rec-field">
                <span>{remarksLabel} (optional)</span>
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
            ) : null}

            {layerDecision === 'recommend' ? (
              <>
                <p className="aid-section-hint">
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
                      setDraft((prev) => ({
                        ...prev,
                        remarks: e.target.value,
                      }))
                    }
                  />
                </label>
              </>
            ) : null}
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
