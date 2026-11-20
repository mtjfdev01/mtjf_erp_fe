import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import '../reportingHierarchy.css';

const PersonHierarchyView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `/reporting-hierarchy/people/${userId}`,
        );
        if (!cancelled) setData(res.data?.data || null);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load hierarchy');
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const user = data?.user;

  return (
    <>
      <Navbar />
      <div className="rh-page">
        <PageHeader
          title={user?.display_name || 'Employee hierarchy'}
          backPath="/dms/reporting-hierarchy"
          breadcrumbs={[
            { label: 'DMS Menu', path: '/admin' },
            { label: 'Reporting Hierarchy', path: '/dms/reporting-hierarchy' },
            { label: user?.display_name || 'View' },
          ]}
          rightElement={
            <button
              type="button"
              className="primary_btn"
              onClick={() =>
                navigate(`/dms/reporting-hierarchy/people/${userId}/edit`)
              }
            >
              <FiEdit2 style={{ marginRight: 6 }} />
              Manage managers
            </button>
          }
        />

        {loading ? (
          <div className="rh-loading">Loading…</div>
        ) : !data ? (
          <div className="rh-empty">
            <p>Could not load this employee.</p>
          </div>
        ) : (
          <div className="rh-detail-grid">
            <section className="rh-card">
              <h3>Employee</h3>
              <dl className="rh-dl">
                <div>
                  <dt>Name</dt>
                  <dd>{user.display_name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user.email || '—'}</dd>
                </div>
                <div>
                  <dt>Department</dt>
                  <dd>{user.department || '—'}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{user.role || '—'}</dd>
                </div>
              </dl>
            </section>

            <section className="rh-card">
              <h3>Reports to</h3>
              <p className="rh-card__label">Primary</p>
              <p>
                {data.primary_manager?.display_name || (
                  <span className="rh-muted">Unassigned</span>
                )}
              </p>
              <p className="rh-card__label">Secondary</p>
              {(data.secondary_managers || []).length === 0 ? (
                <p className="rh-muted">None</p>
              ) : (
                <ul className="rh-simple-list">
                  {data.secondary_managers.map((m) => (
                    <li key={m.id}>{m.display_name}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rh-card">
              <h3>Direct reports ({(data.direct_reports || []).length})</h3>
              {(data.direct_reports || []).length === 0 ? (
                <p className="rh-muted">No direct reports</p>
              ) : (
                <ul className="rh-simple-list">
                  {data.direct_reports.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="rh-link"
                        onClick={() =>
                          navigate(`/dms/reporting-hierarchy/people/${r.id}`)
                        }
                      >
                        {r.display_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rh-card">
              <h3>All reports ({(data.all_reports || []).length})</h3>
              {(data.all_reports || []).length === 0 ? (
                <p className="rh-muted">No reports in chain</p>
              ) : (
                <ul className="rh-simple-list">
                  {data.all_reports.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="rh-link"
                        onClick={() =>
                          navigate(`/dms/reporting-hierarchy/people/${r.id}`)
                        }
                      >
                        {r.display_name}
                      </button>
                      <span className="rh-muted"> · {r.department || '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
};

export default PersonHierarchyView;
