import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import './Auth.css';

// Add validation rules
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
      confirmPassword: ''
    };
    let isValid = true;

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!EMAIL_REGEX.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      errors.password = 'Password must be at least 8 characters and include letters, numbers, and special characters';
      isValid = false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
        return;
    }

    setIsLoading(true);

    try {
        const response = await axios.post<{ success: boolean; message?: string }>('http://localhost:5000/api/register', {
            email: formData.email,
            password: formData.password
        });

        if (response.data.success) {
            // Use window.location for a full page refresh
            window.location.href = '/login?registered=true';
        }
    } catch (err: any) {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
        if (err.response?.status === 400) {
            // Handle validation errors
            const validationErrors = {
                email: '',
                password: '',
                confirmPassword: ''
            };
            
            if (err.response.data.message.includes('email')) {
                validationErrors.email = err.response.data.message;
            }
            setValidationErrors(validationErrors);
        }
    } finally {
        setIsLoading(false);
    }
};

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Link to="/login" className="back-link">
          <FaArrowLeft /> Back to Login
        </Link>
        
        <h2>Create Account</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
              required
              maxLength={50}
            />
          </div>
          {validationErrors.email && (
            <div className="error-message">{validationErrors.email}</div>
          )}

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password"
              required
              maxLength={72}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {validationErrors.password && (
            <div className="error-message">{validationErrors.password}</div>
          )}

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <div className="error-message">{validationErrors.confirmPassword}</div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;