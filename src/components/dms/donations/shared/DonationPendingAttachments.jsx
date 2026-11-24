import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FiPaperclip, FiPlus, FiTrash2 } from 'react-icons/fi';
import { PrimaryButton } from '../../../common/buttons';
import './DonationPendingAttachments.css';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function makeItem(name, file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    file,
  };
}

/**
 * Pending named attachments for donation create/update.
 * On form submit, call ref.current.collectForSubmit() so a filled name+file
 * is included even if "Add attachment" was not clicked.
 */
const DonationPendingAttachments = forwardRef(function DonationPendingAttachments(
  {
    items = [],
    onChange,
    disabled = false,
    title = 'Attachments',
    fileInputId = 'donation-pending-attachment-file',
    /** Optional upload control shown on the last pending item when documents are queued */
    onUpload = null,
    uploading = false,
    uploadLabel = 'Upload attachments',
    uploadingLabel = 'Uploading...',
  },
  ref,
) {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const draftRef = useRef({ name: '', file: null });
  draftRef.current = { name, file };

  const clearDraft = () => {
    setName('');
    setFile(null);
    setError('');
    const input = document.getElementById(fileInputId);
    if (input) input.value = '';
  };

  useImperativeHandle(ref, () => ({
    collectForSubmit() {
      const trimmed = String(draftRef.current.name || '').trim();
      const draftFile = draftRef.current.file;
      if (trimmed && draftFile && draftFile.size <= MAX_FILE_BYTES) {
        const next = [...items, makeItem(trimmed, draftFile)];
        onChange?.(next);
        clearDraft();
        return next;
      }
      return items;
    },
  }));

  const handleFileChange = (e) => {
    const next = e.target.files?.[0] || null;
    if (next && next.size > MAX_FILE_BYTES) {
      setError('File must be 10MB or smaller');
      setFile(null);
      e.target.value = '';
      return;
    }
    setError('');
    setFile(next);
  };

  const handleAdd = () => {
    const trimmed = String(name || '').trim();
    if (!trimmed) {
      setError('Attachment name is required');
      return;
    }
    if (!file) {
      setError('Please select a file');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('File must be 10MB or smaller');
      return;
    }

    onChange?.([...items, makeItem(trimmed, file)]);
    clearDraft();
  };

  const handleRemove = (id) => {
    onChange?.(items.filter((item) => item.id !== id));
  };

  const showUpload = typeof onUpload === 'function' && items.length > 0;
  const lastItemId = items.length > 0 ? items[items.length - 1].id : null;

  return (
    <div className="donation-pending-attachments">
      <h3 className="form-section-heading">{title}</h3>
      {/* <p className="donation-pending-attachments__hint">
        Choose a file, add a name/note, then click Add (or save the donation). Max 10MB each.
      </p> */}

      <div className="donation-pending-attachments__form">
        <div className="donation-pending-attachments__row">
          <div className="donation-pending-attachments__field donation-pending-attachments__field--file">
            <label className="donation-pending-attachments__sr-only" htmlFor={fileInputId}>
              File
            </label>
            <input
              id={fileInputId}
              type="file"
              className="donation-pending-attachments__file-input"
              onChange={handleFileChange}
              disabled={disabled}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt,application/pdf,image/*"
            />
          </div>

          <div className="donation-pending-attachments__field donation-pending-attachments__field--name">
            <label className="donation-pending-attachments__sr-only" htmlFor={`${fileInputId}-name`}>
              Attachment name
            </label>
            <input
              id={`${fileInputId}-name`}
              type="text"
              className="donation-pending-attachments__name-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Name / note (e.g. Cheque scan)"
              disabled={disabled}
            />
          </div>

          <div className="donation-pending-attachments__field donation-pending-attachments__field--action">
            <PrimaryButton
              type="button"
              className="donation-pending-attachments__add-btn"
              onClick={handleAdd}
              disabled={disabled}
              icon={<FiPlus />}
            >
              Add
            </PrimaryButton>
          </div>
        </div>

        {file && (
          <div className="donation-pending-attachments__selected">
            <FiPaperclip /> Selected: {file.name}
          </div>
        )}

        {error && <div className="form-error">{error}</div>}
      </div>

      {items.length > 0 && (
        <ul className="donation-pending-attachments__list">
          {items.map((item) => {
            const isLast = item.id === lastItemId;
            return (
              <li key={item.id} className="donation-pending-attachments__item">
                <div className="donation-pending-attachments__item-main">
                  <strong>{item.name}</strong>
                  <span>{item.file?.name}</span>
                </div>
                <div className="donation-pending-attachments__item-actions">
                  {showUpload && isLast ? (
                    <button
                      type="button"
                      className="primary_btn donation-pending-attachments__upload-btn"
                      onClick={onUpload}
                      disabled={disabled || uploading}
                    >
                      {uploading ? uploadingLabel : uploadLabel}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="donation-pending-attachments__remove"
                    onClick={() => handleRemove(item.id)}
                    disabled={disabled}
                    title="Remove"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

export default DonationPendingAttachments;

/** Upload pending named attachments after donation create/update. */
export async function uploadPendingEntityAttachments({
  axiosInstance,
  entityId,
  items,
  uploadPath,
  /** Extra FormData fields (e.g. installment_ids for shared recurring attach) */
  extraFields = null,
}) {
  if (!entityId || !items?.length) return { uploaded: 0, failed: 0 };

  let uploaded = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const formData = new FormData();
      formData.append('file', item.file);
      if (item.name) {
        formData.append('description', item.name);
        formData.append('name', item.name);
      }
      if (extraFields && typeof extraFields === 'object') {
        Object.entries(extraFields).forEach(([key, value]) => {
          if (value == null || value === '') return;
          formData.append(key, String(value));
        });
      }
      await axiosInstance.post(uploadPath(entityId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      uploaded += 1;
    } catch (err) {
      console.error('Attachment upload error:', err);
      failed += 1;
    }
  }

  return { uploaded, failed };
}

export async function uploadPendingDonationAttachments({
  axiosInstance,
  donationId,
  items,
}) {
  return uploadPendingEntityAttachments({
    axiosInstance,
    entityId: donationId,
    items,
    uploadPath: (id) => `/donations/${id}/attachments/upload`,
  });
}

export async function uploadPendingRecurringDonationAttachments({
  axiosInstance,
  recurringDonationId,
  items,
  /** When set, same file is linked to each installment under this subscription */
  installmentIds = null,
}) {
  const ids = Array.isArray(installmentIds)
    ? installmentIds.filter((n) => Number.isFinite(Number(n)) && Number(n) > 0)
    : [];
  return uploadPendingEntityAttachments({
    axiosInstance,
    entityId: recurringDonationId,
    items,
    uploadPath: (id) => `/recurring-donations/${id}/attachments/upload`,
    extraFields: ids.length ? { installment_ids: ids.join(',') } : null,
  });
}
