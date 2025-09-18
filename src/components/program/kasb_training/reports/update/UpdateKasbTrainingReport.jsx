import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import PageHeader from '../../../../common/PageHeader';
import './UpdateKasbTrainingReport.css';

const UpdateKasbTrainingReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/program/kasb-training/reports/${id}`);
      
      if (response.data.success) {
        const report = response.data.data;
        setFormData({
          date: report.date ? new Date(report.date).toISOString().split('T')[0] : '',
          skill_level: report.skill_level || '',
          quantity: report.quantity || 0,
          addition: report.addition || 0,
          left: report.left || 0,
          total: report.total || 0
        });
      } else {
        setError(response.data.message || 'Failed to fetch report');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching the report');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
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
    setSaving(true);
    setError('');

    try {
      const updateData = {
        date: new Date(formData.date),
        skill_level: formData.skill_level,
        quantity: parseInt(formData.quantity) || 0,
        addition: parseInt(formData.addition) || 0,
        left: parseInt(formData.left) || 0,
        total: parseInt(formData.total) || 0
      };

      const response = await axios.patch(`/program/kasb-training/reports/${id}`, updateData);
      
      if (response.data.success) {
        navigate('/program/kasb-training/reports');
      } else {
        setError(response.data.message || 'Failed to update report');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating the report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="update-kasb-training-report">
        <PageHeader 
          title="Update Kasb Training Report" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
            { label: 'Update Report' }
          ]}
        />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="update-kasb-training-report">
      <PageHeader 
        title="Update Kasb Training Report" 
        breadcrumbs={[
          { label: 'Program', path: '/program' },
          { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
          { label: 'Update Report' }
        ]}
      />
      
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <FormInput
              label="Date"
              type="date"
              value={formData.date}
              onChange={(value) => handleInputChange('date', value)}
              required
            />
            
            <FormSelect
              label="Skill Level"
              value={formData.skill_level}
              onChange={(value) => handleInputChange('skill_level', value)}
              options={skillLevelOptions}
              required
            />
          </div>

          <div className="form-row">
            <FormInput
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(value) => handleInputChange('quantity', value)}
              min="0"
            />
            
            <FormInput
              label="Addition"
              type="number"
              value={formData.addition}
              onChange={(value) => handleInputChange('addition', value)}
              min="0"
            />
          </div>

          <div className="form-row">
            <FormInput
              label="Left"
              type="number"
              value={formData.left}
              onChange={(value) => handleInputChange('left', value)}
              min="0"
            />
            
            <FormInput
              label="Total"
              type="number"
              value={formData.total}
              readOnly
              className="readonly-field"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/program/kasb-training/reports')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateKasbTrainingReport; 