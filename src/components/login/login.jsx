import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './login.css';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import mtjfLogo from '../../assets/mtjf_logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Making login request with:', formData);
      const response = await login(formData);
      console.log('Login response in component:', response);
      
      if (response && response.user) {
        const userData = response.user;
        console.log('User data for redirection:', userData);
        
        // Redirect based on department
        switch (userData.department) {
          case 'store':
            console.log('Redirecting to store');
            navigate('/store', { replace: true });
            break;
          case 'procurements':
            console.log('Redirecting to procurements');
            navigate('/procurements', { replace: true });
            break;
          case 'program':
            console.log('Redirecting to program');
            navigate('/program', { replace: true });
            break;
          case 'accounts_and_finance':
            console.log('Redirecting to accounts-and-finance');
            navigate('/accounts_and_finance', { replace: true });
            break;
          case 'admin':
            console.log('Redirecting to admin');
            navigate('/admin', { replace: true });
            break;
          case 'fund_raising':
            console.log('Redirecting to fund_raising');
            navigate('/fund_raising', { replace: true });
            break;
          default:
            console.error('Invalid department:', userData.department);
            setError('Invalid department');
        }
      } else {
        console.error('No user data in response');
        setError('Login successful but user data not found');
      }
    } catch (error) {
      console.error('Login error in component:', error.response || error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <img src={mtjfLogo} alt="MTJF Logo" style={{ height: '100%', width: '100%', display: 'block', marginTop: '3%'     }} />
        </div>
        <h2 className="login-title">MTJ Foundation</h2>
        <p className="login-subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          <label>Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              autoComplete="email"
            />
          </label>
          <label>Password
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <span 
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </label>
          <button 
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 