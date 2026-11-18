import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../../../utils/axios';
import FormInput from '../../common/FormInput';

const emptyForm = {
  platform: '',
  amount: '',
  spend_date: '',
  notes: '',
  attachment_url: '',
  attachment_name: '',
  attachment_type: '',
};

const newDraftKey = () =>
  `spend-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const CampaignAdSpendSection = ({
  campaignId = null,
  draftSpends = [],
  onDraftSpendsChange = null,
  currency = 'PKR',
  onTotalChange = null,
}) => {
  const isDraftMode = !campaignId && typeof onDraftSpendsChange === 'function';
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingKey, setEditingKey] = useState(null);
  const [loading, setLoading] = useState(!isDraftMode);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const displayItems = isDraftMode ? draftSpends : items;
  const total = useMemo(
    () =>
      displayItems.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0,
      ),
    [displayItems],
  );

  useEffect(() => {
    onTotalChange?.(total);
  }, [onTotalChange, total]);

  const fetchItems = useCallback(async () => {
    if (!campaignId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/campaigns/${campaignId}/ad-spends`,
      );
      if (response.data.success) setItems(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ad spend');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) fetchItems();
  }, [campaignId, fetchItems]);

  const resetForm = () => {
    setEditingKey(null);
    setForm(emptyForm);
    setError('');
  };

  const startEdit = (item) => {
    setEditingKey(isDraftMode ? item._key : item.id);
    setForm({
      platform: item.platform || '',
      amount: item.amount != null ? String(item.amount) : '',
      spend_date: item.spend_date ? String(item.spend_date).slice(0, 10) : '',
      notes: item.notes || '',
      attachment_url: item.attachment_url || '',
      attachment_name: item.attachment_name || '',
      attachment_type: item.attachment_type || '',
    });
  };

  const uploadAttachment = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      const body = new FormData();
      body.append('file', file);
      const response = await axiosInstance.post(
        '/campaigns/upload/ad-spend-attachment',
        body,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const uploaded = response.data?.data;
      if (!uploaded?.url) throw new Error('No attachment URL returned');
      setForm((prev) => ({
        ...prev,
        attachment_url: uploaded.url,
        attachment_name: uploaded.file_name || file.name,
        attachment_type: uploaded.file_type || file.type,
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    const payload = {
      platform: form.platform.trim(),
      amount: Number(form.amount),
      spend_date: form.spend_date || null,
      notes: form.notes.trim() || null,
      attachment_url: form.attachment_url || null,
      attachment_name: form.attachment_name || null,
      attachment_type: form.attachment_type || null,
    };
    if (!payload.platform || !Number.isFinite(payload.amount) || payload.amount <= 0) {
      setError('Platform and an amount greater than zero are required');
      return;
    }

    if (isDraftMode) {
      onDraftSpendsChange(
        editingKey
          ? draftSpends.map((item) =>
              item._key === editingKey ? { ...item, ...payload } : item,
            )
          : [...draftSpends, { _key: newDraftKey(), ...payload }],
      );
      resetForm();
      return;
    }

    try {
      setSaving(true);
      if (editingKey) {
        await axiosInstance.patch(
          `/campaigns/${campaignId}/ad-spends/${editingKey}`,
          payload,
        );
      } else {
        await axiosInstance.post(`/campaigns/${campaignId}/ad-spends`, payload);
      }
      resetForm();
      await fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save ad spend');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm('Remove this ad-spend entry?')) return;
    const key = isDraftMode ? item._key : item.id;
    if (isDraftMode) {
      onDraftSpendsChange(draftSpends.filter((row) => row._key !== key));
      if (editingKey === key) resetForm();
      return;
    }
    try {
      await axiosInstance.delete(`/campaigns/${campaignId}/ad-spends/${key}`);
      if (editingKey === key) resetForm();
      await fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove ad spend');
    }
  };

  return (
    <div className="form-section">
      <h3 style={{ marginBottom: '8px' }}>Advertising spend by platform</h3>
      <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '13px' }}>
        Add each platform expense. Total spend and pending budget update automatically.
      </p>

      {error && (
        <div className="status-message status-message--error">{error}</div>
      )}

      {loading ? (
        <p>Loading ad spend...</p>
      ) : (
        <>
          {displayItems.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Date</th>
                    <th>Notes</th>
                    <th>Attachment</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item) => {
                    const key = isDraftMode ? item._key : item.id;
                    return (
                      <tr key={key}>
                        <td>{item.platform}</td>
                        <td>{item.spend_date || '—'}</td>
                        <td>{item.notes || '—'}</td>
                        <td>
                          {item.attachment_url ? (
                            <a
                              href={item.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {item.attachment_name || 'View'}
                            </a>
                          ) : '—'}
                        </td>
                        <td>
                          {currency} {Number(item.amount || 0).toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="secondary_btn"
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="secondary_btn"
                              onClick={() => removeItem(item)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan="4"><strong>Total spend</strong></td>
                    <td colSpan="2">
                      <strong>{currency} {total.toLocaleString()}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: '16px', borderRadius: '8px', background: '#f9fafb' }}>
            <h4 style={{ margin: '0 0 12px' }}>
              {editingKey ? 'Edit expense' : 'Add expense'}
            </h4>
            <div className="form-grid-2">
              <FormInput
                label="Ad platform"
                name="platform"
                value={form.platform}
                onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
                placeholder="e.g. Facebook, Google, TikTok"
                list="campaign-ad-platforms"
                maxLength={120}
              />
              <datalist id="campaign-ad-platforms">
                <option value="Facebook / Meta" />
                <option value="Instagram" />
                <option value="Google Ads" />
                <option value="YouTube" />
                <option value="TikTok" />
                <option value="LinkedIn" />
                <option value="X / Twitter" />
              </datalist>
              <FormInput
                label="Amount"
                type="number"
                name="amount"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                min={0.01}
                step="0.01"
              />
              <FormInput
                label="Spend date"
                type="date"
                name="spend_date"
                value={form.spend_date}
                onChange={(e) => setForm((prev) => ({ ...prev, spend_date: e.target.value }))}
              />
              <FormInput
                label="Notes / ad reference"
                name="notes"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional campaign, invoice, or ad-set reference"
              />
            </div>
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Attachment (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/jpeg,image/png,image/webp,image/gif"
                onChange={uploadAttachment}
                disabled={uploading || saving}
              />
              {uploading && <div style={{ marginTop: '6px' }}>Uploading…</div>}
              {form.attachment_url && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '10px' }}>
                  <a href={form.attachment_url} target="_blank" rel="noreferrer">
                    {form.attachment_name || 'View attachment'}
                  </a>
                  <button
                    type="button"
                    className="secondary_btn"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        attachment_url: '',
                        attachment_name: '',
                        attachment_type: '',
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                className="primary_btn"
                disabled={saving || uploading}
                onClick={handleSubmit}
              >
                <FiPlus style={{ marginRight: '6px' }} />
                {saving ? 'Saving...' : editingKey ? 'Update expense' : 'Add expense'}
              </button>
              {editingKey && (
                <button type="button" className="secondary_btn" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CampaignAdSpendSection;
