import { useState, useEffect } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import SummaryCards from '../components/SummaryCards';
import LogTable from '../components/LogTable';
import { AttackPieChart } from '../components/AttackChart';
import { useAuth } from '../context/AuthContext';

// --- Icons ---
const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ── Sub-views ──────────────────────────────────────────────────

function DashboardView({ stats, logs }) {
    const cards = stats ? [
        { label: 'Total Users', value: stats.total_users, color: 'blue' },
        { label: 'Pending Approvals', value: stats.pending_approvals, color: 'yellow' },
        { label: 'Managed Vehicles', value: stats.total_vehicles, color: 'cyan' },
        { label: 'Total Logs', value: stats.total_logs, color: 'green' },
    ] : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fadein">
            <SummaryCards cards={cards} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
                <AttackPieChart distribution={stats?.attack_distribution} />
                <div>
                    <p className="section-title">Recent System Logs</p>
                    <LogTable logs={logs} showRaw />
                </div>
            </div>
        </div>
    );
}

function UsersView({ pendingUsers, onApprove }) {
    return (
        <div className="animate-fadein">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pending Approvals</h2>
                <span className="chip">{pendingUsers.length} Pending</span>
            </div>
            {pendingUsers.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}>
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <p style={{ fontSize: '0.85rem' }}>No pending approval requests.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendingUsers.map((u) => (
                        <div key={u._id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px 20px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            transition: 'border-color 0.2s',
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>{u.full_name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                    padding: '3px 10px', borderRadius: 6,
                                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                                    background: u.role === 'engineer' ? 'var(--purple-dim)' : 'var(--blue-dim)',
                                    color: u.role === 'engineer' ? 'var(--purple)' : 'var(--blue)',
                                    border: `1px solid ${u.role === 'engineer' ? 'rgba(179,157,219,0.2)' : 'rgba(79,195,247,0.2)'}`,
                                }}>
                                    {u.role}
                                </span>
                                <button
                                    onClick={() => onApprove(u._id)}
                                    className="btn-primary btn-sm"
                                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                                >
                                    <CheckIcon /> Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function VehiclesView({ vehicles, engineers, onAssign }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [selectedEngineerId, setSelectedEngineerId] = useState('');

    const handleAssign = async () => {
        if (!selectedEngineerId) return;
        await onAssign(selectedVehicle.vehicle_id, selectedEngineerId);
        setShowModal(false);
        setSelectedEngineerId('');
    };

    return (
        <div className="animate-fadein">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Managed Vehicles</h2>
                <span className="chip">{vehicles.length} Total</span>
            </div>

            <div style={{ overflow: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--green-border)', background: 'var(--bg-card)' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Vehicle ID</th>
                            <th>Owner</th>
                            <th>Assigned Engineers</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map((v) => (
                            <tr key={v._id}>
                                <td><code className="mono" style={{ color: 'var(--green-primary)', background: 'rgba(0,255,136,0.07)', padding: '2px 7px', borderRadius: 5 }}>{v.vehicle_id}</code></td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v.owner_name}</td>
                                <td>
                                    {v.engineer_names?.length ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {v.engineer_names.map((name) => (
                                                <span key={name} className="chip" style={{ fontSize: '0.72rem' }}>{name}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Unassigned</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`badge ${v.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                                        {v.status}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        onClick={() => { setSelectedVehicle(v); setShowModal(true); }}
                                        className="btn-secondary btn-sm"
                                    >
                                        Assign Engineer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Assignment Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Assign Engineer</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <CloseIcon />
                            </button>
                        </div>
                        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                            Select an engineer for vehicle{' '}
                            <code className="mono" style={{ color: 'var(--green-primary)' }}>{selectedVehicle?.vehicle_id}</code>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflow: 'auto', marginBottom: 20 }}>
                            {engineers.length === 0 ? (
                                <div className="alert-error">No approved engineers available.</div>
                            ) : engineers.map((e) => (
                                <button
                                    key={e._id}
                                    onClick={() => setSelectedEngineerId(e._id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                        background: selectedEngineerId === e._id ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)',
                                        border: selectedEngineerId === e._id ? '1px solid var(--green-border-strong)' : '1px solid rgba(255,255,255,0.06)',
                                        color: selectedEngineerId === e._id ? 'var(--green-primary)' : 'var(--text-primary)',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{e.full_name}</span>
                                    {selectedEngineerId === e._id && <span className="chip" style={{ fontSize: '0.68rem' }}>Selected</span>}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => { setShowModal(false); setSelectedEngineerId(''); }} className="btn-secondary" style={{ flex: 1, padding: '11px' }}>Cancel</button>
                            <button onClick={handleAssign} disabled={!selectedEngineerId} className="btn-primary" style={{ flex: 1, padding: '11px' }}>Confirm Assignment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LogsView({ logs }) {
    const { user } = useAuth();
    return (
        <div className="animate-fadein">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>System Logs</h2>
                <span className="chip">{logs.length} Entries</span>
            </div>
            <LogTable logs={logs} showRaw userRole={user?.role} />
        </div>
    );
}

// ── Main Dashboard ──────────────────────────────────────────────

export default function AdminDashboard() {
    const [tab, setTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [engineers, setEngineers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [msg, setMsg] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(''); // Empty means "All Vehicles"

    const fetchAll = async () => {
        try {
            const vehicleParam = selectedVehicle ? `?vehicle_id=${selectedVehicle}` : '';
            const logLimit = 50;
            const logParam = selectedVehicle ? `?vehicle_id=${selectedVehicle}&limit=${logLimit}` : `?limit=${logLimit}`;

            const [s, p, v, e, l] = await Promise.all([
                api.get(`/admin/system-stats${vehicleParam}`),
                api.get('/admin/pending-users'),
                api.get('/admin/vehicles'),
                api.get('/admin/engineers'),
                api.get(`/admin/all-logs${logParam}`),
            ]);
            setStats(s.data);
            setPendingUsers(p.data);
            setVehicles(v.data);
            setEngineers(e.data);
            setLogs(l.data);

            // Auto-select first vehicle if none selected and vehicles exist (Requirement: First vehicle auto-selected, not All Vehicles)
            if (!selectedVehicle && v.data.length > 0) {
                setSelectedVehicle(v.data[0].vehicle_id);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchAll();
        const iv = setInterval(fetchAll, 10000);
        return () => clearInterval(iv);
    }, [selectedVehicle]);

    const approveUser = async (id) => {
        try {
            await api.post(`/admin/approve-user/${id}`);
            setMsg('User approved successfully.');
            fetchAll();
            setTimeout(() => setMsg(''), 4000);
        } catch (e) { console.error(e); }
    };

    const handleAssign = async (vehicleId, engineerId) => {
        try {
            await api.post('/admin/assign-engineer', { vehicle_id: vehicleId, engineer_id: engineerId });
            setMsg(`Engineer assigned to ${vehicleId}.`);
            fetchAll();
            setTimeout(() => setMsg(''), 4000);
        } catch (err) {
            alert(err.response?.data?.detail || 'Assignment failed');
        }
    };

    return (
        <div className="main-layout">
            <Sidebar activeTab={tab} onTabChange={setTab} />
            <main className="page-content">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">
                            {tab === 'dashboard' && 'System Overview'}
                            {tab === 'users' && 'User Management'}
                            {tab === 'vehicles' && 'Vehicle Registry'}
                            {tab === 'logs' && 'System Logs'}
                        </h1>
                        <p className="page-subtitle">CAN Intrusion Detection — Administrator Console</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Vehicle Selector */}
                        {(tab === 'dashboard' || tab === 'logs') && (
                            <select
                                className="input-field"
                                style={{ maxWidth: 200, height: 38 }}
                                value={selectedVehicle}
                                onChange={(e) => setSelectedVehicle(e.target.value)}
                            >
                                <option value="">All Vehicles</option>
                                {vehicles.map(v => (
                                    <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_id}</option>
                                ))}
                            </select>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-primary)', boxShadow: '0 0 8px var(--green-primary)', animation: 'pulse-neon 2s infinite' }} />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Live Monitoring</span>
                        </div>
                    </div>
                </div>

                {/* Notification */}
                {msg && (
                    <div className="alert-success" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{msg}</span>
                        <button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', color: 'var(--green-primary)', cursor: 'pointer' }}><CloseIcon /></button>
                    </div>
                )}

                {/* Tab Content */}
                {tab === 'dashboard' && <DashboardView stats={stats} logs={logs} />}
                {tab === 'users' && <UsersView pendingUsers={pendingUsers} onApprove={approveUser} />}
                {tab === 'vehicles' && <VehiclesView vehicles={vehicles} engineers={engineers} onAssign={handleAssign} />}
                {tab === 'logs' && <LogsView logs={logs} />}
            </main>
        </div>
    );
}
