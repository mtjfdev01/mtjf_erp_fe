import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';

import { FiRepeat, FiRefreshCw, FiTrash2, FiFileText } from 'react-icons/fi';
import { formatAuditActor } from '../../../common/audit/auditHistoryLabels';

const UploadPostView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get(`/upload-posts/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load upload post');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load upload post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePublish = async () => {
    try {
      setError('');
      setInfoMessage('');
      await axiosInstance.post(`/upload-posts/${id}/publish`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish to Upload-Post');
    }
  };

  const handleSyncStatus = async () => {
    try {
      setSyncing(true);
      setError('');
      setInfoMessage('');
      const res = await axiosInstance.post(`/upload-posts/${id}/sync-status`);
      if (res.data.success) {
        setInfoMessage(res.data.message || 'Status synced from Upload-Post');
        if (res.data.data?.post) {
          setData(res.data.data.post);
        } else {
          await load();
        }
      } else {
        setError(res.data.message || 'Failed to sync status from Upload-Post');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync status from Upload-Post');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setError('');
      await axiosInstance.delete(`/upload-posts/${id}`);
      navigate('/dms/upload-posts/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive post');
    }
  };

  const status = data?.status || '';
  const scheduledAt = data?.scheduled_at
    ? new Date(data.scheduled_at).toLocaleString()
    : '-';
  const platforms = Array.isArray(data?.platforms) ? data.platforms.join(', ') : '-';
  const photoUrls = Array.isArray(data?.photo_urls) ? data.photo_urls : [];

  const getActions = () => [
    {
      icon: <FiRefreshCw />,
      label: 'Check Upload-Post Status',
      color: '#8b5cf6',
      visible: !!(data?.request_id || data?.job_id),
      disabled: syncing,
      onClick: handleSyncStatus,
    },
    {
      icon: <FiRepeat />,
      label: 'Publish to Upload-Post',
      color: '#10b981',
      visible: status !== 'published' && status !== 'cancelled',
      onClick: handlePublish,
    },
    {
      icon: <FiTrash2 />,
      label: 'Archive',
      color: '#f44336',
      visible: true,
      onClick: () => setShowDeleteModal(true),
    },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Upload Post"
            showBackButton
            backPath="/dms/upload-posts/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Upload Post"
            showBackButton
            backPath="/dms/upload-posts/list"
          />
          <div className="error-message">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title={`Upload Post #${data.id}`}
          showBackButton
          backPath="/dms/upload-posts/list"
          icon={<FiFileText />}
          showEdit={true}
          editPath={`/dms/upload-posts/edit/${data.id}`}
        />

        {error && <div className="error-message">{error}</div>}
        {infoMessage && (
          <div
            className="error-message"
            style={{ backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
          >
            {infoMessage}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <ActionMenu actions={getActions()} />
        </div>

        <div className="view-content">
          <div className="view-section">
            <h3 style={{ marginBottom: 10 }}>Details</h3>

            <div className="view-grid">
              <div>
                <strong>Status</strong>
                <div style={{ textTransform: 'capitalize' }}>{status || '-'}</div>
              </div>
              <div>
                <strong>Platforms</strong>
                <div>{platforms}</div>
              </div>
              <div>
                <strong>Profile</strong>
                <div>{data.upload_post_user || '-'}</div>
              </div>
              <div>
                <strong>Scheduled At</strong>
                <div>{scheduledAt}</div>
              </div>
              <div>
                <strong>Campaign ID</strong>
                <div>{data.campaign_id ?? '-'}</div>
              </div>
              <div>
                <strong>Appeal ID</strong>
                <div>{data.appeal_id ?? '-'}</div>
              </div>
              <div>
                <strong>Facebook Page ID</strong>
                <div>{data.facebook_page_id || '-'}</div>
              </div>
              <div>
                <strong>LinkedIn Page ID</strong>
                <div>{data.target_linkedin_page_id || '-'}</div>
              </div>
              <div>
                <strong>Upload-Post ID</strong>
                <div>{data.upload_post_id || '-'}</div>
              </div>
              <div>
                <strong>Request ID</strong>
                <div>{data.request_id || '-'}</div>
              </div>
              <div>
                <strong>Created By</strong>
                <div>{formatAuditActor(data.created_by) || '-'}</div>
              </div>
            </div>
          </div>

          <div className="view-section">
            <h3 style={{ marginBottom: 10 }}>Content</h3>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {data.title || '-'}
            </pre>
            {data.description ? (
              <div style={{ marginTop: 12, color: '#4b5563' }}>{data.description}</div>
            ) : null}
            {data.first_comment ? (
              <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
                First comment: {data.first_comment}
              </div>
            ) : null}
            {photoUrls.map((url) => (
              <div key={url} style={{ marginTop: 12 }}>
                <img src={url} alt="Post" style={{ maxWidth: '100%', borderRadius: 10 }} />
              </div>
            ))}
          </div>

          {data.last_error ? (
            <div className="view-section">
              <h3 style={{ marginBottom: 10 }}>Last Error</h3>
              <div className="error-message">{data.last_error}</div>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        text="Archive upload post?"
        delete
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default UploadPostView;
