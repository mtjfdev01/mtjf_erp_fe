import React, { useRef } from 'react';

/**
 * Thumb / signature pad with:
 * - Upload image (works for all users — no SecuGen WebAPI install)
 * - Optional live Capture (SecuGen WebAPI / window.mtjfDevices when present)
 */
const AidBiometricCaptureSlot = ({
  label,
  value,
  onCapture,
  onUpload,
  onClear,
  readOnly,
  busy,
  kind = 'thumb',
  allowUpload = true,
  labels = {},
}) => {
  const inputRef = useRef(null);
  const preview = value?.data_url || value?.url || null;
  const {
    capture = 'Capture',
    upload = 'Upload',
    clear = 'Clear',
    empty = 'Upload an image, or Capture if the device service is available',
    capturing = 'Capturing…',
  } = labels;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUpload) return;
    await onUpload(file);
  };

  return (
    <div className={`aid-zakat-capture aid-zakat-capture--${kind}`}>
      <div className="aid-zakat-capture__label">{label}</div>
      <div className="aid-zakat-capture__pad">
        {preview ? (
          <img src={preview} alt={label} className="aid-zakat-capture__img" />
        ) : (
          <span className="aid-zakat-capture__empty">{empty}</span>
        )}
      </div>
      {!readOnly && (
        <div className="aid-zakat-capture__actions">
          {allowUpload ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="aid-fh-photo__input"
                onChange={onFile}
              />
              <button
                type="button"
                className="aid-mini-btn aid-mini-btn--add"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {upload}
              </button>
            </>
          ) : null}
          {onCapture ? (
            <button
              type="button"
              className="aid-mini-btn"
              disabled={busy}
              onClick={onCapture}
              title="Requires SecuGen WebAPI on this PC (optional)"
            >
              {busy ? capturing : capture}
            </button>
          ) : null}
          {preview ? (
            <button
              type="button"
              className="aid-mini-btn aid-mini-btn--remove"
              disabled={busy}
              onClick={onClear}
            >
              {clear}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AidBiometricCaptureSlot;

export function fileToCapturePayload(file, source = 'upload') {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl.startsWith('data:')) {
        reject(new Error('Could not read image'));
        return;
      }
      resolve({
        data_url: dataUrl,
        url: null,
        source,
        file_name: file.name || null,
        captured_at: new Date().toISOString(),
      });
    };
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}
