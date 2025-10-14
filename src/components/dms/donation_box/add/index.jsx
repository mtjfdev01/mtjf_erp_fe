import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import HybridDropdown from '../../../common/HybridDropdown';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';

const AddDonationBox = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    // Box identification
    box_id_no: '',
    key_no: '',
    
    // Location information
    region: '',
    city: '',
    frd_officer_reference: '',
    
    // Shop details
    shop_name: '',
    shopkeeper: '',
    cell_no: '',
    landmark_marketplace: '',
    route: '',
    
    // Box configuration
    box_type: 'medium',
    active_since: new Date().toISOString().split('T')[0],
    status: 'active',
    collection_frequency: 'weekly'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields
    //   if (!form.box_id_no || !form.shop_name || !form.region || !form.city) {
    //     setError('Please fill in all required fields (Box ID, Shop Name, Region, City)');
    //     setIsSubmitting(false);
    //     return;
    //   }

      // Prepare donation box data
      const donationBoxData = {
        box_id_no: form.box_id_no,
        key_no: form.key_no || null,
        region: form.region,
        city: form.city,
        frd_officer_reference: form.frd_officer_reference || null,
        shop_name: form.shop_name,
        shopkeeper: form.shopkeeper || null,
        cell_no: form.cell_no || null,
        landmark_marketplace: form.landmark_marketplace || null,
        route: form.route || null,
        box_type: form.box_type,
        active_since: form.active_since,
        status: form.status,
        collection_frequency: form.collection_frequency
      };

      await axiosInstance.post('donation-box', donationBoxData);

      // Redirect to donation boxes list after successful creation
      navigate('/dms/donation-boxes/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add donation box. Please try again.');
      console.error('Error adding donation box:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dms/donation-boxes/list');
  };

  // Dropdown options
  const regionOptions = [
    { value: 'karachi', label: 'Karachi' },
    { value: 'lahore', label: 'Lahore' },
    { value: 'islamabad', label: 'Islamabad' },
    { value: 'rawalpindi', label: 'Rawalpindi' },
    { value: 'faisalabad', label: 'Faisalabad' },
    { value: 'multan', label: 'Multan' },
    { value: 'peshawar', label: 'Peshawar' },
    { value: 'quetta', label: 'Quetta' },
    { value: 'hyderabad', label: 'Hyderabad' },
    { value: 'sukkur', label: 'Sukkur' }
  ];

  const cityOptions = [
    { value: 'karachi', label: 'Karachi' },
    { value: 'lahore', label: 'Lahore' },
    { value: 'islamabad', label: 'Islamabad' },
    { value: 'rawalpindi', label: 'Rawalpindi' },
    { value: 'faisalabad', label: 'Faisalabad' },
    { value: 'multan', label: 'Multan' },
    { value: 'peshawar', label: 'Peshawar' },
    { value: 'quetta', label: 'Quetta' },
    { value: 'hyderabad', label: 'Hyderabad' },
    { value: 'sukkur', label: 'Sukkur' }
  ];

  const boxTypeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'medium_star', label: 'Medium/Star' },
    { value: 'premium', label: 'Premium' },
    { value: 'standard', label: 'Standard' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'retired', label: 'Retired' },
    { value: 'pending', label: 'Pending' }
  ];

  const collectionFrequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const frdOfficerOptions = [
    { value: 'faisal_maqbool', label: 'Faisal Maqbool' },
    { value: 'ahmed_khan', label: 'Ahmed Khan' },
    { value: 'sara_ahmed', label: 'Sara Ahmed' },
    { value: 'muhammad_ali', label: 'Muhammad Ali' },
    { value: 'fatima_raza', label: 'Fatima Raza' },
    { value: 'hassan_malik', label: 'Hassan Malik' }
  ];

  // Common landmarks/marketplaces based on the data
  const landmarkOptions = [
    { value: 'johar', label: 'Johar' },
    { value: 'dha', label: 'DHA' },
    { value: 'gulshan', label: 'Gulshan' },
    { value: 'clifton', label: 'Clifton' },
    { value: 'defence', label: 'Defence' },
    { value: 'malir', label: 'Malir' },
    { value: 'north_nazimabad', label: 'North Nazimabad' },
    { value: 'saddar', label: 'Saddar' },
    { value: 'korangi', label: 'Korangi' },
    { value: 'landhi', label: 'Landhi' }
  ];

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader 
          title="Add Donation Box" 
          onBack={handleBack}
        />
        
        {error && (
          <div className="status-message status-message--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          {/* Box Identification */}
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Box Identification</h3>
            <div className="form-grid-2">
              <FormInput
                label="Box ID Number"
                type="text"
                name="box_id_no"
                value={form.box_id_no}
                onChange={handleChange}
                required
                placeholder="e.g., 140, 201, 202"
              />

              <FormInput
                label="Key Number"
                type="text"
                name="key_no"
                value={form.key_no}
                onChange={handleChange}
                placeholder="e.g., 625, 71, 681"
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Location Information</h3>
            <div className="form-grid-2">
              <FormSelect
                label="Region"
                name="region"
                value={form.region}
                onChange={handleChange}
                options={regionOptions}
                required
              />

              <FormSelect
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                options={cityOptions}
                required
              />

              <HybridDropdown
                label="FRD Officer Reference"
                placeholder="Type or select officer..."
                options={frdOfficerOptions}
                value={form.frd_officer_reference}
                onChange={(value) => setForm({ ...form, frd_officer_reference: value })}
                allowCustom={true}
              />

              <HybridDropdown
                label="Landmark / Marketplace"
                placeholder="Type or select landmark..."
                options={landmarkOptions}
                value={form.landmark_marketplace}
                onChange={(value) => setForm({ ...form, landmark_marketplace: value })}
                allowCustom={true}
              />
            </div>
          </div>

          {/* Shop Details */}
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Shop Details</h3>
            <div className="form-grid-2">
              <FormInput
                label="Shop Name"
                type="text"
                name="shop_name"
                value={form.shop_name}
                onChange={handleChange}
                required
                placeholder="e.g., Flexon, DAH Club & Authority"
              />

              <FormInput
                label="Shopkeeper Name"
                type="text"
                name="shopkeeper"
                value={form.shopkeeper}
                onChange={handleChange}
                placeholder="e.g., Muneeb, Muzamil"
              />

              <FormInput
                label="Cell Number"
                type="tel"
                name="cell_no"
                value={form.cell_no}
                onChange={handleChange}
                placeholder="e.g., 0317-2841827"
              />

              <FormInput
                label="Route"
                type="text"
                name="route"
                value={form.route}
                onChange={handleChange}
                placeholder="Route information"
              />
            </div>
          </div>

          {/* Box Configuration */}
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Box Configuration</h3>
            <div className="form-grid-2">
              <FormSelect
                label="Box Type"
                name="box_type"
                value={form.box_type}
                onChange={handleChange}
                options={boxTypeOptions}
                required
              />

              <FormInput
                label="Active Since"
                type="date"
                name="active_since"
                value={form.active_since}
                onChange={handleChange}
                required
              />

              <FormSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={statusOptions}
                required
              />

              <FormSelect
                label="Collection Frequency"
                name="collection_frequency"
                value={form.collection_frequency}
                onChange={handleChange}
                options={collectionFrequencyOptions}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="primary_btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Donation Box...' : 'Add Donation Box'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddDonationBox;
