import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import './index.css';

const AddTreePlantationReport = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    report_date: '',
    school_name: '',
    plants: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.report_date || !form.school_name || !form.plants) {
      setError('All fields are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/program/tree_plantation/reports', {
        ...form,
        plants: parseInt(form.plants, 10)
      });
      navigate('/program/tree_plantation/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader 
          title="Add Tree Plantation Report"
          showBackButton={true}
          backPath="/program/tree_plantation/reports/list"
        />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}
            <div className="form-grid-2">
              <FormInput
                name="report_date"
                label="Date"
                type="date"
                value={form.report_date}
                onChange={handleChange}
                required
              />
              <FormInput
                name="school_name"
                label="School Name"
                type="text"
                value={form.school_name}
                onChange={handleChange}
                required
              />
              <FormInput
                name="plants"
                label="Plants (Quantity)"
                type="number"
                min="0"
                value={form.plants}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary_btn" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddTreePlantationReport; 