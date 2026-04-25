import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';

const TemplateAdd = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
  });

  const create = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await axiosInstance.post('/progress/workflow-templates', {
        name: form.name?.trim(),
        code: form.code?.trim(),
        description: form.description || null,
        is_active: Boolean(form.is_active),
      });
      if (res.data?.success && res.data?.data?.id) {
        navigate(`/progress/templates/${res.data.data.id}`);
        return;
      }
      setError(res.data?.message || 'Failed to create template');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = form.name.trim().length > 0 && form.code.trim().length > 0;

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader title="Create Workflow Template" showBackButton={true} backPath="/progress/templates" />
        <div className="view-content">
          {error && (
            <div className="status-message status-message--error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div className="view-section">
            <h3 className="view-section-title">Template</h3>
            <div className="form-grid-2">
              <FormInput
                label="Name"
                name="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              <FormInput
                label="Code"
                name="code"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="e.g. qurbani_workflow"
              />
              <FormSelect
                label="Active"
                name="is_active"
                value={form.is_active ? 'true' : 'false'}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}
                options={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
              />
              <FormInput
                label="Description"
                name="description"
                type="textarea"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="primary_btn" onClick={create} disabled={saving || !canSubmit}>
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button type="button" className="secondary_btn" onClick={() => navigate('/progress/templates')} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateAdd;

