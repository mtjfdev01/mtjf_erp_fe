import React, { useMemo, useRef } from 'react';
import mtjfLogo from '../../../../assets/mtjf_logo.png';
import {
  formatAidRequestType,
  formatAidProgramLabel,
  formatMaritalStatus,
  formatResidentHousingSummary,
  formatLivestockSummary,
  formatVulnerability,
  calcAgeFromDob,
  formatEducation,
} from '../aidConstants';
import {
  normalizeInvestigationEntry,
  AID_RECOMMENDATION_DECISIONS,
  AID_RECOMMENDATION_PERIODS,
  AID_RATION_REC_OPTIONS,
  normalizeRationOptions,
} from './AidInvestigationPanel';
import { printAidElement } from './printAidElement';

const dash = (v) => {
  if (v == null || v === '') return '—';
  const s = String(v).trim();
  return s || '—';
};

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dash(d);
  }
};

const formatDateTime = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dash(d);
  }
};

const money = (v) => {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return dash(v);
  return n.toLocaleString('en-PK');
};

const yn = (v) => {
  if (v === true || v === 'yes' || v === 'Yes') return 'Yes';
  if (v === false || v === 'no' || v === 'No') return 'No';
  return '—';
};

const Cell = ({ label, children, span, valueClassName }) => (
  <div
    className={`aid-preview__cell${span ? ` aid-preview__cell--span-${span}` : ''}`}
  >
    <span className="aid-preview__label">{label}</span>
    <span
      className={`aid-preview__value${valueClassName ? ` ${valueClassName}` : ''}`}
    >
      {children}
    </span>
  </div>
);

const SectionBar = ({ title, right }) => (
  <div className="aid-preview__section-bar">
    <span>{title}</span>
    {right ? <span className="aid-preview__section-bar-right">{right}</span> : null}
  </div>
);

const Check = ({ label, checked }) => (
  <span className={`aid-preview__check${checked ? ' is-on' : ''}`}>
    <span className="aid-preview__check-box" aria-hidden />
    {label}
  </span>
);

const Lines = ({ lines = 4, text }) => (
  <div className="aid-preview__lines">
    {text ? <p className="aid-preview__lines-text">{text}</p> : null}
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="aid-preview__line" />
    ))}
  </div>
);

const statusLabel = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'verified') return 'Verified';
  if (s === 'mismatch') return 'Mismatch';
  return 'Not checked';
};

const decisionLabel = (decision) =>
  AID_RECOMMENDATION_DECISIONS.find((d) => d.value === decision)?.label ||
  dash(decision);

const periodLabel = (months) =>
  AID_RECOMMENDATION_PERIODS.find((p) => Number(p.value) === Number(months))
    ?.label || (months ? `${months} months` : '—');

/**
 * Formal Beneficiary Registration + Investigation & Approval preview (2 pages).
 */
const AidApplicationPreview = ({
  app,
  familyTree,
  kinship = [],
  investigation = null,
  investigationItems = [],
  recommendation = null,
  vulnerability = null,
  preparedBy,
  printedBy,
}) => {
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);
  const bothRef = useRef(null);

  const data = useMemo(() => {
    if (!app) return null;
    const beneficiary = app.beneficiary || {};
    const writer = app.writer || null;
    const isSelf =
      !writer ||
      writer.id === beneficiary.id ||
      String(app.writer_relation || '').toLowerCase() === 'self';
    const applicant = isSelf ? beneficiary : writer || beneficiary;
    const tree = familyTree || {};
    const children = tree.children || [];
    const parents = tree.parents || [];
    const spouse = tree.spouse || [];
    const brothers = tree.brothers || [];
    const sisters = tree.sisters || [];
    const siblings = tree.siblings || [];
    const dependents = Array.isArray(kinship)
      ? kinship.filter((e) =>
          /dependent under (family head|guardian) sponsorship/i.test(
            String(e.notes || ''),
          ),
        )
      : [];

    const familyRows = [];
    const pushRow = (person, relation, badge) => {
      if (!person) return;
      const id = person.id || `${person.cnic || ''}-${person.full_name || ''}`;
      if (familyRows.some((r) => r._id === id && r.relation === relation)) return;
      familyRows.push({
        _id: id,
        name: person.full_name || '—',
        relation: relation || '—',
        badge,
        age: calcAgeFromDob(person.date_of_birth),
        cnic: person.cnic || person.b_form || '',
        educationOcc:
          [
            formatEducation(person.education_level) !== '—'
              ? formatEducation(person.education_level)
              : '',
            person.occupation || person.literacy_category || '',
          ]
            .filter(Boolean)
            .join(' · ') || '—',
        income: person.monthly_income,
        disability: person.has_disability
          ? person.disability_type || 'Yes'
          : person.has_disability === false
            ? 'No'
            : formatVulnerability(person.vulnerability) || '—',
      });
    };

    pushRow(beneficiary, isSelf ? 'Self' : 'Beneficiary', 'Head');
    if (!isSelf && writer) {
      pushRow(writer, app.writer_relation || 'Applicant', null);
    }
    parents.forEach((r) =>
      pushRow(r.person, r.relation_type || r.relation || 'Parent', null),
    );
    spouse.forEach((r) =>
      pushRow(r.person, r.relation_type || 'Spouse', null),
    );
    children.forEach((r) =>
      pushRow(r.person, r.relation_type || 'Child', null),
    );
    brothers.forEach((r) =>
      pushRow(r.person, r.relation_type || 'Brother', null),
    );
    sisters.forEach((r) =>
      pushRow(r.person, r.relation_type || 'Sister', null),
    );
    siblings.forEach((r) =>
      pushRow(r.person, r.relation_type || 'Sibling', null),
    );
    dependents.forEach((edge) => {
      const person =
        edge.to_person || edge.from_person || edge.person || null;
      pushRow(person, edge.relation_type || 'Dependent', null);
    });

    while (familyRows.length < 5) {
      familyRows.push({
        _id: `empty-${familyRows.length}`,
        empty: true,
      });
    }

    const housing = formatResidentHousingSummary(beneficiary) || '';
    const livestock = formatLivestockSummary(beneficiary) || '';
    const rent =
      beneficiary.total_rent ||
      beneficiary.rent_amount ||
      (Array.isArray(beneficiary.resident_entries)
        ? beneficiary.resident_entries.find((r) => r?.rented_amount)?.rented_amount
        : null);

    const rec = recommendation || app.investigation_recommendation || {};
    const status = String(app.status || '').toLowerCase();
    let approvalDecision = '';
    if (status === 'successful' || status === 'delivered') approvalDecision = 'approved';
    else if (status === 'rejected') approvalDecision = 'rejected';
    else if (status === 'under_review' || status === 'submitted') {
      /* leave blank */
    } else if (String(rec.decision || '').includes('changes')) {
      approvalDecision = 'approved_with_changes';
    } else if (rec.decision === 'reject') {
      approvalDecision = 'rejected';
    } else if (rec.decision === 'approve_as_requested') {
      approvalDecision = 'approved';
    }

    const inv = investigation || app.verification_checklist || {};
    const items = Array.isArray(investigationItems)
      ? investigationItems
      : app.investigation_items ||
        app.verification_checklist_items ||
        [];
    const claimItems = items.filter((i) => i && i.kind !== 'process');
    const processItems = items.filter((i) => i && i.kind === 'process');
    const vuln =
      vulnerability ||
      app.vulnerability ||
      (rec.vulnerability_after_visit
        ? {
            declared: rec.vulnerability_declared,
            after_visit: rec.vulnerability_after_visit,
            deltas: rec.vulnerability_deltas || [],
          }
        : null);

    const entryFor = (key) =>
      normalizeInvestigationEntry(inv?.[key] ?? null);

    return {
      beneficiary,
      writer,
      isSelf,
      applicant,
      familyRows,
      housing,
      livestock,
      rent,
      dependentsCount: dependents.length,
      childrenCount: children.length,
      rec,
      approvalDecision,
      claimItems,
      processItems,
      entryFor,
      vuln,
      programLabel:
        formatAidProgramLabel(app.aid_program) ||
        formatAidRequestType(app.requested_aid_type),
      preparedName:
        preparedBy ||
        (app.created_by
          ? app.created_by.full_name ||
            app.created_by.name ||
            app.created_by.email
          : ''),
    };
  }, [
    app,
    familyTree,
    kinship,
    investigation,
    investigationItems,
    recommendation,
    vulnerability,
    preparedBy,
  ]);

  if (!app || !data) return null;

  const {
    beneficiary,
    isSelf,
    applicant,
    familyRows,
    housing,
    livestock,
    rent,
    dependentsCount,
    childrenCount,
    rec,
    approvalDecision,
    claimItems,
    processItems,
    entryFor,
    vuln,
    programLabel,
    preparedName,
  } = data;

  const rationOpts = normalizeRationOptions(rec.ration_options);
  const vulnAfter = vuln?.after_visit?.total;
  const vulnDeclared = vuln?.declared?.total;

  const printMeta = `Printed ${formatDateTime(new Date())}${
    printedBy ? ` by ${printedBy}` : preparedName ? ` by ${preparedName}` : ''
  }`;

  const handlePrintAll = () =>
    printAidElement(bothRef.current, { fitSinglePage: false });
  const handlePrintPage1 = () => printAidElement(page1Ref.current);
  const handlePrintPage2 = () => printAidElement(page2Ref.current);

  return (
    <section className="aid-section aid-section--flush aid-preview-section">
      <div className="aid-printable__toolbar no-print">
        <p className="aid-printable__toolbar-hint">
          Formal registration preview (Page 1) and investigation &amp; approval
          (Page 2).
        </p>
        <div className="aid-preview__toolbar-actions">
          <button type="button" className="secondary-btn" onClick={handlePrintPage1}>
            Print page 1
          </button>
          <button type="button" className="secondary-btn" onClick={handlePrintPage2}>
            Print page 2
          </button>
          <button type="button" className="primary-btn" onClick={handlePrintAll}>
            Print both
          </button>
        </div>
      </div>

      <div ref={bothRef} className="aid-preview-print-root">
        {/* ——— Page 1: Beneficiary Registration Form ——— */}
        <div
          ref={page1Ref}
          id="aid-preview-page-1"
          className="aid-preview aid-preview--page1"
        >
          <header className="aid-preview__header">
            <div className="aid-preview__brand">
              <img src={mtjfLogo} alt="MTJF" className="aid-preview__logo" />
              <div>
                <div className="aid-preview__org">
                  Molana Tariq Jamil Foundation
                </div>
                <div className="aid-preview__org-sub">
                  Head Office, Mian Channu, Punjab
                </div>
                <h1 className="aid-preview__title">
                  Beneficiary Registration Form
                </h1>
              </div>
            </div>
            <div className="aid-preview__meta-box">
              <div className="aid-preview__meta-row">
                <span>Application no.</span>
                <strong className="aid-preview__app-no">
                  {dash(app.application_no)}
                </strong>
              </div>
              <div className="aid-preview__meta-row">
                <span>Date</span>
                <strong>
                  {formatDate(app.submitted_at || app.created_at)}
                </strong>
              </div>
              <div className="aid-preview__meta-row">
                <span>Program</span>
                <strong>{dash(programLabel)}</strong>
              </div>
            </div>
          </header>

          <SectionBar title="1. Applicant details" />
          <div className="aid-preview__grid aid-preview__grid--3">
            <Cell label="Applicant name">{dash(applicant.full_name)}</Cell>
            <Cell label="CNIC no.">{dash(applicant.cnic)}</Cell>
            <Cell label="Contact no.">{dash(applicant.phone)}</Cell>
            <Cell label="Permanent address" span={1}>
              {dash(applicant.address)}
            </Cell>
            <Cell label="City">{dash(applicant.city)}</Cell>
            <Cell label="District / Province">
              {[applicant.district || app.district, applicant.province || app.province]
                .filter(Boolean)
                .join(' / ') || '—'}
            </Cell>
            <Cell label="Relation to beneficiary">
              {isSelf ? 'Self' : dash(app.writer_relation)}
            </Cell>
            <Cell label="Marital status">
              {formatMaritalStatus(applicant.marital_status)}
            </Cell>
            <Cell label="Occupation">
              {dash(applicant.occupation || applicant.literacy_category)}
            </Cell>
            <Cell label="Avg. monthly income (PKR)">
              {money(applicant.monthly_income)}
            </Cell>
          </div>

          <SectionBar
            title="2. Beneficiary details"
            right={isSelf ? 'Beneficiary is the applicant' : undefined}
          />
          <div className="aid-preview__grid aid-preview__grid--3">
            <Cell label="Beneficiary name">
              {dash(beneficiary.full_name)}
              {isSelf ? (
                <span className="aid-preview__badge">Same as applicant</span>
              ) : null}
            </Cell>
            <Cell label="CNIC / B-form no.">
              {dash(beneficiary.cnic || beneficiary.b_form)}
            </Cell>
            <Cell label="Disability">
              {beneficiary.has_disability
                ? beneficiary.disability_type || 'Yes'
                : beneficiary.has_disability === false
                  ? 'No'
                  : dash(formatVulnerability(beneficiary.vulnerability))}
            </Cell>
            <Cell label="Residence type">
              {housing || 'Not recorded'}
            </Cell>
            <Cell label="Monthly rent (PKR)">{money(rent)}</Cell>
            <Cell label="Other property / area">
              {dash(
                beneficiary.property_details ||
                  beneficiary.property_type ||
                  beneficiary.property_area ||
                  'None',
              )}
            </Cell>
            <Cell label="Earning from property (PKR)">
              {money(
                beneficiary.property_income ||
                  beneficiary.total_property_earning,
              )}
            </Cell>
            <Cell label="Vehicle">
              {yn(beneficiary.has_vehicle)}
            </Cell>
            <Cell label="Livestock">
              {livestock
                ? livestock.replace(/^Livestock:\s*/i, '')
                : '—'}
            </Cell>
            <Cell label="Dependents / children">
              {`${dependentsCount} / ${childrenCount}`}
            </Cell>
          </div>

          <SectionBar
            title="3. Family details"
            right="Family head and household members"
          />
          <div className="aid-preview__table-wrap">
            <table className="aid-preview__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Relation</th>
                  <th>Age</th>
                  <th>CNIC / B-form</th>
                  <th>Education / occupation</th>
                  <th>Income (PKR)</th>
                  <th>Disability</th>
                </tr>
              </thead>
              <tbody>
                {familyRows.slice(0, 8).map((row, idx) =>
                  row.empty ? (
                    <tr key={row._id}>
                      <td>{idx + 1}</td>
                      <td colSpan={7}>&nbsp;</td>
                    </tr>
                  ) : (
                    <tr key={row._id}>
                      <td>{idx + 1}</td>
                      <td>
                        {row.name}
                        {row.badge ? (
                          <span className="aid-preview__badge aid-preview__badge--head">
                            {row.badge}
                          </span>
                        ) : null}
                      </td>
                      <td>{row.relation}</td>
                      <td>{row.age != null ? row.age : '—'}</td>
                      <td>{dash(row.cnic)}</td>
                      <td>{row.educationOcc}</td>
                      <td>{money(row.income)}</td>
                      <td>{row.disability}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <SectionBar title="4. Requirement" />
          <div className="aid-preview__req">
            <div className="aid-preview__req-top">
              <Cell label="Requirement requested">
                {formatAidRequestType(app.requested_aid_type)}
              </Cell>
              <Cell label="Amount requested by applicant (PKR)">
                {money(app.requested_amount || app.expected_amount)}
              </Cell>
            </div>
            <Cell
              label="Details of need"
              valueClassName="aid-preview__value--need"
            >
              {dash(app.request_summary || app.title)}
            </Cell>
          </div>

          <div className="aid-preview__signs-grid">
            <div className="aid-preview__sign-box">
              <div className="aid-preview__sign-main">
                <p className="aid-preview__sign-text">
                  I confirm that the information above is true to the best of
                  my knowledge. I understand that false information may lead to
                  rejection of this application.
                </p>
                <div className="aid-preview__sign-fields">
                  <div>
                    <span className="aid-preview__label">Name</span>
                    <span className="aid-preview__dotted">
                      {dash(applicant.full_name)}
                    </span>
                  </div>
                  <div>
                    <span className="aid-preview__label">Date</span>
                    <span className="aid-preview__dotted">
                      {formatDate(app.submitted_at || app.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="aid-preview__thumb">Thumb impression</div>
            </div>
          </div>

          <footer className="aid-preview__page-foot">
            <span>{dash(app.application_no)}</span>
            <span>{printMeta}</span>
            <span>Page 1 of 2</span>
          </footer>
        </div>

        {/* ——— Page 2: Investigation & approval ——— */}
        <div
          ref={page2Ref}
          id="aid-preview-page-2"
          className="aid-preview aid-preview--page2"
        >
          <header className="aid-preview__header aid-preview__header--compact">
            <div>
              <div className="aid-preview__org">
                Molana Tariq Jamil Foundation
              </div>
              <h1 className="aid-preview__title aid-preview__title--sm">
                Investigation &amp; approval
              </h1>
            </div>
            <div className="aid-preview__meta-box">
              <div className="aid-preview__meta-row">
                <span>Application no.</span>
                <strong className="aid-preview__app-no">
                  {dash(app.application_no)}
                </strong>
              </div>
              <div className="aid-preview__meta-row">
                <span>Applicant</span>
                <strong>{dash(applicant.full_name)}</strong>
              </div>
            </div>
          </header>

          <SectionBar
            title="Verification checklist"
            right="Declared claims and investigator status"
          />
          {claimItems.length ? (
            <div className="aid-preview__invest-table-wrap">
              <table className="aid-preview__invest-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Item</th>
                    <th>Declared</th>
                    <th style={{ width: '12%' }}>Status</th>
                    <th style={{ width: '22%' }}>Found / note</th>
                  </tr>
                </thead>
                <tbody>
                  {claimItems.map((item) => {
                    const entry = entryFor(item.key);
                    return (
                      <tr key={item.key}>
                        <td>
                          {item.label || item.key}
                          {item.required ? ' *' : ''}
                        </td>
                        <td>{dash(item.declared)}</td>
                        <td>
                          <span
                            className={`aid-preview__status aid-preview__status--${entry.status || 'not_checked'}`}
                          >
                            {statusLabel(entry.status)}
                          </span>
                        </td>
                        <td>{dash(entry.note)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="aid-preview__empty-note">
              No investigation checklist data saved for this application yet.
            </p>
          )}

          <SectionBar
            title="Field process"
            right="Site visit, process checks, vulnerability & recommendation"
          />
          {processItems.length ? (
            <div className="aid-preview__invest-table-wrap">
              <table className="aid-preview__invest-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Process check</th>
                    <th style={{ width: '14%' }}>Status</th>
                    <th>Found / note</th>
                  </tr>
                </thead>
                <tbody>
                  {processItems.map((item) => {
                    const entry = entryFor(item.key);
                    return (
                      <tr key={item.key}>
                        <td>
                          {item.label || item.key}
                          {item.required ? ' *' : ''}
                        </td>
                        <td>
                          <span
                            className={`aid-preview__status aid-preview__status--${entry.status || 'not_checked'}`}
                          >
                            {statusLabel(entry.status)}
                          </span>
                        </td>
                        <td>{dash(entry.note)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="aid-preview__empty-note">
              No field process checks recorded yet.
            </p>
          )}

          <div className="aid-preview__field-process-summary">
            <div className="aid-preview__vuln-box">
              <span className="aid-preview__label">
                Vulnerability after visit
              </span>
              <div className="aid-preview__vuln-score">
                {vulnAfter != null ? `${vulnAfter}%` : '—'}
                {vulnDeclared != null &&
                vulnAfter != null &&
                Number(vulnDeclared) !== Number(vulnAfter) ? (
                  <span className="aid-preview__vuln-old">
                    was {vulnDeclared}%
                  </span>
                ) : null}
              </div>
              <div className="aid-preview__vuln-band">
                {dash(vuln?.after_visit?.band_label)}
              </div>
              {vuln?.after_visit?.program_min_score != null ? (
                <div className="aid-preview__vuln-threshold">
                  Program min {vuln.after_visit.program_code || ''}:{' '}
                  {vuln.after_visit.program_min_score} pts
                  {vuln.after_visit.meets_program_threshold === false
                    ? ' — below threshold'
                    : vuln.after_visit.meets_program_threshold
                      ? ' — meets threshold'
                      : ''}
                </div>
              ) : (
                <div className="aid-preview__vuln-threshold">
                  Score from intake factors (income, housing, assets, BISP…).
                </div>
              )}
            </div>
            <div className="aid-preview__rec-box">
              <span className="aid-preview__label">Recommendation</span>
              <div className="aid-preview__grid aid-preview__grid--2" style={{ border: 'none' }}>
                <Cell label="Decision">{decisionLabel(rec.decision)}</Cell>
                <Cell label="Amount (PKR)">
                  {money(rec.amount || app.expected_amount)}
                </Cell>
                <Cell label="Period">{periodLabel(rec.period_months)}</Cell>
                <Cell label="Ration options">
                  {rationOpts.length
                    ? rationOpts
                        .map(
                          (v) =>
                            AID_RATION_REC_OPTIONS.find((o) => o.value === v)
                              ?.label || v,
                        )
                        .join(', ')
                    : '—'}
                </Cell>
              </div>
              <div className="aid-preview__block" style={{ border: 'none', paddingLeft: 0, paddingRight: 0 }}>
                <span className="aid-preview__label">Remarks</span>
                <p className="aid-preview__lines-text">
                  {dash(rec.remarks || app.verification_notes)}
                </p>
              </div>
            </div>
          </div>

          <div className="aid-preview__grid aid-preview__grid--3 aid-preview__rec-row">
            <Cell label="Recommended support">
              {dash(
                rationOpts.length
                  ? rationOpts.join(', ')
                  : formatAidRequestType(app.requested_aid_type),
              )}
            </Cell>
            <Cell label="Approx. amount / expense (PKR)">
              {money(rec.amount || app.expected_amount)}
            </Cell>
            <div className="aid-preview__cell">
              <span className="aid-preview__label">Recommendation</span>
              <span className="aid-preview__checks">
                <Check
                  label="Recommend"
                  checked={
                    !!rec.decision &&
                    rec.decision !== 'reject' &&
                    String(rec.decision).toLowerCase() !== 'not_recommend'
                  }
                />
                <Check
                  label="Not recommend"
                  checked={
                    rec.decision === 'reject' ||
                    String(rec.decision || '').toLowerCase() ===
                      'not_recommend'
                  }
                />
              </span>
            </div>
          </div>

          <div className="aid-preview__inv-sign">
            <div>
              <span className="aid-preview__label">Investigator signature</span>
              <span className="aid-preview__dotted">&nbsp;</span>
            </div>
            <div>
              <span className="aid-preview__label">Name</span>
              <span className="aid-preview__dotted">
                {dash(
                  app.assigned_to?.full_name ||
                    app.assigned_to?.name ||
                    app.verified_by?.full_name ||
                    '',
                )}
              </span>
            </div>
            <div>
              <span className="aid-preview__label">Designation</span>
              <span className="aid-preview__dotted">Investigator</span>
            </div>
            <div>
              <span className="aid-preview__label">Date</span>
              <span className="aid-preview__dotted">
                {formatDate(app.verified_at)}
              </span>
            </div>
          </div>

          <SectionBar
            title="Approval"
            right="CEO / approving authority"
          />
          <div className="aid-preview__cell aid-preview__decision">
            <span className="aid-preview__label">Decision</span>
            <span className="aid-preview__checks">
              <Check
                label="Approved"
                checked={approvalDecision === 'approved'}
              />
              <Check
                label="Approved with changes"
                checked={approvalDecision === 'approved_with_changes'}
              />
              <Check
                label="Rejected"
                checked={approvalDecision === 'rejected'}
              />
              <Check
                label="Re-investigate"
                checked={
                  status === 'under_review' &&
                  String(app.return_reason || '').length > 0
                }
              />
            </span>
          </div>
          <div className="aid-preview__grid aid-preview__grid--2">
            <Cell label="Approved support">
              {dash(
                Array.isArray(rec.ration_options) && rec.ration_options.length
                  ? rec.ration_options.join(', ')
                  : programLabel,
              )}
            </Cell>
            <Cell label="Approved amount (PKR)">
              {money(
                app.approved_amount ||
                  (rec.decision !== 'reject' ? rec.amount : ''),
              )}
            </Cell>
          </div>
          <div className="aid-preview__block">
            <span className="aid-preview__label">Remarks</span>
            <Lines
              lines={3}
              text={app.ceo_remarks || app.manager_remarks || ''}
            />
          </div>

          <div className="aid-preview__approval-foot">
            <div className="aid-preview__sign-fields">
              <div>
                <span className="aid-preview__label">
                  CEO / approver signature
                </span>
                <span className="aid-preview__dotted">&nbsp;</span>
              </div>
              <div>
                <span className="aid-preview__label">Date</span>
                <span className="aid-preview__dotted">
                  {formatDate(app.approved_at || app.ceo_approved_at)}
                </span>
              </div>
            </div>
            <div className="aid-preview__stamp">Office stamp</div>
          </div>

          <footer className="aid-preview__page-foot">
            <span>{dash(app.application_no)}</span>
            <span>{printMeta}</span>
            <span>Page 2 of 2</span>
          </footer>
        </div>
      </div>
    </section>
  );
};

export default AidApplicationPreview;
