import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ration_vulnerabilities } from '../../../../utils/program';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import './index.css';
import RationReportSwitch from '../RationReportSwitch';

const AddRationReport = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
    is_alternate: false,
    full_widows: 0,
    full_divorced: 0,
    full_disable: 0,
    full_indegent: 0,
    full_orphan: 0,
    half_widows: 0,
    half_divorced: 0,
    half_disable: 0,
    half_indegent: 0,
    half_orphan: 0,
    life_time: 0
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'is_alternate' ? e.target.checked : value
    }));
    if (error) setError('');
  };

  const handleVulnerabilityChange = (type, vul, value) => {
    const fieldName = `${type}_${vul.toLowerCase()}`;
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setForm(prev => ({
      ...prev,
      [fieldName]: isNaN(numValue) ? 0 : numValue
    }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.report_date) {
      setError('Date is required');
      return;
    }
    setIsSubmitting(true);
    
    try {
      await axiosInstance.post('/program/ration/reports', form);
      navigate('/program/ration_report/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit form. Please try again.');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotal = (type) => {
    return ration_vulnerabilities.reduce((sum, vul) => {
      const fieldName = `${type}_${vul.toLowerCase()}`;
      return sum + (form[fieldName] || 0);
    }, 0);
  };

  return (
    <>
      <Navbar />
      <div className="page_container">
        <PageHeader title="Create Ration Report" showBackButton={true} backPath="/program/ration_report/list" />
        <form onSubmit={handleSubmit} className="user-form">
          {error && <div className="status-message status-message--error">{error}</div>}
          <div className="form-grid">
            <FormInput
              name="report_date"
              label="Date"
              type="date"
              value={form.report_date}
              onChange={handleChange}
              required
            />
            <div className="form-group">
              <label className="form-label">Alternate</label>
              <RationReportSwitch
                checked={form.is_alternate}
                onChange={handleChange}
                label=""
                name="is_alternate"
              />
            </div>
          </div>
          <div className="horizontal-row">
            <p className="semi-title">Full:</p>
            {ration_vulnerabilities.map(vul => (
              <FormInput
                key={`full-${vul}`}
                name={`full-${vul}`}
                label={vul}
                type="number"
                min={0}
                value={form[`full_${vul.toLowerCase()}`] || 0}
                onChange={e => handleVulnerabilityChange('full', vul, e.target.value)}
              />
            ))}
            <div className="form-group">
              <label className="form-label">Total</label>
              <input
                type="number"
                className="form-input"
                value={getTotal('full')}
                readOnly
                tabIndex={-1}
                style={{ background: '#f5f5f5', fontWeight: 600 }}
              />
            </div>
          </div>
          <div className="horizontal-row">
            <p className="semi-title">Half:</p>
            {ration_vulnerabilities.map(vul => (
              <FormInput
                key={`half-${vul}`}
                name={`half-${vul}`}
                label={vul}
                type="number"
                min={0}
                value={form[`half_${vul.toLowerCase()}`] || 0}
                onChange={e => handleVulnerabilityChange('half', vul, e.target.value)}
              />
            ))}
            <div className="form-group">
              <label className="form-label">Total</label>
              <input
                type="number"
                className="form-input"
                value={getTotal('half')}
                readOnly
                tabIndex={-1}
                style={{ background: '#f5f5f5', fontWeight: 600 }}
              />
            </div>
          </div>
          <div className="horizontal-row">
            <label className="semi-title" htmlFor="life_time" style={{ marginRight: 8 }}>Life Time:</label>
            <input
              id="life_time"
              name="life_time"
              type="number"
              className="form-input"
              value={form.life_time}
              onChange={handleChange}
              min={0}
              style={{ maxWidth: 120 }}
            />
          </div>
          <button type="submit" className="primary_btn" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Create Report'}
          </button>
        </form>
      </div>
    </>
  );
};

export default AddRationReport;