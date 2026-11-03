import React, { useCallback, useEffect, useState } from 'react';
import { FiCopy, FiKey, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { isSuperAdmin } from '../../../../utils/permissions';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ConfirmationModal from '../../../common/ConfirmationModal';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import ActionMenu from '../../../common/ActionMenu';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import './ApiKeysList.css';

const KNOWN_SCOPES = [
  { value: 'ask_clinic', label: 'Ask Clinic (all)' },
  { value: 'ask_clinic.beneficiaries', label: 'Ask Clinic · Beneficiaries search' },
];

const canManageApiKeys = (permissions) =>
  isSuperAdmin(permissions) ||
  permissions?.program_manager === true ||
  permissions?.fund_raising_manager === true ||
  permissions?.fund_raising?.manager === true;

const ApiKeysList = () => {
  const { permissions } = useAuth();
  const canManage = canManageApiKeys(permissions);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [form, setForm] = useState({
    name: '',
    notes: '',
    scopes: ['ask_clinic', 'ask_clinic.beneficiaries'],
  });

  const fetchRows = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      setRows([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/api-keys');
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load API keys';
      setError(msg);
      toast.error(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const toggleScope = (scope) => {
    setForm((prev) => {
      const has = prev.scopes.includes(scope);
      return {
        ...prev,
        scopes: has
          ? prev.scopes.filter((s) => s !== scope)
          : [...prev.scopes, scope],
      };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.scopes.length) {
      toast.error('Select at least one scope');
      return;
    }
    setCreating(true);
    try {
      const res = await axiosInstance.post('/api-keys', {
        name: form.name.trim(),
        notes: form.notes.trim() || undefined,
        scopes: form.scopes,
      });
      const data = res.data?.data;
      setCreatedKey(data?.api_key || null);
      toast.success('API key created — copy it now');
      setForm({
        name: '',
        notes: '',
        scopes: ['ask_clinic', 'ask_clinic.beneficiaries'],
      });
      setShowCreate(false);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (row) => {
    try {
      await axiosInstance.patch(`/api-keys/${row.id}`, {
        is_active: !row.is_active,
      });
      toast.success(row.is_active ? 'Key deactivated' : 'Key activated');
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update key');
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget?.id) return;
    setRevoking(true);
    try {
      await axiosInstance.delete(`/api-keys/${revokeTarget.id}`);
      toast.success('API key revoked');
      setRevokeTarget(null);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke key');
    } finally {
      setRevoking(false);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const openCreateForm = () => {
    setShowCreate(true);
    setCreatedKey(null);
  };

  if (!canManage) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <PageHeader title="API Keys" backPath="/admin" />
          <p className="api-keys-hint">
            You do not have permission to manage integration API keys.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container api-keys-page">
        <PageHeader
          title="API Keys"
          backPath="/admin"
          onRefresh={fetchRows}
          rightElement={
            <button
              type="button"
              className="primary_btn"
              onClick={() => {
                if (showCreate) setShowCreate(false);
                else openCreateForm();
              }}
            >
              <FiPlus style={{ marginRight: 6 }} />
              {showCreate ? 'Close' : 'New API key'}
            </button>
          }
        />

        <p className="api-keys-hint">
          Integration keys for Ask Clinic and future partners (
          <code>api_keys</code> table). Donation partner keys stay under{' '}
          <code>/external/api-keys</code> and are managed separately.
        </p>

        {createdKey ? (
          <div className="api-keys-secret-banner">
            <div>
              <strong>Copy this key now</strong> — it will not be shown again.
              <code className="api-keys-secret">{createdKey}</code>
            </div>
            <button
              type="button"
              className="secondary_btn"
              onClick={() => copyText(createdKey)}
            >
              <FiCopy style={{ marginRight: 6 }} />
              Copy
            </button>
          </div>
        ) : null}

        {showCreate ? (
          <form className="api-keys-create" onSubmit={handleCreate}>
            <h3 className="api-keys-create__title">
              <FiKey style={{ marginRight: 8 }} />
              Create integration key
            </h3>
            <FormInput
              name="name"
              label="Partner / integration name"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="Ask Clinic / AAS"
              required
            />
            <div className="form-group">
              <label className="form-label">Scopes</label>
              <div className="api-keys-scopes">
                {KNOWN_SCOPES.map((s) => (
                  <label key={s.value} className="api-keys-scope">
                    <input
                      type="checkbox"
                      checked={form.scopes.includes(s.value)}
                      onChange={() => toggleScope(s.value)}
                    />
                    <span>{s.label}</span>
                    <code>{s.value}</code>
                  </label>
                ))}
              </div>
            </div>
            <FormTextarea
              name="notes"
              label="Notes (optional)"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              placeholder="Production key for AAS Clinics…"
            />
            <div className="api-keys-create__actions">
              <button
                type="submit"
                className="primary_btn"
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create key'}
              </button>
            </div>
          </form>
        ) : null}

        {error ? (
          <div className="status-message status-message--error">{error}</div>
        ) : null}

        {loading ? (
          <div className="api-keys-loading">Loading…</div>
        ) : rows.length === 0 && !showCreate ? (
          <div className="api-keys-empty">
            <p>No integration API keys yet. Create one for Ask Clinic.</p>
            <button
              type="button"
              className="primary_btn"
              onClick={openCreateForm}
            >
              <FiPlus style={{ marginRight: 6 }} />
              New API key
            </button>
          </div>
        ) : rows.length === 0 && showCreate ? null : (
          <div className="api-keys-table-wrap">
            <table className="api-keys-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Prefix</th>
                  <th>Scopes</th>
                  <th>Status</th>
                  <th>Last used</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                      {row.notes ? (
                        <div className="api-keys-notes">{row.notes}</div>
                      ) : null}
                    </td>
                    <td>
                      <code>{row.key_prefix || '—'}…</code>
                    </td>
                    <td>
                      {(row.scopes || []).length ? (
                        <div className="api-keys-scope-chips">
                          {row.scopes.map((s) => (
                            <span key={s} className="api-keys-chip">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span
                        className={`api-keys-badge${
                          row.is_active
                            ? ' api-keys-badge--active'
                            : ' api-keys-badge--inactive'
                        }`}
                      >
                        {row.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {row.last_used_at
                        ? new Date(row.last_used_at).toLocaleString()
                        : 'Never'}
                    </td>
                    <td>
                      <ActionMenu
                        actions={[
                          {
                            label: row.is_active ? 'Deactivate' : 'Activate',
                            visible: true,
                            onClick: () => handleToggleActive(row),
                          },
                          {
                            label: 'Revoke',
                            icon: <FiTrash2 />,
                            visible: true,
                            color: '#b91c1c',
                            onClick: () => setRevokeTarget(row),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!revokeTarget}
        delete
        text={
          revokeTarget
            ? `Revoke “${revokeTarget.name}” (${revokeTarget.key_prefix || ''}…)? Partners using this key will stop working.`
            : ''
        }
        onConfirm={() => {
          if (!revoking) handleRevoke();
        }}
        onCancel={() => !revoking && setRevokeTarget(null)}
      />
    </>
  );
};

export default ApiKeysList;
