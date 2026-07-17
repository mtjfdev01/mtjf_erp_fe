import React, { useEffect, useState } from 'react';
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

const AddDonorInteraction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const donorIdFromUrl = searchParams.get('donor_id') || '';

  const [selectedDonor, setSelectedDonor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    donor_id: '',
    activity_type: 'call',
    custom_activity_title: '',
    user_action_text: '',
    donor_response_text: '',
    donor_response_type: '',
    next_action_text: '',
    next_followup_datetime: '',
    status: 'need_followup',
  });

  useEffect(() => {
    if (!donorIdFromUrl || selectedDonor) return;

    const fetchDonor = async () => {
      try {
        const response = await axiosInstance.get(`/donors/${donorIdFromUrl}`);
        if (response.data.success && response.data.data) {
          const donor = response.data.data;
          setSelectedDonor(donor);
          setForm((prev) => ({ ...prev, donor_id: donor.id }));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load donor');
      }
    };

    fetchDonor();
  }, [donorIdFromUrl, selectedDonor]);

  const handleDonorSelect = (donor) => {
    setSelectedDonor(donor);
    setForm((prev) => ({ ...prev, donor_id: donor.id }));
    if (error) setError('');
  };

  const handleDonorClear = () => {
    setSelectedDonor(null);
    setForm((prev) => ({ ...prev, donor_id: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.donor_id) {
      setError('Please select a donor');
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
        donor_id: Number(form.donor_id),
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
        navigate(`/dms/donors/view/${form.donor_id}?tab=journey`, {
          state: { flashMessage: 'Interaction recorded successfully' },
        });
      } else {
        setError(response.data.message || 'Failed to save interaction');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save interaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title="Add Donor Interaction"
          backPath="/dms/donor-relationship/follow-ups"
        />

        {error && (
          <div className="reconciliation-summary reconciliation-summary--error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="form reconciliation-upload-card">
          <div className="form-section">
            <p className="reconciliation-notes">
              Search and select a donor, then record what you did and how they responded.
            </p>

            <div className="form-grid-2">
              <div>
                <SearchableDropdown
                  label="Select Donor :"
                  placeholder="Search donors by name, email, or phone..."
                  apiEndpoint="/donors"
                  onSelect={handleDonorSelect}
                  onClear={handleDonorClear}
                  value={selectedDonor}
                  displayKey="name"
                  debounceDelay={500}
                  minSearchLength={2}
                  allowResearch={true}
                  required
                  renderOption={(donor, index) => (
                    <div
                      key={donor.id}
                      className="searchable-dropdown__option"
                      onClick={() => handleDonorSelect(donor)}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {donor.name || `${donor.first_name || ''} ${donor.last_name || ''}`.trim()}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {[donor.email, donor.phone].filter(Boolean).join(' • ') || `ID: ${donor.id}`}
                      </div>
                    </div>
                  )}
                />
                {!selectedDonor && (
                  <div
                    style={{
                      marginTop: '10px',
                      fontSize: '14px',
                      color: '#666',
                      fontStyle: 'italic',
                    }}
                  >
                    Please register the donor first if not in the system
                  </div>
                )}
              </div>

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

            <div className="form-actions">
              <PrimaryButton type="submit" loading={submitting} loadingText="Saving…">
                Save interaction
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddDonorInteraction;
