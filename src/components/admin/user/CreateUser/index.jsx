import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShield } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import UserPermissions from '../UserPermissions';
import './CreateUser.css';
import { toast } from 'react-toastify';

const departments = [
  { value: 'store', label: 'Store' },
  { value: 'procurements', label: 'Procurement' },
  { value: 'accounts_and_finance', label: 'Accounts & Finance' },
  { value: 'program', label: 'Program' },
  { value: 'it', label: 'IT' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'audio_video', label: 'Audio Video' },
  { value: 'fund_raising', label: 'Fund Raising' }
];

const bloodGroups = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
];

const roles = [
  { value: 'user', label: 'User' },
  { value: 'assistant_manager', label: 'Assistant Manager' },
  { value: 'manager', label: 'Manager' }
];

const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];


const CreateUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    cnic: '',
    role: roles[0].value,
    department: departments[0].value,
    gender: genders[0].value,
    joining_date: '',
    emergency_contact: '',
    blood_group: bloodGroups[2].value,
    password: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Password strength validation
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('Minimum 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
    if (!/\d/.test(password)) errors.push('At least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character');
    return errors;
  };

  const validateForm = () => {
    const requiredFields = [
      'first_name',
      'last_name',
      'email', // Make email required
      'phone',
      'dob',
      'address',
      'cnic',
      'role',
      'department',
      'gender',
      'joining_date',
      'emergency_contact',
      'blood_group',
      'password' // Make password required
    ];

    for (const field of requiredFields) {
      if (!form[field]) {
        setError(`Please fill in all required fields`);
        return false;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate password strength
    const passwordErrors = validatePassword(form.password);
    if (passwordErrors.length > 0) {
      setError(`Password requirements: ${passwordErrors.join(', ')}`);
      return false;
    }

    // Validate CNIC format (13 digits)
    if (!/^\d{13}$/.test(form.cnic)) {
      setError('CNIC must be 13 digits');
      return false;
    }

    // Validate phone number format
    if (!/^\d{11}$/.test(form.phone)) {
      setError('Phone number must be 11 digits');
      return false;
    }

    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Create payload with user data and permissions
      const payload = {
        ...form,
        permissions: userPermissions
      };
      
      console.log('Submitting payload:', payload);
      console.log('User permissions:', userPermissions);
      
      await axiosInstance.post('/users', payload);
      
      setSubmitted(true);
      setError('');
      toast.success('User created successfully!');
      
      // Reset form for next user
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        dob: '',
        address: '',
        cnic: '',
        role: roles[0].value,
        department: departments[0].value,
        gender: genders[0].value,
        joining_date: '',
        emergency_contact: '',
        blood_group: bloodGroups[2].value,
        password: '',
      });
      
      // Reset permissions
      setUserPermissions({});
      navigate('/admin/users');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit form. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="user-form-container">
        <PageHeader 
          title="Create New User"
          backPath="/admin/users"
          breadcrumbs={[
            { label: 'Admin', path: '/admin' },
            { label: 'User Management', path: '/admin/users' },
            { label: 'Create User' }
          ]}
        />
        
        <form onSubmit={handleSubmit} className="user-form">
            {error && <div className="status-message status-message--error">{error}</div>}
            
            <div className="form-grid">
              <FormInput
                name="first_name"
                label="First Name"
                value={form.first_name}
                onChange={handleChange}
                required
              />

              <FormInput
                name="last_name"
                label="Last Name"
                value={form.last_name}
                onChange={handleChange}
                required
              />

              <FormInput
                name="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password <span className="required">*</span>
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {form.password && (
                  <div className="password-strength">
                    <small>Password must contain: 8+ characters, uppercase, lowercase, number, special character</small>
                  </div>
                )}
              </div>

              <FormInput
                name="phone"
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
              />

              <FormInput
                name="dob"
                label="Date of Birth"
                type="date"
                value={form.dob}
                onChange={handleChange}
                required
              />

              <FormSelect
                name="gender"
                label="Gender"
                value={form.gender}
                options={genders}
                onChange={handleChange}
                required
              />

              <FormInput
                name="cnic"
                label="CNIC Number"
                value={form.cnic}
                onChange={handleChange}
                placeholder="13 digits"
                required
              />

              <FormSelect
                name="blood_group"
                label="Blood Group"
                value={form.blood_group}
                options={bloodGroups}
                onChange={handleChange}
                required
              />

              <FormSelect
                name="department"
                label="Department"
                value={form.department}
                options={departments}
                onChange={handleChange}
                required
              />

              <FormSelect
                name="role"
                label="Role"
                value={form.role}
                options={roles}
                onChange={handleChange}
                required
              />

              <FormInput
                name="joining_date"
                label="Joining Date"
                type="date"
                value={form.joining_date}
                onChange={handleChange}
                required
              />

              <FormInput
                name="emergency_contact"
                label="Emergency Contact"
                type="tel"
                value={form.emergency_contact}
                onChange={handleChange}
                required
              />
            </div>

            <FormTextarea
              name="address"
              label="Address"
              value={form.address}
              onChange={handleChange}
              required
            />

            <div className="form-actions">


              <button
                type="button"
                className="secondary_btn"
                onClick={() => setShowPermissionsModal(true)}
                style={{ marginTop: '10px' }}
              >
                <FiShield style={{ marginRight: '5px' }} />
                Manage Permissions
              </button>
              <button
                type="submit"
                className="primary_btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>

        <UserPermissions
          isOpen={showPermissionsModal}
          user={form}
          onSave={(permissions) => {
            setUserPermissions(permissions);
            setShowPermissionsModal(false);
            toast.success('Permissions data collected');
          }}
          onCancel={() => setShowPermissionsModal(false)}
        />
      </div>
    </>
  );
};

export default CreateUser; 