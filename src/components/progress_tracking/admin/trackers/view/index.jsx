import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormSelect from '../../../../common/FormSelect';
import FormInput from '../../../../common/FormInput';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TrackersView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState('link');
  const [activeStepId, setActiveStepId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/progress/trackers/${id}`);
      if (res.data?.success) setTracker(res.data.data);
      else setError(res.data?.message || 'Failed to load tracker');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load tracker');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const updateStep = async (stepId, patch) => {
    setSaving(true);
    try {
      await axiosInstance.patch(`/progress/trackers/steps/${stepId}`, patch);
      await fetchData();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update step');
    } finally {
      setSaving(false);
    }
  };

  const addEvidence = async () => {
    if (!activeStepId || !evidenceUrl) return;
    setSaving(true);
    try {
      await axiosInstance.post(`/progress/trackers/steps/${activeStepId}/evidence`, {
        file_url: evidenceUrl,
        file_type: evidenceType,
        title: evidenceTitle || null,
      });
      setEvidenceUrl('');
      setEvidenceTitle('');
      await fetchData();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add evidence');
    } finally {
      setSaving(false);
    }
  };

  const regenToken = async () => {
    setSaving(true);
    try {
      await axiosInstance.post(`/progress/trackers/${id}/token`);
      await fetchData();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to generate token');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Progress Tracker" showBackButton={true} backPath="/progress/trackers" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Progress Tracker" showBackButton={true} backPath="/progress/trackers" />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }

  if (!tracker) return null;

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader title="Progress Tracker" showBackButton={true} backPath="/progress/trackers" />
        <div className="view-content">
          <div className="view-section">
            <h3 className="view-section-title">Summary</h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div><strong>ID:</strong> {tracker.id}</div>
              <div><strong>Overall:</strong> {tracker.overall_status}</div>
              <div><strong>Template:</strong> {tracker.template?.name || '-'}</div>
              <div><strong>Donation:</strong> {tracker.donation_id || '-'}</div>
              <div><strong>Token:</strong> {tracker.public_tracking_token || '-'}</div>
            </div>
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button type="button" className="primary_btn" onClick={regenToken} disabled={saving}>
                {saving ? 'Working...' : (tracker.public_tracking_token ? 'Regenerate Token' : 'Generate Token')}
              </button>
              <button
                type="button"
                className="secondary_btn"
                onClick={() => navigate(`/progress/trackers/${tracker.id}/steps`)}
                disabled={saving}
              >
                Manage Steps
              </button>
              {tracker.donation_id && (
                <button type="button" className="secondary_btn" onClick={() => navigate(`/donations/online_donations/view/${tracker.donation_id}`)}>
                  Open Donation
                </button>
              )}
              {tracker.public_tracking_token && (
                <button type="button" className="secondary_btn" onClick={() => navigate(`/tracking/${tracker.public_tracking_token}`)}>
                  Open Public Page
                </button>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Steps</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {(tracker.steps || []).map((s) => (
                <div key={s.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontWeight: 600 }}>{s.step_order}. {s.title}</div>
                    <span className={`status-badge status-${s.status}`}>{s.status}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 10, marginTop: 10 }}>
                    <FormSelect
                      label="Status"
                      name={`status_${s.id}`}
                      value={s.status}
                      onChange={(e) => updateStep(s.id, { status: e.target.value })}
                      options={STATUS_OPTIONS}
                    />
                    <FormInput
                      label="Notes"
                      name={`notes_${s.id}`}
                      type="textarea"
                      value={s.notes || ''}
                      onChange={(e) => updateStep(s.id, { notes: e.target.value })}
                      placeholder="Internal notes / donor-safe notes depending on visibility"
                    />
                  </div>

                  {(s.evidence || []).length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(s.evidence || []).map((ev) => (
                        <a key={ev.id} href={ev.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                          {ev.evidence_label ? `${ev.evidence_label}: ` : ''}{ev.title || ev.file_type}
                        </a>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10, alignItems: 'end' }}>
                    <FormInput
                      label="Evidence URL"
                      name={`evidence_${s.id}`}
                      value={activeStepId === s.id ? evidenceUrl : ''}
                      onChange={(e) => { setActiveStepId(s.id); setEvidenceUrl(e.target.value); }}
                      placeholder="https://..."
                    />
                    <button type="button" className="secondary_btn" onClick={() => { setActiveStepId(s.id); addEvidence(); }} disabled={saving}>
                      Add Evidence
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 10, marginTop: 8 }}>
                    <FormInput
                      label="Evidence Title"
                      name={`evidence_title_${s.id}`}
                      value={activeStepId === s.id ? evidenceTitle : ''}
                      onChange={(e) => { setActiveStepId(s.id); setEvidenceTitle(e.target.value); }}
                      placeholder="Optional"
                    />
                    <FormSelect
                      label="Type"
                      name={`evidence_type_${s.id}`}
                      value={activeStepId === s.id ? evidenceType : 'link'}
                      onChange={(e) => { setActiveStepId(s.id); setEvidenceType(e.target.value); }}
                      options={[
                        { value: 'image', label: 'Image' },
                        { value: 'video', label: 'Video' },
                        { value: 'pdf', label: 'PDF' },
                        { value: 'document', label: 'Document' },
                        { value: 'link', label: 'Link' },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrackersView;

