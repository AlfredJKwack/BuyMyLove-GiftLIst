import { useState } from 'react';

export default function AuthModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Login link sent! Check your email.');
        setEmail('');
      } else {
        setError(data.error || 'Failed to send login link');
      }
    } catch (err) {
      setError('Failed to send login link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal">
      <div className="admin-modal-overlay" onClick={onClose}></div>
      <div className="admin-modal-content">
        <div className="login-form">
          <h2>Admin Login</h2>
          <p className="text-gray-500 mb-6">
            Enter your email to receive a login link
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
              />
            </div>

            {message && (
              <div className="form-message success">
                {message}
              </div>
            )}

            {error && (
              <div className="form-message error">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="form-button"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Login Link'}
              </button>
              <button
                type="button"
                className="form-button bg-gray-500"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
