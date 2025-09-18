import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { water_program_systems, water_activity_types } from '../../../../../utils/program';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import DynamicFormSection from '../../../../common/DynamicFormSection';
import axios from '../../../../../utils/axios';

const AddWaterReport = () => {
  const navigate = useNavigate();
  
  const initialActivityRow = () => ({
    id: Date.now() + Math.random(),
    activity: water_activity_types[0],
    system: water_program_systems[0],
    quantity: 0
  });

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    activities: [initialActivityRow()]
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleRowChange = (id, field, value) => {
    let newActivities = form.activities.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    );

    if (field === 'quantity') {
      newActivities = newActivities.map(row => {
        if (row.id !== id) return row;
        if (value === '') {
            return { ...row, quantity: '' };
        }
        const num = parseInt(value, 10);
        return { ...row, quantity: isNaN(num) ? 0 : num };
      });
    }

    setForm({ ...form, activities: newActivities });
  };
  
  const addRow = () => {
    setForm(prevForm => ({
      ...prevForm,
      activities: [...prevForm.activities, initialActivityRow()]
    }));
  };

  const removeRow = (id) => {
    if (form.activities.length <= 1) return;
    setForm(prevForm => ({
      ...prevForm,
      activities: prevForm.activities.filter(row => row.id !== id)
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Prepare the data for API call
      const reportsData = form.activities.map(activity => ({
        date: form.date,
        activity: activity.activity,
        system: activity.system,
        quantity: activity.quantity || 0
      }));

      const response = await axios.post('/program/water/reports/multiple', reportsData);
      
      if (response.data.success) {
        navigate('/program/water/reports/list');
      } else {
        setError(response.data.message || 'Failed to create report');
      }
    } catch (err) {
      console.error('Error creating water report:', err);
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderActivityItem = (item) => (
    <div className="form-grid-dynamic" style={{ gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-end', gap: 'var(--spacing-lg)' }}>
      <FormSelect
        name="activity"
        label="Activity"
        value={item.activity}
        onChange={e => handleRowChange(item.id, 'activity', e.target.value)}
        options={water_activity_types}
        required
      />
      <FormSelect
        name="system"
        label="System"
        value={item.system}
        onChange={e => handleRowChange(item.id, 'system', e.target.value)}
        options={water_program_systems}
        required
      />
      <FormInput
        name="quantity"
        label="Quantity"
        type="number"
        min="0"
        value={item.quantity}
        onChange={e => handleRowChange(item.id, 'quantity', e.target.value)}
        placeholder="0"
        required
      />
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader 
          title="Create Water Report"
          showBackButton={true}
          backPath="/program/water/reports/list"
        />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}
            <div className="form-group" style={{maxWidth: '300px'}}>
              <FormInput
                name="date"
                label="Report Date"
                type="date"
                value={form.date}
                onChange={handleDateChange}
                required
              />
            </div>

            <DynamicFormSection
              items={form.activities}
              onAdd={addRow}
              onRemove={removeRow}
              renderItem={renderActivityItem}
              titlePrefix="Activity"
              canRemove={form.activities.length > 1}
            />

            <div className="form-actions">
              <button
                type="submit"
                className="primary_btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddWaterReport; 