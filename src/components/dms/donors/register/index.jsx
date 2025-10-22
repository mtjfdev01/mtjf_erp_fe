import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import HybridDropdown from '../../../common/HybridDropdown';
import Navbar from '../../../Navbar';
// import '../../Store.css';

const RegisterDonor = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    donor_type: 'individual',
    name: '',
    email: '',
    password: '',
    phone: '',
    // Individual fields
    first_name: '',
    last_name: '',
    // CSR fields
    company_name: '',
    company_registration: '',
    contact_person: '',
    designation: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    // Common fields
    address: '',
    city: '',
    country: 'Pakistan',
    postal_code: '',
    cnic: '',
    notes: ''
  });
  const [assignedUser, setAssignedUser] = useState(null);
  const [referrerUser, setReferrerUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setAssignedUser(user);
  };

  // Handle user clear
  const handleUserClear = () => {
    setAssignedUser(null);
  };

  // Handle referrer selection
  const handleReferrerSelect = (user) => {
    setReferrerUser(user);
  };

  // Handle referrer clear
  const handleReferrerClear = () => {
    setReferrerUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare data based on donor type
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
        assigned_user_id: assignedUser?.id || null,
        referrer_user_id: referrerUser?.id || null
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

      console.log("donorData", donorData);
      await axiosInstance.post('/donors/register', donorData);

      // Redirect to donors list after successful registration
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

  const donorTypeOptions = [
    { value: 'individual', label: 'Individual Donor' },
    { value: 'csr', label: 'CSR Donor (Corporate)' }
  ];

  return (
    <>
      <Navbar />
        <div className="form-content">
          <PageHeader 
            title="Register Donor" 
            onBack={handleBack}
          />
          
          {error && (
            <div className="status-message status-message--error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form">
            {/* Donor Type Selection */}
            <div className="form-section">
              <FormSelect
                label="Donor Type"
                name="donor_type"
                value={form.donor_type}
                onChange={handleChange}
                options={donorTypeOptions}
                required
              />
            </div>

            {/* Individual Donor Fields */}
            {form.donor_type === 'individual' && ( <>
              <div className="form-section">
                <div className="form-grid-2">
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

                  
                </div>
              </div>
                          {/* Address Information */}
            <div className="form-section">

            <div className="form-grid-2">
            <FormInput
                    label="Email"
                    type="text"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
            <FormInput
                label="Address"
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
            />
            <FormInput
                label="City"
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
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
            <FormInput
                label="CNIC"
                type="text"
                name="cnic"
                value={form.cnic}
                onChange={handleChange}
                required
            />
            </div>
            </div>
            </>
            )}

            {/* CSR Donor Fields */}
            {form.donor_type === 'csr' && (<>
              <div className="form-section">
                <div className="form-grid-2">
                  <FormInput
                    label="Company Name"
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    required
                  />
                  
                  <FormInput
                    label="Company Registration Number"
                    type="text"
                    name="company_registration"
                    value={form.company_registration}
                    onChange={handleChange}
                    placeholder="e.g., 123456789"
                  />
                  
                </div>
            </div>      
            <div className="form-section">

                <div className="form-grid-2">
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
            </div>
            <div className="form-section">
                <div className="form-grid-2">
                <FormInput
                  label="Company Address"
                  type="text"
                  name="company_address"
                  value={form.company_address}
                  onChange={handleChange}
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
                </div>
                </div>
            </>)}

             {/* Contact Information */}
             <div className="form-section">
               <div className="form-grid-2">
                 <FormInput
                   label="Phone"
                   type="tel"
                   name="phone"
                   value={form.phone}
                   onChange={handleChange}
                   required
                 />
                                 <FormInput
                  label="Password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
               </div>
             </div>

            {/* User Assignment */}
            <div className="form-section">
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
                renderOption={(user, index) => (
                  <div 
                    key={user.id}
                    className="searchable-dropdown__option"
                    onClick={() => handleUserSelect(user)}
                    style={{ 
                      padding: '12px',
                      borderBottom: index < user.length - 1 ? '1px solid #eee' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {user.first_name} {user.last_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {user.email}
                    </div>
                    {user.department && (
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                        {user.department} • {user.role || 'User'}
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Referrer User */}
            <div className="form-section">
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
                renderOption={(user, index) => (
                  <div 
                    key={user.id}
                    className="searchable-dropdown__option"
                    onClick={() => handleReferrerSelect(user)}
                    style={{ 
                      padding: '12px',
                      borderBottom: index < user.length - 1 ? '1px solid #eee' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {user.first_name} {user.last_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {user.email}
                    </div>
                    {user.department && (
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                        {user.department} • {user.role || 'User'}
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Additional Information */}
            <div className="form-section">
              <FormInput
                label="Notes"
                type="textarea"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any additional information about the donor..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="primary_btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Register Donor'}
              </button>
            </div>
          </form>
        </div>
    </>
  );
};

export default RegisterDonor;
