import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import { programs_list } from '../../../../utils/program';

import AddRationReport from '../../ration_report/add';
import AddMarriageGiftsReport from '../../marriage_gifts/reports/add';
import AddFinancialAssistanceReport from '../../financial_assistance/reports/add';
import AddSewingMachineReport from '../../sewing_machine/reports/add';
import AddWheelChairOrCrutchesReport from '../../wheel_chair_or_crutches/reports/add';
import AddWaterReport from '../../water/reports/add';
import AddKasbReport from '../../kasb/reports/add';
import AddKasbTrainingReport from '../../kasb_training/reports/add/AddKasbTrainingReport';
import AddEducationReport from '../../education/reports/add';
import AddTreePlantationReport from '../../tree_plantation/reports/add';
import AddAreaRationReport from '../../area_ration/reports/add';

import './CreateApplication.css';

const PROGRAM_COMPONENTS_MAP = {
  // Programs
  food_security: AddRationReport,
  community_services: AddMarriageGiftsReport,
  education: AddEducationReport,
  water_clean_water: AddWaterReport,
  kasb: AddKasbReport,
  green_initiative: AddTreePlantationReport,
  widows_and_orphans_care_program: AddFinancialAssistanceReport,
  livelihood_support_program: AddSewingMachineReport,

  // Subprograms (Mapping subprogram keys to components)
  area_ration: AddAreaRationReport,
  kasb_training: AddKasbTrainingReport,
  'kasb-training': AddKasbTrainingReport,
  wheel_chair_or_crutches: AddWheelChairOrCrutchesReport,
  'wheel-chair-or-crutches': AddWheelChairOrCrutchesReport,
  ration_report: AddRationReport,
  marriage_gifts: AddMarriageGiftsReport,
  financial_assistance: AddFinancialAssistanceReport,
  sewing_machine: AddSewingMachineReport,
  water_reports: AddWaterReport,
  kasb_reports: AddKasbReport,
  education_reports: AddEducationReport,
  tree_plantation: AddTreePlantationReport,
  area_ration_reports: AddAreaRationReport,
};

const CreateApplication = ({ applicationData = null, isEdit = false }) => {
  const navigate = useNavigate();

  const [activePrograms, setActivePrograms] = useState([]);

  const projectOptions = activePrograms.map((program) => ({
    value: program.key,
    label: program.label,
  }));
  
  // Initialize with one empty application
  const [applications, setApplications] = useState(
    applicationData?.applications || [
      {
        id: 1,
        project: '',
        subprogram: '',   // ✅ added
        pending_last_month: 0,
        application_count: 0,
        investigation_count: 0,
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

  const [activeSubprograms, setActiveSubprograms] = useState([]);
  const [latestPendingByProjectAndSubprogram, setLatestPendingByProjectAndSubprogram] = useState({});

  useEffect(() => {
    const fetchLatestApplicationReport = async () => {
      try {
        const response = await axiosInstance.get('/program/application-reports/latest');
        console.log('Latest application report:', response.data);

        const latest = response.data?.data;
        const latestApps = Array.isArray(latest?.applications) ? latest.applications : [];

        const map = {};
        latestApps.forEach((a) => {
          const projectKey = a?.project;
          const subKey = a?.subprogram;
          if (!projectKey || !subKey) return;
          map[`${projectKey}::${subKey}`] = Number(a?.pending_count ?? 0);
        });
        setLatestPendingByProjectAndSubprogram(map);
      } catch (err) {
        console.log('Latest application report fetch failed:', err?.response?.data || err?.message || err);
      }
    };

    const fetchActivePrograms = async () => {
      try {
        const response = await axiosInstance.get('/program/programs', {
          params: { page: 1, pageSize: 1000, active: 'true' },
        });
        if (response.data?.success) {
          setActivePrograms(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching active programs:', err);
      }
    };

    const fetchActiveSubprograms = async () => {
      try {
        const response = await axiosInstance.get('/program/subprograms', {
          params: { page: 1, pageSize: 1000, active: 'true' },
        });
        if (response.data?.success) {
          setActiveSubprograms(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching active subprograms:', err);
      }
    };

    fetchLatestApplicationReport();
    fetchActivePrograms();
    fetchActiveSubprograms();
  }, []);


  const getSubProgramOptions = (programKey) => {
    const program = activePrograms.find((p) => p.key === programKey) || programs_list.find((p) => p.key === programKey);
    if (!program) return [];
  
    return activeSubprograms
      .filter(sp => sp.program_id === program.id)
      .map(sp => ({
        value: sp.key,
        label: sp.label
      }));
  };


  const handleApplicationChange = (index, field, value) => {
    const updatedApplications = [...applications];
    const numericFields = ['pending_last_month', 'application_count', 'investigation_count', 'approved_count', 'rejected_count', 'pending_count'];
    
    if (numericFields.includes(field)) {
      updatedApplications[index][field] = value === '' ? '' : parseInt(value, 10) || 0;
    } else {
      updatedApplications[index][field] = value;

      // ✅ reset subprogram if program changes
    if (field === 'project') {
      updatedApplications[index].subprogram = '';
    }

    }

    // ✅ Auto-set pending_last_month from latest pending_count
    // Trigger when project/subprogram changes and user hasn't entered a value yet.
    if (field === 'project' || field === 'subprogram') {
      const proj = updatedApplications[index].project;
      const sub = updatedApplications[index].subprogram;
      const key = proj && sub ? `${proj}::${sub}` : null;
      const currentPendingLast = updatedApplications[index].pending_last_month;
      const hasUserValue = !(currentPendingLast === '' || currentPendingLast === 0);

      if (key && !hasUserValue) {
        const latestPending = latestPendingByProjectAndSubprogram[key];
        if (typeof latestPending === 'number' && !Number.isNaN(latestPending)) {
          updatedApplications[index].pending_last_month = latestPending;
        }
      }
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
      subprogram: '',
      pending_last_month: 0,
      application_count: 0,
      investigation_count: 0,
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
        setError(`Please select a project for application ${i + 1}`);
        return false;
      }

      if (!app.subprogram || !String(app.subprogram).trim()) {
        setError(`Please select a sub program for application ${i + 1}`);
        return false;
      }

      // Validate that all numeric fields are non-negative
      const numericFields = ['pending_last_month', 'application_count', 'investigation_count', 'approved_count', 'rejected_count', 'pending_count'];
      for (const field of numericFields) {
        if (app[field] < 0) {
          setError(`${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} cannot be negative for application ${i + 1}`);
          return false;
        }
      }

      // Validate: pending_last_month + application_count - investigation_count = pending_count
      const pendingLastMonth = Number(app.pending_last_month ?? 0) || 0;
      const applicationCount = Number(app.application_count ?? 0) || 0;
      const investigationCount = Number(app.investigation_count ?? 0) || 0;
      const pendingCount = Number(app.pending_count ?? 0) || 0;

      const expectedPending = pendingLastMonth + applicationCount - investigationCount;
      if (expectedPending !== pendingCount) {
        setError(
          `For application ${i + 1}, Pending Count must equal Pending of Last Month + Application Count - Investigation Count (${pendingLastMonth} + ${applicationCount} - ${investigationCount} = ${expectedPending}).`
        );
        return false;
      }
    }
    return true;
  };

  const lastApplication = applications[applications.length - 1];
  const DynamicCreateComponent = 
    (lastApplication?.subprogram && PROGRAM_COMPONENTS_MAP[lastApplication.subprogram]) || 
    (lastApplication?.project && PROGRAM_COMPONENTS_MAP[lastApplication.project]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const endpoint = isEdit ? `/program/application-reports/${applicationData.id}` : '/program/application-reports';
      const method = isEdit ? 'patch' : 'post';
      
      const reportPayload = {
        ...reportData,
        applications: applications.map((app) => ({
          ...app,
          subprogram: app.subprogram, // ✅ include
          pending_last_month: app.pending_last_month === '' ? 0 : app.pending_last_month,
          application_count: app.application_count === '' ? 0 : app.application_count,
          investigation_count: app.investigation_count === '' ? 0 : app.investigation_count,
          approved_count: app.approved_count === '' ? 0 : app.approved_count,
          rejected_count: app.rejected_count === '' ? 0 : app.rejected_count,
          pending_count: app.pending_count === '' ? 0 : app.pending_count,
        }))
      };
      
      await axiosInstance[method](endpoint, reportPayload);

      // Navigate immediately after successful operation
      navigate('/program/applications_reports');
      
      if (!isEdit) {
        // Reset form only if it's a new report
        setApplications([{
          id: 1,
          project: '',
          subprogram: '',
          pending_last_month: 0,
          application_count: 0,
          investigation_count: 0,
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
                    <FormSelect
                      name={`project-${index}`}
                      label="Themetic Area"
                      value={application.project}
                      onChange={(e) => handleApplicationChange(index, 'project', e.target.value)}
                      options={projectOptions}
                      required
                      showDefaultOption={true}
                      defaultOptionText="Select Theme"
                    />

                    <FormSelect
                      name={`subprogram-${index}`}
                      label="Sub Program"
                      value={application.subprogram}
                      onChange={(e) => handleApplicationChange(index, 'subprogram', e.target.value)}
                      options={getSubProgramOptions(application.project)}
                      required
                      showDefaultOption={true}
                      defaultOptionText={
                        application.project ? "Select Sub Program" : "Select Program First"
                      }
                      disabled={!application.project}
                    />

                    <FormInput
                      name={`pending_last_month-${index}`}
                      label="Pending of Last Month"
                      type="number"
                      value={application.pending_last_month}
                      onChange={(e) => handleApplicationChange(index, 'pending_last_month', e.target.value)}
                      // min="0"
                      // placeholder="0"
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

            {DynamicCreateComponent && <DynamicCreateComponent />}
          </form>
        )}
      </div>
    </>
  );
};

export default CreateApplication; 