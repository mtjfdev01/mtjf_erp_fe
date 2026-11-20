import React, { useRef, useState } from 'react';
import { FiDownload, FiUpload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ReportingHierarchyTabs from '../ReportingHierarchyTabs';
import '../reportingHierarchy.css';

const FORMAT_COLUMNS = [
  {
    name: 'employee_email',
    required: true,
    note: 'ERP work email of the person who reports',
  },
  {
    name: 'manager_email',
    required: true,
    note: 'ERP work email of their manager',
  },
  {
    name: 'relationship',
    required: false,
    note: 'primary (default) or secondary',
  },
  {
    name: 'department',
    required: false,
    note: 'e.g. hr, it, program, fund_raising',
  },
  {
    name: 'notes',
    required: false,
    note: 'Optional comment',
  },
  {
    name: 'employee_name',
    required: false,
    note: 'Label only — not used for matching',
  },
  {
    name: 'manager_name',
    required: false,
    note: 'Label only — not used for matching',
  },
];

const HierarchyImport = () => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const downloadTemplate = async () => {
    try {
      const res = await axiosInstance.get('/reporting-hierarchy/import/template', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporting_hierarchy_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download template');
    }
  };

  const runImport = async (dryRun) => {
    if (!file) {
      toast.error('Choose a .xlsx or .csv file first');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axiosInstance.post(
        `/reporting-hierarchy/import?dry_run=${dryRun ? 'true' : 'false'}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setResult(res.data?.data || null);
      if (dryRun) {
        toast.info('Validation complete — review results below');
      } else {
        toast.success(res.data?.message || 'Import complete');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="rh-page">
        <PageHeader
          title="Reporting Hierarchy"
          backPath="/dms/reporting-hierarchy"
          breadcrumbs={[
            { label: 'DMS Menu', path: '/admin' },
            { label: 'Reporting Hierarchy', path: '/dms/reporting-hierarchy' },
            { label: 'Import' },
          ]}
        />

        <ReportingHierarchyTabs />

        <div className="rh-import-layout">
          <section className="rh-card rh-import-card">
            <h3>Give this format to departments</h3>
            <p className="rh-muted" style={{ marginBottom: 12 }}>
              Send the Excel template. They fill one row per reporting link
              using ERP work emails, then return the file for upload.
            </p>
            <button
              type="button"
              className="primary_btn"
              onClick={downloadTemplate}
            >
              <FiDownload style={{ marginRight: 6 }} />
              Download Excel template
            </button>

            <h4 className="rh-import-subhead">Column specification</h4>
            <div className="rh-table-wrap">
              <table className="rh-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {FORMAT_COLUMNS.map((c) => (
                    <tr key={c.name}>
                      <td>
                        <code>{c.name}</code>
                      </td>
                      <td>{c.required ? 'Yes' : 'No'}</td>
                      <td>{c.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="rh-import-subhead">Rules for departments</h4>
            <ul className="rh-simple-list">
              <li>Use exact ERP login emails — do not invent addresses.</li>
              <li>
                One row = one link: employee reports to manager.
              </li>
              <li>
                Top leader: only appears as <code>manager_email</code>, not as
                an employee row.
              </li>
              <li>
                <code>relationship</code>: <code>primary</code> (main) or{' '}
                <code>secondary</code>.
              </li>
              <li>
                Names are optional labels for the sheet; matching is by email
                only.
              </li>
            </ul>
          </section>

          <section className="rh-card rh-import-card">
            <h3>Upload filled sheet</h3>
            <p className="rh-muted" style={{ marginBottom: 12 }}>
              Accepts <code>.xlsx</code> (Hierarchy sheet) or <code>.csv</code>.
              Validate first, then import.
            </p>

            <div className="rh-import-file">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setResult(null);
                }}
              />
              {file ? (
                <p className="rh-muted">Selected: {file.name}</p>
              ) : null}
            </div>

            <div className="rh-form-actions" style={{ justifyContent: 'flex-start' }}>
              <button
                type="button"
                className="secondary_btn"
                disabled={busy || !file}
                onClick={() => runImport(true)}
              >
                Validate (dry run)
              </button>
              <button
                type="button"
                className="primary_btn"
                disabled={busy || !file}
                onClick={() => runImport(false)}
              >
                <FiUpload style={{ marginRight: 6 }} />
                {busy ? 'Working…' : 'Import & create hierarchy'}
              </button>
            </div>

            {result ? (
              <div className="rh-import-result">
                <div className="rh-import-summary">
                  <span>
                    Rows: <strong>{result.total_rows}</strong>
                  </span>
                  {result.dry_run ? (
                    <span className="rh-badge rh-badge--secondary">
                      Dry run
                    </span>
                  ) : null}
                  <span>
                    {result.dry_run ? 'Valid' : 'Created'}:{' '}
                    <strong>
                      {result.dry_run ? result.valid : result.created}
                    </strong>
                  </span>
                  {!result.dry_run ? (
                    <span>
                      Updated: <strong>{result.updated}</strong>
                    </span>
                  ) : null}
                  <span>
                    Errors: <strong>{result.errors}</strong>
                  </span>
                </div>

                <div className="rh-table-wrap" style={{ maxHeight: 420, overflow: 'auto' }}>
                  <table className="rh-table">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Employee</th>
                        <th>Manager</th>
                        <th>Rel</th>
                        <th>Status</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result.results || []).map((r) => (
                        <tr key={`${r.row}-${r.employee_email}`}>
                          <td>{r.row}</td>
                          <td>{r.employee_email}</td>
                          <td>{r.manager_email}</td>
                          <td>
                            <span
                              className={`rh-badge rh-badge--${
                                r.relationship === 'primary'
                                  ? 'primary'
                                  : 'secondary'
                              }`}
                            >
                              {r.relationship}
                            </span>
                          </td>
                          <td>
                            {r.status === 'error' ? (
                              <span className="rh-status-err">
                                <FiAlertCircle /> {r.status}
                              </span>
                            ) : (
                              <span className="rh-status-ok">
                                <FiCheckCircle /> {r.status}
                              </span>
                            )}
                          </td>
                          <td>{r.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
};

export default HierarchyImport;
