import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import Navbar from '../../../Navbar';
import './index.css';

const RegisterDonor = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    donor_type: 'individual',
    name: '',
    email: '',
    password: '',
    phone: '',
    first_name: '',
    last_name: '',
    company_name: '',
    company_registration: '',
    contact_person: '',
    designation: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    address: '',
    city: '',
    country: 'Pakistan',
    source: 'fund_raising',
    postal_code: '',
    cnic: '',
    notes: '',
  });
  const [assignedUser, setAssignedUser] = useState(null);
  const [referrerUser, setReferrerUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkingDonor, setCheckingDonor] = useState(false);
  const [donorSearchMessage, setDonorSearchMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
    if (donorSearchMessage && (e.target.name === 'email' || e.target.name === 'phone')) {
      setDonorSearchMessage('');
    }
  };

  const handleUserSelect = (user) => setAssignedUser(user);
  const handleUserClear = () => setAssignedUser(null);
  const handleReferrerSelect = (user) => setReferrerUser(user);
  const handleReferrerClear = () => setReferrerUser(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const donorData = {
        donor_type: form.donor_type,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
        city: form.city,
        country: form.country,
        postal_code: form.postal_code,
        cnic: form.cnic,
        notes: form.notes,
        assigned_to_user_id: assignedUser?.id || null,
        referrer_user_id: referrerUser?.id || null,
        source: form.source,
      };

      if (form.donor_type === 'individual') {
        donorData.name = `${form.first_name} ${form.last_name}`.trim();
        donorData.first_name = form.first_name;
        donorData.last_name = form.last_name;
        donorData.cnic = form.cnic;
      } else {
        donorData.name = form.company_name;
        donorData.company_name = form.company_name;
        donorData.company_registration = form.company_registration;
        donorData.contact_person = form.contact_person;
        donorData.designation = form.designation;
        donorData.company_address = form.company_address;
        donorData.company_phone = form.company_phone;
        donorData.company_email = form.company_email;
      }

      await axiosInstance.post('/donors/register', donorData);
      navigate('/dms/donors/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register donor. Please try again.');
      console.error('Error registering donor:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dms');
  };

  const handleCheckDonorExists = async () => {
    const email = form.email?.trim();
    const phone = form.phone?.trim();
    if (!email && !phone) {
      setDonorSearchMessage('Enter email or phone to search for an existing donor.');
      return;
    }
    setDonorSearchMessage('');
    setCheckingDonor(true);
    try {
      const params = {};
      if (email) params.email = email;
      if (phone) params.phone = phone;
      const res = await axiosInstance.get('/donors/lookup', { params });
      if (res.data.success && res.data.data) {
        navigate(`/dms/donors/view/${res.data.data.id}`);
      } else {
        setDonorSearchMessage('No existing donor found for this email/phone.');
      }
    } catch (err) {
      setDonorSearchMessage(err.response?.data?.message || 'Could not check for existing donor.');
    } finally {
      setCheckingDonor(false);
    }
  };

  const donorTypeOptions = [
    { value: 'individual', label: 'Individual Donor' },
    { value: 'csr', label: 'CSR Donor (Corporate)' },
  ];

  const renderUserOption = (user, index, onSelect) => (
    <div
      key={user.id}
      className="searchable-dropdown__option"
      onClick={() => onSelect(user)}
      style={{
        padding: '12px',
        borderBottom: '1px solid #eee',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
        {user.first_name} {user.last_name}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
      {user.department && (
        <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
          {user.department} • {user.role || 'User'}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <div className="list-content donor-register-page">
          <PageHeader title="Register Donor" onBack={handleBack} />

          {error && (
            <div className="status-message status-message--error">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="form donor-register-form">
            <section className="donor-register-card">
              <h3 className="donor-register-card__title">1. Contact & Type</h3>
              <div className="form-grid-3">
                <FormSelect
                  label="Donor Type"
                  name="donor_type"
                  value={form.donor_type}
                  onChange={handleChange}
                  options={donorTypeOptions}
                  required
                />
                <FormInput
                  label="Email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="Phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="donor-register-lookup">
                <button
                  type="button"
                  className="primary_btn"
                  onClick={handleCheckDonorExists}
                  disabled={checkingDonor}
                  title="Check if a donor with this email or phone already exists"
                >
                  <FiSearch size={16} />
                  {checkingDonor ? 'Checking...' : 'Check existing donor'}
                </button>
                {donorSearchMessage && (
                  <span className="donor-register-lookup__msg">{donorSearchMessage}</span>
                )}
              </div>
            </section>

            {form.donor_type === 'individual' ? (
              <section className="donor-register-card">
                <h3 className="donor-register-card__title">2. Personal Details</h3>
                <div className="form-grid-3">
                  <FormInput
                    label="First Name"
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                  <FormInput
                    label="Last Name"
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                  <FormInput
                    label="CNIC"
                    type="text"
                    name="cnic"
                    value={form.cnic}
                    onChange={handleChange}
                  />
                </div>
              </section>
            ) : (
              <section className="donor-register-card">
                <h3 className="donor-register-card__title">2. Company Details</h3>
                <div className="form-grid-3">
                  <FormInput
                    label="Company Name"
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    required
                  />
                  <FormInput
                    label="Registration Number"
                    type="text"
                    name="company_registration"
                    value={form.company_registration}
                    onChange={handleChange}
                    placeholder="e.g., 123456789"
                  />
                  <FormInput
                    label="Contact Person"
                    type="text"
                    name="contact_person"
                    value={form.contact_person}
                    onChange={handleChange}
                    required
                  />
                  <FormInput
                    label="Designation"
                    type="text"
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="e.g., CSR Manager"
                  />
                  <FormInput
                    label="Company Phone"
                    type="tel"
                    name="company_phone"
                    value={form.company_phone}
                    onChange={handleChange}
                    required
                  />
                  <FormInput
                    label="Company Email"
                    type="email"
                    name="company_email"
                    value={form.company_email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-grid-2 donor-register-card__row">
                  <FormInput
                    label="Company Address"
                    type="text"
                    name="company_address"
                    value={form.company_address}
                    onChange={handleChange}
                    required
                  />
                  <FormInput
                    label="CNIC (optional)"
                    type="text"
                    name="cnic"
                    value={form.cnic}
                    onChange={handleChange}
                  />
                </div>
              </section>
            )}

            <section className="donor-register-card">
              <h3 className="donor-register-card__title">3. Address</h3>
              <div className="form-grid-2">
                <FormInput
                  label="Address"
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required={form.donor_type === 'individual'}
                />
                <FormInput
                  label="City"
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                />
                <FormInput
                  label="Country"
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="Postal Code"
                  type="text"
                  name="postal_code"
                  value={form.postal_code}
                  onChange={handleChange}
                />
              </div>
            </section>

            <section className="donor-register-card">
              <h3 className="donor-register-card__title">4. Access & Assignment</h3>
              <div className="form-grid-2">
                <FormInput
                  label="Password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  minLength="6"
                />
                <FormInput
                  label="Source"
                  type="text"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                />
                <SearchableDropdown
                  label="Assign to User (Optional)"
                  placeholder="Search users by name or email..."
                  apiEndpoint="/users"
                  onSelect={handleUserSelect}
                  onClear={handleUserClear}
                  value={assignedUser}
                  displayKey="first_name"
                  debounceDelay={500}
                  minSearchLength={2}
                  allowResearch={true}
                  renderOption={(user, index) =>
                    renderUserOption(user, index, handleUserSelect)
                  }
                />
                <SearchableDropdown
                  label="Referrer (Optional)"
                  placeholder="Search users by name or email..."
                  apiEndpoint="/users"
                  onSelect={handleReferrerSelect}
                  onClear={handleReferrerClear}
                  value={referrerUser}
                  displayKey="first_name"
                  debounceDelay={500}
                  minSearchLength={2}
                  allowResearch={true}
                  renderOption={(user, index) =>
                    renderUserOption(user, index, handleReferrerSelect)
                  }
                />
              </div>
            </section>

            <section className="donor-register-card">
              <h3 className="donor-register-card__title">5. Notes</h3>
              <FormInput
                label="Notes"
                type="textarea"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any additional information about the donor..."
                rows="3"
              />
            </section>

            <div className="form-actions donor-register-actions">
              <button type="button" className="donor-register-cancel" onClick={handleBack}>
                Cancel
              </button>
              <button type="submit" className="primary_btn" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register Donor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegisterDonor;
