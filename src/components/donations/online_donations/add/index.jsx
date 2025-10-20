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
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useInKindItems } from '../../../../context/InKindItemsContext';
import ReloadButton from '../../../common/buttons/reload';

const AddDonation = () => {
  const navigate = useNavigate();
  const { inKindItems, refetchInKindItems } = useInKindItems();
  console.log("inKindItems", inKindItems);
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
    
    // In-kind donation fields (array of items)
        in_kind_items: [
          {
            name: '',
            description: '',
            category: '',
            condition: 'good',
            quantity: 1,
            estimated_value: '',
            brand: '',
            model: '',
            size: '',
            color: '',
            collection_date: new Date().toISOString().split('T')[0],
            collection_location: '',
            notes: ''
          }
        ],
    
    // Project information
    project_id: '',
    project_name: ''
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

  // Handle adding new in-kind item
  const addInKindItem = () => {
    const newItem = {
      name: '',
      item_code: '',
      description: '',
      category: '',
      condition: 'good',
      quantity: 1,
      estimated_value: '',
      brand: '',
      model: '',
      size: '',
      color: '',
      collection_date: new Date().toISOString().split('T')[0],
      collection_location: '',
      notes: ''
    };
    
    setForm({
      ...form,
      in_kind_items: [...form.in_kind_items, newItem]
    });
  };

  // Handle removing in-kind item
  const removeInKindItem = (index) => {
    if (form.in_kind_items.length > 1) {
      const updatedItems = form.in_kind_items.filter((_, i) => i !== index);
      setForm({
        ...form,
        in_kind_items: updatedItems
      });
    }
  };

  // Handle in-kind item field change
  const handleInKindItemChange = (index, field, value) => {
    const updatedItems = form.in_kind_items.map((item, i) => {
      if (i === index) {
        // If changing the name field, find the selected item and populate its data
        if (field === 'name') {
          const selectedItem = inKindItems.find(inkindItem => inkindItem.name === value);
          if (selectedItem) {
            return {
              ...item,
              name: selectedItem.name,
              description: selectedItem.description || item.description,
              category: selectedItem.category || item.category,
              // Don't override estimated_value, let user keep their input
              estimated_value: item.estimated_value
            };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setForm({
      ...form,
      in_kind_items: updatedItems
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
        // Payment method specific fields
        cheque_number: form.cheque_number || null,
        bank_name: form.bank_name || null,
        
        // In-kind donation fields
        in_kind_items: form.in_kind_items.map(item => ({
          name: item.name || null,
          description: item.description || null,
          category: item.category || null,
          condition: item.condition || null,
          quantity: item.quantity ? parseInt(item.quantity) : null,
          estimated_value: item.estimated_value ? parseFloat(item.estimated_value) : null,
          brand: item.brand || null,
          model: item.model || null,
          size: item.size || null,
          color: item.color || null,
          collection_date: item.collection_date || null,
          collection_location: item.collection_location || null,
          notes: item.notes || null
        }))
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

  // In-kind donation category options
  const inKindCategoryOptions = [
    { value: 'clothing', label: 'Clothing' },
    { value: 'food', label: 'Food' },
    { value: 'medical', label: 'Medical' },
    { value: 'educational', label: 'Educational' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'books', label: 'Books' },
    { value: 'toys', label: 'Toys' },
    { value: 'household', label: 'Household' },
    { value: 'other', label: 'Other' }
  ];

  // In-kind donation condition options
  const inKindConditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
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
                    in_kind_items: method === 'in_kind' ? form.in_kind_items : [
                      {
                        name: '',
                        item_code: '',
                        description: '',
                        category: '',
                        condition: 'good',
                        quantity: 1,
                        estimated_value: '',
                        brand: '',
                        model: '',
                        size: '',
                        color: '',
                        collection_date: new Date().toISOString().split('T')[0],
                        collection_location: '',
                        notes: ''
                      }
                    ]
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
                  <div className="form-section">

                  </div>
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

           {/* In Kind Details - Only show if in kind is selected */}
           {isInKindSelected && (
             <div className='form-section'>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                 <h3 style={{ color: '#2563eb', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem', margin: 0 }}>
                   In-Kind Donation Details
                 </h3>
               </div>

               {form.in_kind_items.map((item, index) => (
                 <div key={index} style={{ 
                   marginBottom: '2rem', 
                   padding: '1.5rem', 
                   border: '1px solid #e5e7eb', 
                   borderRadius: '8px',
                   backgroundColor: '#f9fafb'
                 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                     <h4 style={{ margin: 0, color: '#374151', fontSize: '16px' }}>
                       Item {index + 1}
                     </h4>
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                       <button
                         type="button"
                         onClick={addInKindItem}
                         style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '4px',
                           padding: '6px 12px',
                           backgroundColor: '#10b981',
                           color: 'white',
                           border: 'none',
                           borderRadius: '4px',
                           cursor: 'pointer',
                           fontSize: '12px'
                         }}
                       >
                         <FiPlus size={14} />
                         Add Item
                       </button>
                       {form.in_kind_items.length > 1 && (
                         <button
                           type="button"
                           onClick={() => removeInKindItem(index)}
                           style={{
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px',
                             padding: '6px 12px',
                             backgroundColor: '#ef4444',
                             color: 'white',
                             border: 'none',
                             borderRadius: '4px',
                             cursor: 'pointer',
                             fontSize: '12px'
                           }}
                         >
                           <FiTrash2 size={14} />
                           Remove
                         </button>
                       )}
                     </div>
                   </div>

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                       <div style={{ flex: 1 }}>
                         <FormSelect
                           label="Item Name"
                           name={`name_${index}`}
                           value={item.name}
                           onChange={(e) => handleInKindItemChange(index, 'name', e.target.value)}
                           options={[
                             { value: '', label: 'Select item name...' },
                             ...inKindItems.map(item => ({
                               value: item.name,
                               label: item.name
                             }))
                           ]}
                           required
                         />
                       </div>
                       <ReloadButton 
                         contextRefetch={refetchInKindItems}
                         className="reload-btn--small"
                       />
                     </div>
                   </div>

                   <FormInput
                     label="Description"
                     type="textarea"
                     name={`description_${index}`}
                     value={item.description}
                     onChange={(e) => handleInKindItemChange(index, 'description', e.target.value)}
                     placeholder="Detailed description of the item(s)"
                     rows="3"
                     style={{ marginBottom: '1rem' }}
                   />

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <FormSelect
                       label="Category"
                       name={`category_${index}`}
                       value={item.category}
                       onChange={(e) => handleInKindItemChange(index, 'category', e.target.value)}
                       options={inKindCategoryOptions}
                       required
                       placeholder="Select category"
                     />

                     <FormSelect
                       label="Condition"
                       name={`condition_${index}`}
                       value={item.condition}
                       onChange={(e) => handleInKindItemChange(index, 'condition', e.target.value)}
                       options={inKindConditionOptions}
                       required
                     />
                   </div>

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <FormInput
                       label="Quantity"
                       type="number"
                       name={`quantity_${index}`}
                       value={item.quantity}
                       onChange={(e) => handleInKindItemChange(index, 'quantity', e.target.value)}
                       required
                       placeholder="Enter quantity"
                       min="1"
                     />

                     <FormInput
                       label="Estimated Value (PKR)"
                       type="number"
                       name={`estimated_value_${index}`}
                       value={item.estimated_value}
                       onChange={(e) => handleInKindItemChange(index, 'estimated_value', e.target.value)}
                       placeholder="Estimated market value"
                       step="0.01"
                       min="0"
                     />
                   </div>

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <FormInput
                       label="Brand"
                       type="text"
                       name={`brand_${index}`}
                       value={item.brand}
                       onChange={(e) => handleInKindItemChange(index, 'brand', e.target.value)}
                       placeholder="Brand name (if applicable)"
                     />

                     <FormInput
                       label="Model"
                       type="text"
                       name={`model_${index}`}
                       value={item.model}
                       onChange={(e) => handleInKindItemChange(index, 'model', e.target.value)}
                       placeholder="Model number (if applicable)"
                     />
                   </div>

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <FormInput
                       label="Size"
                       type="text"
                       name={`size_${index}`}
                       value={item.size}
                       onChange={(e) => handleInKindItemChange(index, 'size', e.target.value)}
                       placeholder="Size (if applicable)"
                     />

                     <FormInput
                       label="Color"
                       type="text"
                       name={`color_${index}`}
                       value={item.color}
                       onChange={(e) => handleInKindItemChange(index, 'color', e.target.value)}
                       placeholder="Color (if applicable)"
                     />
                   </div>

                   <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
                     <FormInput
                       label="Collection Date"
                       type="date"
                       name={`collection_date_${index}`}
                       value={item.collection_date}
                       onChange={(e) => handleInKindItemChange(index, 'collection_date', e.target.value)}
                       required
                     />

                     <FormInput
                       label="Collection Location"
                       type="text"
                       name={`collection_location_${index}`}
                       value={item.collection_location}
                       onChange={(e) => handleInKindItemChange(index, 'collection_location', e.target.value)}
                       placeholder="Where was it collected from?"
                     />
                   </div>

                   <FormInput
                     label="Notes"
                     type="textarea"
                     name={`notes_${index}`}
                     value={item.notes}
                     onChange={(e) => handleInKindItemChange(index, 'notes', e.target.value)}
                     placeholder="Any additional notes about the item(s)"
                     rows="2"
                   />
                 </div>
               ))}
             </div>
           )}
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

          {/* Payment Details */}
          {/* <div className="form-section">
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
          </div> */}

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

