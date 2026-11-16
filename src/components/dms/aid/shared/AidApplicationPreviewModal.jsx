import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import AidApplicationPreview from './AidApplicationPreview';
import {
  emptyRecommendation,
  enrichInvestigationFromAttachments,
  mergeInvestigationState,
  normalizeRationOptions,
  normalizeRecommendationDecision,
} from './AidInvestigationPanel';

/**
 * Full formal preview (AidApplicationPreview) in a popup.
 * Loads application detail + family tree when opened.
 */
const AidApplicationPreviewModal = ({
  open,
  applicationId = null,
  onClose,
  onViewDetail,
  canEditMeal = false,
  canEditApproval = false,
  canUnlockSections = false,
}) => {
  const [app, setApp] = useState(null);
  const [familyTree, setFamilyTree] = useState(null);
  const [kinship, setKinship] = useState([]);
  const [investigation, setInvestigation] = useState({});
  const [recommendation, setRecommendation] = useState(emptyRecommendation());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mealSaving, setMealSaving] = useState(false);
  const [approvalSaving, setApprovalSaving] = useState(false);

  useEffect(() => {
    if (!open || !applicationId) {
      setApp(null);
      setFamilyTree(null);
      setKinship([]);
      setInvestigation({});
      setRecommendation(emptyRecommendation());
      setError('');
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const appRes = await axiosInstance.get(
          `/aid/applications/${applicationId}`,
        );
        const payload = appRes.data?.data || null;
        if (cancelled) return;
        setApp(payload);

        const items =
          payload?.investigation_items ||
          payload?.verification_checklist_items ||
          [];
        const merged = mergeInvestigationState(
          items,
          payload?.verification_checklist || {},
        );
        setInvestigation(
          enrichInvestigationFromAttachments(
            items,
            merged,
            payload?.attachments || [],
          ),
        );

        const saved = payload?.investigation_recommendation;
        if (saved && typeof saved === 'object') {
          const ration_options = normalizeRationOptions(saved.ration_options);
          const rawDecision = String(saved.decision || '').trim();
          setRecommendation({
            ...emptyRecommendation(),
            decision: rawDecision
              ? normalizeRecommendationDecision(rawDecision)
              : ration_options.length > 0
                ? 'recommend'
                : '',
            amount: saved.amount ?? '',
            period_months: saved.period_months ?? 6,
            remarks: saved.remarks || '',
            found_monthly_income: saved.found_monthly_income ?? '',
            ration_options,
          });
        } else {
          setRecommendation(emptyRecommendation());
        }

        const beneficiaryId =
          payload?.beneficiary?.id || payload?.beneficiary_person_id;
        if (beneficiaryId) {
          try {
            const peopleRes = await axiosInstance.get(
              `/aid/people/${beneficiaryId}`,
            );
            const peopleData = peopleRes.data?.data || {};
            if (!cancelled) {
              setFamilyTree(peopleData.family_tree || null);
              setKinship(peopleData.kinship || []);
            }
          } catch {
            if (!cancelled) {
              setFamilyTree(null);
              setKinship([]);
            }
          }
        } else {
          setFamilyTree(null);
          setKinship([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Failed to load preview',
          );
          setApp(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, applicationId]);

  if (!open) return null;

  const investigationItems =
    app?.investigation_items?.length > 0
      ? app.investigation_items
      : app?.verification_checklist_items || [];

  const saveMealReview = async (meal) => {
    if (!applicationId || mealSaving || !canEditMeal) return;
    setMealSaving(true);
    try {
      const res = await axiosInstance.patch(
        `/aid/applications/${applicationId}/meal`,
        {
          verification_status: meal?.verification_status || null,
          recommendation_status: meal?.recommendation_status || null,
          remarks: meal?.remarks || null,
          locked: meal?.locked === true,
        },
      );
      const updated = res.data?.data;
      if (updated) setApp(updated);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to save MEAL',
      );
    } finally {
      setMealSaving(false);
    }
  };

  const savePreviewApproval = async (approval) => {
    if (!applicationId || approvalSaving || !canEditApproval) return;
    setApprovalSaving(true);
    try {
      const amountRaw =
        approval?.amount != null && approval.amount !== ''
          ? approval.amount
          : approval?.approved_amount;
      const amount =
        amountRaw === '' || amountRaw == null ? null : Number(amountRaw);
      const res = await axiosInstance.patch(
        `/aid/applications/${applicationId}/preview-approval`,
        {
          decision: approval?.decision || null,
          remarks: approval?.remarks || null,
          ration_options: Array.isArray(approval?.ration_options)
            ? approval.ration_options
            : [],
          amount: Number.isFinite(amount) ? amount : null,
          period_months:
            approval?.period_months != null
              ? Number(approval.period_months)
              : null,
          approved_support: approval?.approved_support || null,
          approved_amount: Number.isFinite(amount) ? amount : null,
          locked: approval?.locked === true,
        },
      );
      const updated = res.data?.data;
      if (updated) setApp(updated);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to save approval',
      );
    } finally {
      setApprovalSaving(false);
    }
  };

  const appNo = app?.application_no || (applicationId ? `#${applicationId}` : '');

  return (
    <div className="aid-rec-modal aid-preview-modal" role="dialog" aria-modal="true">
      <div className="aid-rec-modal__backdrop" onClick={onClose} />
      <div className="aid-rec-modal__panel aid-preview-modal__panel">
        <header className="aid-rec-modal__head">
          <div>
            <h4>Application preview</h4>
            <p className="aid-rec-modal__meta">{appNo || '—'}</p>
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

        <div className="aid-rec-modal__body aid-preview-modal__body">
          {loading ? (
            <div className="aid-preview-modal__loading">Loading preview…</div>
          ) : null}
          {error ? <div className="error-message">{error}</div> : null}
          {!loading && app ? (
            <AidApplicationPreview
              app={app}
              familyTree={familyTree}
              kinship={kinship}
              investigation={investigation}
              investigationItems={investigationItems}
              recommendation={recommendation}
              vulnerability={app.vulnerability || null}
              preparedBy={
                app.created_by
                  ? app.created_by.full_name ||
                    app.created_by.name ||
                    app.created_by.email
                  : undefined
              }
              canEditMeal={canEditMeal}
              onSaveMeal={canEditMeal ? saveMealReview : undefined}
              mealSaving={mealSaving}
              canEditApproval={canEditApproval}
              onSaveApproval={canEditApproval ? savePreviewApproval : undefined}
              approvalSaving={approvalSaving}
              canUnlockSections={canUnlockSections}
              hideToolbar
            />
          ) : null}
          {!loading && !app && !error ? (
            <div className="aid-preview-modal__loading">No application data.</div>
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
              disabled={!applicationId}
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

export default AidApplicationPreviewModal;
