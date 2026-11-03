import React, { useEffect, useRef, useState } from 'react';

/**
 * Live webcam capture → File (JPEG). Caller applies the file to form state.
 */
const AidWebcamCaptureModal = ({
  open,
  onClose,
  onCapture,
  title = 'Webcam',
  captureLabel = 'Take photo',
  closeLabel = 'Close',
  errorUnavailable = 'Camera not available or permission denied',
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setError('');
    setReady(false);

    const start = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError(errorUnavailable);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setReady(true);
      } catch {
        setError(errorUnavailable);
      }
    };

    start();

    return () => {
      cancelled = true;
      setReady(false);
      const stream = streamRef.current;
      streamRef.current = null;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      const video = videoRef.current;
      if (video) video.srcObject = null;
    };
  }, [open, errorUnavailable]);

  if (!open) return null;

  const stopAndClose = () => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    onClose?.();
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    if (!video || !ready || busy) return;
    setBusy(true);
    try {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.drawImage(video, 0, 0, w, h);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('blob'))),
          'image/jpeg',
          0.92,
        );
      });
      const file = new File([blob], `webcam-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      onCapture?.(file);
      stopAndClose();
    } catch {
      setError(errorUnavailable);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="aid-webcam-modal" role="dialog" aria-modal="true">
      <div className="aid-webcam-modal__backdrop" onClick={stopAndClose} />
      <div className="aid-webcam-modal__panel">
        <header className="aid-webcam-modal__head">
          <h4>{title}</h4>
          <button
            type="button"
            className="aid-webcam-modal__x"
            onClick={stopAndClose}
            aria-label={closeLabel}
          >
            ×
          </button>
        </header>
        <div className="aid-webcam-modal__body">
          {error ? (
            <p className="aid-webcam-modal__error">{error}</p>
          ) : (
            <video
              ref={videoRef}
              className="aid-webcam-modal__video"
              playsInline
              muted
              autoPlay
            />
          )}
        </div>
        <footer className="aid-webcam-modal__actions">
          <button
            type="button"
            className="aid-fh-photo__btn"
            onClick={stopAndClose}
          >
            {closeLabel}
          </button>
          <button
            type="button"
            className="aid-fh-photo__btn aid-fh-photo__btn--primary"
            disabled={!ready || !!error || busy}
            onClick={takePhoto}
          >
            {busy ? '…' : captureLabel}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AidWebcamCaptureModal;
