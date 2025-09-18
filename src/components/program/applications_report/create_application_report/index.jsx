import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import './CreateApplication.css';

const CreateApplication = ({ applicationData = null, isEdit = false }) => {
  const navigate = useNavigate();
  
  // Initialize with one empty application
  const [applications, setApplications] = useState(
    applicationData?.applications || [
      {
        id: 1,
        project: '',
        pending_last_month: 0,
        application_count: 0,
        investigation_count: 0,
        verified_count: 0,
        approved_count: 0,
        rejected_count: 0,
        pending_count: 0
      }
    ]
  );

  const [reportData, setReportData] = useState({
    report_date: applicationData?.report_date || new Date().toISOString().split('T')[0]
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplicationChange = (index, field, value) => {
    const updatedApplications = [...applications];
    const numericFields = ['pending_last_month', 'application_count', 'investigation_count', 'verified_count', 'approved_count', 'rejected_count', 'pending_count'];
    
    if (numericFields.includes(field)) {
      updatedApplications[index][field] = parseInt(value) || 0;
    } else {
      updatedApplications[index][field] = value;
    }
    
    setApplications(updatedApplications);
    if (error) setError('');
  };

  const handleReportDataChange = (field, value) => {
    setReportData({ ...reportData, [field]: value });
    if (error) setError('');
  };

  const addApplication = () => {
    const newId = Math.max(...applications.map(app => app.id), 0) + 1;
    const newApplication = {
      id: newId,
      project: '',
      pending_last_month: 0,
      application_count: 0,
      investigation_count: 0,
      verified_count: 0,
      approved_count: 0,
      rejected_count: 0,
      pending_count: 0
    };
    setApplications([...applications, newApplication]);
  };

  const removeApplication = (index) => {
    if (applications.length > 1) {
      const updatedApplications = applications.filter((_, i) => i !== index);
      setApplications(updatedApplications);
    }
  };

  const validateForm = () => {
    // Validate report data
    if (!reportData.report_date) {
      setError('Please select a report date');
      return false;
    }

    // Validate applications
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      
      if (!app.project.trim()) {
        setError(`Please enter project name for application ${i + 1}`);
        return false;
      }

      // Validate that all numeric fields are non-negative
      const numericFields = ['pending_last_month', 'application_count', 'investigation_count', 'verified_count', 'approved_count', 'rejected_count', 'pending_count'];
      for (const field of numericFields) {
        if (app[field] < 0) {
          setError(`${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} cannot be negative for application ${i + 1}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const endpoint = isEdit ? `/program/application-reports/${applicationData.id}` : '/program/application-reports';
      const method = isEdit ? 'patch' : 'post';
      
      const reportPayload = {
        ...reportData,
        applications: applications
      };
      
      await axiosInstance[method](endpoint, reportPayload);

      // Navigate immediately after successful operation
      navigate('/program/applications_reports');
      
      if (!isEdit) {
        // Reset form only if it's a new report
        setApplications([{
          id: 1,
          project: '',
          pending_last_month: 0,
          application_count: 0,
          investigation_count: 0,
          verified_count: 0,
          approved_count: 0,
          rejected_count: 0,
          pending_count: 0
        }]);
        setReportData({
          report_date: new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
      console.error('Error submitting report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="application-form-container">
        <PageHeader 
          title={isEdit ? 'Update Application Report' : 'Create New Application Report'}
          showBackButton={true}
          backPath="/program/applications_reports"
        />

        {submitted ? (
          <div className="status-message status-message--success">
            Application Report {isEdit ? 'updated' : 'created'} successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="application-form">
            {error && <div className="status-message status-message--error">{error}</div>}
            
            <div className="date-field-container">
              <FormInput
                name="report_date"
                label="Report Date"
                type="date"
                value={reportData.report_date}
                onChange={(e) => handleReportDataChange('report_date', e.target.value)}
                required
              />
            </div>

            {/* Applications Section */}
            <div className="applications-section">
              {applications.map((application, index) => (
                <div key={application.id} className="application-entry">
                  <div className="application-header">
                    <h4 className="application-title">Application {index + 1}</h4>
                    <div className="application-actions">
                      {applications.length > 1 && (
                        <button
                          type="button"
                          className="remove-application-btn"
                          onClick={() => removeApplication(index)}
                          title="Remove Application"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                      {index === applications.length - 1 && (
                        <button
                          type="button"
                          className="add-application-btn"
                          onClick={addApplication}
                          title="Add Another Application"
                        >
                          <FiPlus />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-grid">
                    <FormInput
                      name={`project-${index}`}
                      label="Project Name"
                      value={application.project}
                      onChange={(e) => handleApplicationChange(index, 'project', e.target.value)}
                      required
                    />

                    <FormInput
                      name={`pending_last_month-${index}`}
                      label="Pending of Last Month"
                      type="number"
                      value={application.pending_last_month}
                      onChange={(e) => handleApplicationChange(index, 'pending_last_month', e.target.value)}
                      min="0"
                      placeholder="0"
                    />

                    <FormInput
                      name={`application_count-${index}`}
                      label="Application Count"
                      type="number"
                      value={application.application_count}
                      onChange={(e) => handleApplicationChange(index, 'application_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />

                    <FormInput
                      name={`investigation_count-${index}`}
                      label="Investigation Count"
                      type="number"
                      value={application.investigation_count}
                      onChange={(e) => handleApplicationChange(index, 'investigation_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />

                    <FormInput
                      name={`verified_count-${index}`}
                      label="Verified Count"
                      type="number"
                      value={application.verified_count}
                      onChange={(e) => handleApplicationChange(index, 'verified_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />

                    <FormInput
                      name={`approved_count-${index}`}
                      label="Approved Count"
                      type="number"
                      value={application.approved_count}
                      onChange={(e) => handleApplicationChange(index, 'approved_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />

                    <FormInput
                      name={`rejected_count-${index}`}
                      label="Rejected Count"
                      type="number"
                      value={application.rejected_count}
                      onChange={(e) => handleApplicationChange(index, 'rejected_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />

                    <FormInput
                      name={`pending_count-${index}`}
                      label="Pending Count"
                      type="number"
                      value={application.pending_count}
                      onChange={(e) => handleApplicationChange(index, 'pending_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="primary_btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : (isEdit ? 'Update Report' : 'Create Report')}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default CreateApplication; 