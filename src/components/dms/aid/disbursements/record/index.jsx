import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import { hasAidPermission } from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import {
  formatAidProgramLabel,
  formatAidRequestType,
} from '../../aidConstants';
import { dispatchListDataChanged } from '../../../../../hooks/useListAutoRefresh';
import '../../aid.css';

const MODE_OPTIONS = [
  { value: 'in_kind_store', label: 'In-kind (store issue)' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'lab_voucher', label: 'Lab voucher' },
  { value: 'other', label: 'Other' },
];

const OFFICE_OPTIONS = [
  { value: 'Mian Channu head office', label: 'Mian Channu head office' },
  { value: 'Field office', label: 'Field office' },
];

const formatMoney = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-PK');
};

const formatDue = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Record delivery for a single installment.
 */
const AidDisbursementRecord = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { permissions, user } = useAuth();

  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;

  const canDeliver =
    hasAidPermission(permissions, 'aid_disbursements', 'deliver') ||
    hasAidPermission(permissions, 'aid_applications', 'deliver') ||
    isStaffElevated;

  const viewOnly =
    searchParams.get('view') === '1' ||
    !canDeliver;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const [quantity, setQuantity] = useState('1');
  const [value, setValue] = useState('');
  const [mode, setMode] = useState('in_kind_store');
  const [referenceNo, setReferenceNo] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(todayIso());
  const [location, setLocation] = useState('Mian Channu head office');
  const [recipientType, setRecipientType] = useState('beneficiary');
  const [recipientName, setRecipientName] = useState('');
  const [recipientCnic, setRecipientCnic] = useState('');
  const [recipientRelation, setRecipientRelation] = useState('Self');
  const [notes, setNotes] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpExpected, setOtpExpected] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  const [proofs, setProofs] = useState({
    handover: null,
    receipt: null,
    cnic: null,
  });

  const summary = data?.case_summary || {};
  const remainingQty = Math.max(
    1,
    Number(summary.remaining_quantity) || Number(data?.planned_quantity) || 1,
  );

  const checks = useMemo(() => {
    const qtyOk =
      Number(quantity) > 0 && Number(quantity) <= remainingQty + 0.0001;
    const notApprover =
      !user?.id ||
      !summary.ceo_decided_by_id ||
      Number(user.id) !== Number(summary.ceo_decided_by_id);
    const refOk = !!String(referenceNo || '').trim();
    const proofOk = !!(proofs.handover || proofs.receipt || proofs.cnic);
    return [
      { ok: qtyOk, label: 'Quantity within remaining balance' },
      { ok: notApprover, label: 'You are not the approver of this case' },
      { ok: refOk, label: 'Store issue number entered' },
      { ok: proofOk, label: 'At least one proof uploaded' },
    ];
  }, [quantity, remainingQty, user?.id, summary.ceo_decided_by_id, referenceNo, proofs]);

  const allChecksOk = checks.every((c) => c.ok);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get(`/aid/disbursements/${id}`);
      const row = res.data?.data;
      setData(row);
      setQuantity(String(row?.planned_quantity || '1'));
      setValue(
        row?.planned_amount != null ? String(Number(row.planned_amount)) : '',
      );
      setLocation(row?.delivery_location || row?.office_name || location);
      setRecipientName(row?.beneficiary_name || '');
      setRecipientCnic(row?.beneficiary_cnic || '');
      setRecipientRelation('Self');
      setRecipientType('beneficiary');
      if (row?.mode) setMode(row.mode);
      if (row?.reference_no) setReferenceNo(row.reference_no);
      if (row?.delivery_date) setDeliveryDate(row.delivery_date);
      if (row?.notes) setNotes(row.notes);
      if (row?.otp_verified) setOtpVerified(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load disbursement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sendOtp = () => {
    const phone = data?.beneficiary_phone || data?.otp_phone || '';
    if (!phone) {
      toast.info('No registered phone on file — mark verified after call confirm.');
      setOtpVerified(true);
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtpExpected(code);
    setOtpSent(true);
    setOtpVerified(false);
    setOtpCode('');
    toast.success(`OTP sent to ${phone} (demo: ${code})`);
  };

  const verifyOtp = () => {
    if (otpCode.trim() && otpCode.trim() === otpExpected) {
      setOtpVerified(true);
      toast.success('OTP verified');
    } else {
      toast.error('Invalid code');
    }
  };

  const onProofChange = (key, file) => {
    setProofs((p) => ({ ...p, [key]: file || null }));
  };

  const uploadProofs = async (applicationId) => {
    const uploads = [
      { key: 'handover', context: 'disbursement_handover', label: 'Handover photo' },
      { key: 'receipt', context: 'disbursement_receipt', label: 'Signed receipt' },
      { key: 'cnic', context: 'disbursement_cnic', label: 'CNIC copy' },
    ];
    for (const u of uploads) {
      const file = proofs[u.key];
      if (!file) continue;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('context', u.context);
      fd.append('description', `${u.label} · installment ${data?.installment_no}`);
      await axiosInstance.post(
        `/aid/applications/${applicationId}/attachments/upload`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
    }
  };

  const handleSave = async () => {
    if (viewOnly) return;
    if (!allChecksOk) {
      setError('Complete the save checks before recording delivery.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const hasProof = !!(proofs.handover || proofs.receipt || proofs.cnic);
      if (hasProof) {
        await uploadProofs(data.application_id);
      }
      await axiosInstance.post(`/aid/disbursements/${id}/deliver`, {
        quantity: Number(quantity),
        value: value !== '' ? Number(value) : undefined,
        mode,
        reference_no: referenceNo || undefined,
        delivery_date: deliveryDate,
        delivery_location: location,
        recipient_type: recipientType,
        recipient_name: recipientName,
        recipient_cnic: recipientCnic || undefined,
        recipient_relation: recipientRelation || undefined,
        otp_verified: otpVerified,
        notes: notes || undefined,
        has_proof: hasProof,
        submit_for_verification: false,
      });
      dispatchListDataChanged('aid');
      toast.success('Delivery recorded');
      navigate('/dms/aid/disbursements/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save delivery');
    } finally {
      setSaving(false);
    }
  };

  const subtitle = data
    ? `${data.application_no || `APP-${data.application_id}`} · Installment ${
        data.installment_label
      } · due ${formatDue(data.due_at)}`
    : '';

  const readOnly =
    viewOnly ||
    data?.status === 'delivered' ||
    data?.stored_status === 'delivered';

  return (
    <>
      <Navbar />
      <div className="form-wrapper aid-disb-record">
        <PageHeader
          title="Record delivery"
          backPath="/dms/aid/disbursements/list"
          showAdd={false}
          onBackClick={() => navigate('/dms/aid/disbursements/list')}
        />

        <div className="aid-disb-record__body">
          {loading ? (
            <div className="aid-disb-record__loading">Loading…</div>
          ) : error && !data ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <div className="aid-disb-record__head">
                <button
                  type="button"
                  className="aid-disb-back"
                  onClick={() => navigate('/dms/aid/disbursements/list')}
                  aria-label="Back"
                >
                  <FiArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="aid-disb-record__title">Record delivery</h2>
                  <p className="aid-disb-record__meta">{subtitle}</p>
                </div>
              </div>

              {error ? <div className="error-message">{error}</div> : null}

              <div className="aid-disb-record__layout">
                <div className="aid-disb-record__main">
                  <section className="aid-disb-panel">
                    <h3>What was delivered</h3>
                    <div className="aid-disb-grid">
                      <div className="aid-disb-field">
                        <FormInput
                          label="Quantity *"
                          type="number"
                          min={1}
                          max={remainingQty}
                          value={quantity}
                          disabled={readOnly}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                        <p className="aid-disb-field-hint">
                          Max {remainingQty} remaining
                        </p>
                      </div>
                      <div className="aid-disb-field">
                        <FormInput
                          label="Value (PKR)"
                          type="number"
                          value={value}
                          disabled={readOnly}
                          onChange={(e) => setValue(e.target.value)}
                        />
                        <p className="aid-disb-field-hint">Auto from plan</p>
                      </div>
                      <div className="aid-disb-field">
                        <FormSelect
                          label="Mode *"
                          value={mode}
                          disabled={readOnly}
                          onChange={(e) => setMode(e.target.value)}
                          options={MODE_OPTIONS}
                        />
                        <p className="aid-disb-field-hint">&nbsp;</p>
                      </div>
                      <div className="aid-disb-field">
                        <FormInput
                          label="Store issue no. *"
                          value={referenceNo}
                          disabled={readOnly}
                          onChange={(e) => setReferenceNo(e.target.value)}
                          placeholder="SI-26-____"
                        />
                        <p className="aid-disb-field-hint">
                          Voucher no. for cash · MR no. for lab
                        </p>
                      </div>
                      <div className="aid-disb-field">
                        <FormInput
                          label="Delivery date *"
                          type="date"
                          value={deliveryDate}
                          disabled={readOnly}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                        />
                        <p className="aid-disb-field-hint">&nbsp;</p>
                      </div>
                      <div className="aid-disb-field">
                        <FormSelect
                          label="Location *"
                          value={location}
                          disabled={readOnly}
                          onChange={(e) => setLocation(e.target.value)}
                          options={OFFICE_OPTIONS}
                        />
                        <p className="aid-disb-field-hint">&nbsp;</p>
                      </div>
                    </div>
                  </section>

                  <section className="aid-disb-panel">
                    <h3>Who received it</h3>
                    <div className="aid-disb-recipient-toggle" role="group">
                      <button
                        type="button"
                        className={
                          recipientType === 'beneficiary'
                            ? 'aid-disb-toggle aid-disb-toggle--active'
                            : 'aid-disb-toggle'
                        }
                        disabled={readOnly}
                        onClick={() => {
                          setRecipientType('beneficiary');
                          setRecipientName(data?.beneficiary_name || '');
                          setRecipientCnic(data?.beneficiary_cnic || '');
                          setRecipientRelation('Self');
                        }}
                      >
                        Beneficiary
                      </button>
                      <button
                        type="button"
                        className={
                          recipientType === 'family_member'
                            ? 'aid-disb-toggle aid-disb-toggle--active'
                            : 'aid-disb-toggle'
                        }
                        disabled={readOnly}
                        onClick={() => {
                          setRecipientType('family_member');
                          setRecipientRelation('');
                        }}
                      >
                        Registered family member
                      </button>
                    </div>
                    <div className="aid-disb-grid">
                      <div className="aid-disb-field">
                        <FormInput
                          label="Name *"
                          value={recipientName}
                          disabled={readOnly}
                          onChange={(e) => setRecipientName(e.target.value)}
                        />
                      </div>
                      <div className="aid-disb-field">
                        <FormInput
                          label="CNIC *"
                          value={recipientCnic}
                          disabled={readOnly}
                          onChange={(e) => setRecipientCnic(e.target.value)}
                          placeholder="36XXX-XXXXXXX-X"
                        />
                      </div>
                      <div className="aid-disb-field">
                        <FormInput
                          label="Relation"
                          value={recipientRelation}
                          disabled={readOnly}
                          onChange={(e) => setRecipientRelation(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="aid-disb-otp">
                      <div className="aid-disb-otp__text">
                        Send OTP to registered number{' '}
                        <strong>
                          {data?.beneficiary_phone || '03XX-XXXXXXX'}
                        </strong>
                      </div>
                      <div className="aid-disb-otp__actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          disabled={readOnly || otpVerified}
                          onClick={sendOtp}
                        >
                          {otpSent ? 'Resend OTP' : 'Send OTP'}
                        </button>
                        <div className="aid-disb-otp__code">
                          <FormInput
                            label="Code"
                            value={otpCode}
                            disabled={readOnly || otpVerified}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="6 digits"
                          />
                        </div>
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={readOnly || otpVerified || !otpCode}
                          onClick={verifyOtp}
                        >
                          {otpVerified ? 'Verified' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="aid-disb-panel">
                    <h3>Proof (at least one required)</h3>
                    <div className="aid-disb-proofs">
                      {[
                        {
                          key: 'handover',
                          title: 'Handover photo',
                          hint: 'Beneficiary with item',
                        },
                        {
                          key: 'receipt',
                          title: 'Signed / thumb receipt',
                          hint: 'Photo or scan',
                        },
                        {
                          key: 'cnic',
                          title: 'CNIC copy',
                          hint: 'If received by family member',
                        },
                      ].map((slot) => (
                        <label key={slot.key} className="aid-disb-proof">
                          <span className="aid-disb-proof__title">
                            {slot.title}
                          </span>
                          <span className="aid-disb-proof__hint">
                            {proofs[slot.key]
                              ? proofs[slot.key].name
                              : slot.hint}
                          </span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            disabled={readOnly}
                            onChange={(e) =>
                              onProofChange(
                                slot.key,
                                e.target.files?.[0] || null,
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <FormTextarea
                      label="Notes"
                      value={notes}
                      disabled={readOnly}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything the verification team should know"
                      rows={3}
                    />
                  </section>

                  {!readOnly ? (
                    <div className="aid-disb-record__footer">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() =>
                          navigate('/dms/aid/disbursements/list')
                        }
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={saving || !allChecksOk}
                        onClick={handleSave}
                      >
                        {saving ? 'Saving…' : 'Save delivery'}
                      </button>
                    </div>
                  ) : null}
                </div>

                <aside className="aid-disb-record__side">
                  <section className="aid-disb-side-card">
                    <h3>Case summary</h3>
                    <dl className="aid-disb-summary">
                      <div>
                        <dt>Beneficiary</dt>
                        <dd>{summary.beneficiary || data?.beneficiary_name || '—'}</dd>
                      </div>
                      <div>
                        <dt>Program</dt>
                        <dd>
                          {formatAidRequestType(
                            summary.program || data?.requested_aid_type,
                          )}
                          {summary.aid_program || data?.aid_program
                            ? ` · ${formatAidProgramLabel(
                                summary.aid_program || data?.aid_program,
                              )}`
                            : ''}
                        </dd>
                      </div>
                      <div>
                        <dt>Fund source</dt>
                        <dd>{summary.fund_source || data?.fund_source || '—'}</dd>
                      </div>
                      <div>
                        <dt>Approved</dt>
                        <dd>
                          {summary.approved_quantity ?? '—'} packs ·{' '}
                          {formatMoney(summary.approved_amount)}
                        </dd>
                      </div>
                      <div>
                        <dt>Delivered</dt>
                        <dd>
                          {summary.delivered_quantity ?? 0} packs ·{' '}
                          {formatMoney(summary.delivered_amount)}
                        </dd>
                      </div>
                      <div>
                        <dt>After this entry</dt>
                        <dd>{summary.after_this_entry || data?.installment_label}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="aid-disb-side-card">
                    <h3>Save checks</h3>
                    <ul className="aid-disb-checks">
                      {checks.map((c) => (
                        <li
                          key={c.label}
                          className={
                            c.ok
                              ? 'aid-disb-checks__item aid-disb-checks__item--ok'
                              : 'aid-disb-checks__item'
                          }
                        >
                          {c.ok ? (
                            <FiCheck size={16} />
                          ) : (
                            <FiCircle size={16} />
                          )}
                          <span>{c.label}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AidDisbursementRecord;
