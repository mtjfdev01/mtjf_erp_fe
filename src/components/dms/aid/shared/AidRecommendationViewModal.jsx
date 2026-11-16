import React from 'react';
import {
  AID_RATION_REC_OPTIONS,
  formatRecommendationDecision,
  formatRecommendationPeriod,
  getRationLayerDecision,
  isNegativeRecommendation,
  normalizeRationOptions,
  resolveManagerRecommendation,
} from './AidInvestigationPanel';

const formatRationOptions = (rec) => {
  const opts = normalizeRationOptions(rec?.ration_options);
  if (!opts.length) return '';
  return opts
    .map((v) => AID_RATION_REC_OPTIONS.find((o) => o.value === v)?.label || v)
    .join(', ');
};

const RecBlock = ({ title, rec, isRation }) => {
  if (!rec) {
    return (
      <div className="aid-rec-card aid-rec-card--modal">
        <h5 className="aid-rec-card__title">{title}</h5>
        <p className="aid-section-hint" style={{ marginTop: 0 }}>
          No recommendation recorded.
        </p>
      </div>
    );
  }

  const layerDecision = isRation
    ? getRationLayerDecision(rec)
    : formatRecommendationDecision(rec.decision);
  const decisionLabel = isRation
    ? layerDecision === 'not_recommend'
      ? 'Not Recommend'
      : layerDecision === 'recommend'
        ? 'Recommend'
        : formatRecommendationDecision(rec.decision)
    : formatRecommendationDecision(rec.decision);
  const negative = isNegativeRecommendation(
    isRation ? layerDecision : rec.decision,
  );
  const rationOptions = formatRationOptions(rec);

  return (
    <div className="aid-rec-card aid-rec-card--modal">
      <h5 className="aid-rec-card__title">{title}</h5>
      <div className="aid-rec-view-row">
        <span className="aid-rec-view-label">Decision</span>
        <strong
          className={
            negative ? 'aid-rec-view-value is-bad' : 'aid-rec-view-value'
          }
        >
          {decisionLabel && decisionLabel !== '—' ? decisionLabel : '—'}
        </strong>
      </div>

      {isRation && rationOptions ? (
        <div className="aid-rec-view-row">
          <span className="aid-rec-view-label">Package</span>
          <strong className="aid-rec-view-value">{rationOptions}</strong>
        </div>
      ) : null}

      {!isRation && !negative && rec?.amount != null && rec.amount !== '' ? (
        <div className="aid-rec-view-row">
          <span className="aid-rec-view-label">Amount</span>
          <strong className="aid-rec-view-value">
            PKR {Number(rec.amount).toLocaleString()}
          </strong>
        </div>
      ) : null}

      {!isRation && !negative && rec?.period_months != null ? (
        <div className="aid-rec-view-row">
          <span className="aid-rec-view-label">Period</span>
          <strong className="aid-rec-view-value">
            {formatRecommendationPeriod(rec.period_months)}
          </strong>
        </div>
      ) : null}

      <div className="aid-rec-view-row aid-rec-view-row--block">
        <span className="aid-rec-view-label">Remarks</span>
        <p className="aid-rec-view-remarks">
          {String(rec?.remarks || '').trim() || '—'}
        </p>
      </div>
    </div>
  );
};

/**
 * Read-only popup to inspect manager + final recommendations from listings.
 */
const AidRecommendationViewModal = ({
  open,
  application = null,
  onClose,
  onViewDetail,
}) => {
  if (!open || !application) return null;

  const rec = application.investigation_recommendation || {};
  const isRation =
    String(application.requested_aid_type || '').toLowerCase() === 'ration';
  const appNo = application.application_no || `#${application.id}`;
  const beneficiary = application.beneficiary?.full_name || '';
  const managerRec = resolveManagerRecommendation(rec);
  const finalRec = {
    decision: rec.decision ?? null,
    amount: rec.amount ?? null,
    period_months: rec.period_months ?? null,
    remarks: rec.remarks ?? null,
    ration_options: normalizeRationOptions(rec.ration_options),
  };
  const showFinalSeparately =
    !!rec.ceo_edited_at ||
    (managerRec &&
      (String(managerRec.decision || '') !== String(finalRec.decision || '') ||
        formatRationOptions(managerRec) !== formatRationOptions(finalRec) ||
        String(managerRec.remarks || '').trim() !==
          String(finalRec.remarks || '').trim()));

  return (
    <div className="aid-rec-modal" role="dialog" aria-modal="true">
      <div className="aid-rec-modal__backdrop" onClick={onClose} />
      <div className="aid-rec-modal__panel">
        <header className="aid-rec-modal__head">
          <div>
            <h4>Recommendation</h4>
            <p className="aid-rec-modal__meta">
              {appNo}
              {beneficiary ? ` · ${beneficiary}` : ''}
            </p>
          </div>
          <button
            type="button"
            className="aid-rec-modal__x"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="aid-rec-modal__body">
          <RecBlock
            title="Manager Recommendation"
            rec={managerRec}
            isRation={isRation}
          />
          {showFinalSeparately ? (
            <RecBlock
              title="Final Recommendation"
              rec={finalRec}
              isRation={isRation}
            />
          ) : null}
        </div>

        <footer className="aid-rec-modal__actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
          {typeof onViewDetail === 'function' ? (
            <button
              type="button"
              className="primary-btn"
              onClick={onViewDetail}
            >
              View application in detail
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
};

export default AidRecommendationViewModal;
