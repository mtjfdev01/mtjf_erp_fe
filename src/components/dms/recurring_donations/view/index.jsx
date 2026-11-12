import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ConfirmationModal from '../../../common/ConfirmationModal';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import {
  FiRepeat,
  FiUser,
  FiDollarSign,
  FiSend,
  FiCheck,
  FiCheckCircle,
  FiEdit2,
  FiX,
  FiTrash2,
  FiPaperclip,
  FiPlus,
} from 'react-icons/fi';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission, isSuperAdmin, canReconcileRecurring } from '../../../../utils/permissions';
import { formatAuditActor } from '../../../common/audit/auditHistoryLabels';
import RecurringAttachmentPanel from '../shared/RecurringAttachmentPanel';
import DonationPendingAttachments, {
  uploadPendingRecurringDonationAttachments,
} from '../../donations/shared/DonationPendingAttachments';
import './recurringDonationView.css';

const INSTALLMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const RecurringDonationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingLink, setSendingLink] = useState(false);
  const [linkMessage, setLinkMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [markingPaid, setMarkingPaid] = useState(false);
  const [markingInstallmentId, setMarkingInstallmentId] = useState(null);
  const [markMessage, setMarkMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'pending',
    amount: '',
    period_key: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [deleteInstallmentTarget, setDeleteInstallmentTarget] = useState(null);
  const [deletingInstallment, setDeletingInstallment] = useState(false);
  const [deleteSubTarget, setDeleteSubTarget] = useState(false);
  const [deletingSub, setDeletingSub] = useState(false);
  const [installmentAttachmentTarget, setInstallmentAttachmentTarget] = useState(null);
  const [showAddInstallments, setShowAddInstallments] = useState(false);
  const [addInstForm, setAddInstForm] = useState({
    count: '1',
    status: 'pending',
    amount: '',
  });
  const [addInstPendingFiles, setAddInstPendingFiles] = useState([]);
  const addInstAttachmentsRef = useRef(null);
  const [addingInstallments, setAddingInstallments] = useState(false);
  const [attachingToSelected, setAttachingToSelected] = useState(false);
  const selectedAttachRef = useRef(null);
  const [selectedAttachPending, setSelectedAttachPending] = useState([]);
  const [showAttachSelected, setShowAttachSelected] = useState(false);

  const isFrAdmin = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return (
      isSuperAdmin(permissions) ||
      role === 'super_admin' ||
      permissions?.fund_raising_manager === true ||
      role === 'fund_raising_manager'
    );
  }, [permissions, user]);

  const canUpdate = useMemo(
    () =>
      isFrAdmin ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'update'),
    [permissions, isFrAdmin],
  );

  const canDelete = useMemo(
    () =>
      isFrAdmin ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'delete'),
    [permissions, isFrAdmin],
  );

  const canReconcile = useMemo(
    () => canReconcileRecurring(permissions),
    [permissions],
  );

  const installmentStatusOptions = useMemo(() => {
    if (canReconcile) return INSTALLMENT_STATUS_OPTIONS;
    return [{ value: 'pending', label: 'Pending' }];
  }, [canReconcile]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/recurring-donations/${id}`);
      if (response.data.success) {
        setData(response.data.data);
        setError('');
        setSelectedIds(new Set());
        setEditingId(null);
      } else {
        setError(response.data.message || 'Failed to load recurring donation');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load recurring donation',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const formatAmount = (amount, currency) => {
    if (amount == null) return '-';
    return `${currency || 'PKR'} ${Number(amount).toLocaleString('en-PK', {
      minimumFractionDigits: 0,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  };

  const donorLabel = (donor) => {
    if (!donor) return '-';
    return (
      donor.name ||
      [donor.first_name, donor.last_name].filter(Boolean).join(' ') ||
      donor.email
    );
  };

  const pendingInstallments = useMemo(() => {
    const list = data?.installments || [];
    return list.filter(
      (inst) => String(inst.status || '').toLowerCase() === 'pending',
    );
  }, [data]);

  const allPendingSelected =
    pendingInstallments.length > 0 &&
    pendingInstallments.every((inst) => selectedIds.has(inst.id));

  const selectedPendingAmount = useMemo(() => {
    return pendingInstallments
      .filter((inst) => selectedIds.has(inst.id))
      .reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
  }, [pendingInstallments, selectedIds]);

  const toggleOne = (installmentId, allowNonPending) => {
    // Mark-paid selection is pending-only; attach-to-selected allows any row
    if (!allowNonPending) {
      const inst = (data?.installments || []).find(
        (row) => row.id === installmentId,
      );
      if (String(inst?.status || '').toLowerCase() !== 'pending') return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(installmentId)) next.delete(installmentId);
      else next.add(installmentId);
      return next;
    });
  };

  const toggleAllPending = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(pendingInstallments.map((inst) => inst.id)));
  };

  const toggleAllInstallments = () => {
    const list = data?.installments || [];
    if (
      list.length > 0 &&
      list.every((inst) => selectedIds.has(inst.id))
    ) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(list.map((inst) => inst.id)));
  };

  const sendInstallmentLink = async () => {
    setSendingLink(true);
    setLinkMessage('');
    try {
      const response = await axiosInstance.post(
        `/recurring-donations/${id}/send-installment-link`,
      );
      if (response.data.success) {
        const d = response.data.data || {};
        const parts = [];
        if (d.email_sent) parts.push('email');
        if (d.whatsapp_sent) parts.push('WhatsApp');
        setLinkMessage(
          `Installment link sent via ${parts.join(' + ') || 'channel'}.`,
        );
      } else {
        setLinkMessage(
          response.data.message || 'Failed to send installment link',
        );
      }
    } catch (err) {
      setLinkMessage(
        err.response?.data?.message || 'Failed to send installment link',
      );
    } finally {
      setSendingLink(false);
    }
  };

  const markSelectedPaid = async () => {
    const ids = [...selectedIds];
    if (!ids.length) {
      setMarkMessage('Select at least one pending installment');
      return;
    }
    if (
      !window.confirm(
        `Mark ${ids.length} installment(s) as complete (${formatAmount(
          selectedPendingAmount,
          data?.subscription?.currency,
        )})?`,
      )
    ) {
      return;
    }

    setMarkingPaid(true);
    setMarkMessage('');
    try {
      const response = await axiosInstance.post(
        `/recurring-donations/${id}/mark-installments-paid`,
        { installment_ids: ids },
      );
      if (response.data.success) {
        toast.success(
          response.data.message ||
            `Marked ${response.data.data?.marked || ids.length} installment(s) as complete`,
        );
        setMarkMessage(response.data.message || 'Marked as complete');
        await load();
      } else {
        toast.error(response.data.message || 'Failed to mark as complete');
        setMarkMessage(response.data.message || 'Failed to mark as complete');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to mark as complete',
      );
      setMarkMessage(err.response?.data?.message || 'Failed to mark as complete');
    } finally {
      setMarkingPaid(false);
    }
  };

  const markSingleInstallmentPaid = async (inst) => {
    if (!inst?.id) return;
    if (String(inst.status || '').toLowerCase() !== 'pending') return;
    if (
      !window.confirm(
        `Mark installment #${inst.id} (${inst.period_key || 'Period'}) as complete?`,
      )
    ) {
      return;
    }
    setMarkingInstallmentId(inst.id);
    setMarkMessage('');
    try {
      const response = await axiosInstance.post(
        `/recurring-donations/${id}/mark-installments-paid`,
        { installment_ids: [inst.id] },
      );
      if (response.data.success) {
        toast.success(
          response.data.message ||
            `Installment #${inst.id} marked as complete`,
        );
        await load();
      } else {
        toast.error(
          response.data.message || 'Failed to mark installment as complete',
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Failed to mark installment as complete',
      );
    } finally {
      setMarkingInstallmentId(null);
    }
  };

  const startEdit = (inst) => {
    setEditMessage('');
    setEditingId(inst.id);
    setEditForm({
      status: String(inst.status || 'pending').toLowerCase(),
      amount: inst.amount != null ? String(inst.amount) : '',
      period_key: inst.period_key || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMessage('');
  };

  const saveInstallmentEdit = async (installmentId) => {
    const amountNum = Number(editForm.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setEditMessage('Amount must be greater than 0');
      return;
    }
    setSavingEdit(true);
    setEditMessage('');
    try {
      const response = await axiosInstance.patch(
        `/recurring-donations/${id}/installments/${installmentId}`,
        {
          status: editForm.status,
          amount: amountNum,
          period_key: editForm.period_key || null,
        },
      );
      if (response.data.success) {
        setEditMessage('Installment saved');
        await load();
      } else {
        setEditMessage(response.data.message || 'Failed to save installment');
      }
    } catch (err) {
      setEditMessage(
        err.response?.data?.message || 'Failed to save installment',
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteInstallment = async () => {
    if (!deleteInstallmentTarget) return;
    setDeletingInstallment(true);
    setEditMessage('');
    try {
      const response = await axiosInstance.delete(
        `/recurring-donations/${id}/installments/${deleteInstallmentTarget.id}`,
      );
      if (response.data.success) {
        setDeleteInstallmentTarget(null);
        setEditMessage('Installment deleted');
        await load();
      } else {
        setEditMessage(response.data.message || 'Failed to delete installment');
      }
    } catch (err) {
      setEditMessage(
        err.response?.data?.message || 'Failed to delete installment',
      );
    } finally {
      setDeletingInstallment(false);
    }
  };

  const confirmDeleteSubscription = async () => {
    setDeletingSub(true);
    setError('');
    try {
      const response = await axiosInstance.delete(`/recurring-donations/${id}`);
      if (response.data.success) {
        navigate('/dms/recurring-donations/list');
      } else {
        setError(response.data.message || 'Failed to delete recurring donation');
        setDeleteSubTarget(false);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to delete recurring donation',
      );
      setDeleteSubTarget(false);
    } finally {
      setDeletingSub(false);
    }
  };

  const submitAddInstallments = async () => {
    const count = Math.floor(Number(addInstForm.count));
    if (!Number.isFinite(count) || count < 1 || count > 36) {
      toast.error('Installment count must be between 1 and 36');
      return;
    }
    const amountRaw = String(addInstForm.amount || '').trim();
    const amountNum = amountRaw === '' ? null : Number(amountRaw);
    if (amountRaw !== '' && (!Number.isFinite(amountNum) || amountNum <= 0)) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setAddingInstallments(true);
    try {
      const formData = new FormData();
      formData.append('count', String(count));
      formData.append('status', addInstForm.status || 'pending');
      if (amountNum != null) formData.append('amount', String(amountNum));

      const items =
        addInstAttachmentsRef.current?.collectForSubmit?.() ||
        addInstPendingFiles;
      const firstFile = items[0];
      if (firstFile?.file) {
        formData.append('file', firstFile.file);
        if (firstFile.name) {
          formData.append('description', firstFile.name);
          formData.append('name', firstFile.name);
        }
      }

      const response = await axiosInstance.post(
        `/recurring-donations/${id}/installments/bulk`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      if (response.data.success) {
        toast.success(response.data.message || 'Installments added');
        setShowAddInstallments(false);
        setAddInstForm({ count: '1', status: 'pending', amount: '' });
        setAddInstPendingFiles([]);
        await load();
      } else {
        toast.error(response.data.message || 'Failed to add installments');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add installments');
    } finally {
      setAddingInstallments(false);
    }
  };

  const submitAttachToSelected = async () => {
    const ids = [...selectedIds];
    if (!ids.length) {
      toast.error('Select at least one installment');
      return;
    }
    const items =
      selectedAttachRef.current?.collectForSubmit?.() || selectedAttachPending;
    if (!items.length) {
      toast.info('Add at least one attachment');
      return;
    }
    setAttachingToSelected(true);
    try {
      const { uploaded, failed } =
        await uploadPendingRecurringDonationAttachments({
          axiosInstance,
          recurringDonationId: Number(id),
          items,
          installmentIds: ids,
        });
      if (uploaded > 0) {
        toast.success(
          uploaded === 1
            ? `Attachment linked to ${ids.length} installment(s)`
            : `${uploaded} attachments linked to ${ids.length} installment(s)`,
        );
        setShowAttachSelected(false);
        setSelectedAttachPending([]);
        await load();
      }
      if (failed > 0) {
        toast.error(
          failed === 1
            ? 'Failed to upload 1 attachment.'
            : `Failed to upload ${failed} attachments.`,
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to attach file');
    } finally {
      setAttachingToSelected(false);
    }
  };

  if (loading && !data) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Recurring Donation"
            showBackButton
            backPath="/dms/recurring-donations/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !data?.subscription) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Recurring Donation"
            showBackButton
            backPath="/dms/recurring-donations/list"
          />
          <div className="error-message">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  const {
    subscription,
    installments,
    initial_donation,
    donor,
    summary,
    referred_by: referrer,
  } = data;
  const referrerName = referrer
    ? [referrer.first_name, referrer.last_name].filter(Boolean).join(' ').trim() ||
      referrer.email ||
      `User #${referrer.id}`
    : null;
  const canSendInstallmentLink = !subscription.stripe_subscription_id;
  const canMarkPaid =
    canReconcile &&
    !subscription.stripe_subscription_id &&
    pendingInstallments.length > 0;
  // Edit installments for non-Stripe; delete allowed for all when permitted
  const canEditInstallments =
    canUpdate && !subscription.stripe_subscription_id;
  const canDeleteInstallments = canDelete;
  const showInstallmentActions =
    canEditInstallments ||
    canDeleteInstallments ||
    (canReconcile && !subscription.stripe_subscription_id);
  const canAddInstallments = canEditInstallments;
  const showInstallmentCheckboxes =
    canMarkPaid || canEditInstallments;
  const canAttachToSelected =
    canEditInstallments && selectedIds.size > 0;
  const allInstallmentsSelected =
    (installments || []).length > 0 &&
    (installments || []).every((inst) => selectedIds.has(inst.id));
  const addInstStatusOptions = canReconcile
    ? INSTALLMENT_STATUS_OPTIONS
    : [{ value: 'pending', label: 'Pending' }];

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title={`Recurring Donation #${subscription.id}`}
          showBackButton
          backPath="/dms/recurring-donations/list"
          icon={<FiRepeat />}
          showEdit={canUpdate}
          editPath={`/dms/recurring-donations/update/${id}`}
          rightElement={
            canDelete ? (
              <button
                type="button"
                className="back-button"
                title="Delete"
                onClick={() => setDeleteSubTarget(true)}
                style={{ color: '#ef4444' }}
              >
                <FiTrash2 />
              </button>
            ) : null
          }
        />

        <div className="view-content">
          {canSendInstallmentLink && (
            <section className="view-section">
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  className="primary_btn"
                  disabled={sendingLink}
                  onClick={sendInstallmentLink}
                >
                  <FiSend style={{ marginRight: 6 }} />
                  {sendingLink ? 'Sending...' : 'Send installment link'}
                </button>
                {linkMessage && (
                  <span style={{ fontSize: 13, color: '#4b5563' }}>
                    {linkMessage}
                  </span>
                )}
              </div>
            </section>
          )}

          <section className="view-section">
            <div className="rd-sub-card">
              <div className="rd-sub-card__head">
                <h3 className="rd-sub-card__title">
                  <span className="rd-sub-card__title-icon" aria-hidden>
                    <FiRepeat size={17} />
                  </span>
                  Subscription
                </h3>
                <span
                  className={`rd-sub-status rd-sub-status--${
                    ['active', 'past_due', 'failed', 'canceled', 'cancelled'].includes(
                      String(subscription.status || '').toLowerCase(),
                    )
                      ? String(subscription.status).toLowerCase()
                      : 'default'
                  }`}
                >
                  {subscription.status || '—'}
                </span>
              </div>

              <div className="rd-sub-kpis">
                <div className="rd-sub-kpi">
                  <span className="rd-sub-kpi__label">Installment</span>
                  <p className="rd-sub-kpi__value">
                    {formatAmount(subscription.amount, subscription.currency)}
                  </p>
                </div>
                <div className="rd-sub-kpi">
                  <span className="rd-sub-kpi__label">Paid</span>
                  <p className="rd-sub-kpi__value rd-sub-kpi__value--ok">
                    {formatAmount(
                      summary?.total_paid_amount,
                      subscription.currency,
                    )}
                  </p>
                </div>
                <div className="rd-sub-kpi">
                  <span className="rd-sub-kpi__label">Missing</span>
                  <p
                    className={`rd-sub-kpi__value${
                      Number(summary?.pending_installment_count) > 0
                        ? ' rd-sub-kpi__value--warn'
                        : ''
                    }`}
                  >
                    {summary?.pending_installment_count ?? 0}
                    <span style={{ fontWeight: 500, fontSize: '0.85rem', color: '#64748b' }}>
                      {' '}
                      / {summary?.completed_installment_count ?? 0} paid
                    </span>
                  </p>
                </div>
                <div className="rd-sub-kpi">
                  <span className="rd-sub-kpi__label">Arrears</span>
                  <p
                    className={`rd-sub-kpi__value${
                      Number(summary?.arrears_amount) > 0
                        ? ' rd-sub-kpi__value--warn'
                        : ''
                    }`}
                  >
                    {formatAmount(
                      summary?.arrears_amount,
                      subscription.currency,
                    )}
                  </p>
                </div>
              </div>

              <div className="rd-sub-body">
                <div className="rd-sub-grid">
                  <div className="rd-sub-field">
                    <span className="rd-sub-field__label">Total amount</span>
                    <p className="rd-sub-field__value">
                      {subscription.total_amount != null
                        ? formatAmount(
                            subscription.total_amount,
                            subscription.currency,
                          )
                        : '—'}
                    </p>
                  </div>
                  <div className="rd-sub-field">
                    <span className="rd-sub-field__label">Billing</span>
                    <p className="rd-sub-field__value">
                      {subscription.billing_interval || '—'}
                      {subscription.billing_interval
                        ? ` · every ${subscription.billing_interval_count || 1}`
                        : ''}
                    </p>
                  </div>
                  <div className="rd-sub-field">
                    <span className="rd-sub-field__label">Method</span>
                    <p className="rd-sub-field__value">
                      {subscription.donation_method
                        ? String(subscription.donation_method).replace(
                            /_/g,
                            ' ',
                          )
                        : '—'}
                    </p>
                  </div>
                  <div className="rd-sub-field">
                    <span className="rd-sub-field__label">Project</span>
                    <p
                      className={`rd-sub-field__value${
                        subscription.project_id ? '' : ' rd-sub-field__value--muted'
                      }`}
                    >
                      {subscription.project_id || '—'}
                    </p>
                  </div>
                  <div className="rd-sub-field">
                    <span className="rd-sub-field__label">Campaign</span>
                    <p
                      className={`rd-sub-field__value${
                        subscription.campaign_id
                          ? ''
                          : ' rd-sub-field__value--muted'
                      }`}
                    >
                      {subscription.campaign_id || '—'}
                    </p>
                  </div>
                  <div className="rd-sub-field">
                    <span className="rd-sub-field__label">On behalf</span>
                    <p
                      className={`rd-sub-field__value${
                        subscription.on_behalf_names
                          ? ''
                          : ' rd-sub-field__value--muted'
                      }`}
                    >
                      {subscription.on_behalf_names || '—'}
                    </p>
                  </div>
                  <div className="rd-sub-field">
                    <span className="rd-sub-field__label">Started</span>
                    <p className="rd-sub-field__value">
                      {formatDate(subscription.created_at)}
                    </p>
                  </div>
                  <div className="rd-sub-field">
                    <span className="rd-sub-field__label">Created by</span>
                    <p className="rd-sub-field__value">
                      {subscription.created_by
                        ? formatAuditActor(subscription.created_by)
                        : '—'}
                    </p>
                  </div>

                  {(subscription.prepaid_periods > 0 ||
                    subscription.prepaid_months > 0) && (
                    <>
                      <div className="rd-sub-section-label">Prepaid</div>
                      <div className="rd-sub-field">
                        <span className="rd-sub-field__label">Periods</span>
                        <p className="rd-sub-field__value">
                          {subscription.prepaid_periods ||
                            subscription.prepaid_months}{' '}
                          {subscription.billing_interval === 'day'
                            ? 'day(s)'
                            : subscription.billing_interval === 'week'
                              ? 'week(s)'
                              : 'month(s)'}
                        </p>
                      </div>
                      <div className="rd-sub-field">
                        <span className="rd-sub-field__label">Coverage</span>
                        <p className="rd-sub-field__value">
                          {subscription.prepaid_start_period_key &&
                          subscription.prepaid_end_period_key
                            ? `${subscription.prepaid_start_period_key} → ${subscription.prepaid_end_period_key}`
                            : '—'}
                        </p>
                      </div>
                      <div className="rd-sub-field">
                        <span className="rd-sub-field__label">
                          Next after prepaid
                        </span>
                        <p className="rd-sub-field__value">
                          {subscription.start_date || '—'}
                        </p>
                      </div>
                    </>
                  )}

                  {(subscription.stripe_subscription_id ||
                    subscription.stripe_customer_id) && (
                    <>
                      <div className="rd-sub-section-label">Stripe</div>
                      {subscription.stripe_subscription_id && (
                        <div className="rd-sub-field">
                          <span className="rd-sub-field__label">
                            Subscription
                          </span>
                          <p className="rd-sub-field__value">
                            {subscription.stripe_subscription_id}
                          </p>
                        </div>
                      )}
                      {subscription.stripe_customer_id && (
                        <div className="rd-sub-field">
                          <span className="rd-sub-field__label">Customer</span>
                          <p className="rd-sub-field__value">
                            {subscription.stripe_customer_id}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="view-section">
            <RecurringAttachmentPanel
              entityId={subscription.id}
              attachments={subscription.attachments || []}
              canUpdate={canUpdate}
              onChanged={load}
            />
          </section>

          <section className="view-section">
            <h3>
              <FiUser style={{ marginRight: 8 }} />
              Donor
            </h3>
            <div className="view-grid">
              <div>
                <strong>Name</strong>
                <p>
                  {donor?.id ? (
                    <Link to={`/dms/donors/view/${donor.id}`}>
                      {donorLabel(donor)}
                    </Link>
                  ) : (
                    donorLabel(donor)
                  )}
                </p>
              </div>
              <div>
                <strong>Email</strong>
                <p>{donor?.email || '-'}</p>
              </div>
              <div>
                <strong>Phone</strong>
                <p>{donor?.phone || '-'}</p>
              </div>
              <div>
                <strong>Referred By</strong>
                <p>
                  {referrerName || '-'}
                  {referrer?.referral_code && (
                    <small style={{ color: '#6b7280', marginLeft: 6 }}>
                      ({referrer.referral_code})
                    </small>
                  )}
                </p>
              </div>
              {donor?.id && (
                <div>
                  <Link
                    to={`/dms/donors/view/${donor.id}`}
                    className="btn-secondary"
                    style={{
                      display: 'inline-block',
                      textDecoration: 'none',
                    }}
                  >
                    Open donor profile
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="view-section">
            <h3>
              <FiDollarSign style={{ marginRight: 8 }} />
              Initial donation
            </h3>
            <div className="view-grid">
              <div>
                <strong>Donation ID</strong>
                <p>
                  {initial_donation?.id ||
                  subscription.initial_donation_id ? (
                    <Link
                      to={`/donations/online_donations/view/${
                        initial_donation?.id ||
                        subscription.initial_donation_id
                      }`}
                    >
                      {initial_donation?.id ||
                        subscription.initial_donation_id}
                    </Link>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div>
                <strong>Order</strong>
                <p>{initial_donation?.orderId || '-'}</p>
              </div>
              <div>
                <strong>Status</strong>
                <p>{initial_donation?.status || '-'}</p>
              </div>
              {initial_donation?.id && (
                <div>
                  <Link
                    to={`/donations/online_donations/view/${initial_donation.id}`}
                    className="btn-secondary"
                    style={{
                      display: 'inline-block',
                      textDecoration: 'none',
                    }}
                  >
                    View initial donation
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="view-section">
            <div className="rd-inst-toolbar">
              <h3 className="rd-inst-toolbar__title">Installments</h3>
              <div className="rd-inst-toolbar__actions">
                {canAddInstallments && (
                  <button
                    type="button"
                    className={`rd-inst-btn ${
                      showAddInstallments ? 'rd-inst-btn--ghost' : 'rd-inst-btn--soft'
                    }`}
                    onClick={() => setShowAddInstallments((v) => !v)}
                  >
                    {showAddInstallments ? <FiX size={16} /> : <FiPlus size={16} />}
                    {showAddInstallments ? 'Close' : 'Add installments'}
                  </button>
                )}
                {canAttachToSelected && (
                  <button
                    type="button"
                    className={`rd-inst-btn ${
                      showAttachSelected ? 'rd-inst-btn--ghost' : 'rd-inst-btn--ghost'
                    }`}
                    onClick={() => setShowAttachSelected((v) => !v)}
                  >
                    <FiPaperclip size={15} />
                    {showAttachSelected
                      ? 'Close attach'
                      : `Attach (${selectedIds.size})`}
                  </button>
                )}
                {canMarkPaid && (
                  <button
                    type="button"
                    className="rd-inst-btn rd-inst-btn--success"
                    disabled={markingPaid || selectedIds.size === 0}
                    onClick={markSelectedPaid}
                  >
                    <FiCheckCircle size={16} />
                    {markingPaid
                      ? 'Saving…'
                      : `Mark as complete (${selectedIds.size})`}
                  </button>
                )}
                {selectedIds.size > 0 && canMarkPaid && (
                  <span className="rd-inst-toolbar__meta">
                    Total{' '}
                    {formatAmount(
                      selectedPendingAmount,
                      subscription.currency,
                    )}
                  </span>
                )}
                {markMessage && (
                  <span className="rd-inst-toolbar__meta">{markMessage}</span>
                )}
                {editMessage && (
                  <span className="rd-inst-toolbar__meta">{editMessage}</span>
                )}
              </div>
            </div>
            {showAddInstallments && canAddInstallments && (
              <div className="rd-inst-panel">
                <div className="rd-inst-panel__head">
                  <div>
                    <h4 className="rd-inst-panel__title">Add installments</h4>
                    <p className="rd-inst-panel__hint">
                      Creates the next unused periods. One attachment (optional)
                      is shared across all new installments.
                    </p>
                  </div>
                </div>
                <div className="rd-inst-panel__grid">
                  <FormInput
                    label="Count *"
                    type="number"
                    min="1"
                    max="36"
                    value={addInstForm.count}
                    onChange={(e) =>
                      setAddInstForm((p) => ({ ...p, count: e.target.value }))
                    }
                  />
                  <FormSelect
                    label="Status"
                    value={addInstForm.status}
                    onChange={(e) =>
                      setAddInstForm((p) => ({ ...p, status: e.target.value }))
                    }
                    options={addInstStatusOptions}
                  />
                  <FormInput
                    label="Amount (optional)"
                    type="number"
                    min="1"
                    placeholder={
                      subscription.amount != null
                        ? String(subscription.amount)
                        : 'Subscription amount'
                    }
                    value={addInstForm.amount}
                    onChange={(e) =>
                      setAddInstForm((p) => ({ ...p, amount: e.target.value }))
                    }
                  />
                </div>
                <div style={{ marginTop: 12 }}>
                  <DonationPendingAttachments
                    ref={addInstAttachmentsRef}
                    items={addInstPendingFiles}
                    onChange={setAddInstPendingFiles}
                    disabled={addingInstallments}
                    title="Shared attachment (optional — applies to all new installments)"
                    fileInputId={`recurring-bulk-inst-attach-${id}`}
                  />
                </div>
                <div className="rd-inst-panel__footer">
                  <button
                    type="button"
                    className="rd-inst-btn rd-inst-btn--primary"
                    disabled={addingInstallments}
                    onClick={submitAddInstallments}
                  >
                    <FiPlus size={16} />
                    {addingInstallments ? 'Adding…' : 'Add installments'}
                  </button>
                  <button
                    type="button"
                    className="rd-inst-btn rd-inst-btn--ghost"
                    disabled={addingInstallments}
                    onClick={() => {
                      setShowAddInstallments(false);
                      setAddInstPendingFiles([]);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {showAttachSelected && canAttachToSelected && (
              <div className="rd-inst-panel">
                <div className="rd-inst-panel__head">
                  <div>
                    <h4 className="rd-inst-panel__title">
                      Attach to {selectedIds.size} selected
                    </h4>
                    <p className="rd-inst-panel__hint">
                      One upload is linked to every selected installment (same
                      file).
                    </p>
                  </div>
                </div>
                <DonationPendingAttachments
                  ref={selectedAttachRef}
                  items={selectedAttachPending}
                  onChange={setSelectedAttachPending}
                  disabled={attachingToSelected}
                  title="Attachment"
                  fileInputId={`recurring-selected-inst-attach-${id}`}
                />
                <div className="rd-inst-panel__footer">
                  <button
                    type="button"
                    className="rd-inst-btn rd-inst-btn--primary"
                    disabled={attachingToSelected}
                    onClick={submitAttachToSelected}
                  >
                    <FiPaperclip size={15} />
                    {attachingToSelected ? 'Uploading…' : 'Upload & link'}
                  </button>
                  <button
                    type="button"
                    className="rd-inst-btn rd-inst-btn--ghost"
                    disabled={attachingToSelected}
                    onClick={() => {
                      setShowAttachSelected(false);
                      setSelectedAttachPending([]);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {showInstallmentCheckboxes && (
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          checked={
                            canMarkPaid && !canEditInstallments
                              ? allPendingSelected
                              : allInstallmentsSelected
                          }
                          onChange={
                            canMarkPaid && !canEditInstallments
                              ? toggleAllPending
                              : toggleAllInstallments
                          }
                          title={
                            canEditInstallments
                              ? 'Select all installments'
                              : 'Select all pending'
                          }
                          aria-label="Select installments"
                        />
                      </th>
                    )}
                    <th>ID</th>
                    <th>Period</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created by</th>
                    <th>Paid at</th>
                    <th>Reason</th>
                    <th style={{ width: 120 }}>Attachments</th>
                    {showInstallmentActions && (
                      <th style={{ width: 140 }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {installments?.length ? (
                    installments.map((inst) => {
                      const isPending =
                        String(inst.status || '').toLowerCase() ===
                        'pending';
                      const isEditing = editingId === inst.id;
                      return (
                        <tr key={inst.id}>
                          {showInstallmentCheckboxes && (
                            <td>
                              <input
                                type="checkbox"
                                disabled={
                                  isEditing ||
                                  (!canEditInstallments && !isPending)
                                }
                                checked={selectedIds.has(inst.id)}
                                onChange={() =>
                                  toggleOne(inst.id, canEditInstallments)
                                }
                                aria-label={`Select installment ${inst.id}`}
                              />
                            </td>
                          )}
                          <td>{inst.id}</td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.period_key}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    period_key: e.target.value,
                                  }))
                                }
                                placeholder="e.g. 2026-09"
                                style={{ width: 110 }}
                              />
                            ) : (
                              inst.period_key || '-'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                value={editForm.amount}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    amount: e.target.value,
                                  }))
                                }
                                style={{ width: 100 }}
                              />
                            ) : (
                              formatAmount(
                                inst.amount,
                                inst.currency || subscription.currency,
                              )
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <select
                                value={editForm.status}
                                disabled={!canReconcile}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    status: e.target.value,
                                  }))
                                }
                              >
                                {installmentStatusOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className={`rd-sub-status rd-sub-status--${
                                  String(inst.status || '').toLowerCase() === 'completed'
                                    ? 'active'
                                    : String(inst.status || '').toLowerCase() === 'failed'
                                    ? 'failed'
                                    : String(inst.status || '').toLowerCase() === 'pending'
                                    ? 'pending'
                                    : 'default'
                                }`}
                                style={{ padding: '3px 10px', fontSize: '12px' }}
                              >
                                {inst.status || 'pending'}
                              </span>
                            )}
                          </td>
                          <td>
                            {inst.created_by
                              ? formatAuditActor(inst.created_by)
                              : '—'}
                          </td>
                          <td>{formatDate(inst.paid_at)}</td>
                          <td>{inst.stripe_billing_reason || '-'}</td>
                          <td>
                            <button
                              type="button"
                              className="rd-inst-attach-chip"
                              onClick={() =>
                                setInstallmentAttachmentTarget(inst)
                              }
                              title="Manage installment attachments"
                            >
                              <FiPaperclip size={14} />
                              <span className="rd-inst-attach-chip__count">
                                {(inst.attachments || []).length}
                              </span>
                            </button>
                          </td>
                          {showInstallmentActions && (
                            <td>
                              {isEditing ? (
                                <div className="rd-inst-actions">
                                  <button
                                    type="button"
                                    className="rd-inst-icon-btn rd-inst-icon-btn--save"
                                    disabled={savingEdit}
                                    onClick={() =>
                                      saveInstallmentEdit(inst.id)
                                    }
                                    title="Save"
                                    aria-label="Save installment"
                                  >
                                    <FiCheck size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="rd-inst-icon-btn"
                                    disabled={savingEdit}
                                    onClick={cancelEdit}
                                    title="Cancel"
                                    aria-label="Cancel edit"
                                  >
                                    <FiX size={15} />
                                  </button>
                                </div>
                              ) : (
                                <div className="rd-inst-actions">
                                  {canReconcile && !subscription.stripe_subscription_id && isPending && (
                                    <button
                                      type="button"
                                      className="rd-inst-icon-btn rd-inst-icon-btn--complete"
                                      disabled={markingInstallmentId === inst.id || markingPaid}
                                      onClick={() => markSingleInstallmentPaid(inst)}
                                      title="Mark as Complete"
                                      aria-label={`Mark installment ${inst.id} as complete`}
                                    >
                                      <FiCheckCircle size={15} />
                                    </button>
                                  )}
                                  {canEditInstallments && (
                                    <button
                                      type="button"
                                      className="rd-inst-icon-btn rd-inst-icon-btn--edit"
                                      onClick={() => startEdit(inst)}
                                      title="Edit installment"
                                      aria-label="Edit installment"
                                    >
                                      <FiEdit2 size={14} />
                                    </button>
                                  )}
                                  {canDeleteInstallments && (
                                    <button
                                      type="button"
                                      className="rd-inst-icon-btn rd-inst-icon-btn--delete"
                                      onClick={() =>
                                        setDeleteInstallmentTarget(inst)
                                      }
                                      title="Delete installment"
                                      aria-label="Delete installment"
                                    >
                                      <FiTrash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          (showInstallmentCheckboxes ? 1 : 0) +
                          8 +
                          (showInstallmentActions ? 1 : 0)
                        }
                        style={{ textAlign: 'center' }}
                      >
                        No installments recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {installmentAttachmentTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 16,
          }}
          onMouseDown={() => setInstallmentAttachmentTarget(null)}
        >
          <div
            style={{
              width: 'min(640px, 100%)',
              maxHeight: '85vh',
              overflow: 'auto',
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <RecurringAttachmentPanel
              entityId={installmentAttachmentTarget.id}
              attachments={installmentAttachmentTarget.attachments || []}
              canUpdate={canUpdate}
              title={`Installment #${installmentAttachmentTarget.id} attachments`}
              compact
              onChanged={async () => {
                await load();
                setInstallmentAttachmentTarget(null);
              }}
            />
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setInstallmentAttachmentTarget(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteInstallmentTarget}
        text={
          deleteInstallmentTarget
            ? `Delete installment #${deleteInstallmentTarget.id} (${
                deleteInstallmentTarget.period_key || 'no period'
              })? This archives the row only.`
            : ''
        }
        delete
        onConfirm={confirmDeleteInstallment}
        onCancel={() =>
          !deletingInstallment && setDeleteInstallmentTarget(null)
        }
      />

      <ConfirmationModal
        isOpen={deleteSubTarget}
        text={`Delete subscription #${subscription.id}? All installments will be archived. Donors and donations are not deleted.`}
        delete
        onConfirm={confirmDeleteSubscription}
        onCancel={() => !deletingSub && setDeleteSubTarget(false)}
      />
    </>
  );
};

export default RecurringDonationView;
