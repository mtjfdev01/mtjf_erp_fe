import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import '../reportingHierarchy.css';

const userLabel = (u) => {
  if (!u) return '';
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return name ? `${name} (${u.email || u.id})` : u.email || `#${u.id}`;
};

const PersonHierarchyEdit = () => {
  const { userId: paramUserId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAssignNew = !paramUserId;

  const [userOptions, setUserOptions] = useState([]);
  const [employeeId, setEmployeeId] = useState(paramUserId || '');
  const [primaryManagerId, setPrimaryManagerId] = useState('');
  const [secondaryIds, setSecondaryIds] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(!isAssignNew);
  const [saving, setSaving] = useState(false);
  const [employeeName, setEmployeeName] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get('/users/lookup', {
          params: { activeOnly: true, limit: 500 },
        });
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        if (cancelled) return;
        setUserOptions(
          list.map((u) => ({
            value: String(u.id ?? u.value),
            label:
              u.label ||
              userLabel(u) ||
              String(u.id ?? u.value),
            raw: u,
          })),
        );
      } catch {
        toast.error('Failed to load users');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const prefill = searchParams.get('user_id');
    if (isAssignNew && prefill) setEmployeeId(prefill);
  }, [isAssignNew, searchParams]);

  useEffect(() => {
    if (!paramUserId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `/reporting-hierarchy/people/${paramUserId}`,
        );
        const data = res.data?.data;
        if (cancelled || !data) return;
        setEmployeeName(data.user?.display_name || '');
        setEmployeeId(String(data.user?.id || paramUserId));
        setPrimaryManagerId(
          data.primary_manager?.id != null
            ? String(data.primary_manager.id)
            : '',
        );
        setSecondaryIds(
          (data.secondary_managers || []).map((m) => String(m.id)),
        );
        setNotes('');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paramUserId]);

  const managerOptions = useMemo(
    () =>
      userOptions.filter(
        (o) => o.value !== String(employeeId || paramUserId || ''),
      ),
    [userOptions, employeeId, paramUserId],
  );

  const toggleSecondary = (id) => {
    setSecondaryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = Number(employeeId || paramUserId);
    if (!uid) {
      toast.error('Select an employee');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.put(`/reporting-hierarchy/people/${uid}`, {
        primary_manager_id: primaryManagerId
          ? Number(primaryManagerId)
          : null,
        secondary_manager_ids: secondaryIds
          .map((id) => Number(id))
          .filter((id) => id && id !== Number(primaryManagerId)),
        notes: notes.trim() || null,
      });
      toast.success('Reporting managers saved');
      navigate(`/dms/reporting-hierarchy/people/${uid}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="rh-page">
          <p>Loading…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="rh-page">
        <PageHeader
          title={
            isAssignNew
              ? 'Assign managers'
              : `Manage: ${employeeName || `#${paramUserId}`}`
          }
          backPath={
            paramUserId
              ? `/dms/reporting-hierarchy/people/${paramUserId}`
              : '/dms/reporting-hierarchy'
          }
          breadcrumbs={[
            { label: 'DMS Menu', path: '/admin' },
            { label: 'Reporting Hierarchy', path: '/dms/reporting-hierarchy' },
            { label: isAssignNew ? 'Assign' : 'Manage' },
          ]}
        />

        <form className="rh-form" onSubmit={handleSubmit}>
          {isAssignNew ? (
            <FormSelect
              name="employee_id"
              label="Employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              options={userOptions}
              showDefaultOption
              defaultOptionText="Select employee"
              required
            />
          ) : null}

          <FormSelect
            name="primary_manager_id"
            label="Primary manager"
            value={primaryManagerId}
            onChange={(e) => {
              setPrimaryManagerId(e.target.value);
              setSecondaryIds((prev) =>
                prev.filter((id) => id !== e.target.value),
              );
            }}
            options={managerOptions}
            showDefaultOption
            defaultOptionText="No primary manager"
          />

          <div className="form-group">
            <label className="form-label">Secondary managers</label>
            <div className="rh-secondary-grid">
              {managerOptions
                .filter((o) => o.value !== primaryManagerId)
                .slice(0, 80)
                .map((o) => (
                  <label key={o.value} className="rh-check">
                    <input
                      type="checkbox"
                      checked={secondaryIds.includes(o.value)}
                      onChange={() => toggleSecondary(o.value)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
            </div>
            <p className="rh-muted">
              Optional dotted-line / matrix managers. Clearing primary and saving
              removes active edges for this employee in this module.
            </p>
          </div>

          <FormTextarea
            name="notes"
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional reason for this assignment"
          />

          <div className="rh-form-actions">
            <button
              type="button"
              className="secondary_btn"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="primary_btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default PersonHierarchyEdit;
