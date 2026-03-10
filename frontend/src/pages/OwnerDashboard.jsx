import { useState, useEffect } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import SummaryCards from '../components/SummaryCards';
import LogTable from '../components/LogTable';
import { AttackPieChart } from '../components/AttackChart';
import { useAuth } from '../context/AuthContext';

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const KeyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
);

const EyeIcon = ({ open }) => open ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

// ── Sub-views ──────────────────────────────────────────────────

function DashboardView({ summary, vehicles }) {
    const cards = summary ? [
        { label: 'My Vehicles', value: vehicles.length, color: 'cyan' },
        { label: 'Total Logs', value: summary.total_logs, color: 'blue' },
        { label: 'Attacks Today', value: summary.attacks_today, color: 'red' },
        {
            label: 'Current Status',
            value: summary.attacks_today > 0 ? 'Under Attack' : 'Secure',
            color: summary.attacks_today > 0 ? 'red' : 'green',
        },
    ] : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fadein">
            <SummaryCards cards={cards} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
                <AttackPieChart distribution={summary?.distribution} />
                <div>
                    <p className="section-title">Fleet Health</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {vehicles.slice(0, 4).map((v) => (
                            <div key={v._id} style={{
                                padding: '16px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--green-border)',
                                borderRadius: 12,
                            }}>
                                <div style={{ fontWeight: 700, color: 'var(--green-primary)', fontSize: '0.9rem', marginBottom: 4 }}>{v.vehicle_id}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>{v.manufacturer} {v.model} ({v.year})</div>
                                <span className={`badge ${v.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{v.status === 'active' ? 'Monitored' : v.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function VehiclesView({ vehicles, onRegister, onRegenerate, regResult, revealKey, onToggleReveal, onClearResult }) {
    const [showForm, setShowForm] = useState(false);
    const [newV, setNewV] = useState({ vehicle_id: '', vin_number: '', license_plate: '', manufacturer: '', model: '', year: 2024, ecu_count: 15 });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const err = await onRegister(newV);
        if (!err) { setShowForm(false); setNewV({ vehicle_id: '', vin_number: '', license_plate: '', manufacturer: '', model: '', year: 2024, ecu_count: 15 }); }
        else setError(err);
    };

    return (
        <div className="animate-fadein">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Vehicles</h2>
                <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Register Vehicle'}
                </button>
            </div>

            {/* API Key result */}
            {regResult && (
                <div style={{ marginBottom: 20, padding: '16px 20px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green-primary)', fontWeight: 700, fontSize: '0.88rem' }}>
                            <KeyIcon /> New API Key Generated
                        </div>
                        <button onClick={onClearResult} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><CloseIcon /></button>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                        This key is only shown once. Copy it now for vehicle <strong style={{ color: 'var(--text-primary)' }}>{regResult.vehicle_id}</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{
                            flex: 1, fontFamily: 'monospace', fontSize: '0.82rem',
                            background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', wordBreak: 'break-all',
                            color: 'var(--text-secondary)',
                        }}>
                            {revealKey[regResult.vehicle_id] ? regResult.vehicle_api_key : '•'.repeat(42)}
                        </div>
                        <button
                            onClick={() => onToggleReveal(regResult.vehicle_id)}
                            className="btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
                        >
                            <EyeIcon open={revealKey[regResult.vehicle_id]} />
                            {revealKey[regResult.vehicle_id] ? 'Hide' : 'Reveal'}
                        </button>
                        <button
                            onClick={() => { navigator.clipboard.writeText(regResult.vehicle_api_key); }}
                            className="btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
                        >
                            <CopyIcon /> Copy
                        </button>
                    </div>
                </div>
            )}

            {/* Register form */}
            {showForm && (
                <div style={{ marginBottom: 20, padding: 20, background: 'var(--bg-card)', border: '1px solid var(--green-border)', borderRadius: 14 }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Register New Vehicle</h3>
                    {error && <div className="alert-error" style={{ marginBottom: 12 }}>{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            {[
                                { key: 'vehicle_id', placeholder: 'Vehicle ID (e.g. VHC-001)', required: true },
                                { key: 'vin_number', placeholder: 'VIN Number', required: true },
                                { key: 'license_plate', placeholder: 'License Plate', required: true },
                                { key: 'manufacturer', placeholder: 'Manufacturer', required: true },
                                { key: 'model', placeholder: 'Model', required: true },
                            ].map(({ key, placeholder, required }) => (
                                <input key={key} type="text" placeholder={placeholder} required={required} className="input-field"
                                    value={newV[key]} onChange={(e) => setNewV({ ...newV, [key]: e.target.value })} />
                            ))}
                            <input type="number" placeholder="Year" required className="input-field" value={newV.year} onChange={(e) => setNewV({ ...newV, year: parseInt(e.target.value) })} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%', padding: 12 }}>Register</button>
                    </form>
                </div>
            )}

            {/* Vehicle cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {vehicles.map((v) => (
                    <div key={v._id} style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--green-border)', borderRadius: 14, transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div>
                                <div style={{ fontWeight: 800, color: 'var(--green-primary)', fontSize: '1.05rem' }}>{v.vehicle_id}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{v.manufacturer} {v.model} &middot; {v.year}</div>
                            </div>
                            <span className={`badge ${v.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{v.status === 'active' ? 'Monitored' : v.status}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <span>License</span><span style={{ color: 'var(--text-secondary)' }}>{v.license_plate}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
                                <span>Engineer</span>
                                <span style={{ color: v.engineer_names?.length ? 'var(--blue)' : 'var(--text-muted)', fontStyle: v.engineer_names?.length ? 'normal' : 'italic' }}>
                                    {v.engineer_names?.length ? v.engineer_names.join(', ') : 'Not Assigned'}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => onRegenerate(v.vehicle_id)} className="btn-secondary btn-sm" style={{ width: '100%' }}>
                            Regenerate API Key
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LogsView({ logs }) {
    const { user } = useAuth();
    return (
        <div className="animate-fadein">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Live Vehicle Logs</h2>
                <span className="chip">{logs.length} Recent Entries</span>
            </div>
            <LogTable logs={logs} userRole={user?.role} />
        </div>
    );
}

function ReportsView({ summary }) {
    if (!summary) return <div className="animate-fadein" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 48 }}>Loading report data...</div>;

    const dist = summary.distribution || {};
    const total = Object.values(dist).reduce((s, v) => s + v, 0);
    const attackCount = Object.entries(dist).filter(([k]) => k !== 'Normal').reduce((s, [, v]) => s + v, 0);

    return (
        <div className="animate-fadein" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Security Report</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Total Events', value: total, color: 'var(--text-primary)' },
                    { label: 'Normal', value: dist.Normal ?? 0, color: 'var(--green-primary)' },
                    { label: 'Attacks', value: attackCount, color: 'var(--red)' },
                    { label: 'Attack Rate', value: total ? `${((attackCount / total) * 100).toFixed(1)}%` : '0%', color: attackCount > 0 ? 'var(--red)' : 'var(--green-primary)' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--green-border)', borderRadius: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {Object.entries(dist).filter(([k]) => k !== 'Normal').map(([type, count]) => {
                    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                    const COLOR_MAP = { DoS: 'var(--red)', Fuzzing: 'var(--orange)', Replay: 'var(--purple)', Spoofing: 'var(--yellow)' };
                    return (
                        <div key={type} style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid rgba(255,71,87,0.1)', borderRadius: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: COLOR_MAP[type] || 'var(--red)' }}>{type} Attack</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{count} events</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${pct}%`, background: COLOR_MAP[type] || 'var(--red)' }} />
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>{pct}% of total traffic</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Main ─────────────────────────────────────────────────────────

export default function OwnerDashboard() {
    const [tab, setTab] = useState('dashboard');
    const [vehicles, setVehicles] = useState([]);
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState(null);
    const [regResult, setRegResult] = useState(null);
    const [revealKey, setRevealKey] = useState({});
    const [selectedVehicle, setSelectedVehicle] = useState('');

    const fetchAll = async () => {
        try {
            const vehicleParam = selectedVehicle ? `?vehicle_id=${selectedVehicle}` : '';
            const logLimit = 50;
            const logParam = selectedVehicle ? `?vehicle_id=${selectedVehicle}&limit=${logLimit}` : `?limit=${logLimit}`;

            const [v, l, s] = await Promise.all([
                api.get('/owner/my-vehicle'),
                api.get(`/owner/my-logs${logParam}`),
                api.get(`/owner/attack-summary${vehicleParam}`),
            ]);
            setVehicles(v.data);
            setLogs(l.data);
            setSummary(s.data);

            // Auto-select first vehicle if none selected and vehicles exist
            if (!selectedVehicle && v.data.length > 0) {
                // We keep it empty for "All Vehicles" initially or can auto-select.
                // The requirement says "Default behavior: First vehicle auto-selected (not 'All Vehicles')" for Admin.
                // For Owner: "If multiple vehicles assigned, have a dropdown".
                // Let's auto-select the first one for Owner too if they want specific vehicle view.
                setSelectedVehicle(v.data[0].vehicle_id);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchAll();
        const iv = setInterval(fetchAll, 10000);
        return () => clearInterval(iv);
    }, [selectedVehicle]);

    const handleRegister = async (newV) => {
        try {
            const res = await api.post('/owner/register-vehicle', newV);
            setRegResult(res.data);
            fetchAll();
            return null;
        } catch (err) {
            return err.response?.data?.detail || 'Registration failed';
        }
    };

    const handleRegenerate = async (vId) => {
        if (!window.confirm(`Regenerate API key for ${vId}? The old key will stop working immediately.`)) return;
        try {
            const res = await api.post(`/owner/regenerate-api-key/${vId}`);
            setRegResult(res.data);
        } catch (err) {
            alert(err.response?.data?.detail || 'Regeneration failed');
        }
    };

    return (
        <div className="main-layout">
            <Sidebar activeTab={tab} onTabChange={setTab} />
            <main className="page-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">
                            {tab === 'dashboard' && 'Fleet Overview'}
                            {tab === 'vehicles' && 'Vehicle Management'}
                            {tab === 'logs' && 'Live Logs'}
                            {tab === 'reports' && 'Security Reports'}
                        </h1>
                        <p className="page-subtitle">CAN Intrusion Detection — Vehicle Owner Portal</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Vehicle Selector (Admin/Owner) */}
                        {vehicles.length > 1 && (tab === 'dashboard' || tab === 'logs' || tab === 'reports') && (
                            <select
                                className="input-field"
                                style={{ maxWidth: 200, height: 38 }}
                                value={selectedVehicle}
                                onChange={(e) => setSelectedVehicle(e.target.value)}
                            >
                                {vehicles.map(v => (
                                    <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_id}</option>
                                ))}
                            </select>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: summary?.attacks_today > 0 ? 'var(--red)' : 'var(--green-primary)', boxShadow: `0 0 8px ${summary?.attacks_today > 0 ? 'var(--red)' : 'var(--green-primary)'}` }} />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {summary?.attacks_today > 0 ? 'Threat Detected' : 'All Systems Normal'}
                            </span>
                        </div>
                    </div>
                </div>

                {tab === 'dashboard' && <DashboardView summary={summary} vehicles={vehicles} />}
                {tab === 'vehicles' && (
                    <VehiclesView
                        vehicles={vehicles}
                        onRegister={handleRegister}
                        onRegenerate={handleRegenerate}
                        regResult={regResult}
                        revealKey={revealKey}
                        onToggleReveal={(vid) => setRevealKey((p) => ({ ...p, [vid]: !p[vid] }))}
                        onClearResult={() => setRegResult(null)}
                    />
                )}
                {tab === 'logs' && <LogsView logs={logs} />}
                {tab === 'reports' && <ReportsView summary={summary} />}
            </main>
        </div>
    );
}
