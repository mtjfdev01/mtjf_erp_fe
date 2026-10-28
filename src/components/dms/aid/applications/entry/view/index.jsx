import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiPrinter } from 'react-icons/fi';
import axiosInstance from '../../../../../../utils/axios';
import { useAuth } from '../../../../../../context/AuthContext';
import { hasAidPermission } from '../../../../../../utils/permissions';
import Navbar from '../../../../../Navbar';
import PageHeader from '../../../../../common/PageHeader';
import AidEducationApplicationFields from '../../../shared/AidEducationApplicationFields';
import AidRationApplicationFields from '../../../shared/AidRationApplicationFields';
import AidMarriageGiftApplicationFields from '../../../shared/AidMarriageGiftApplicationFields';
import AidFinancialAssistanceFields from '../../../shared/AidFinancialAssistanceFields';
import AidCleanWaterSurveyForm from '../../../shared/AidCleanWaterSurveyForm';
import AidZakatPermissionForm from '../../../shared/AidZakatPermissionForm';
import AidConsentForm from '../../../shared/AidConsentForm';
import AidWheelchairConsentForm from '../../../shared/AidWheelchairConsentForm';
import AidMarriageGiftConsentForm from '../../../shared/AidMarriageGiftConsentForm';
import AidCollapsibleSection from '../../../shared/AidCollapsibleSection';
import AidPersonProfileCard, {
  AidFamilyMemberLine,
  Fact,
} from '../../../shared/AidPersonProfileCard';
import AidFamilyTreePanel from '../../../shared/AidFamilyTreePanel';
import AidUserAssignField from '../../../shared/AidUserAssignField';
import AidApplicationPrintable from '../../../shared/AidApplicationPrintable';
import AidApplicationPreview from '../../../shared/AidApplicationPreview';
import AidInvestigationPanel, {
  AID_RATION_REC_OPTIONS,
  emptyRecommendation,
  enrichInvestigationFromAttachments,
  mergeInvestigationState,
  normalizeRationOptions,
} from '../../../shared/AidInvestigationPanel';
import { printAidElement } from '../../../shared/printAidElement';
import {
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
} from '../../../aidConstants';
import { formatAuditActor } from '../../../../../common/audit/auditHistoryLabels';
import '../../../aid.css';

const isSponsorshipDependent = (notes) =>
  /dependent under (family head|guardian) sponsorship/i.test(
    String(notes || ''),
  );

const ENTRY_TABS_BASE = [
  { id: 'application', label: 'Application' },
  { id: 'beneficiary', label: 'Beneficiary' },
  { id: 'family', label: 'Family' },
  { id: 'family_tree', label: 'Family Tree' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'preview', label: 'Preview' },
  { id: 'printable', label: 'Printable' },
  { id: 'verification', label: 'Verification' },
];

const FAMILY_GROUPS = [
  { key: 'parents', label: 'Parents / Family head' },
  { key: 'spouse', label: 'Spouse' },
  { key: 'children', label: 'Children' },
  { key: 'brothers', label: 'Brothers' },
  { key: 'sisters', label: 'Sisters' },
  { key: 'siblings', label: 'Siblings' },
  { key: 'extended', label: 'Guardians / extended' },
];

/**
 * Simple read-only view of entered application data (no investigation workflow).
 */
const AidEntryApplicationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromDrafts = location.pathname.includes('/drafts/');
  const listPath = fromDrafts
    ? '/dms/aid/applications/drafts/list'
    : '/dms/aid/applications/entry/list';
  const { permissions } = useAuth();
  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;
  const canApproveDraft =
    hasAidPermission(permissions, 'aid_drafts', 'approve_draft') ||
    hasAidPermission(permissions, 'aid_applications', 'approve_draft') ||
    isStaffElevated;

  const [app, setApp] = useState(null);
  const [familyTree, setFamilyTree] = useState(null);
  const [kinship, setKinship] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [panelTab, setPanelTab] = useState('application');
  const [approving, setApproving] = useState(false);
  const [assignUser, setAssignUser] = useState(null);
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [investigationItems, setInvestigationItems] = useState([]);
  const [investigation, setInvestigation] = useState({});
  const [recommendation, setRecommendation] = useState(emptyRecommendation);
  const [vulnerability, setVulnerability] = useState(null);
  const zakatPrintRef = useRef(null);
  const consentPrintRef = useRef(null);

  const applyVerificationPayload = useCallback((payload) => {
    if (!payload) return;
    const items =
      payload.investigation_items ||
      payload.verification_checklist_items ||
      [];
    setInvestigationItems(items);
    const merged = mergeInvestigationState(
      items,
      payload.verification_checklist || {},
    );
    setInvestigation(
      enrichInvestigationFromAttachments(
        items,
        merged,
        payload.attachments || [],
      ),
    );
    const saved = payload.investigation_recommendation || {};
    setRecommendation({
      ...emptyRecommendation(),
      decision: saved.decision || 'approve_as_requested',
      amount: saved.amount ?? '',
      period_months: saved.period_months ?? 6,
      remarks: saved.remarks || '',
      found_monthly_income: saved.found_monthly_income ?? '',
      ration_options: normalizeRationOptions(saved.ration_options),
    });
    setVulnerability(
      payload.vulnerability ||
        (saved.vulnerability_after_visit
          ? {
              declared: saved.vulnerability_declared,
              after_visit: saved.vulnerability_after_visit,
              deltas: saved.vulnerability_deltas || [],
            }
          : null),
    );
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const appRes = await axiosInstance.get(`/aid/applications/${id}`);
      const payload = appRes.data?.data || null;
      setApp(payload);
      applyVerificationPayload(payload);

      const beneficiaryId =
        payload?.beneficiary?.id || payload?.beneficiary_person_id;
      if (beneficiaryId) {
        try {
          const peopleRes = await axiosInstance.get(
            `/aid/people/${beneficiaryId}`,
          );
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
  }, [id, applyVerificationPayload]);

  const loadVerification = useCallback(async () => {
    if (!id) return;
    try {
      setVerificationLoading(true);
      setVerificationError('');
      const appRes = await axiosInstance.get(`/aid/applications/${id}`);
      const payload = appRes.data?.data || null;
      if (payload) {
        setApp(payload);
        applyVerificationPayload(payload);
      }
    } catch (err) {
      setVerificationError(
        err.response?.data?.message || 'Failed to load verification data',
      );
    } finally {
      setVerificationLoading(false);
    }
  }, [id, applyVerificationPayload]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (panelTab !== 'verification' && panelTab !== 'preview') return;
    loadVerification();
  }, [panelTab, loadVerification]);

  const approveDraft = async () => {
    if (!canApproveDraft || !app?.id) return;
    if (!assignUser?.id) {
      setError('Select a program department user to assign before approving.');
      setShowApprovePanel(true);
      return;
    }
    try {
      setApproving(true);
      setError('');
      const res = await axiosInstance.post(
        `/aid/applications/${app.id}/approve-draft`,
        { assigned_to_user_id: Number(assignUser.id) },
      );
      setApp(res.data?.data || app);
      setShowApprovePanel(false);
      setAssignUser(null);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to approve draft application',
      );
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content aid-view">
          <p>Loading…</p>
        </div>
      </>
    );
  }

  if (error || !app) {
    return (
      <>
        <Navbar />
        <div className="form-content aid-view">
          <PageHeader
            title={fromDrafts ? 'Data Entry' : 'Application'}
            backPath={listPath}
            onBackClick={() => navigate(listPath)}
            showAdd={false}
          />
          <div className="error-message">{error || 'Application not found'}</div>
        </div>
      </>
    );
  }

  const status = app.status;
  const ENTRY_TABS =
    String(app.requested_aid_type || '').toLowerCase() === 'clean_water'
      ? [
          ...ENTRY_TABS_BASE.slice(0, 5),
          { id: 'survey', label: 'Survey' },
          ...ENTRY_TABS_BASE.slice(5),
        ]
      : ENTRY_TABS_BASE;
  const tree = familyTree || {};
  const fromTree = FAMILY_GROUPS.flatMap((g) =>
    (tree[g.key] || []).map((row) => ({ ...row, group: g.label })),
  );
  const dependents = (kinship || []).filter((e) =>
    isSponsorshipDependent(e.notes),
  );
  const dependentIds = new Set(
    dependents.map((e) => e.to_person_id || e.to_person?.id),
  );
  const core = fromTree.filter((row) => !dependentIds.has(row.person?.id));
  const hasFamily =
    core.length > 0 ||
    dependents.length > 0 ||
    (app.writer &&
      app.writer.id !== app.beneficiary?.id &&
      String(app.writer_relation || '').toLowerCase() !== 'self');
  const attachments = app.attachments || [];
  const hasAidDetails =
    (app.requested_aid_type === 'education' && app.education_details) ||
    (app.requested_aid_type === 'ration' && app.ration_details) ||
    (app.requested_aid_type === 'marriage_gift' &&
      app.marriage_gift_details) ||
    (app.requested_aid_type === 'financial_assistance' &&
      app.financial_assistance_details) ||
    (app.requested_aid_type === 'clean_water' && app.clean_water_details);

  return (
    <>
      <Navbar />
      <div className="form-content aid-view aid-entry-view">
        <PageHeader
          title={app.application_no}
          backPath={listPath}
          onBackClick={() => navigate(listPath)}
          showAdd={false}
        />

        <div className="aid-hero">
          <div>
            <p className="aid-entry-view__eyebrow">
              {status === 'draft'
                ? 'Draft — consider to enter verification'
                : status === 'incomplete'
                  ? 'Incomplete — complete details, then consider for verification'
                  : 'Application record'}
            </p>
            <h2 style={{ margin: '0 0 6px' }}>
              {app.title || 'Aid application'}
            </h2>
            <p style={{ margin: 0, color: '#64748b' }}>
              {app.request_summary || 'No summary'}
            </p>
          </div>
          <div className="aid-entry-view__hero-actions">
            <span
              className={`aid-status-pill aid-status-pill--${aidStatusTone(
                status,
              )}`}
            >
              {formatAidStatus(status)}
            </span>
            {status !== 'rejected' && status !== 'delivered' ? (
              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  navigate(`/dms/aid/applications/edit/${app.id}`)
                }
              >
                Edit
              </button>
            ) : null}
            {canApproveDraft &&
            (status === 'draft' || status === 'incomplete') ? (
              <button
                type="button"
                className="primary-btn"
                disabled={approving}
                onClick={() => {
                  setShowApprovePanel(true);
                  setError('');
                }}
              >
                Consider for verification
              </button>
            ) : null}
          </div>
        </div>

        {canApproveDraft &&
        (status === 'draft' || status === 'incomplete') &&
        showApprovePanel ? (
          <div className="aid-panel" style={{ marginBottom: 16, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>
              {status === 'incomplete' ? 'Consider incomplete' : 'Consider draft'}
            </h3>
            <AidUserAssignField
              label="Assign to program user"
              value={assignUser}
              onChange={setAssignUser}
              hint="Required — pick a user from the program department who will own this case."
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                type="button"
                className="primary-btn"
                disabled={approving || !assignUser?.id}
                onClick={approveDraft}
              >
                {approving ? 'Considering…' : 'Consider & assign'}
              </button>
              <button
                type="button"
                className="secondary-btn"
                disabled={approving}
                onClick={() => {
                  setShowApprovePanel(false);
                  setAssignUser(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="aid-panel aid-panel--view">
          <div className="aid-tabs aid-tabs--main" role="tablist">
            {ENTRY_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={panelTab === t.id}
                className={`aid-tab ${panelTab === t.id ? 'aid-tab--active' : ''}`}
                onClick={() => setPanelTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="aid-panel__body">
            {panelTab === 'application' && (
              <section className="aid-section aid-section--flush">
                <div className="aid-fact-grid aid-fact-grid--case">
                  <Fact label="Case source">
                    {formatAidCaseSource(app.case_source)}
                  </Fact>
                  <Fact label="Program">
                    {formatAidRequestType(app.requested_aid_type)}
                  </Fact>
                  <Fact label="SubProgram">
                    {formatAidProgramLabel(app.aid_program)}
                  </Fact>
                  <Fact label="Expected Amount">
                    {formatExpectedAmount(app)}
                  </Fact>
                  <Fact label="Status">{formatAidStatus(status)}</Fact>
                  <Fact label="Entered by">
                    {app.created_by ? formatAuditActor(app.created_by) : '—'}
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

                {hasAidDetails ? (
                  <div className="aid-detail-block">
                    <h4 className="aid-detail-block__title">Program details</h4>
                    {app.requested_aid_type === 'education' &&
                      app.education_details && (
                        <AidEducationApplicationFields
                          value={app.education_details}
                          readOnly
                        />
                      )}
                    {app.requested_aid_type === 'ration' &&
                      app.ration_details && (
                        <AidRationApplicationFields
                          value={app.ration_details}
                          readOnly
                        />
                      )}
                    {app.requested_aid_type === 'marriage_gift' &&
                      app.marriage_gift_details && (
                        <AidMarriageGiftApplicationFields
                          value={app.marriage_gift_details}
                          readOnly
                        />
                      )}
                    {app.requested_aid_type === 'financial_assistance' &&
                      app.financial_assistance_details && (
                        <AidFinancialAssistanceFields
                          value={app.financial_assistance_details}
                          readOnly
                        />
                      )}
                  </div>
                ) : null}

                {app.zakat_permission && (
                  <AidCollapsibleSection
                    className="aid-detail-block"
                    title="Zakat Permission Letter"
                    hint="Click to view"
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
                        value={app.zakat_permission}
                        applicationNo={app.application_no}
                        readOnly
                      />
                    </div>
                  </AidCollapsibleSection>
                )}
                {app.consent_form && (
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
                    hint="Click to view"
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
                          value={app.consent_form}
                          applicationNo={app.application_no}
                          readOnly
                        />
                      ) : isMarriageGiftConsentProgram(
                          app.requested_aid_type,
                          app.aid_program,
                        ) || isMarriageGiftConsentForm(app.consent_form) ? (
                        <AidMarriageGiftConsentForm
                          value={app.consent_form}
                          applicationNo={app.application_no}
                          readOnly
                        />
                      ) : (
                        <AidConsentForm
                          value={app.consent_form}
                          applicationNo={app.application_no}
                          readOnly
                        />
                      )}
                    </div>
                  </AidCollapsibleSection>
                )}
              </section>
            )}

            {panelTab === 'beneficiary' && (
              <section className="aid-section aid-section--flush">
                <AidPersonProfileCard
                  person={app.beneficiary}
                  title="Beneficiary"
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

            {panelTab === 'family' && (
              <section className="aid-section aid-section--flush">
                {hasFamily ? (
                  <>
                    {app.writer &&
                    app.writer.id !== app.beneficiary?.id &&
                    String(app.writer_relation || '').toLowerCase() !==
                      'self' ? (
                      <div
                        className="aid-family-block"
                        style={{ marginBottom: 14 }}
                      >
                        <h4 className="aid-family-block__title">Applicant</h4>
                        <AidPersonProfileCard
                          person={app.writer}
                          title="Applicant"
                          relation={app.writer_relation}
                          roles={{ applicant: true }}
                        />
                      </div>
                    ) : null}

                    <div className="aid-family-groups">
                      {FAMILY_GROUPS.map((g) => {
                        const rows = core.filter((r) => r.group === g.label);
                        if (!rows.length) return null;
                        return (
                          <div key={g.key} className="aid-family-block">
                            <h4 className="aid-family-block__title">
                              {g.label}
                            </h4>
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
                                app.beneficiary?.id ||
                                app.beneficiary_person_id;
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
                  </>
                ) : (
                  <p className="aid-empty-note">
                    No family members linked yet.
                  </p>
                )}
              </section>
            )}

            {panelTab === 'family_tree' && (
              <section className="aid-section aid-section--flush">
                <AidFamilyTreePanel
                  apiTree={familyTree || {}}
                  rootPerson={app.beneficiary}
                  familyHeadHint={
                    app.writer &&
                    app.writer.id !== app.beneficiary?.id &&
                    String(app.writer_relation || '').toLowerCase() !== 'self'
                      ? app.writer
                      : null
                  }
                  familyHeadRelation={app.writer_relation || ''}
                  showHeader={false}
                  emptyHint="No linked family tree for this beneficiary yet."
                />
              </section>
            )}

            {panelTab === 'survey' &&
              String(app.requested_aid_type || '').toLowerCase() ===
                'clean_water' && (
                <section className="aid-section aid-section--flush">
                  {app.clean_water_details ? (
                    <AidCleanWaterSurveyForm
                      value={app.clean_water_details}
                      applicationNo={app.application_no}
                      readOnly
                    />
                  ) : (
                    <p className="aid-empty-note">
                      No water program survey filled yet.
                    </p>
                  )}
                </section>
              )}

            {panelTab === 'attachments' && (
              <section className="aid-section aid-section--flush">
                {attachments.length === 0 ? (
                  <p className="aid-empty-note">No attachments on this entry.</p>
                ) : (
                  <ul className="aid-attach-list">
                    {attachments.map((a) => (
                      <li key={a.id}>
                        <a
                          href={a.file_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {a.file_name || a.original_name || 'Attachment'}
                        </a>
                        {a.context ? (
                          <span style={{ color: '#64748b', fontSize: 13 }}>
                            {' '}
                            · {String(a.context).replace(/_/g, ' ')}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {panelTab === 'preview' && (
              <AidApplicationPreview
                app={app}
                familyTree={familyTree}
                kinship={kinship}
                investigation={investigation}
                investigationItems={investigationItems}
                recommendation={recommendation}
                vulnerability={vulnerability}
                preparedBy={
                  app.created_by
                    ? formatAuditActor(app.created_by)
                    : undefined
                }
              />
            )}

            {panelTab === 'printable' && (
              <AidApplicationPrintable
                app={app}
                familyTree={familyTree}
                kinship={kinship}
                preparedBy={
                  app.created_by
                    ? formatAuditActor(app.created_by)
                    : undefined
                }
              />
            )}

            {panelTab === 'verification' && (
              <section className="aid-section aid-section--flush">
                {verificationError ? (
                  <div className="error-message">{verificationError}</div>
                ) : null}
                {verificationLoading ? (
                  <p className="aid-empty-note">Loading verification…</p>
                ) : status === 'draft' || status === 'incomplete' ? (
                  <p className="aid-empty-note">
                    Verification starts after this application is considered for
                    verification.
                  </p>
                ) : (
                  <>
                    <div className="aid-fact-grid aid-fact-grid--case" style={{ marginBottom: 12 }}>
                      <Fact label="Status">{formatAidStatus(status)}</Fact>
                      <Fact label="Assigned to">
                        {app.assigned_to
                          ? [
                              app.assigned_to.first_name,
                              app.assigned_to.last_name,
                            ]
                              .filter(Boolean)
                              .join(' ') ||
                            app.assigned_to.email ||
                            '—'
                          : '—'}
                      </Fact>
                      <Fact label="Verified at">
                        {app.verified_at
                          ? new Date(app.verified_at).toLocaleString()
                          : '—'}
                      </Fact>
                      <Fact label="Recommendation">
                        {normalizeRationOptions(
                          recommendation.ration_options,
                        ).length > 0
                          ? normalizeRationOptions(
                              recommendation.ration_options,
                            )
                              .map(
                                (v) =>
                                  AID_RATION_REC_OPTIONS.find(
                                    (o) => o.value === v,
                                  )?.label || v,
                              )
                              .join(', ')
                          : recommendation.decision
                            ? String(recommendation.decision).replace(
                                /_/g,
                                ' ',
                              )
                            : '—'}
                      </Fact>
                    </div>
                    {app.verification_notes ? (
                      <p className="aid-section-hint" style={{ marginTop: 0 }}>
                        Notes: {app.verification_notes}
                      </p>
                    ) : null}
                    <AidInvestigationPanel
                      items={investigationItems}
                      value={investigation}
                      onChange={setInvestigation}
                      disabled
                      showRecommendation
                      aidType={app.requested_aid_type}
                      rationPackageMode={
                        String(app.requested_aid_type || '').toLowerCase() ===
                          'ration' &&
                        normalizeRationOptions(recommendation.ration_options)
                          .length > 0
                      }
                      remarksLabel="Investigator remarks"
                      activeTab="field_process"
                      vulnerability={vulnerability}
                      recommendation={recommendation}
                      includeChecklistGaps={false}
                    />
                  </>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AidEntryApplicationView;
