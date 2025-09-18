import React, { useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import '../../Procurements.css';

const AddProcurementReport = () => {
  const [form, setForm] = useState({
    date: '',
    totalGeneratedPOs: '',
    pendingPOs: '',
    fulfilledPOs: '',
    totalGeneratedPIs: '',
    totalPaidAmount: '',
    unpaidAmount: '',
    unpaidPIs: '',
    tenders: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    const requiredFields = [
      'date',
      'totalGeneratedPOs',
      'pendingPOs',
      'fulfilledPOs',
      'totalGeneratedPIs',
      'totalPaidAmount',
      'unpaidAmount',
      'unpaidPIs',
      'tenders',
    ];
    for (const field of requiredFields) {
      if (!form[field]) {
        setError(`Please fill in all required fields`);
        return false;
      }
    }
    const numericFields = [
      'totalGeneratedPOs',
      'pendingPOs',
      'fulfilledPOs',
      'totalGeneratedPIs',
      'totalPaidAmount',
      'unpaidAmount',
      'unpaidPIs',
      'tenders',
    ];
    for (const field of numericFields) {
      const value = parseFloat(form[field]);
      if (isNaN(value) || value < 0) {
        setError(`Please enter valid numbers for all amount fields`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/procurements/reports', {
        ...form,
        total_generated_pos: form.totalGeneratedPOs, 
        pending_pos: form.pendingPOs,
        fulfilled_pos: form.fulfilledPOs,
        total_generated_pis: form.totalGeneratedPIs,
        total_paid_amount: form.totalPaidAmount,
        unpaid_amount: form.unpaidAmount,
        unpaid_pis: form.unpaidPIs,
        tenders: form.tenders,
      });
      setSubmitted(true);
      setError('');
      setForm({
        date: '',
        total_generated_pos: '',
        pending_pos: '',
        fulfilled_pos: '',
        total_generated_pis: '',
        total_paid_amount: '',
        unpaid_amount: '',
        unpaid_pis: '',
        tenders: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <>
      <Navbar />
      <div className="procurements-container">
        <PageHeader title="Add Procurement Report" onBack={handleBack} />
        {submitted ? (
          <div className="procurements-success">Form submitted successfully!</div>
        ) : (
          <form onSubmit={handleSubmit} className="procurements-form">
            {error && <div className="procurements-error">{error}</div>}
            <label className="full-width">Date
              <input name="date" type="date" value={form.date} onChange={handleChange} required />
            </label>
            <label>Total Generated PO's
              <input name="totalGeneratedPOs" type="number" min="0" value={form.totalGeneratedPOs} onChange={handleChange} required />
            </label>
            <label>Pending PO's
              <input name="pendingPOs" type="number" min="0" value={form.pendingPOs} onChange={handleChange} required />
            </label>
            <label>Fulfilled PO's
              <input name="fulfilledPOs" type="number" min="0" value={form.fulfilledPOs} onChange={handleChange} required />
            </label>
            <label>Total Generated PI's
              <input name="totalGeneratedPIs" type="number" min="0" value={form.totalGeneratedPIs} onChange={handleChange} required />
            </label>
            <label>Total Paid Amount
              <input name="totalPaidAmount" type="number" min="0" value={form.totalPaidAmount} onChange={handleChange} required />
            </label>
            <label>Unpaid Amount
              <input name="unpaidAmount" type="number" min="0" value={form.unpaidAmount} onChange={handleChange} required />
            </label>
            <label>Unpaid PI's
              <input name="unpaidPIs" type="number" min="0" value={form.unpaidPIs} onChange={handleChange} required />
            </label>
            <label>Tenders
              <input name="tenders" type="number" min="0" value={form.tenders} onChange={handleChange} required />
            </label>
            <button type="submit" className="primary_btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default AddProcurementReport; 