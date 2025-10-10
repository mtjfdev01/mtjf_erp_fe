import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import HybridDropdown from '../../../common/HybridDropdown';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { donation_collection_centers } from '../../../../utils/dms';

const AddDonation = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    // Donor information (will come from selected donor)
    donor_id: '',
    
    // Donation details
    amount: '',
    currency: 'PKR',
    date: new Date().toISOString().split('T')[0], // Current date
    donation_type: 'general',
    donation_method: 'cash',
    donation_source: '',
    collection_center: '',
    status: 'pending',
    
    // Payment method specific fields
    cheque_number: '',
    bank_name: '',
    in_kind_item_name: '',
    in_kind_quantity: '',
    
    // Project information
    project_id: '',
    project_name: '',
    
    // Item details (optional)
    item_name: '',
    item_description: '',
    item_price: '',
    
    // Payment details
    orderId: '',
    recurrence_id: ''
  });
  
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Handle donor selection from SearchableDropdown
  const handleDonorSelect = (donor) => {
    setSelectedDonor(donor);
    setForm({
      ...form,
      donor_id: donor.id
    });
  };

  // Handle donor clear
  const handleDonorClear = () => {
    setSelectedDonor(null);
    setForm({
      ...form,
      donor_id: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate donor selection
      if (!form.donor_id) {
        setError('Please select a donor before submitting');
        setIsSubmitting(false);
        return;
      }

      // Prepare donation data
      const donationData = {
        donor_id: form.donor_id,
        amount: parseFloat(form.amount),
        currency: form.currency,
        date: form.date,
        donation_type: form.donation_type,
        donation_method: form.donation_method,
        donation_source: form.donation_source,
        collection_center: form.collection_center || null,
        status: form.status,
        project_id: form.project_id || null,
        project_name: form.project_name,
        item_name: form.item_name,
        item_description: form.item_description,
        item_price: form.item_price ? parseFloat(form.item_price) : null,
        orderId: form.orderId,
        recurrence_id: form.recurrence_id,
        // Payment method specific fields
        cheque_number: form.cheque_number || null,
        bank_name: form.bank_name || null,
        in_kind_item_name: form.in_kind_item_name || null,
        in_kind_quantity: form.in_kind_quantity ? parseInt(form.in_kind_quantity) : null
      };

      await axiosInstance.post('/donations', donationData);

      // Redirect to donations list after successful creation
      navigate('/donations/online_donations/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add donation. Please try again.');
      console.error('Error adding donation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/donations/online_donations/list');
  };

  // Dropdown options
  const donationTypeOptions = [
    { value: 'zakat', label: 'Zakat' },
    { value: 'sadqa', label: 'Sadqa' },
    { value: 'general', label: 'General' },
    { value: 'fidya', label: 'Fidya' },
    { value: 'kaffarah', label: 'Kaffarah' }
  ];

  const donationMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'meezan', label: 'Meezan Bank' },
    { value: 'blinq', label: 'Blinq' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'in_kind', label: 'In Kind' },
    { value: 'online', label: 'Online Payment' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'registered', label: 'Registered' }
  ];

  const currencyOptions = [
    { value: 'PKR', label: 'PKR - Pakistani Rupee' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'SAR', label: 'SAR - Saudi Riyal' }
  ];

  const bankOptions = [
    { value: 'habib_bank', label: 'Habib Bank Limited (HBL)' },
    { value: 'mcb', label: 'Muslim Commercial Bank (MCB)' },
    { value: 'ubl', label: 'United Bank Limited (UBL)' },
    { value: 'allied_bank', label: 'Allied Bank Limited (ABL)' },
    { value: 'meezan_bank', label: 'Meezan Bank' },
    { value: 'national_bank', label: 'National Bank of Pakistan (NBP)' },
    { value: 'standard_chartered', label: 'Standard Chartered Bank' },
    { value: 'bank_alfalah', label: 'Bank Alfalah' },
    { value: 'faysal_bank', label: 'Faysal Bank' },
    { value: 'askari_bank', label: 'Askari Bank' },
    { value: 'js_bank', label: 'JS Bank' },
    { value: 'soneri_bank', label: 'Soneri Bank' },
    { value: 'silk_bank', label: 'Silk Bank' },
    { value: 'other', label: 'Other Bank' }
  ];

  // Check if cheque is selected as payment method
  const isChequeSelected = form.donation_method === 'cheque';
  
  // Check if in kind is selected as payment method
  const isInKindSelected = form.donation_method === 'in_kind';
  
  // Check if collection center is selected as donation source
  const isCollectionCenter = form.donation_source === 'collection_center';

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader 
          title="Add Donation" 
          onBack={handleBack}
        />
        
        {error && (
          <div className="status-message status-message--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          {/* Donor Selection */}
          <div className="form-section">
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
              renderOption={(donor, index) => (
                <div 
                  key={donor.id}
                  className="searchable-dropdown__option"
                  onClick={() => handleDonorSelect(donor)}
                  style={{ 
                    padding: '12px',
                    borderBottom: index < donor.length - 1 ? '1px solid #eee' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    {donor.name || `${donor.first_name} ${donor.last_name}`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {donor.email} • {donor.phone}
                  </div>
                  {donor.donor_type && (
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      {donor.donor_type === 'individual' ? 'Individual' : 'Corporate'} Donor
                    </div>
                  )}
                </div>
              )}
            />
            {!selectedDonor && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                💡 Please register the donor first if not in the system
              </div>
            )}
          </div>

          {/* Donation Details */}
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Donation Details</h3>
            <div className="form-grid-2">
              <FormInput
                label="Amount"
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                placeholder="0.00"
                step="0.01"
                min="0"
              />

              <FormSelect
                label="Currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                options={currencyOptions}
                required
              />

              <FormInput
                label="Donation Date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />

              <FormSelect
                label="Donation Type"
                name="donation_type"
                value={form.donation_type}
                onChange={handleChange}
                options={donationTypeOptions}
                required
              />

              <FormSelect
                label="Payment Method"
                name="donation_method"
                value={form.donation_method}
                onChange={(e) => {
                  const method = e.target.value;
                  setForm({ 
                    ...form, 
                    donation_method: method,
                    // Set status to pending if cheque is selected
                    status: method === 'cheque' ? 'pending' : form.status,
                    // Reset cheque fields if not cheque
                    cheque_number: method === 'cheque' ? form.cheque_number : '',
                    bank_name: method === 'cheque' ? form.bank_name : '',
                    // Reset in kind fields if not in kind
                    in_kind_item_name: method === 'in_kind' ? form.in_kind_item_name : '',
                    in_kind_quantity: method === 'in_kind' ? form.in_kind_quantity : ''
                  });
                }}
                options={donationMethodOptions}
                required
              />

              {/* Cheque Fields - Only show if cheque is selected */}
              {isChequeSelected && (
                <>
                  <FormInput
                    label="Cheque Number"
                    type="text"
                    name="cheque_number"
                    value={form.cheque_number}
                    onChange={handleChange}
                    required
                    placeholder="Enter cheque number"
                  />

                  <FormSelect
                    label="Bank Name"
                    name="bank_name"
                    value={form.bank_name}
                    onChange={handleChange}
                    options={bankOptions}
                    required
                  />
                </>
              )}

              {/* In Kind Fields - Only show if in kind is selected */}
              {isInKindSelected && (
                <>
                  <FormInput
                    label="Item Name"
                    type="text"
                    name="in_kind_item_name"
                    value={form.in_kind_item_name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Clothes, Food items, Books"
                  />

                  <FormInput
                    label="Quantity"
                    type="number"
                    name="in_kind_quantity"
                    value={form.in_kind_quantity}
                    onChange={handleChange}
                    required
                    placeholder="Enter quantity"
                    min="1"
                  />
                </>
              )}

              <FormSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={statusOptions}
                required
              />

              <HybridDropdown
                label="Donation Source"
                placeholder="Type or select source..."
                options={[
                  { value: 'website', label: 'Website' },
                  { value: 'mobile_app', label: 'Mobile App' },
                  { value: 'home_collection', label: 'Home Collection' },
                  { value: 'email_campaign', label: 'Email Campaign' },
                  { value: 'event', label: 'Event' },
                  { value: 'referral', label: 'Referral' },
                  { value: 'collection_center', label: 'Collection Center' },
                  { value: 'collection_box', label: 'Collection Box' }
                ]}
                value={form.donation_source}
                onChange={(value) => setForm({ 
                  ...form, 
                  donation_source: value,
                  // Reset collection center when source changes
                  collection_center: value === 'collection_center' ? form.collection_center : ''
                })}
                allowCustom={true}
              />

              {/* Collection Center Field - Only show if collection_center is selected */}
              {isCollectionCenter && (
                <HybridDropdown
                  label="Collection Center"
                  placeholder="Type or select collection center..."
                  options={donation_collection_centers}
                  value={form.collection_center}
                  onChange={(value) => setForm({ ...form, collection_center: value })}
                  allowCustom={true}
                />
              )}
            </div>
          </div>

          {/* Project Information */}
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Project Information (Optional)</h3>
            <div className="form-grid-2">
              <FormInput
                label="Project ID"
                type="text"
                name="project_id"
                value={form.project_id}
                onChange={handleChange}
                placeholder="Enter project ID"
              />

              <FormInput
                label="Project Name"
                type="text"
                name="project_name"
                value={form.project_name}
                onChange={handleChange}
                placeholder="Enter project name"
              />
            </div>
          </div>

          {/* Item Details - Only show when In Kind is selected */}
          {isInKindSelected && (
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Item Details (Required)</h3>
            <div className="form-grid-2">
              <FormInput
                label="Item Name"
                type="text"
                name="item_name"
                value={form.item_name}
                onChange={handleChange}
                placeholder="e.g., Food Package, Medical Aid"
                required
              />

              <FormInput
                label="Item Price"
                type="number"
                name="item_price"
                value={form.item_price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />

              <div style={{ gridColumn: '1 / -1' }}>
                <FormInput
                  label="Item Description"
                  type="textarea"
                  name="item_description"
                  value={form.item_description}
                  onChange={handleChange}
                  placeholder="Describe the item..."
                  rows="3"
                  required
                />
              </div>
            </div>
          </div>
          )}

          {/* Payment Details */}
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Payment Details (Optional)</h3>
            <div className="form-grid-2">
              <FormInput
                label="Order ID"
                type="text"
                name="orderId"
                value={form.orderId}
                onChange={handleChange}
                placeholder="Bank/Payment gateway order ID"
              />

              <FormInput
                label="Recurrence ID"
                type="text"
                name="recurrence_id"
                value={form.recurrence_id}
                onChange={handleChange}
                placeholder="For recurring donations"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="primary_btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Donation...' : 'Add Donation'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddDonation;

