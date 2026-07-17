import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiMic, FiSquare, FiCheck, FiLoader, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { useVoiceTaskUsers } from '../../../../context/VoiceTaskUsersContext';
import './VoiceTaskModal.css';

const STEPS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  TRANSCRIBING: 'transcribing',
  REVIEW: 'review',
  BUILDING: 'building',
  CONFIRM: 'confirm',
  CREATING: 'creating',
};

const formatLabel = (value) => {
  if (!value) return '—';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const VoiceTaskModal = ({ open, onClose, onCreated }) => {
  const { user } = useAuth();
  const {
    users: knownUsers,
    userCount,
    loading: usersLoading,
    loadedAt,
    refreshUsers,
  } = useVoiceTaskUsers();
  const [step, setStep] = useState(STEPS.IDLE);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [draft, setDraft] = useState(null);
  const [payload, setPayload] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [outputLanguage, setOutputLanguage] = useState('ur'); // default Urdu; English optional
  const [refreshingUsers, setRefreshingUsers] = useState(false);

  const canRecord = outputLanguage === 'ur' || outputLanguage === 'en';

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const resetState = useCallback(() => {
    setStep(STEPS.IDLE);
    setError('');
    setTranscript('');
    setDraft(null);
    setPayload(null);
    setWarnings([]);
    chunksRef.current = [];
    // keep outputLanguage when recording again from review
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopStream();
    setOutputLanguage('ur');
    resetState();
    onClose();
  }, [onClose, resetState, stopStream]);

  useEffect(() => {
    if (!open) {
      stopStream();
      return undefined;
    }
    setOutputLanguage('ur');
    resetState();
    return () => stopStream();
  }, [open, resetState, stopStream]);

  const startRecording = async () => {
    if (!canRecord) {
      setError('Pehle title aur description ki zaban select karein.');
      return;
    }
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const mimeType =
        preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopStream();
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        chunksRef.current = [];
        if (!blob.size) {
          setError('No audio captured. Please try again.');
          setStep(STEPS.IDLE);
          return;
        }
        await uploadAndTranscribe(blob);
      };

      recorder.onerror = () => {
        setError('Recording failed. Please try again.');
        setStep(STEPS.IDLE);
        stopStream();
      };

      recorder.start();
      setStep(STEPS.RECORDING);
    } catch (err) {
      setError(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission denied.'
          : 'Could not access microphone.',
      );
      setStep(STEPS.IDLE);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const uploadAndTranscribe = async (blob) => {
    setStep(STEPS.TRANSCRIBING);
    setError('');
    try {
      const formData = new FormData();
      const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
      formData.append('audio', blob, `voice-task.${ext}`);
      formData.append('language', outputLanguage || 'ur');

      const res = await axiosInstance.post('/tasks/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const text = res.data?.data?.transcript || '';
      if (!text.trim()) {
        throw new Error('No speech detected.');
      }
      setTranscript(text.trim());
      setStep(STEPS.REVIEW);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to transcribe audio.',
      );
      setStep(STEPS.IDLE);
    }
  };

  const handleRefreshUsers = async () => {
    try {
      setRefreshingUsers(true);
      setError('');
      await refreshUsers();
      toast.success('Team names refreshed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refresh users');
    } finally {
      setRefreshingUsers(false);
    }
  };

  const handleBuildPayload = async () => {
    const text = transcript.trim();
    if (!text) {
      setError('Transcript is empty.');
      return;
    }

    setStep(STEPS.BUILDING);
    setError('');
    try {
      const res = await axiosInstance.post('/tasks/voice/build-payload', {
        transcript: text,
        output_language: outputLanguage,
        known_users: knownUsers.map((u) => ({
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          department: u.department,
        })),
      });
      const data = res.data?.data;
      setDraft(data?.draft || null);
      setPayload(data?.payload || null);
      setWarnings(Array.isArray(data?.warnings) ? data.warnings : []);
      setStep(STEPS.CONFIRM);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to prepare task from transcript.',
      );
      setStep(STEPS.REVIEW);
    }
  };

  const handleCreateTask = async () => {
    if (!payload) return;
    setStep(STEPS.CREATING);
    setError('');
    try {
      const res = await axiosInstance.post('/tasks/voice/create', payload);
      const created = res.data?.data;
      toast.success('Task created from voice');
      onCreated?.(created);
      handleClose();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to create task.',
      );
      setStep(STEPS.CONFIRM);
    }
  };

  if (!open) return null;

  const isBusy = [
    STEPS.TRANSCRIBING,
    STEPS.BUILDING,
    STEPS.CREATING,
  ].includes(step);

  return (
    <div className="voice-task-overlay" onMouseDown={handleClose}>
      <div
        className="voice-task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-task-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="voice-task-close"
          onClick={handleClose}
          aria-label="Close"
          disabled={isBusy}
        >
          &times;
        </button>

        <h2 id="voice-task-title" className="voice-task-title">
          Create Task by Voice
        </h2>
        <p className="voice-task-subtitle">
          Record in English or Urdu (Roman Urdu). Review the transcript, then confirm to create.
        </p>

        <div className="voice-task-roster-bar">
          <span>
            {usersLoading || refreshingUsers
              ? 'Loading team names…'
              : `${userCount} team name${userCount === 1 ? '' : 's'} cached`}
            {loadedAt && !usersLoading && !refreshingUsers ? (
              <span className="voice-task-roster-bar__meta">
                {' '}
                · {new Date(loadedAt).toLocaleString()}
              </span>
            ) : null}
          </span>
          <button
            type="button"
            className="voice-task-roster-refresh"
            onClick={handleRefreshUsers}
            disabled={usersLoading || refreshingUsers || isBusy}
            title="Refresh team names after adding new users"
          >
            <FiRefreshCw className={refreshingUsers || usersLoading ? 'voice-task-spin' : ''} />
            Refresh names
          </button>
        </div>

        {error ? (
          <div className="voice-task-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        ) : null}

        {(step === STEPS.IDLE || step === STEPS.RECORDING) && (
          <div className="voice-task-record-panel">
            <div className="voice-task-lang-picker">
              <p className="voice-task-lang-picker__label">
                Title aur description kis zaban mein chahiye?
              </p>
              <div className="voice-task-lang-picker__options">
                <button
                  type="button"
                  className={`voice-task-lang-btn${outputLanguage === 'ur' ? ' is-active' : ''}`}
                  onClick={() => setOutputLanguage('ur')}
                  disabled={step === STEPS.RECORDING}
                >
                  Urdu (default)
                </button>
                <button
                  type="button"
                  className={`voice-task-lang-btn${outputLanguage === 'en' ? ' is-active' : ''}`}
                  onClick={() => setOutputLanguage('en')}
                  disabled={step === STEPS.RECORDING}
                >
                  English
                </button>
              </div>
            </div>

            <button
              type="button"
              className={`voice-task-record-btn${step === STEPS.RECORDING ? ' is-recording' : ''}`}
              onClick={step === STEPS.RECORDING ? stopRecording : startRecording}
              disabled={!canRecord && step !== STEPS.RECORDING}
            >
              {step === STEPS.RECORDING ? <FiSquare /> : <FiMic />}
              <span>{step === STEPS.RECORDING ? 'Stop recording' : 'Start recording'}</span>
            </button>
            {step === STEPS.RECORDING ? (
              <p className="voice-task-hint voice-task-hint--pulse">
                Listening… {outputLanguage === 'en' ? 'English' : 'Urdu'} mode
              </p>
            ) : (
              <p className="voice-task-hint">
                Default: Urdu. English option upar select kar sakte hain.
                <br />
                Example (UR): “Ali ko kal donor Ahmed ko call karne ka high priority task banao.”
                <br />
                Example (EN): “High priority task for Ali to follow up donor Ahmed tomorrow.”
              </p>
            )}
          </div>
        )}

        {step === STEPS.TRANSCRIBING && (
          <div className="voice-task-status">
            <FiLoader className="voice-task-spin" />
            <span>Transcribing your voice…</span>
          </div>
        )}

        {step === STEPS.REVIEW && (
          <div className="voice-task-review">
            <label htmlFor="voice-task-transcript" className="voice-task-label">
              Your speech (edit if needed)
            </label>
            <textarea
              id="voice-task-transcript"
              className="voice-task-transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={5}
            />
            <div className="voice-task-actions">
              <button type="button" className="voice-task-btn voice-task-btn--ghost" onClick={resetState}>
                Record again
              </button>
              <button
                type="button"
                className="voice-task-btn voice-task-btn--primary"
                onClick={handleBuildPayload}
              >
                <FiCheck />
                OK — prepare task
              </button>
            </div>
          </div>
        )}

        {step === STEPS.BUILDING && (
          <div className="voice-task-status">
            <FiLoader className="voice-task-spin" />
            <span>Preparing task details…</span>
          </div>
        )}

        {(step === STEPS.CONFIRM || step === STEPS.CREATING) && draft && (
          <div className="voice-task-confirm">
            <p className="voice-task-lang-badge">
              Title & description: {draft.output_language === 'ur' ? 'Urdu' : 'English'}
            </p>
            <div className="voice-task-draft">
              <div className="voice-task-draft-row">
                <span>Title</span>
                <strong>{draft.title}</strong>
              </div>
              <div className="voice-task-draft-row">
                <span>Description</span>
                <strong>{draft.description}</strong>
              </div>
              <div className="voice-task-draft-row">
                <span>Priority</span>
                <strong>{formatLabel(draft.priority)}</strong>
              </div>
              <div className="voice-task-draft-row">
                <span>Due date</span>
                <strong>{draft.due_date}</strong>
              </div>
              <div className="voice-task-draft-row">
                <span>Department</span>
                <strong>{formatLabel(draft.department || user?.department)}</strong>
              </div>
              <div className="voice-task-draft-row">
                <span>Assignees</span>
                <strong>{(draft.assignee_labels || []).join(', ') || 'You'}</strong>
              </div>
            </div>

            {warnings.length > 0 ? (
              <ul className="voice-task-warnings">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            ) : null}

            <div className="voice-task-actions">
              <button
                type="button"
                className="voice-task-btn voice-task-btn--ghost"
                onClick={() => setStep(STEPS.REVIEW)}
                disabled={step === STEPS.CREATING}
              >
                Back
              </button>
              <button
                type="button"
                className="voice-task-btn voice-task-btn--primary"
                onClick={handleCreateTask}
                disabled={step === STEPS.CREATING}
              >
                {step === STEPS.CREATING ? (
                  <>
                    <FiLoader className="voice-task-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <FiCheck />
                    Create task
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceTaskModal;
