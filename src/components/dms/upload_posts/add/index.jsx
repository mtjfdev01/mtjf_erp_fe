import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';

import { FiUpload } from 'react-icons/fi';

const PLATFORM_OPTIONS = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'threads', label: 'Threads' },
];

const initialForm = {
  campaign_id: '',
  appeal_id: '',
  upload_post_user: '',
  platforms: [],
  title: '',
  description: '',
  image_url: '',
  facebook_page_id: '',
  target_linkedin_page_id: '',
  first_comment: '',
  scheduled_at: '',
  publish_to_upload_post: false,
  status: 'draft',
};

const UploadPostAdd = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [profileOptions, setProfileOptions] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const [pageOptions, setPageOptions] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoadingProfiles(true);
        const res = await axiosInstance.get('/upload-posts/profiles');
        if (res.data.success) {
          const list = res.data.data || [];
          setProfileOptions(
            list.map((p) => ({
              value: p.username,
              label: p.display_name
                ? `${p.display_name} (${p.username})`
                : p.username,
            })),
          );
        } else {
          setError(res.data.message || 'Failed to load Upload-Post profiles');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load Upload-Post profiles');
      } finally {
        setLoadingProfiles(false);
      }
    };
    loadProfiles();
  }, []);

  useEffect(() => {
    const loadPages = async () => {
      if (!form.platforms.includes('facebook') || !form.upload_post_user) {
        setPageOptions([]);
        return;
      }
      try {
        setLoadingPages(true);
        const res = await axiosInstance.get('/upload-posts/facebook/pages', {
          params: { user: form.upload_post_user },
        });
        if (res.data.success) {
          const pages = res.data.data || [];
          setPageOptions(
            pages.map((p) => {
              const id = p.id || p.page_id || p.facebook_page_id;
              const name = p.name || p.page_name || id;
              return { value: String(id), label: name };
            }),
          );
        }
      } catch {
        // optional helper; user can still type page id
      } finally {
        setLoadingPages(false);
      }
    };
    loadPages();
  }, [form.platforms, form.upload_post_user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const togglePlatform = (value) => {
    setForm((prev) => {
      const has = prev.platforms.includes(value);
      return {
        ...prev,
        platforms: has
          ? prev.platforms.filter((p) => p !== value)
          : [...prev.platforms, value],
      };
    });
    if (error) setError('');
  };

  const handleUploadImage = async (file) => {
    if (!file) return;
    try {
      setError('');
      const fd = new FormData();
      fd.append('file', file);
      const res = await axiosInstance.post('/upload-posts/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setForm((prev) => ({ ...prev, image_url: res.data.data.url || '' }));
      } else {
        setError(res.data.message || 'Failed to upload image');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!form.platforms.length) {
      setError('Select at least one platform');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      campaign_id: form.campaign_id ? Number(form.campaign_id) : undefined,
      appeal_id: form.appeal_id ? Number(form.appeal_id) : undefined,
      upload_post_user: form.upload_post_user || undefined,
      platforms: form.platforms,
      title: form.title || undefined,
      description: form.description || undefined,
      image_url: form.image_url || undefined,
      facebook_page_id: form.facebook_page_id || undefined,
      target_linkedin_page_id: form.target_linkedin_page_id || undefined,
      first_comment: form.first_comment || undefined,
      scheduled_at: form.scheduled_at
        ? new Date(form.scheduled_at).toISOString()
        : undefined,
      publish_to_upload_post: form.publish_to_upload_post,
      status: form.status,
    };

    try {
      await axiosInstance.post('/upload-posts', payload);
      navigate('/dms/upload-posts/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create upload post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate('/dms/upload-posts/list');
  const showFacebook = form.platforms.includes('facebook');
  const showLinkedIn = form.platforms.includes('linkedin');

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Create Upload Post" onBack={handleBack} />

        {error && <div className="status-message status-message--error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput
                label="Campaign ID (optional)"
                type="number"
                name="campaign_id"
                value={form.campaign_id}
                onChange={handleChange}
                placeholder="e.g. 12"
              />
              <FormInput
                label="Appeal ID (optional)"
                type="number"
                name="appeal_id"
                value={form.appeal_id}
                onChange={handleChange}
                placeholder="e.g. 45"
              />
            </div>
          </div>

          <div className="form-section">
            <FormSelect
              name="upload_post_user"
              label="Upload-Post Profile"
              value={form.upload_post_user}
              options={profileOptions}
              onChange={handleChange}
              showDefaultOption
              defaultOptionText={loadingProfiles ? 'Loading...' : 'Select profile'}
              required
            />

            <div style={{ marginTop: 12 }}>
              <label className="form-label">Platforms</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                {PLATFORM_OPTIONS.map((p) => (
                  <label key={p.value} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={form.platforms.includes(p.value)}
                      onChange={() => togglePlatform(p.value)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                YouTube uses the video API and is not available on photo posts.
              </div>
            </div>

            <FormInput
              label="Scheduled At (optional)"
              type="datetime-local"
              name="scheduled_at"
              value={form.scheduled_at}
              onChange={handleChange}
            />
          </div>

          {showFacebook && (
            <div className="form-section">
              {pageOptions.length > 0 ? (
                <FormSelect
                  name="facebook_page_id"
                  label="Facebook Page"
                  value={form.facebook_page_id}
                  options={pageOptions}
                  onChange={handleChange}
                  showDefaultOption
                  defaultOptionText={loadingPages ? 'Loading...' : 'Select Facebook page'}
                  required
                />
              ) : (
                <FormInput
                  label="Facebook Page ID"
                  type="text"
                  name="facebook_page_id"
                  value={form.facebook_page_id}
                  onChange={handleChange}
                  placeholder="Required for Facebook"
                  required
                />
              )}
            </div>
          )}

          {showLinkedIn && (
            <div className="form-section">
              <FormInput
                label="LinkedIn Page ID (optional)"
                type="text"
                name="target_linkedin_page_id"
                value={form.target_linkedin_page_id}
                onChange={handleChange}
                placeholder="Organization page ID, or leave blank for personal"
              />
            </div>
          )}

          <div className="form-section">
            <FormTextarea
              label="Title / Caption"
              name="title"
              value={form.title}
              onChange={handleChange}
              rows={4}
              placeholder="Default caption for all platforms"
            />
            <FormTextarea
              label="Description (optional)"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Used on LinkedIn / Facebook extended text"
            />
            <FormTextarea
              label="First Comment (optional)"
              name="first_comment"
              value={form.first_comment}
              onChange={handleChange}
              rows={2}
              placeholder="Auto first comment after publish"
            />
          </div>

          <div className="form-section">
            <FormTextarea
              label="Photo URL"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              rows={2}
              placeholder="Public HTTPS image URL"
            />

            <div className="form-actions" style={{ justifyContent: 'space-between' }}>
              <label
                className="secondary_btn"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
              >
                <FiUpload style={{ marginRight: 8 }} />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleUploadImage(e.target.files?.[0])}
                />
              </label>

              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  name="publish_to_upload_post"
                  checked={form.publish_to_upload_post}
                  onChange={handleChange}
                />
                Publish to Upload-Post
              </label>
            </div>

            {form.image_url ? (
              <div style={{ marginTop: 12 }}>
                <img
                  src={form.image_url}
                  alt="Preview"
                  style={{ maxWidth: '100%', borderRadius: 8 }}
                />
              </div>
            ) : null}
          </div>

          <div className="form-section">
            <div style={{ marginBottom: 8, color: '#6b7280' }}>
              <strong>Preview</strong>
              <div style={{ fontSize: 13 }}>
                Profile: {form.upload_post_user || '—'} | Platforms:{' '}
                {form.platforms.length ? form.platforms.join(', ') : '—'} | Scheduled:{' '}
                {form.scheduled_at ? new Date(form.scheduled_at).toLocaleString() : '—'}
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {form.title || form.description || 'Write something to see preview...'}
              </pre>
              {form.image_url ? (
                <div style={{ marginTop: 12 }}>
                  <img
                    src={form.image_url}
                    alt="Preview"
                    style={{ maxWidth: '100%', borderRadius: 10 }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary_btn" onClick={handleBack}>
              Cancel
            </button>
            <button type="submit" className="primary_btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Upload Post'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UploadPostAdd;
