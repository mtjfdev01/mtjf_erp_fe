import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import SearchableDropdown from '../../../common/SearchableDropdown';
import { PrimaryButton } from '../../../common/buttons';
import {
  ACTIVITY_TYPE_OPTIONS,
  RESPONSE_TYPE_OPTIONS,
  INTERACTION_STATUS_OPTIONS,
} from '../shared/constants';
import '../donor-relationship.css';

const donorDisplayName = (donor) =>
  donor?.name ||
  `${donor?.first_name || ''} ${donor?.last_name || ''}`.trim() ||
  'Unnamed';

const filterAssignedDonors = (donors, term = '') => {
  const query = String(term || '').trim().toLowerCase();
  if (!query) return donors;
  return donors.filter((d) => {
    const name = donorDisplayName(d).toLowerCase();
    const email = String(d.email || '').toLowerCase();
    const phone = String(d.phone || '').toLowerCase();
    return (
      name.includes(query) || email.includes(query) || phone.includes(query)
    );
  });
};

const AddDonorInteraction = ({
  embedded = false,
  isModal = false,
  embeddedDonorId = null,
  embeddedCsrDonorId = null,
  embeddedCsrPocId = null,
  onSaved = null,
  onCancel = null,
  onClose = null,
} = {}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDonorId =
    (embeddedDonorId != null && embeddedDonorId !== ''
      ? String(embeddedDonorId)
      : null) ||
    searchParams.get('donor_id') ||
    '';
  const preselectedCsrDonorId =
    (embeddedCsrDonorId != null && embeddedCsrDonorId !== ''
      ? String(embeddedCsrDonorId)
      : null) ||
    searchParams.get('csr_donor_id') ||
    '';
  const preselectedCsrPocId =
    (embeddedCsrPocId != null && embeddedCsrPocId !== ''
      ? String(embeddedCsrPocId)
      : null) ||
    searchParams.get('csr_poc_id') ||
    '';

  const isCsrMode = !!preselectedCsrDonorId;
  const isPocMode = !!preselectedCsrPocId && !preselectedCsrDonorId;

  const [donors, setDonors] = useState([]);
  const [csrPocs, setCsrPocs] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedCsrDonor, setSelectedCsrDonor] = useState(null);
  const [selectedPoc, setSelectedPoc] = useState(null);
  const [loadingDonors, setLoadingDonors] = useState(!isCsrMode && !isPocMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    donor_id: preselectedDonorId,
    csr_donor_id: preselectedCsrDonorId,
    csr_poc_id: preselectedCsrPocId,
    activity_type: 'call',
    custom_activity_title: '',
    user_action_text: '',
    donor_response_text: '',
    donor_response_type: '',
    next_action_text: '',
    next_followup_datetime: '',
    status: 'need_followup',
  });

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    } else if (typeof onCancel === 'function') {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  // Load Standalone POC details if in POC mode
  useEffect(() => {
    if (!isPocMode || !preselectedCsrPocId) return;
    const loadPoc = async () => {
      try {
        setLoadingDonors(true);
        const res = await axiosInstance.get(`/csr-pocs/${preselectedCsrPocId}`);
        if (res.data?.success && res.data?.data) {
          const pocData = res.data.data;
          setSelectedPoc(pocData);
          setForm((prev) => ({
            ...prev,
            csr_poc_id: String(pocData.id),
            csr_donor_id: pocData.csr_donor_id ? String(pocData.csr_donor_id) : '',
          }));
        }
      } catch (err) {
        console.warn('Failed to load POC details:', err);
      } finally {
        setLoadingDonors(false);
      }
    };
    loadPoc();
  }, [isPocMode, preselectedCsrPocId]);

  // Load CSR donor details if in CSR mode
  useEffect(() => {
    if (!isCsrMode) return;
    const loadCsrDonor = async () => {
      try {
        setLoadingDonors(true);
        const res = await axiosInstance.get(`/csr-donors/${preselectedCsrDonorId}`);
        if (res.data?.success) {
          setSelectedCsrDonor(res.data.data);
          setForm((prev) => ({
            ...prev,
            csr_donor_id: String(preselectedCsrDonorId),
            csr_poc_id: preselectedCsrPocId || prev.csr_poc_id || '',
          }));
        }
        const pocsRes = await axiosInstance.get(`/csr-donors/${preselectedCsrDonorId}/pocs`, {
          params: { page: 1, pageSize: 200 },
        });
        setCsrPocs(pocsRes.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load CSR donor');
      } finally {
        setLoadingDonors(false);
      }
    };
    loadCsrDonor();
  }, [isCsrMode, preselectedCsrDonorId, preselectedCsrPocId]);

  // Load assigned donors if in individual donor mode
  useEffect(() => {
    if (isCsrMode || isPocMode) return;
    const loadDonors = async () => {
      try {
        setLoadingDonors(true);
        const res = await axiosInstance.get('/donor-relationship/assigned-donors');
        if (res.data.success) {
          setDonors(res.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assigned donors');
      } finally {
        setLoadingDonors(false);
      }
    };
    loadDonors();
  }, [isCsrMode, isPocMode]);

  useEffect(() => {
    if (isCsrMode || isPocMode || !preselectedDonorId || !donors.length || selectedDonor) return;
    const match = donors.find(
      (d) => String(d.id) === String(preselectedDonorId),
    );
    if (match) {
      setSelectedDonor(match);
      setForm((prev) => ({ ...prev, donor_id: String(match.id) }));
    }
  }, [isCsrMode, isPocMode, preselectedDonorId, donors, selectedDonor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleDonorSelect = (donor) => {
    setSelectedDonor(donor);
    setForm((prev) => ({ ...prev, donor_id: String(donor.id) }));
    if (error) setError('');
  };

  const handleDonorClear = () => {
    setSelectedDonor(null);
    setForm((prev) => ({ ...prev, donor_id: '' }));
  };

  const searchAssignedDonors = useCallback(
    async (term) => filterAssignedDonors(donors, term),
    [donors],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.donor_id && !form.csr_donor_id && !form.csr_poc_id) {
      setError(
        isPocMode
          ? 'POC is required'
          : isCsrMode
            ? 'CSR donor is required'
            : 'Please select a donor',
      );
      return;
    }
    if (!form.user_action_text?.trim()) {
      setError('Please describe what you did');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        ...(form.csr_donor_id
          ? {
              csr_donor_id: Number(form.csr_donor_id),
              ...(form.csr_poc_id ? { csr_poc_id: Number(form.csr_poc_id) } : {}),
            }
          : form.csr_poc_id
            ? { csr_poc_id: Number(form.csr_poc_id) }
            : { donor_id: Number(form.donor_id) }),
        activity_type: form.activity_type,
        custom_activity_title:
          form.activity_type === 'custom' ? form.custom_activity_title : undefined,
        user_action_text: form.user_action_text,
        donor_response_text: form.donor_response_text || undefined,
        donor_response_type: form.donor_response_type || undefined,
        next_action_text: form.next_action_text || undefined,
        next_followup_datetime: form.next_followup_datetime || undefined,
        status: form.status,
      };

      const response = await axiosInstance.post('/donor-relationship/interactions', payload);
      if (response.data.success) {
        if (typeof onSaved === 'function') {
          onSaved(response.data.data || null);
          return;
        }
        if (isModal && typeof onClose === 'function') {
          onClose();
          return;
        }
        if (isPocMode && selectedPoc?.donation_box_id) {
          navigate(`/dms/donation_box/profile/${selectedPoc.donation_box_id}?tab=crm`, {
            state: { flashMessage: 'Interaction recorded successfully' },
          });
        } else if (form.csr_donor_id) {
          const personQuery = form.csr_poc_id ? `?person=${form.csr_poc_id}` : '';
          navigate(`/dms/csr-donors/view/${form.csr_donor_id}${personQuery}`, {
            state: { flashMessage: 'Interaction recorded successfully' },
          });
        } else if (form.donor_id) {
          const donorId = form.donor_id;
          navigate(`/dms/donors/view/${donorId}?tab=journey`, {
            state: { flashMessage: 'Interaction recorded successfully' },
          });
        } else {
          navigate(-1);
        }
      } else {
        setError(response.data.message || 'Failed to save interaction');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save interaction');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormContent = () => (
    <div className="form-section" style={{ margin: 0, padding: 0 }}>
      <p className="reconciliation-notes" style={{ marginBottom: '16px' }}>
        {isPocMode
          ? `Record interaction or follow-up for ${selectedPoc?.name || 'this contact person'}.`
          : isCsrMode
            ? 'Record what you did and how the CSR donor responded. Interactions are linked to the company, not individual POC contacts.'
            : 'Record what you did and how the donor responded. You can only add interactions for donors assigned to you.'}
      </p>

      <div className="form-grid-2">
        {isPocMode ? (
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Person of Contact (POC)
            </label>
            <div style={{
              padding: '10px 14px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <div>
                <div style={{ fontWeight: 600, color: '#0284c7', fontSize: '14px' }}>
                  {selectedPoc?.name || `POC #${preselectedCsrPocId}`}
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    borderRadius: '12px',
                    marginLeft: '8px',
                    fontWeight: 600,
                  }}>
                    {selectedPoc?.type || 'Donation Boxes'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {[
                    selectedPoc?.phone,
                    selectedPoc?.donation_box?.name || selectedPoc?.donation_box?.shop_name ? `Unit: ${selectedPoc.donation_box.name || selectedPoc.donation_box.shop_name}` : null,
                    selectedPoc?.donation_box?.box_id_no ? `Box #${selectedPoc.donation_box.box_id_no}` : null,
                  ].filter(Boolean).join(' • ')}
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px' }}>
                ✓ POC Linked
              </span>
            </div>
          </div>
        ) : isCsrMode ? (
          <>
            <FormInput
              label="CSR Donor"
              name="csr_donor_display"
              value={selectedCsrDonor?.name || (loadingDonors ? 'Loading…' : 'CSR Donor')}
              readOnly
              disabled
            />
            <div className="form-group">
              <label htmlFor="csr_poc_id">POC (optional)</label>
              <select
                id="csr_poc_id"
                name="csr_poc_id"
                className="form-control"
                value={form.csr_poc_id || ''}
                onChange={handleChange}
              >
                <option value="">Company-wide (no specific POC)</option>
                {csrPocs.map((row) => {
                  const pocRow = row.poc || row;
                  return (
                    <option key={pocRow.id} value={String(pocRow.id)}>
                      {pocRow.name || pocRow.email || `POC #${pocRow.id}`}
                    </option>
                  );
                })}
              </select>
            </div>
          </>
        ) : (
          <SearchableDropdown
            label="Donor"
            name="donor_id"
            placeholder={
              loadingDonors
                ? 'Loading assigned donors…'
                : 'Search donors by name, email, or phone...'
            }
            onSearch={searchAssignedDonors}
            staticOptions={donors}
            onSelect={handleDonorSelect}
            onClear={handleDonorClear}
            value={selectedDonor}
            displayKey="name"
            debounceDelay={300}
            minSearchLength={1}
            allowResearch={true}
            required
            noResultsText={
              loadingDonors
                ? 'Loading…'
                : 'No assigned donors match your search'
            }
            renderOption={(donor) => (
              <>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                  {donorDisplayName(donor)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {[donor.email, donor.phone].filter(Boolean).join(' • ') ||
                    'No contact info'}
                </div>
              </>
            )}
          />
        )}

        <FormSelect
          name="activity_type"
          label="Activity type"
          value={form.activity_type}
          onChange={handleChange}
          options={ACTIVITY_TYPE_OPTIONS}
          required
        />

        {form.activity_type === 'custom' && (
          <FormInput
            name="custom_activity_title"
            label="Custom activity title"
            value={form.custom_activity_title}
            onChange={handleChange}
            required
          />
        )}

        <FormSelect
          name="status"
          label="Status"
          value={form.status}
          onChange={handleChange}
          options={INTERACTION_STATUS_OPTIONS}
        />

        <FormSelect
          name="donor_response_type"
          label="Donor response type"
          value={form.donor_response_type}
          onChange={handleChange}
          options={RESPONSE_TYPE_OPTIONS}
        />

        <FormInput
          name="next_followup_datetime"
          label="Follow-up date & time"
          type="datetime-local"
          value={form.next_followup_datetime}
          onChange={handleChange}
        />
      </div>

      <FormTextarea
        name="user_action_text"
        label="What did you do?"
        value={form.user_action_text}
        onChange={handleChange}
        rows={3}
        required
      />

      <FormTextarea
        name="donor_response_text"
        label="Donor response"
        value={form.donor_response_text}
        onChange={handleChange}
        rows={3}
      />

      <FormTextarea
        name="next_action_text"
        label="Next step"
        value={form.next_action_text}
        onChange={handleChange}
        rows={2}
      />

      <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
        {(isModal || !embedded) && (
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#475569',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
        <PrimaryButton type="submit" loading={submitting} loadingText="Saving…">
          Save interaction
        </PrimaryButton>
      </div>
    </div>
  );

  // Modal Card markup
  const modalMarkup = (
    <div
      className="donor-relationship-modal donor-relationship-modal--add-interaction"
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 'min(760px, 95vw)',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div
        className="donor-relationship-modal__header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Add Donor Interaction
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            {isPocMode
              ? 'Log a call, visit, or follow-up note for this contact person.'
              : isCsrMode
                ? 'Record what you did and how the CSR donor responded.'
                : 'Record what you did and how the donor responded.'}
          </p>
        </div>
        <button
          type="button"
          className="donor-relationship-modal__close"
          onClick={handleClose}
          aria-label="Close"
          style={{
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: '#64748b',
            lineHeight: 1,
          }}
        >
          &times;
        </button>
      </div>

      {error && (
        <div className="reconciliation-summary reconciliation-summary--error" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form" style={{ margin: 0, padding: 0, border: 'none', boxShadow: 'none' }}>
        {renderFormContent()}
      </form>
    </div>
  );

  // 1. Explicit Modal or Embedded mode (always in a popup dialog)
  if (isModal || embedded) {
    return (
      <div
        className="donor-relationship-modal-overlay"
        style={{ zIndex: 1100 }}
        onClick={handleClose}
      >
        {modalMarkup}
      </div>
    );
  }

  // 2. Standalone Route mode (/dms/donor-relationship/add) -> render as centered modal popup
  return (
    <>
      <Navbar />
      <div
        className="donor-relationship-modal-overlay"
        style={{
          zIndex: 1050,
          marginTop: 'calc(var(--navbar-height, 64px) + 10px)',
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
        }}
        onClick={handleClose}
      >
        {modalMarkup}
      </div>
    </>
  );
};

export default AddDonorInteraction;
