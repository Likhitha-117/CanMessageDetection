import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

const ShieldIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

export default function Register() {
    const [form, setForm] = useState({
        email: '', password: '', full_name: '', role: 'owner',
        manufacturer: '', model: '', year: 2024, specialization: ''
    });
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [adminExists, setAdminExists] = useState(false);

    useEffect(() => {
        api.get('/auth/admin-exists')
            .then(res => setAdminExists(res.data.exists))
            .catch(err => console.error("Error checking admin status:", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setMsg(''); setLoading(true);
        try {
            await api.post('/auth/register', form);
            setMsg('Registration request sent. Wait for administrator approval.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-layout cyber-bg" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div className="glass-card animate-fadein" style={{ width: '100%', maxWidth: 540, padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', marginBottom: 16 }}>
                        <ShieldIcon />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                        Register
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Select your platform role to continue
                    </p>
                </div>

                {error && <div className="alert-error" style={{ marginBottom: 20 }}>{error}</div>}
                {msg && <div className="alert-success" style={{ marginBottom: 20 }}>{msg}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Role Selector Tabs */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 24, background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 12, border: '1px solid var(--border)' }}>
                        {['owner', 'engineer', 'admin'].filter(r => r !== 'admin' || !adminExists).map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setForm({ ...form, role: r })}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                                    background: form.role === r ? 'var(--accent-primary)' : 'transparent',
                                    color: form.role === r ? '#000' : 'var(--text-secondary)',
                                }}
                            >
                                {r.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, marginBottom: 24 }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Full Name</label>
                            <input type="text" required className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Email</label>
                            <input type="email" required className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Password</label>
                            <input type="password" required className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                        </div>

                        {form.role === 'engineer' && (
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Specialization (e.g. LSTM, Forensic)</label>
                                <input type="text" className="input-field" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', height: 48 }}>
                        {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Register'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Already registered?{' '}
                    <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
                </div>
            </div>
        </div>
    );
}
