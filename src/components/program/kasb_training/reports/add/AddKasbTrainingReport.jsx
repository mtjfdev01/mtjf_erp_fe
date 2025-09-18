import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import PageHeader from '../../../../common/PageHeader';
import './AddKasbTrainingReport.css';
import Navbar from '../../../../Navbar';

const AddKasbTrainingReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    skill_level: '',
    quantity: 0,
    addition: 0,
    left: 0,
    total: 0
  });

  const skillLevelOptions = [
    { value: 'expert', label: 'Expert' },
    { value: 'medium_expert', label: 'Medium Expert' },
    { value: 'new trainee', label: 'New Trainee' }
  ];

  const handleInputChange = (field, e) => {
    const value = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Calculate total
      const quantity = parseInt(updated.quantity) || 0;
      const addition = parseInt(updated.addition) || 0;
      const left = parseInt(updated.left) || 0;
      updated.total = quantity + addition - left;
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/program/kasb-training/reports', formData);
      
      if (response.data.success) {
        navigate('/program/kasb-training/reports');
      } else {
        setError(response.data.message || 'Failed to create report');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while creating the report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-kasb-training-report">
      <Navbar />
      <PageHeader 
        title="Add Kasb Training Report" 
        breadcrumbs={[
          { label: 'Program', path: '/program' },
          { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
          { label: 'Add Report' }
        ]}
        actionButton={{
          label: 'Add Report',
          onClick: handleSubmit,
          disabled: loading
        }}
      />
      
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <FormInput
              name="date"
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e)}
              required
            />
            
            <FormSelect
              name="skill_level"
              label="Skill Level"
              value={formData.skill_level}
              onChange={(e) => handleInputChange('skill_level', e)}
              options={skillLevelOptions}
              required
            />
          </div>

          <div className="form-row">
            <FormInput
              name="quantity"
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e)}
              min="0"
            />
            
            <FormInput
              name="addition"
              label="Addition"
              type="number"
              value={formData.addition}
              onChange={(e) => handleInputChange('addition', e)}
              min="0"
            />
          </div>

          <div className="form-row">
            <FormInput
              name="left"
              label="Left"
              type="number"
              value={formData.left}
              onChange={(e) => handleInputChange('left', e)}
              min="0"
            />
            
            <div className="form-field">
              <label>Total</label>
              <div className="total-display">{formData.total}</div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default AddKasbTrainingReport; 