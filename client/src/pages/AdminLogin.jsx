import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [user, setUser] = useState(null);

  // Check whether an admin is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  // Login
  const handleLogin = async (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Firebase authentication state
      // will automatically update and
      // redirect through the code below.
    } catch (error) {
      console.error('Login error:', error);

      switch (error.code) {
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;

        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;

        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;

        case 'auth/too-many-requests':
          setError('Too many login attempts. Please try again later.');
          break;

        default:
          setError('Unable to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while Firebase checks session
  if (checkingAuth) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Already authenticated
  if (user) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>BankIQ</h1>

        <p>Admin Login</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
          />

          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />

            <button
              type="button"
              className="password-visibility-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={loading}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 3.3 10 7a11.6 11.6 0 01-3.1 4.6M6.2 6.2A11.6 11.6 0 002 12c1.5 3.7 5 7 10 7a10.8 10.8 0 003.1-.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              )}
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
