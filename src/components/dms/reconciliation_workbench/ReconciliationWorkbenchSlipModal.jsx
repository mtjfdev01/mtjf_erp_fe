import React from 'react';
import { FiX, FiExternalLink, FiFileText } from 'react-icons/fi';

const ReconciliationWorkbenchSlipModal = ({ isOpen, onClose, attachment, reference }) => {
  if (!isOpen || !attachment) return null;

  const url = attachment.url;
  const isImage =
    attachment.type === 'image' ||
    /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(url) ||
    url.includes('/image');
  const isPdf =
    attachment.type === 'pdf' ||
    /\.pdf$/i.test(url) ||
    url.includes('/pdf');

  return (
    <div
      className="rw-modal-overlay rw-modal-overlay-slip"
      style={{ zIndex: 1200 }}
      onClick={onClose}
    >
      <div
        className="rw-modal"
        style={{ maxWidth: '820px', zIndex: 1201 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rw-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiFileText style={{ color: '#2563eb', fontSize: 20 }} />
            <h3 className="rw-modal-title">
              Slip Attachment &mdash; {reference || attachment.name || 'Receipt Slip'}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rw-btn-outline"
                style={{ padding: '4px 10px', fontSize: 12.5 }}
              >
                <FiExternalLink /> Open original
              </a>
            )}
            <button type="button" className="rw-modal-close" onClick={onClose}>
              <FiX />
            </button>
          </div>
        </div>

        <div
          className="rw-modal-body"
          style={{
            minHeight: '400px',
            maxHeight: '75vh',
            padding: '16px',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a08',
          }}
        >
          {isImage ? (
            <img
              src={url}
              alt={attachment.name || 'Slip'}
              style={{
                maxWidth: '100%',
                maxHeight: '65vh',
                objectFit: 'contain',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
          ) : isPdf ? (
            <iframe
              src={url}
              title={attachment.name || 'Document'}
              style={{
                width: '100%',
                height: '65vh',
                border: 'none',
                borderRadius: '6px',
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <FiFileText style={{ fontSize: 50, color: '#64748b', marginBottom: 16 }} />
              <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                {attachment.name || 'Attached Document'}
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rw-btn-approve"
                style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 10 }}
              >
                Download / View Attachment
              </a>
            </div>
          )}
        </div>

        <div className="rw-modal-footer">
          <button type="button" className="rw-btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReconciliationWorkbenchSlipModal;
