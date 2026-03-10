import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const ShieldIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 8px rgba(0, 194, 255, 0.3))' }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeIcon = ({ open }) => open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45,0 0 1 5.06-5.94" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
);

export default function Login() {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        console.log('Login: Attempting login for', credentials.email);
        try {
            const res = await api.post('/auth/login', credentials);
            console.log('Login: API success, response data:', res.data);
            login(res.data);

            const target = '/';
            console.log('Login: Auth state updated, navigating to:', target);
            navigate(target);
        } catch (err) {
            console.error('Login: API error:', err.response?.data || err.message);
            setError(err.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-layout cyber-bg" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-card animate-fadein" style={{ width: '100%', maxWidth: 420, padding: '40px 32px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', marginBottom: 20 }}>
                        <ShieldIcon />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                        Secure Access
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        CAN Intrusion Detection Platform
                    </p>
                </div>

                {error && <div className="alert-error" style={{ marginBottom: 20 }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            className="input-field"
                            placeholder="name@company.com"
                            value={credentials.email}
                            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPass ? 'text' : 'password'}
                                required
                                className="input-field"
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                            >
                                <EyeIcon open={showPass} />
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ height: 48, marginTop: 10 }}>
                        {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Authenticate'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Unauthorized access is prohibited.{' '}
                    <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>Register Node</Link>
                </div>
            </div>
        </div>
    );
}
