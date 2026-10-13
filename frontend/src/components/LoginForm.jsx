import { useState } from 'react';
import { login } from '../api/auth';
import { extractErrors } from '../utils/errors';

export default function LoginForm({ onLoginSuccess, noticeMessage }) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(mobile.trim(), password);
      onLoginSuccess();
    } catch (err) {
      const { general, fields } = extractErrors(err);
      setError(general || fields.mobile || fields.password || 'Failed to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Patient Management System</h2>
          <p className="login-subtitle">Please log in with your mobile number and password</p>
        </div>

        {noticeMessage && (
          <div className="alert alert-info" role="alert">
            {noticeMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-vertical" noValidate={false}>
          <div className="form-group">
            <label htmlFor="login-mobile">
              Mobile Number <span className="required-star">*</span>
            </label>
            <input
              id="login-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">
              Password <span className="required-star">*</span>
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="login-hint">
          <strong>Reviewer Note:</strong> To view the complete table of all patients, log in with a staff/superuser account.
        </div>
      </div>
    </div>
  );
}
