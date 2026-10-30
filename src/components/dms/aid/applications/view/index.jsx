import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiAlertTriangle, FiPrinter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import {
  hasAidPermission,
  isSuperAdmin,
} from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import AidUserAssignField, {
  formatAidUserLabel,
  toAssignableAidUser,
} from '../../shared/AidUserAssignField';
import AidEducationApplicationFields from '../../shared/AidEducationApplicationFields';
import AidRationApplicationFields from '../../shared/AidRationApplicationFields';
import AidMarriageGiftApplicationFields from '../../shared/AidMarriageGiftApplicationFields';
import AidFinancialAssistanceFields from '../../shared/AidFinancialAssistanceFields';
import AidCleanWaterSurveyForm from '../../shared/AidCleanWaterSurveyForm';
import AidZakatPermissionForm from '../../shared/AidZakatPermissionForm';
import AidConsentForm from '../../shared/AidConsentForm';
import AidWheelchairConsentForm from '../../shared/AidWheelchairConsentForm';
import AidMarriageGiftConsentForm from '../../shared/AidMarriageGiftConsentForm';
import AidApplicationPreview from '../../shared/AidApplicationPreview';
import AidCollapsibleSection from '../../shared/AidCollapsibleSection';
import { printAidElement } from '../../shared/printAidElement';
import AidInvestigationPanel, {
  AID_RECOMMENDATION_DECISIONS,
  AID_RECOMMENDATION_PERIODS,
  AID_RATION_REC_OPTIONS,
  emptyRecommendation,
  enrichInvestigationFromAttachments,
  isInvestigationComplete,
  isRecommendationComplete,
  mergeInvestigationState,
  normalizeInvestigationEntry,
  normalizeRationOptions,
} from '../../shared/AidInvestigationPanel';
import AidPersonProfileCard, {
  AidFamilyMemberLine,
  Fact,
} from '../../shared/AidPersonProfileCard';
import {
  AID_CEO_OPTIONS,
  AID_DELIVERY_OPTIONS,
  aidStatusTone,
  formatAidStatus,
  formatAidRequestType,
  formatAidCaseSource,
  formatAidProgramLabel,
  formatExpectedAmount,
  isWheelchairConsentProgram,
  isWheelchairConsentForm,
  isMarriageGiftConsentProgram,
  isMarriageGiftConsentForm,
} from '../../aidConstants';
import { formatAuditActor } from '../../../../common/audit/auditHistoryLabels';
import '../../aid.css';

const isSponsorshipDependent = (notes) =>
  /dependent under (family head|guardian) sponsorship/i.test(String(notes || ''));

const StatusChip = ({ label, value, tone = 'muted' }) => (
  <div className={`aid-status-chip aid-status-chip--${tone}`}>
    <span className="aid-status-chip__label">{label}</span>
    <strong className="aid-status-chip__value">{value || '—'}</strong>
  </div>
);

const AidApplicationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromApprovals = searchParams.get('from') === 'approvals';
  const openCeoAction = searchParams.get('action') === 'approve';
  const { permissions, user } = useAuth();
  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;
  /** Program manager in Program department (or super admin) — can send to CEO / override rec. */
  const isProgramDeptManager =
    isSuperAdmin(permissions) ||
    (!!permissions?.program_manager &&
      String(user?.department || '').toLowerCase() === 'program');
  const canUpdate =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_verification', 'update') ||
    hasAidPermission(permissions, 'aid_applications', 'update');
  /** Reassign case owner — same capability as Consider & assign (not for investigators). */
  const canAssign =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_drafts', 'approve_draft') ||
    hasAidPermission(permissions, 'aid_applications', 'approve_draft');
  const canCeo =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_applications', 'ceo_approve');
  const canDeliver =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_applications', 'deliver');
  /** Mark all complete — also unlocks investigation for non-assignees */
  const hasMarkAllComplete =
    hasAidPermission(permissions, 'aid_verification', 'bulk_verify') ||
    hasAidPermission(permissions, 'aid_applications', 'bulk_verify');
  const canBulkVerify = isSuperAdmin(permissions) || hasMarkAllComplete;

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const zakatPrintRef = useRef(null);
  const consentPrintRef = useRef(null);
  const [panelTab, setPanelTab] = useState('case');
  // Applicant tab removed — keep legacy 'writer' links on Family
  const activePanelTab = panelTab === 'writer' ? 'family' : panelTab;
  const [attachContext, setAttachContext] = useState('verification');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [incompleteOpen, setIncompleteOpen] = useState(false);
  const [incompleteReason, setIncompleteReason] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [investigation, setInvestigation] = useState({});
  const investigationRef = useRef({});
  investigationRef.current = investigation;
  const [recommendation, setRecommendation] = useState(emptyRecommendation);
  const [leakageOverride, setLeakageOverride] = useState('');
  const [ceoDecision, setCeoDecision] = useState('approved');
  const [ceoReason, setCeoReason] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('pending');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [assignedUser, setAssignedUser] = useState(null);
  const [assignSaving, setAssignSaving] = useState(false);
  const [familyTree, setFamilyTree] = useState(null);
  const [kinship, setKinship] = useState([]);
  const [uploadingInvestKey, setUploadingInvestKey] = useState(null);
  const [attachUploading, setAttachUploading] = useState(false);
  const [investSaving, setInvestSaving] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const appRes = await axiosInstance.get(`/aid/applications/${id}`);
      const payload = appRes.data?.data || null;
      setApp(payload);
      setAssignedUser(toAssignableAidUser(payload?.assigned_to));
      {
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
      }
      {
        const saved = payload?.investigation_recommendation;
        if (saved && typeof saved === 'object') {
          setRecommendation({
            ...emptyRecommendation(),
            decision: saved.decision || 'approve_as_requested',
            amount: saved.amount ?? '',
            period_months: saved.period_months ?? 6,
            remarks: saved.remarks || '',
            found_monthly_income: saved.found_monthly_income ?? '',
            ration_options: normalizeRationOptions(saved.ration_options),
          });
        } else {
          setRecommendation(emptyRecommendation());
        }
      }
      setVerifyNotes(payload?.verification_notes || '');
      if (payload?.leakage_override_reason) {
        setLeakageOverride(payload.leakage_override_reason);
      } else {
        setLeakageOverride('');
      }

      const beneficiaryId = payload?.beneficiary?.id || payload?.beneficiary_person_id;
      if (beneficiaryId) {
        try {
          const peopleRes = await axiosInstance.get(`/aid/people/${beneficiaryId}`);
          const peopleData = peopleRes.data?.data || {};
          setFamilyTree(peopleData.family_tree || null);
          setKinship(peopleData.kinship || []);
        } catch {
          setFamilyTree(null);
          setKinship([]);
        }
      } else {
        setFamilyTree(null);
        setKinship([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn) => {
    setBusy(true);
    setActionError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const uploadFile = async (file) => {
    if (!file || !id) return;
    setAttachUploading(true);
    setActionError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('context', attachContext);
      fd.append('description', attachContext);
      const res = await axiosInstance.post(
        `/aid/applications/${id}/attachments/upload`,
        fd,
      );
      const row = res.data?.data;
      if (row?.id) {
        setApp((prev) =>
          prev
            ? {
                ...prev,
                attachments: [row, ...(prev.attachments || [])],
              }
            : prev,
        );
      }
      await load({ silent: true });
      toast.success('Attachment uploaded');
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to upload file';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setAttachUploading(false);
    }
  };

  const uploadInvestigationFile = async (itemKey, fileOrFiles) => {
    const files = (Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles]).filter(
      Boolean,
    );
    if (!files.length || !itemKey) return;
    setUploadingInvestKey(itemKey);
    setActionError('');
    const uploadedRows = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append(
          'context',
          itemKey === 'site_visit' ? 'site_visit' : 'verification',
        );
        fd.append('description', itemKey);
        // eslint-disable-next-line no-await-in-loop
        const res = await axiosInstance.post(
          `/aid/applications/${id}/attachments/upload`,
          fd,
        );
        const row = res.data?.data;
        if (!row?.file_url) {
          throw new Error('Upload succeeded but no file URL returned');
        }
        uploadedRows.push({ row, fallbackName: file.name });
      }
      const prev = normalizeInvestigationEntry(
        investigationRef.current[itemKey],
      );
      const attachments = [...(prev.attachments || [])];
      for (const { row, fallbackName } of uploadedRows) {
        const added = {
          id: row?.id ?? null,
          url: row.file_url,
          name: row.file_name || fallbackName,
        };
        if (
          !attachments.some(
            (f) => f.url === added.url || (f.id != null && f.id === added.id),
          )
        ) {
          attachments.push(added);
        }
      }
      const nextEntry = {
        ...prev,
        status: 'verified',
        attachments,
        attachment_url: attachments[0]?.url || '',
        attachment_name: attachments[0]?.name || '',
        attachment_id: attachments[0]?.id ?? null,
      };
      const nextInvestigation = {
        ...investigationRef.current,
        [itemKey]: nextEntry,
      };
      investigationRef.current = nextInvestigation;
      setInvestigation(nextInvestigation);
      // Persist on checklist so a reload cannot wipe the attachment link.
      await axiosInstance.patch(`/aid/applications/${id}`, {
        verification_checklist: nextInvestigation,
      });
      setApp((prevApp) =>
        prevApp
          ? {
              ...prevApp,
              attachments: [
                ...uploadedRows.map(({ row }) => row).filter((r) => r?.id),
                ...(prevApp.attachments || []),
              ],
              verification_checklist: nextInvestigation,
            }
          : prevApp,
      );
      toast.success(
        uploadedRows.length > 1
          ? `${uploadedRows.length} files attached`
          : 'File attached',
      );
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to upload file';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setUploadingInvestKey(null);
    }
  };

  const currentAssignedId = app?.assigned_to_user_id ?? app?.assigned_to?.id ?? null;
  const nextAssignedId = assignedUser?.id ?? null;
  const assignmentDirty =
    String(currentAssignedId || '') !== String(nextAssignedId || '');
  const isAssignee =
    user?.id != null &&
    currentAssignedId != null &&
    Number(user.id) === Number(currentAssignedId);
  /** Investigation: assignee, super admin, or Mark all complete (bulk_verify) */
  const canInvestigate =
    isSuperAdmin(permissions) || hasMarkAllComplete || isAssignee;

  const saveAssignment = async () => {
    setAssignSaving(true);
    setActionError('');
    try {
      await axiosInstance.patch(`/aid/applications/${id}`, {
        assigned_to_user_id: nextAssignedId ? Number(nextAssignedId) : null,
      });
      await load();
    } catch (err) {
      setActionError(
        err.response?.data?.message || err.message || 'Failed to update assignment',
      );
    } finally {
      setAssignSaving(false);
    }
  };

  const status = app?.status;
  const showCeo = canCeo && status === 'ceo_approval_required';

  useEffect(() => {
    if (!openCeoAction || !showCeo || loading || !app) return;
    const t = window.setTimeout(() => {
      document
        .getElementById('aid-ceo-decision')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => window.clearTimeout(t);
  }, [openCeoAction, showCeo, loading, id, app]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">Loading…</div>
      </>
    );
  }
  if (error || !app) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <div className="error-message">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  const attachments = app.attachments || [];
  const flags = app.duplicate_flags || {};
  const history = app.aid_history || {};
  const needsLeakageOverride =
    !!history.requires_override && !history.override_recorded;
  const leakageOverrideOk =
    !needsLeakageOverride || String(leakageOverride || '').trim().length >= 5;
  const investigationItems =
    app.investigation_items?.length > 0
      ? app.investigation_items
      : app.verification_checklist_items || [];
  const checklistComplete = isInvestigationComplete(
    investigationItems,
    investigation,
  );
  const isRationApp =
    String(app?.requested_aid_type || '').toLowerCase() === 'ration';
  const showManagerForward =
    isProgramDeptManager && status === 'manager_review';
  const showVerify =
    canInvestigate && ['submitted', 'under_review'].includes(status);
  /** Manager / CEO (and Program manager → CEO) ration edit: checkboxes + remarks only */
  const rationOverrideEdit =
    isRationApp &&
    (showManagerForward ||
      showCeo ||
      (showVerify && isProgramDeptManager) ||
      status === 'manager_review' ||
      status === 'ceo_approval_required');
  const recommendationComplete = isRecommendationComplete(recommendation, {
    rationOverride: !!rationOverrideEdit,
  });

  const buildRecommendationBody = () => {
    const ration_options = normalizeRationOptions(recommendation.ration_options);
    if (isRationApp && rationOverrideEdit) {
      return {
        decision: 'approve_as_requested',
        amount: null,
        period_months: null,
        remarks: recommendation.remarks,
        found_monthly_income: null,
        ration_options,
      };
    }
    return {
      decision: recommendation.decision,
      amount:
        recommendation.decision === 'reject'
          ? null
          : Number(recommendation.amount),
      period_months: Number(recommendation.period_months) || null,
      remarks: recommendation.remarks,
      found_monthly_income: recommendation.found_monthly_income
        ? Number(recommendation.found_monthly_income)
        : null,
      ration_options,
    };
  };

  const saveInvestigationProgress = async () => {
    if (!id || investSaving) return;
    setInvestSaving(true);
    setActionError('');
    try {
      await axiosInstance.patch(`/aid/applications/${id}`, {
        verification_notes: verifyNotes || recommendation.remarks || undefined,
        verification_checklist: investigation,
        investigation_recommendation: {
          decision: recommendation.decision,
          amount:
            recommendation.decision === 'reject'
              ? null
              : recommendation.amount !== '' &&
                  recommendation.amount != null
                ? Number(recommendation.amount)
                : null,
          period_months: Number(recommendation.period_months) || null,
          remarks: recommendation.remarks || '',
          found_monthly_income: recommendation.found_monthly_income
            ? Number(recommendation.found_monthly_income)
            : null,
          ration_options: normalizeRationOptions(recommendation.ration_options),
        },
      });
      await load({ silent: true });
      toast.success('Investigation progress saved');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to save investigation progress';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setInvestSaving(false);
    }
  };
  const showReject =
    canUpdate &&
    !['successful', 'delivered', 'rejected', 'incomplete', 'incomplete_docs', 'draft'].includes(
      status,
    );
  const showMarkIncomplete =
    canUpdate &&
    ![
      'draft',
      'incomplete',
      'incomplete_docs',
      'successful',
      'delivered',
      'rejected',
    ].includes(status);
  const showResumeIncomplete =
    canUpdate && (status === 'incomplete' || status === 'incomplete_docs');
  const submitLabel = isProgramDeptManager
    ? 'Submit for Approvals to CEO'
    : 'Submit for Manager Review';
  const showDelivery = canDeliver && (status === 'successful' || status === 'delivered');
  const tabAtt = attachments.filter((a) => a.context === attachContext);
  const verifiedByName = app.verified_by
    ? [app.verified_by.first_name, app.verified_by.last_name].filter(Boolean).join(' ') ||
      app.verified_by.email
    : null;

  const formatWhen = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString();
    } catch {
      return String(d);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-content aid-view">
        <PageHeader
          title={app.application_no}
          backPath={
            fromApprovals
              ? '/dms/aid/applications/approvals'
              : '/dms/aid/applications/list'
          }
          onBackClick={() =>
            navigate(
              fromApprovals
                ? '/dms/aid/applications/approvals'
                : '/dms/aid/applications/list',
            )
          }
          showAdd={false}
        />

        {actionError && <div className="error-message">{actionError}</div>}

        <div className="aid-hero">
          <div>
            <h2 style={{ margin: '0 0 6px' }}>{app.title || 'Aid application'}</h2>
            <p style={{ margin: 0, color: '#64748b' }}>{app.request_summary || 'No summary'}</p>
          </div>
          <div className="aid-entry-view__hero-actions">
            <span className={`aid-status-pill aid-status-pill--${aidStatusTone(status)}`}>
              {formatAidStatus(status)}
            </span>
            {canUpdate &&
            status !== 'rejected' &&
            status !== 'delivered' ? (
              <button
                type="button"
                className="primary-btn"
                onClick={() =>
                  navigate(`/dms/aid/applications/edit/${app.id}`)
                }
              >
                Edit
              </button>
            ) : null}
            {showMarkIncomplete ? (
              <button
                type="button"
                className="secondary-btn"
                disabled={busy}
                onClick={() => {
                  setIncompleteOpen(true);
                  setRejectOpen(false);
                }}
              >
                Mark Incomplete
              </button>
            ) : null}
            {showResumeIncomplete ? (
              <button
                type="button"
                className="primary-btn"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    axiosInstance.post(
                      `/aid/applications/${id}/resume-incomplete`,
                    ),
                  )
                }
              >
                Resume to verification
              </button>
            ) : null}
          </div>
        </div>

        {history.requires_override && (
          <div className="aid-leak-banner">
            <strong>Aid history / leakage control</strong>
            {(history.reasons || []).length > 0 && (
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                {history.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <div className="aid-leak-pills">
              {history.already_received_this_year && (
                <span className="aid-status-pill aid-status-pill--danger">
                  Already received this year ({history.calendar_year})
                </span>
              )}
              {history.within_cooldown && (
                <span className="aid-status-pill aid-status-pill--warn">
                  Within {history.cooldown_days}-day cooldown
                  {history.days_since_last_success != null
                    ? ` · ${history.days_since_last_success}d since last`
                    : ''}
                </span>
              )}
              {history.override_recorded && (
                <span className="aid-status-pill aid-status-pill--info">
                  Override recorded
                </span>
              )}
            </div>
            {(history.person_successful || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Beneficiary prior successful aids</em>
                <ul>
                  {history.person_successful.map((a) => (
                    <li key={`ps-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {` · ${formatAidStatus(a.status)} · ${a.requested_aid_type || '—'}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(history.household_successful || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Household prior successful aids</em>
                <ul>
                  {history.household_successful.map((a) => (
                    <li key={`hs-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {` · ${a.beneficiary_name || '—'} · ${formatAidStatus(a.status)}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {app.leakage_override_reason && (
              <p style={{ fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                Override reason: {app.leakage_override_reason}
              </p>
            )}
            {needsLeakageOverride && (showVerify || (showCeo && ceoDecision === 'approved')) && (
              <div style={{ marginTop: 12 }}>
                <FormTextarea
                  label="Leakage override reason (required to proceed)"
                  value={leakageOverride}
                  onChange={(e) => setLeakageOverride(e.target.value)}
                  rows={2}
                  placeholder="Explain why this case should proceed despite cooldown / same-year aid…"
                />
              </div>
            )}
          </div>
        )}

        {!history.requires_override &&
          ((history.person_successful || []).length > 0 ||
            (history.household_successful || []).length > 0) && (
            <div className="aid-history-banner">
              <strong>Aid history</strong>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>
                Prior successful aids found, outside cooldown / same-year block.
              </p>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                {[...(history.person_successful || []), ...(history.household_successful || [])]
                  .slice(0, 8)
                  .map((a) => (
                    <li key={`hist-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {a.beneficiary_name ? ` · ${a.beneficiary_name}` : ''}
                      {` · ${formatAidStatus(a.status)}`}
                    </li>
                  ))}
              </ul>
            </div>
          )}

        {flags.has_flags && (
          <div className="aid-dup-banner">
            <strong>Duplicate / prior-aid flags</strong>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>
              Review these before checking “Duplicate / prior-aid flags reviewed”.
            </p>
            {(flags.cnic_matches || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Same CNIC</em>
                <ul>
                  {flags.cnic_matches.map((p) => (
                    <li key={`cnic-${p.id}`}>
                      <Link to={`/dms/aid/people/view/${p.id}`}>{p.full_name}</Link>
                      {p.cnic ? ` · ${p.cnic}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(flags.phone_matches || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Same phone</em>
                <ul>
                  {flags.phone_matches.map((p) => (
                    <li key={`phone-${p.id}`}>
                      <Link to={`/dms/aid/people/view/${p.id}`}>{p.full_name}</Link>
                      {p.phone ? ` · ${p.phone}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(flags.address_matches || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Similar address</em>
                <ul>
                  {flags.address_matches.map((p) => (
                    <li key={`addr-${p.id}`}>
                      <Link to={`/dms/aid/people/view/${p.id}`}>{p.full_name}</Link>
                      {p.address ? ` · ${p.address}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(flags.prior_applications || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Prior / related applications</em>
                <ul>
                  {flags.prior_applications.map((a) => (
                    <li key={`app-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {` · ${formatAidStatus(a.status)}`}
                      {a.beneficiary_name ? ` · ${a.beneficiary_name}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="aid-panel aid-panel--view">
          <div className="aid-tabs aid-tabs--main" role="tablist">
            {[
              { id: 'case', label: 'Case details' },
              { id: 'beneficiary', label: 'Beneficiary' },
              { id: 'family', label: 'Family' },
              { id: 'attachments', label: 'Attachments' },
              { id: 'preview', label: 'Preview' },
              { id: 'field_process', label: 'Field process' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activePanelTab === t.id}
                className={`aid-tab ${activePanelTab === t.id ? 'aid-tab--active' : ''}`}
                onClick={() => setPanelTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="aid-panel__body">
            {activePanelTab === 'case' && (
              <section className="aid-section aid-section--flush">
                <div className="aid-status-chip-row">
                  <StatusChip
                    label="Program"
                    value={formatAidRequestType(app.requested_aid_type)}
                    tone="info"
                  />
                  <StatusChip
                    label="SubProgram"
                    value={formatAidProgramLabel(app.aid_program)}
                    tone="muted"
                  />
                  <StatusChip
                    label="Expected Amount"
                    value={formatExpectedAmount(app)}
                    tone="info"
                  />
                  <StatusChip
                    label="CEO"
                    value={app.ceo_approval_status || '—'}
                    tone={
                      String(app.ceo_approval_status || '').includes('approv')
                        ? 'success'
                        : String(app.ceo_approval_status || '').includes('reject')
                          ? 'danger'
                          : 'muted'
                    }
                  />
                  <StatusChip
                    label="Delivery"
                    value={app.delivery_status || '—'}
                    tone={
                      app.delivery_status === 'delivered'
                        ? 'success'
                        : app.delivery_status === 'pending'
                          ? 'warn'
                          : 'muted'
                    }
                  />
                  <StatusChip
                    label="Status"
                    value={formatAidStatus(status)}
                    tone={aidStatusTone(status) || 'muted'}
                  />
                </div>

                <div className="aid-fact-grid aid-fact-grid--case">
                  <Fact label="Case source">
                    {formatAidCaseSource(app.case_source)}
                  </Fact>
                  <Fact label="Created by">
                    {app.created_by ? formatAuditActor(app.created_by) : '—'}
                  </Fact>
                  <Fact label="Assigned to">
                    {app.assigned_to
                      ? formatAidUserLabel(app.assigned_to)
                      : '—'}
                  </Fact>
                  <Fact label="Applicant">
                    {app.writer ? (
                      <Link to={`/dms/aid/people/view/${app.writer.id}`}>
                        {app.writer.full_name}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </Fact>
                  <Fact label="Applicant relation">
                    {app.writer_relation
                      ? String(app.writer_relation).replace(/_/g, ' ')
                      : '—'}
                  </Fact>
                </div>

                {canAssign &&
                  status !== 'rejected' &&
                  status !== 'delivered' && (
                  <div className="aid-assign-block">
                    <div className="aid-assign-block__head">
                      <h4>Case assignment</h4>
                      <p>Change who owns this case, then save.</p>
                    </div>
                    <div className="aid-assign-row">
                      <AidUserAssignField
                        value={assignedUser}
                        onChange={setAssignedUser}
                        hint=""
                      />
                      <div className="aid-assign-actions">
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={busy || assignSaving || !assignmentDirty}
                          onClick={saveAssignment}
                        >
                          {assignSaving ? 'Saving…' : 'Save assignment'}
                        </button>
                        {assignedUser && (
                          <button
                            type="button"
                            className="secondary-btn"
                            disabled={busy || assignSaving}
                            onClick={() => setAssignedUser(null)}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {app.rejection_reason && (
                  <p className="aid-alert aid-alert--danger">
                    Rejection: {app.rejection_reason}
                  </p>
                )}
                {app.ceo_rejection_reason && (
                  <p className="aid-alert aid-alert--danger">
                    CEO rejection: {app.ceo_rejection_reason}
                  </p>
                )}
                {app.requested_aid_type === 'education' &&
                  app.education_details && (
                    <div className="aid-detail-block">
                      <AidEducationApplicationFields
                        value={app.education_details}
                        readOnly
                      />
                    </div>
                  )}
                {app.requested_aid_type === 'ration' && app.ration_details && (
                  <div className="aid-detail-block">
                    <AidRationApplicationFields
                      value={app.ration_details}
                      readOnly
                    />
                  </div>
                )}
                {app.requested_aid_type === 'marriage_gift' &&
                  app.marriage_gift_details && (
                    <div className="aid-detail-block">
                      <AidMarriageGiftApplicationFields
                        value={app.marriage_gift_details}
                        readOnly
                      />
                    </div>
                  )}
                {app.requested_aid_type === 'financial_assistance' &&
                  app.financial_assistance_details && (
                    <div className="aid-detail-block">
                      <AidFinancialAssistanceFields
                        value={app.financial_assistance_details}
                        readOnly
                      />
                    </div>
                  )}
                {app.requested_aid_type === 'clean_water' &&
                  app.clean_water_details && (
                    <div className="aid-detail-block">
                      <AidCleanWaterSurveyForm
                        value={app.clean_water_details}
                        applicationNo={app.application_no}
                        readOnly
                      />
                    </div>
                  )}
                <AidCollapsibleSection
                  className="aid-detail-block"
                  title="Zakat Permission Letter"
                  hint="Attached to every application"
                  actions={
                    <button
                      type="button"
                      className="aid-png-download-btn"
                      title="Print"
                      aria-label="Print"
                      onClick={() => printAidElement(zakatPrintRef.current)}
                    >
                      <FiPrinter size={18} />
                    </button>
                  }
                >
                  <div ref={zakatPrintRef}>
                    <AidZakatPermissionForm
                      value={app.zakat_permission || {}}
                      applicationNo={app.application_no}
                      readOnly
                    />
                  </div>
                </AidCollapsibleSection>
                <AidCollapsibleSection
                  className="aid-detail-block"
                  title={
                    isWheelchairConsentProgram(app.aid_program) ||
                    isWheelchairConsentForm(app.consent_form)
                      ? 'Wheelchair Affidavit / Consent'
                      : isMarriageGiftConsentProgram(
                            app.requested_aid_type,
                            app.aid_program,
                          ) || isMarriageGiftConsentForm(app.consent_form)
                        ? 'Marriage Gift Receipt / Consent'
                        : 'Consent Form'
                  }
                  hint="Attached to every application"
                  actions={
                    <button
                      type="button"
                      className="aid-png-download-btn"
                      title="Print"
                      aria-label="Print"
                      onClick={() => printAidElement(consentPrintRef.current)}
                    >
                      <FiPrinter size={18} />
                    </button>
                  }
                >
                  <div ref={consentPrintRef}>
                    {isWheelchairConsentProgram(app.aid_program) ||
                    isWheelchairConsentForm(app.consent_form) ? (
                      <AidWheelchairConsentForm
                        value={app.consent_form || {}}
                        applicationNo={app.application_no}
                        readOnly
                      />
                    ) : isMarriageGiftConsentProgram(
                        app.requested_aid_type,
                        app.aid_program,
                      ) || isMarriageGiftConsentForm(app.consent_form) ? (
                      <AidMarriageGiftConsentForm
                        value={app.consent_form || {}}
                        applicationNo={app.application_no}
                        readOnly
                      />
                    ) : (
                      <AidConsentForm
                        value={
                          app.consent_form || {
                            variant: 'media',
                          }
                        }
                        applicationNo={app.application_no}
                        readOnly
                      />
                    )}
                  </div>
                </AidCollapsibleSection>
              </section>
            )}

            {activePanelTab === 'beneficiary' && (
              <section className="aid-section aid-section--flush">
                <AidPersonProfileCard
                  person={app.beneficiary}
                  title="Beneficiary"
                  attachments={attachments}
                  roles={{
                    beneficiary: true,
                    applicant:
                      !app.writer ||
                      app.writer.id === app.beneficiary?.id ||
                      String(app.writer_relation || '').toLowerCase() ===
                        'self',
                  }}
                />
              </section>
            )}

            {activePanelTab === 'family' && (
              <section className="aid-section aid-section--flush">
                {app.writer &&
                app.writer.id !== app.beneficiary?.id &&
                String(app.writer_relation || '').toLowerCase() !== 'self' ? (
                  <div className="aid-family-block" style={{ marginBottom: 14 }}>
                    <h4 className="aid-family-block__title">Applicant</h4>
                    <AidPersonProfileCard
                      person={app.writer}
                      title="Applicant"
                      relation={app.writer_relation}
                      attachments={attachments}
                      roles={{ applicant: true }}
                    />
                  </div>
                ) : null}
                {(() => {
                  const tree = familyTree || {};
                  const groups = [
                    { key: 'parents', label: 'Parents / Family head' },
                    { key: 'spouse', label: 'Spouse' },
                    { key: 'children', label: 'Children' },
                    { key: 'brothers', label: 'Brothers' },
                    { key: 'sisters', label: 'Sisters' },
                    { key: 'siblings', label: 'Siblings' },
                    { key: 'extended', label: 'Guardians / extended' },
                  ];
                  const fromTree = groups.flatMap((g) =>
                    (tree[g.key] || []).map((row) => ({
                      ...row,
                      group: g.label,
                    })),
                  );
                  const dependents = (kinship || []).filter((e) =>
                    isSponsorshipDependent(e.notes),
                  );
                  const dependentIds = new Set(
                    dependents.map((e) => e.to_person_id || e.to_person?.id),
                  );
                  const core = fromTree.filter(
                    (row) => !dependentIds.has(row.person?.id),
                  );

                  if (!core.length && !dependents.length) {
                    return (
                      <p className="aid-empty-note">
                        No family members linked yet.
                      </p>
                    );
                  }

                  return (
                    <div className="aid-family-groups">
                      {groups.map((g) => {
                        const rows = core.filter((r) => r.group === g.label);
                        if (!rows.length) return null;
                        return (
                          <div key={g.key} className="aid-family-block">
                            <h4 className="aid-family-block__title">{g.label}</h4>
                            <ul className="aid-family-list">
                              {rows.map((row) => (
                                <AidFamilyMemberLine
                                  key={`fam-${row.edge_id || row.person?.id}`}
                                  person={row.person}
                                  relation={row.relation_type}
                                  notes={row.notes}
                                />
                              ))}
                            </ul>
                          </div>
                        );
                      })}

                      {dependents.length > 0 && (
                        <div className="aid-family-block">
                          <h4 className="aid-family-block__title">
                            Others under sponsorship / dependents
                          </h4>
                          <ul className="aid-family-list">
                            {dependents.map((edge) => {
                              const egoId =
                                app.beneficiary?.id || app.beneficiary_person_id;
                              const person =
                                edge.from_person_id === egoId
                                  ? edge.to_person
                                  : edge.from_person || edge.to_person;
                              return (
                                <AidFamilyMemberLine
                                  key={`dep-${edge.id}`}
                                  person={person}
                                  relation={edge.relation_type}
                                  notes={edge.notes}
                                />
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </section>
            )}

            {activePanelTab === 'attachments' && (
              <section className="aid-section aid-section--flush">
                <div className="aid-attach-tabs">
                  {[
                    'verification',
                    'site_visit',
                    'mepco_bill',
                    'cnic',
                    'bay_form',
                    'death_certificate',
                    'marriage_certificate',
                    'education_certificate',
                    'e_stamp_paper',
                    'zakat',
                    'consent',
                    'delivery',
                    'profile',
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`aid-attach-tab ${attachContext === t ? 'is-active' : ''}`}
                      onClick={() => setAttachContext(t)}
                    >
                      {String(t).replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                {canUpdate && (
                  <label className="aid-attach-upload">
                    <span>
                      {attachUploading
                        ? 'Uploading…'
                        : `Upload file (${String(attachContext).replace(/_/g, ' ')})`}
                    </span>
                    <input
                      type="file"
                      disabled={attachUploading || busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadFile(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
                {tabAtt.length === 0 ? (
                  <p className="aid-empty-note">
                    No {attachContext} attachments.
                  </p>
                ) : (
                  <ul className="aid-attach-list">
                    {tabAtt.map((a) => (
                      <li
                        key={a.id}
                        className={a.is_missing ? 'is-missing' : undefined}
                      >
                        <div className="aid-attach-list__meta">
                          <a href={a.file_url} target="_blank" rel="noreferrer">
                            {a.file_name}
                          </a>
                          {a.is_missing ? (
                            <span className="aid-attach-missing-badge">
                              Missing
                            </span>
                          ) : null}
                        </div>
                        {canUpdate && (
                          <div className="aid-attach-list__actions">
                            <button
                              type="button"
                              className={`aid-attach-missing-btn${a.is_missing ? ' is-on' : ''}`}
                              title={
                                a.is_missing
                                  ? 'Clear missing flag'
                                  : 'Mark as missing (sets Incomplete Docs)'
                              }
                              aria-label={
                                a.is_missing
                                  ? 'Clear missing flag'
                                  : 'Mark attachment as missing'
                              }
                              disabled={busy}
                              onClick={() =>
                                run(async () => {
                                  await axiosInstance.patch(
                                    `/aid/applications/attachments/${a.id}/missing`,
                                    { is_missing: !a.is_missing },
                                  );
                                  if (!a.is_missing) {
                                    toast.info(
                                      'Marked missing — status set to Incomplete Docs',
                                    );
                                  }
                                })
                              }
                            >
                              <FiAlertTriangle aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="secondary-btn"
                              style={{ padding: '2px 8px', fontSize: 12 }}
                              onClick={() =>
                                run(() =>
                                  axiosInstance.delete(
                                    `/aid/applications/attachments/${a.id}`,
                                  ),
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {activePanelTab === 'preview' && (
              <AidApplicationPreview
                app={app}
                familyTree={familyTree}
                kinship={kinship}
                investigation={investigation}
                investigationItems={investigationItems}
                recommendation={recommendation}
                vulnerability={
                  app.vulnerability ||
                  (app.investigation_recommendation
                    ?.vulnerability_after_visit
                    ? {
                        declared:
                          app.investigation_recommendation
                            .vulnerability_declared,
                        after_visit:
                          app.investigation_recommendation
                            .vulnerability_after_visit,
                        deltas:
                          app.investigation_recommendation
                            .vulnerability_deltas || [],
                      }
                    : null)
                }
                preparedBy={
                  app.created_by
                    ? formatAuditActor(app.created_by)
                    : undefined
                }
              />
            )}

            {(showVerify ||
              app.verification_checklist ||
              investigationItems.length > 0) &&
              activePanelTab !== 'attachments' &&
              activePanelTab !== 'preview' && (
              <section className="aid-section aid-section--flush aid-section--investigation">
                {(() => {
                  const investigationBlock = (
                    <>
                      {activePanelTab === 'case' &&
                        (app.verified_at || verifiedByName) && (
                          <p
                            style={{
                              fontSize: 13,
                              color: '#64748b',
                              marginTop: 0,
                            }}
                          >
                            Verified by: {verifiedByName || '—'} · At:{' '}
                            {formatWhen(app.verified_at)}
                          </p>
                        )}
                      {!showVerify &&
                      ['submitted', 'under_review'].includes(status) ? (
                        <p className="aid-section-hint">
                          Investigation can only be performed by the assigned
                          user, a super admin, or someone with Mark all complete
                          permission.
                        </p>
                      ) : null}
                      <AidInvestigationPanel
                        items={investigationItems}
                        value={investigation}
                        onChange={setInvestigation}
                        disabled={!showVerify || busy}
                        recommendationEditable={
                          (showManagerForward || showCeo) && !busy
                        }
                        aidType={app.requested_aid_type}
                        rationPackageMode={!!rationOverrideEdit}
                        remarksLabel={
                          showCeo
                            ? 'CEO remarks'
                            : showManagerForward ||
                                (showVerify && isProgramDeptManager)
                              ? 'Manager remarks'
                              : 'Investigator remarks'
                        }
                        canBulkVerify={canBulkVerify}
                        onUploadItemFile={uploadInvestigationFile}
                        uploadingKey={uploadingInvestKey}
                        activeTab={activePanelTab}
                        vulnerability={
                          app.vulnerability ||
                          (app.investigation_recommendation
                            ?.vulnerability_after_visit
                            ? {
                                declared:
                                  app.investigation_recommendation
                                    .vulnerability_declared,
                                after_visit:
                                  app.investigation_recommendation
                                    .vulnerability_after_visit,
                                deltas:
                                  app.investigation_recommendation
                                    .vulnerability_deltas || [],
                              }
                            : null)
                        }
                        recommendation={recommendation}
                        onRecommendationChange={setRecommendation}
                        submitLabel={submitLabel}
                        includeChecklistGaps={showVerify}
                        extraMissingSteps={
                          needsLeakageOverride && !leakageOverrideOk
                            ? [
                                'Leakage override: enter a reason (min 5 characters) before submit',
                              ]
                            : []
                        }
                        onSaveProgress={
                          showVerify ? saveInvestigationProgress : undefined
                        }
                        saveProgressBusy={investSaving}
                        saveProgressDisabled={busy || investSaving}
                        submitDisabled={
                          busy ||
                          investSaving ||
                          !recommendationComplete ||
                          !leakageOverrideOk ||
                          (showVerify && !checklistComplete)
                        }
                        onSubmitReport={
                          activePanelTab === 'field_process' &&
                          (showVerify || showManagerForward)
                            ? () =>
                                run(() =>
                                  showManagerForward
                                    ? axiosInstance.post(
                                        `/aid/applications/${id}/manager-forward`,
                                        {
                                          recommendation:
                                            buildRecommendationBody(),
                                          leakage_override_reason:
                                            needsLeakageOverride
                                              ? leakageOverride.trim()
                                              : undefined,
                                        },
                                      )
                                    : axiosInstance.post(
                                        `/aid/applications/${id}/verify`,
                                        {
                                          verification_notes:
                                            verifyNotes ||
                                            recommendation.remarks ||
                                            undefined,
                                          verification_checklist: investigation,
                                          recommendation:
                                            buildRecommendationBody(),
                                          leakage_override_reason:
                                            needsLeakageOverride
                                              ? leakageOverride.trim()
                                              : undefined,
                                        },
                                      ),
                                )
                            : undefined
                        }
                      />
                      {activePanelTab === 'field_process' &&
                        showManagerForward && (
                          <p
                            style={{
                              fontSize: 12,
                              color: '#166534',
                              marginBottom: 0,
                            }}
                          >
                            You can overwrite the investigator recommendation
                            before submitting for CEO approval.
                          </p>
                        )}
                      {activePanelTab === 'field_process' &&
                        !showVerify &&
                        !showManagerForward &&
                        app.verification_notes && (
                          <p style={{ fontSize: 13, color: '#64748b' }}>
                            Notes: {app.verification_notes}
                          </p>
                        )}
                      {activePanelTab === 'field_process' &&
                        !showVerify &&
                        !showManagerForward &&
                        app.investigation_recommendation?.decision && (
                          <p
                            style={{
                              fontSize: 13,
                              color: '#166534',
                              marginTop: 8,
                            }}
                          >
                            Recommendation:{' '}
                            {normalizeRationOptions(
                              app.investigation_recommendation.ration_options,
                            ).length > 0
                              ? normalizeRationOptions(
                                  app.investigation_recommendation
                                    .ration_options,
                                )
                                  .map(
                                    (v) =>
                                      AID_RATION_REC_OPTIONS.find(
                                        (o) => o.value === v,
                                      )?.label || v,
                                  )
                                  .join(', ')
                              : String(
                                  app.investigation_recommendation.decision,
                                ).replace(/_/g, ' ')}
                            {app.investigation_recommendation.amount != null
                              ? ` · PKR ${app.investigation_recommendation.amount}`
                              : ''}
                            {app.investigation_recommendation.period_months
                              ? ` · ${app.investigation_recommendation.period_months} months`
                              : ''}
                          </p>
                        )}
                    </>
                  );

                  if (activePanelTab === 'case') {
                    return (
                      <AidCollapsibleSection
                        title="Verification"
                        hint="Click to expand checklist"
                        defaultOpen={false}
                        className="aid-detail-block"
                      >
                        {investigationBlock}
                      </AidCollapsibleSection>
                    );
                  }

                  return investigationBlock;
                })()}
              </section>
            )}
          </div>
        </div>

        {(showReject || showCeo || showDelivery) && (
          <div
            id="aid-ceo-decision"
            className={`aid-cta-strip${showCeo ? ' aid-ceo-panel' : ''}`}
          >
            {showReject && !showVerify && (
              <button
                type="button"
                className="secondary-btn secondary-btn--danger"
                disabled={busy}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </button>
            )}
            {showCeo && (
              <>
                <FormSelect
                  label="CEO decision"
                  value={ceoDecision}
                  onChange={(e) => setCeoDecision(e.target.value)}
                  options={AID_CEO_OPTIONS}
                />
                {ceoDecision === 'rejected' ? (
                  <FormTextarea
                    label="CEO rejection reason"
                    value={ceoReason}
                    onChange={(e) => setCeoReason(e.target.value)}
                    rows={2}
                  />
                ) : null}
                <div className="aid-rec-card" style={{ marginTop: 8 }}>
                  <h4 className="aid-rec-card__title">
                    {isRationApp
                      ? 'Ration recommendation (editable)'
                      : 'Recommendation (editable)'}
                  </h4>
                  {isRationApp ? (
                    <>
                      <p className="aid-section-hint" style={{ marginTop: 0 }}>
                        Select package options and add remarks only.
                      </p>
                      <div className="aid-rec-options aid-rec-options--checks">
                        {AID_RATION_REC_OPTIONS.map((opt) => {
                          const selected = normalizeRationOptions(
                            recommendation.ration_options,
                          ).includes(opt.value);
                          return (
                            <label
                              key={opt.value}
                              className={`aid-rec-option${
                                selected ? ' is-active' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                disabled={busy}
                                onChange={() => {
                                  const cur = normalizeRationOptions(
                                    recommendation.ration_options,
                                  );
                                  const next = selected
                                    ? cur.filter((v) => v !== opt.value)
                                    : [...cur, opt.value];
                                  setRecommendation((prev) => ({
                                    ...prev,
                                    ration_options: next,
                                    decision: 'approve_as_requested',
                                    amount: '',
                                    period_months: null,
                                    found_monthly_income: '',
                                  }));
                                }}
                              />
                              <span>{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      <label className="aid-rec-field">
                        <span>Remarks</span>
                        <textarea
                          rows={3}
                          disabled={busy}
                          placeholder="Remarks…"
                          value={recommendation.remarks}
                          onChange={(e) =>
                            setRecommendation((prev) => ({
                              ...prev,
                              remarks: e.target.value,
                            }))
                          }
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <div className="aid-rec-options">
                        {AID_RECOMMENDATION_DECISIONS.map((opt) => (
                          <label
                            key={opt.value}
                            className={`aid-rec-option${
                              recommendation.decision === opt.value
                                ? ' is-active'
                                : ''
                            }${
                              opt.value === 'reject'
                                ? ' aid-rec-option--reject'
                                : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="aid-ceo-rec-decision"
                              value={opt.value}
                              checked={recommendation.decision === opt.value}
                              disabled={busy}
                              onChange={() =>
                                setRecommendation((prev) => ({
                                  ...prev,
                                  decision: opt.value,
                                }))
                              }
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                      {recommendation.decision !== 'reject' ? (
                        <div className="aid-rec-grid">
                          <label className="aid-rec-field">
                            <span>Amount (PKR)</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={recommendation.amount}
                              disabled={busy}
                              onChange={(e) =>
                                setRecommendation((prev) => ({
                                  ...prev,
                                  amount: e.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="aid-rec-field">
                            <span>Period</span>
                            <select
                              value={recommendation.period_months}
                              disabled={busy}
                              onChange={(e) =>
                                setRecommendation((prev) => ({
                                  ...prev,
                                  period_months: Number(e.target.value),
                                }))
                              }
                            >
                              {AID_RECOMMENDATION_PERIODS.map((p) => (
                                <option key={p.value} value={p.value}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      ) : null}
                      <label className="aid-rec-field">
                        <span>Remarks</span>
                        <textarea
                          rows={3}
                          disabled={busy}
                          value={recommendation.remarks}
                          onChange={(e) =>
                            setRecommendation((prev) => ({
                              ...prev,
                              remarks: e.target.value,
                            }))
                          }
                        />
                      </label>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className="primary-btn"
                  disabled={
                    busy ||
                    (ceoDecision === 'approved' &&
                      (!recommendationComplete || !leakageOverrideOk))
                  }
                  onClick={() =>
                    run(() =>
                      axiosInstance.post(`/aid/applications/${id}/ceo-decide`, {
                        decision: ceoDecision,
                        ceo_rejection_reason:
                          ceoDecision === 'rejected'
                            ? ceoReason || 'Rejected by CEO'
                            : undefined,
                        leakage_override_reason:
                          ceoDecision === 'approved' && needsLeakageOverride
                            ? leakageOverride.trim()
                            : undefined,
                        recommendation: buildRecommendationBody(),
                      }),
                    )
                  }
                >
                  {ceoDecision === 'approved'
                    ? 'Approve application'
                    : 'Record CEO decision'}
                </button>
              </>
            )}
            {showDelivery && (
              <>
                <FormSelect
                  label="Delivery status"
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                  options={AID_DELIVERY_OPTIONS}
                />
                <button
                  type="button"
                  className="primary-btn"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      axiosInstance.post(`/aid/applications/${id}/delivery`, {
                        delivery_status: deliveryStatus,
                        delivery_notes: deliveryNotes || undefined,
                      }),
                    )
                  }
                >
                  Update delivery
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={busy}
                  onClick={() =>
                    navigate(
                      `/dms/aid/disbursements/list?application_id=${id}`,
                    )
                  }
                >
                  Open disbursements
                </button>
              </>
            )}
          </div>
        )}

        {showCeo && ceoDecision === 'rejected' && (
          <FormTextarea
            label="CEO rejection reason"
            value={ceoReason}
            onChange={(e) => setCeoReason(e.target.value)}
            rows={2}
          />
        )}
        {showDelivery && (
          <FormTextarea
            label="Delivery notes"
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            rows={2}
          />
        )}
        {rejectOpen && (
          <div className="aid-card" style={{ marginBottom: 16 }}>
            <FormTextarea
              label="Rejection reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              required
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="primary-btn aid-btn--danger-solid"
                disabled={busy || !rejectReason.trim()}
                onClick={() => {
                  const reason = rejectReason.trim();
                  setRejectOpen(false);
                  run(() =>
                    axiosInstance.post(`/aid/applications/${id}/reject`, {
                      rejection_reason: reason,
                    }),
                  );
                }}
              >
                Confirm reject
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {incompleteOpen && (
          <div className="aid-card" style={{ marginBottom: 16 }}>
            <FormTextarea
              label="Incomplete reason (optional)"
              value={incompleteReason}
              onChange={(e) => setIncompleteReason(e.target.value)}
              rows={3}
              placeholder="What details are missing?"
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="primary-btn"
                disabled={busy}
                onClick={() => {
                  const reason = incompleteReason.trim();
                  setIncompleteOpen(false);
                  run(() =>
                    axiosInstance.post(
                      `/aid/applications/${id}/mark-incomplete`,
                      reason ? { reason } : {},
                    ),
                  );
                }}
              >
                Confirm Incomplete
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setIncompleteOpen(false);
                  setIncompleteReason('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    </>
  );
};

export default AidApplicationView;
