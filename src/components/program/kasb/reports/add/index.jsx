import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kasb_centers } from '../../../../../utils/program';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import DynamicFormSection from '../../../../common/DynamicFormSection';
import axios from '../../../../../utils/axios';

const AddKasbReport = () => {
  const navigate = useNavigate();
  
  const initialCenterRow = () => ({
    id: Date.now() + Math.random(),
    center: kasb_centers[0],
    delivery: 0
  });

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    centers: [initialCenterRow()]
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleRowChange = (id, field, value) => {
    let newCenters = form.centers.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    );

    if (field === 'delivery') {
      newCenters = newCenters.map(row => {
        if (row.id !== id) return row;
        if (value === '') {
            return { ...row, delivery: '' };
        }
        const num = parseInt(value, 10);
        return { ...row, delivery: isNaN(num) ? 0 : num };
      });
    }

    setForm({ ...form, centers: newCenters });
  };
  
  const addRow = () => {
    setForm(prevForm => ({
      ...prevForm,
      centers: [...prevForm.centers, initialCenterRow()]
    }));
  };

  const removeRow = (id) => {
    if (form.centers.length <= 1) return;
    setForm(prevForm => ({
      ...prevForm,
      centers: prevForm.centers.filter(row => row.id !== id)
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Prepare the data for API call
      const reportsData = form.centers.map(center => ({
        date: form.date,
        center: center.center,
        delivery: center.delivery || 0
      }));

      const response = await axios.post('/program/kasb/reports', reportsData);
      
      if (response.data.success) {
        navigate('/program/kasb/reports/list');
      } else {
        setError(response.data.message || 'Failed to create report');
      }
    } catch (err) {
      console.error('Error creating kasb report:', err);
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderCenterItem = (item) => (
    <div className="form-grid-dynamic" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end', gap: 'var(--spacing-lg)' }}>
      <FormSelect
        name="center"
        label="Center"
        value={item.center}
        onChange={e => handleRowChange(item.id, 'center', e.target.value)}
        options={kasb_centers}
        required
      />
      <FormInput
        name="delivery"
        label="Delivery"
        type="number"
        min="0"
        value={item.delivery}
        onChange={e => handleRowChange(item.id, 'delivery', e.target.value)}
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
          title="Create Kasb Report"
          showBackButton={true}
          backPath="/program/kasb/reports/list"
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
              items={form.centers}
              onAdd={addRow}
              onRemove={removeRow}
              renderItem={renderCenterItem}
              titlePrefix="Center"
              canRemove={form.centers.length > 1}
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

export default AddKasbReport; 