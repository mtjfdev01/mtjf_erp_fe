import React, { useRef } from 'react';
import {
  formatAidRequestType,
  formatAidProgramLabel,
  formatMaritalStatus,
  formatResidentHousingSummary,
  formatLivestockSummary,
  formatVulnerability,
  isWheelchairConsentProgram,
  isWheelchairConsentForm,
  isMarriageGiftConsentProgram,
  isMarriageGiftConsentForm,
} from '../aidConstants';
import AidZakatPermissionForm from './AidZakatPermissionForm';
import AidConsentForm from './AidConsentForm';
import AidWheelchairConsentForm from './AidWheelchairConsentForm';
import AidMarriageGiftConsentForm from './AidMarriageGiftConsentForm';
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

const Field = ({ label, value }) => (
  <div className="aid-printable__field">
    <span className="aid-printable__label">{label}</span>
    <span className="aid-printable__value">{dash(value)}</span>
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="aid-printable__section-title">{children}</h3>
);

const PersonBlock = ({ person, familyCounts = {} }) => {
  const p = person || {};
  const housing = formatResidentHousingSummary(p) || '';
  const livestock = formatLivestockSummary(p) || '';
  const residentType =
    p.resident_type ||
    (housing.toLowerCase().includes('owner') ? 'Owner' : '') ||
    '';

  return (
    <div className="aid-printable__grid aid-printable__grid--3">
      <div className="aid-printable__col">
        <Field
          label="Marital Status"
          value={formatMaritalStatus(p.marital_status)}
        />
        <Field
          label="Siblings"
          value={
            (familyCounts.brothers || 0) + (familyCounts.sisters || 0) ||
            familyCounts.siblings ||
            ''
          }
        />
        <Field label="Resident Type" value={residentType || housing} />
        <Field
          label="Other Property"
          value={p.property_details || p.property_type}
        />
        <Field
          label="Vehicle"
          value={
            p.has_vehicle ? 'Yes' : p.has_vehicle === false ? 'No' : ''
          }
        />
        <Field
          label="Occupation"
          value={p.occupation || p.literacy_category}
        />
        <Field
          label="Disability if any"
          value={
            p.has_disability
              ? p.disability_type || 'Yes'
              : p.has_disability === false
                ? 'No'
                : formatVulnerability(p.vulnerability)
          }
        />
      </div>
      <div className="aid-printable__col">
        <Field
          label="Total No. Of Dependents"
          value={familyCounts.dependents ?? familyCounts.children ?? ''}
        />
        <Field label="Children" value={familyCounts.children} />
        <Field label="Total Area" value={p.property_area || p.resident_area} />
        <Field
          label="Total Earning through Property"
          value={p.property_income || p.total_property_earning}
        />
        <Field label="Live Stock" value={livestock} />
        <Field
          label="Occupation Details"
          value={p.occupation_details || p.health_notes || p.occupation}
        />
      </div>
      <div className="aid-printable__col">
        <Field label="Total Rent" value={p.total_rent || p.rent_amount} />
        <Field label="Avg Monthly Income" value={p.monthly_income} />
      </div>
    </div>
  );
};

/**
 * Printable application form — paper-style layout for Aid entry / case print.
 * Also exposes Zakat Permission Letter and Consent Form when present.
 */
const AidApplicationPrintable = ({
  app,
  familyTree,
  kinship = [],
  preparedBy,
}) => {
  const printRef = useRef(null);
  const zakatPrintRef = useRef(null);
  const consentPrintRef = useRef(null);
  if (!app) return null;

  const beneficiary = app.beneficiary || {};
  const writer = app.writer || null;
  const isSelf =
    !writer ||
    writer.id === beneficiary.id ||
    String(app.writer_relation || '').toLowerCase() === 'self';

  const tree = familyTree || {};
  const familyCounts = {
    children: (tree.children || []).length,
    brothers: (tree.brothers || []).length,
    sisters: (tree.sisters || []).length,
    siblings: (tree.siblings || []).length,
    dependents: Array.isArray(kinship)
      ? kinship.filter((e) =>
          /dependent under (family head|guardian) sponsorship/i.test(
            String(e.notes || ''),
          ),
        ).length
      : 0,
  };

  const parents = tree.parents || [];
  const father =
    parents.find((r) => String(r.relation_type).toLowerCase() === 'father')
      ?.person || null;
  const mother =
    parents.find((r) => String(r.relation_type).toLowerCase() === 'mother')
      ?.person || null;

  const hasZakat = !!app.zakat_permission;
  const hasConsent = !!app.consent_form;

  return (
    <section className="aid-section aid-section--flush aid-printable-section">
      <div className="aid-printable__toolbar no-print">
        <p className="aid-printable__toolbar-hint">
          Paper-style forms for printing or filing.
        </p>
        <button
          type="button"
          className="primary-btn"
          onClick={() => printAidElement(printRef.current)}
        >
          Print application
        </button>
      </div>

      <div className="aid-printable" ref={printRef} id="aid-application-printable">
        <header className="aid-printable__header">
          <h1 className="aid-printable__title">Application Form</h1>
          <h2 className="aid-printable__subtitle">Applicant&apos;s Details</h2>
        </header>

        <div className="aid-printable__divider" />

        <div className="aid-printable__grid aid-printable__grid--3">
          <div className="aid-printable__col">
            <Field
              label="Date"
              value={formatDate(app.submitted_at || app.created_at)}
            />
            <Field
              label="Applicant Name"
              value={(isSelf ? beneficiary : writer)?.full_name}
            />
            <Field
              label="City"
              value={(isSelf ? beneficiary : writer)?.city}
            />
            <Field
              label="Permanent Address"
              value={(isSelf ? beneficiary : writer)?.address}
            />
          </div>
          <div className="aid-printable__col">
            <Field label="Applicant No" value={app.application_no} />
            <Field
              label="C.N.I.C No"
              value={(isSelf ? beneficiary : writer)?.cnic}
            />
            <Field
              label="District"
              value={
                (isSelf ? beneficiary : writer)?.district ||
                app.district ||
                ''
              }
            />
          </div>
          <div className="aid-printable__col">
            <Field
              label="Sector"
              value={
                formatAidProgramLabel(app.aid_program) ||
                formatAidRequestType(app.requested_aid_type)
              }
            />
            <Field
              label="Contact No"
              value={(isSelf ? beneficiary : writer)?.phone}
            />
            <Field
              label="Province"
              value={
                (isSelf ? beneficiary : writer)?.province || app.province || ''
              }
            />
          </div>
        </div>

        <div className="aid-printable__divider" />
        <SectionTitle>Incase of Beneficiary is the applicant</SectionTitle>
        {isSelf ? (
          <PersonBlock person={beneficiary} familyCounts={familyCounts} />
        ) : (
          <p className="aid-printable__muted">
            Not applicable — beneficiary is not the applicant.
          </p>
        )}

        <div className="aid-printable__divider" />
        <SectionTitle>Incase of Beneficiary is not applicant</SectionTitle>
        {!isSelf ? (
          <div className="aid-printable__grid aid-printable__grid--3">
            <div className="aid-printable__col">
              <Field label="Beneficiary Name" value={beneficiary.full_name} />
              <Field label="City" value={beneficiary.city} />
              <Field
                label="Dependent upon"
                value={
                  beneficiary.household_dependency ||
                  app.writer_relation ||
                  'Family'
                }
              />
              <Field
                label="Marital Status"
                value={formatMaritalStatus(beneficiary.marital_status)}
              />
              <Field
                label="Beneficiary’s Father"
                value={
                  father?.full_name ||
                  beneficiary.father_or_husband_name ||
                  (father?.is_alive === false ? 'Deceased' : '')
                }
              />
              <Field
                label="Resident Type"
                value={formatResidentHousingSummary(beneficiary)}
              />
              <Field
                label="Other Property"
                value={beneficiary.property_details || beneficiary.property_type}
              />
              <Field
                label="Vehicle"
                value={
                  beneficiary.has_vehicle
                    ? 'Yes'
                    : beneficiary.has_vehicle === false
                      ? 'No'
                      : ''
                }
              />
              <Field
                label="Occupation"
                value={beneficiary.occupation || beneficiary.literacy_category}
              />
            </div>
            <div className="aid-printable__col">
              <Field label="C.N.I.C No" value={beneficiary.cnic} />
              <Field
                label="District"
                value={beneficiary.district || app.district || ''}
              />
              <Field
                label="Disability"
                value={
                  beneficiary.has_disability
                    ? 'YES'
                    : beneficiary.has_disability === false
                      ? 'NO'
                      : ''
                }
              />
              <Field
                label="Siblings"
                value={
                  (familyCounts.brothers || 0) + (familyCounts.sisters || 0) ||
                  ''
                }
              />
              <Field
                label="Beneficiary’s Mother"
                value={
                  mother?.full_name ||
                  (mother?.is_alive === false ? 'Deceased' : '')
                }
              />
              <Field
                label="Total Area"
                value={beneficiary.property_area || beneficiary.resident_area}
              />
              <Field
                label="Total Earning through Property"
                value={
                  beneficiary.property_income ||
                  beneficiary.total_property_earning
                }
              />
              <Field
                label="Live Stock"
                value={formatLivestockSummary(beneficiary)}
              />
              <Field
                label="Occupation Detail"
                value={
                  beneficiary.occupation_details ||
                  beneficiary.occupation ||
                  beneficiary.health_notes
                }
              />
            </div>
            <div className="aid-printable__col">
              <Field label="Contact No" value={beneficiary.phone} />
              <Field
                label="Province"
                value={beneficiary.province || app.province || ''}
              />
              <Field
                label="Disability Details"
                value={
                  beneficiary.disability_type ||
                  formatVulnerability(beneficiary.vulnerability)
                }
              />
              <Field
                label="Total Rent"
                value={beneficiary.total_rent || beneficiary.rent_amount}
              />
              <Field
                label="Avg Monthly Income"
                value={beneficiary.monthly_income}
              />
            </div>
          </div>
        ) : (
          <p className="aid-printable__muted">
            Not applicable — beneficiary is the applicant.
          </p>
        )}

        <div className="aid-printable__divider" />
        <SectionTitle>Supporter&apos;s Details:</SectionTitle>
        {!isSelf && writer ? (
          <div className="aid-printable__grid aid-printable__grid--3">
            <div className="aid-printable__col">
              <Field label="Supporter Name" value={writer.full_name} />
              <Field label="City" value={writer.city} />
              <Field
                label="Marital Status"
                value={formatMaritalStatus(writer.marital_status)}
              />
              <Field
                label="Siblings"
                value={
                  (familyCounts.brothers || 0) + (familyCounts.sisters || 0) ||
                  ''
                }
              />
              <Field
                label="Resident Type"
                value={formatResidentHousingSummary(writer)}
              />
              <Field
                label="Other Property"
                value={writer.property_details || writer.property_type}
              />
              <Field
                label="Vehicle"
                value={
                  writer.has_vehicle
                    ? 'Yes'
                    : writer.has_vehicle === false
                      ? 'No'
                      : ''
                }
              />
              <Field
                label="Occupation"
                value={writer.occupation || writer.literacy_category}
              />
            </div>
            <div className="aid-printable__col">
              <Field label="C.N.I.C No" value={writer.cnic} />
              <Field label="District" value={writer.district} />
              <Field
                label="Total No. Of Dependents"
                value={familyCounts.dependents || familyCounts.children || ''}
              />
              <Field label="Children" value={familyCounts.children} />
              <Field
                label="Total Area"
                value={writer.property_area || writer.resident_area}
              />
              <Field
                label="Total Earning through Property"
                value={writer.property_income || writer.total_property_earning}
              />
              <Field label="Live Stock" value={formatLivestockSummary(writer)} />
              <Field
                label="Occupation Details"
                value={
                  writer.occupation_details ||
                  writer.occupation ||
                  writer.health_notes
                }
              />
            </div>
            <div className="aid-printable__col">
              <Field label="Contact No" value={writer.phone} />
              <Field label="Province" value={writer.province} />
              <Field
                label="Total Rent"
                value={writer.total_rent || writer.rent_amount}
              />
              <Field label="Avg Monthly Income" value={writer.monthly_income} />
            </div>
          </div>
        ) : (
          <p className="aid-printable__muted">
            No separate supporter — applicant is the beneficiary.
          </p>
        )}

        <div className="aid-printable__divider" />

        <div className="aid-printable__footer">
          <Field
            label="Applicant Requirements"
            value={
              formatAidRequestType(app.requested_aid_type) ||
              app.request_summary
            }
          />
          <div className="aid-printable__signs">
            <div className="aid-printable__sign">
              <span className="aid-printable__sign-name">
                {dash(
                  preparedBy ||
                    (app.created_by
                      ? app.created_by.full_name ||
                        app.created_by.name ||
                        app.created_by.email
                      : ''),
                )}
              </span>
              <span className="aid-printable__sign-line" />
              <span className="aid-printable__sign-label">Prepared by</span>
            </div>
            <div className="aid-printable__sign">
              <span className="aid-printable__sign-name">&nbsp;</span>
              <span className="aid-printable__sign-line" />
              <span className="aid-printable__sign-label">Approved by</span>
            </div>
          </div>
        </div>
      </div>

      {hasZakat ? (
        <div className="aid-printable-doc">
          <div className="aid-printable__toolbar no-print">
            <p className="aid-printable__toolbar-hint">
              Zakat Permission Letter
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => printAidElement(zakatPrintRef.current)}
            >
              Print zakat
            </button>
          </div>
          <div
            ref={zakatPrintRef}
            id="aid-zakat-printable"
            className="aid-printable aid-printable--form"
          >
            <AidZakatPermissionForm
              value={app.zakat_permission}
              applicationNo={app.application_no}
              readOnly
            />
          </div>
        </div>
      ) : null}

      {hasConsent ? (
        <div className="aid-printable-doc">
          <div className="aid-printable__toolbar no-print">
            <p className="aid-printable__toolbar-hint">
              {isWheelchairConsentProgram(app.aid_program) ||
              isWheelchairConsentForm(app.consent_form)
                ? 'Wheelchair Affidavit / Consent'
                : isMarriageGiftConsentProgram(
                      app.requested_aid_type,
                      app.aid_program,
                    ) || isMarriageGiftConsentForm(app.consent_form)
                  ? 'Marriage Gift Receipt / Consent'
                  : 'Consent Form'}
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => printAidElement(consentPrintRef.current)}
            >
              Print consent
            </button>
          </div>
          <div
            ref={consentPrintRef}
            id="aid-consent-printable"
            className="aid-printable aid-printable--form"
          >
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
        </div>
      ) : null}
    </section>
  );
};

export default AidApplicationPrintable;
