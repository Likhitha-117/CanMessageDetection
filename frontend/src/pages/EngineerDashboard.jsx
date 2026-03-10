import { useState, useEffect } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import SummaryCards from '../components/SummaryCards';
import LogTable from '../components/LogTable';
import { AttackPieChart, AttackBarChart, TimelineChart } from '../components/AttackChart';
import DatasetUpload from '../components/DatasetUpload';

const DownloadIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
);

// ── Sub-views ──────────────────────────────────────────────────

function DashboardView({ dist, attackCount, totalCount, vehicles }) {
    const cards = [
        { label: 'Assigned Vehicles', value: vehicles.length, color: 'blue' },
        { label: 'Total Logs', value: totalCount, color: 'cyan' },
        { label: 'Attacks Detected', value: attackCount, color: 'red' },
        { label: 'Attack Rate', value: totalCount ? `${((attackCount / totalCount) * 100).toFixed(1)}%` : '0%', color: 'yellow' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fadein">
            <SummaryCards cards={cards} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {dist && <AttackPieChart distribution={dist.distribution} />}
                {dist && <AttackBarChart distribution={dist.distribution} />}
                {dist && <TimelineChart timeline={dist.timeline} />}
            </div>
        </div>
    );
}

import { useAuth } from '../context/AuthContext';

function LogsView({ logs, selectedVehicle, vehicles, setSelectedVehicle, onDownload, downloading }) {
    const { user } = useAuth();
    return (
        <div className="animate-fadein">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Real-Time Logs</h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Live CAN bus predictions for selected vehicle</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <select className="input-field" style={{ maxWidth: 220 }} value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
                        {vehicles.map((v) => (
                            <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_id} — {v.manufacturer} {v.model}</option>
                        ))}
                    </select>
                    <button
                        className="btn-secondary btn-sm"
                        onClick={onDownload}
                        disabled={downloading || !selectedVehicle}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                    >
                        {downloading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <DownloadIcon />}
                        Export CSV
                    </button>
                </div>
            </div>
            <LogTable logs={logs} showRaw showFeatures userRole={user?.role} />
        </div>
    );
}

function UploadView({ selectedVehicle, onUploadSuccess }) {
    return (
        <div className="animate-fadein" style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>CSV Dataset Analysis</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Upload a CAN bus dataset for LSTM-based batch inference.</p>
            </div>
            <DatasetUpload onUploadSuccess={onUploadSuccess} />
        </div>
    );
}

function ReportsView({ dist, selectedVehicle, vehicles, setSelectedVehicle }) {
    const distribution = dist?.distribution || {};
    const total = Object.values(distribution).reduce((s, v) => s + v, 0);
    const attackCount = Object.entries(distribution).filter(([k]) => k !== 'Normal').reduce((s, [, v]) => s + v, 0);

    const COLOR_MAP = { DoS: 'var(--red)', Fuzzing: 'var(--orange)', Replay: 'var(--purple)', Spoofing: 'var(--yellow)' };

    return (
        <div className="animate-fadein" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Forensic Report</h2>
                <select className="input-field" style={{ maxWidth: 200 }} value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
                    {vehicles.map((v) => (
                        <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_id}</option>
                    ))}
                </select>
            </div>

            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Total Events', value: total, color: 'var(--text-primary)' },
                    { label: 'Normal', value: distribution.Normal ?? 0, color: 'var(--green-primary)' },
                    { label: 'Attack Events', value: attackCount, color: 'var(--red)' },
                    { label: 'Attack Rate', value: total ? `${((attackCount / total) * 100).toFixed(1)}%` : '0%', color: attackCount > 0 ? 'var(--red)' : 'var(--green-primary)' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--green-border)', borderRadius: 12 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
                        <div style={{ fontSize: '1.7rem', fontWeight: 800, color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <AttackPieChart distribution={distribution} />
                <AttackBarChart distribution={distribution} />
            </div>

            {/* Attack detail breakdown */}
            {Object.entries(distribution).filter(([k]) => k !== 'Normal').length > 0 && (
                <div style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--green-border)', borderRadius: 14 }}>
                    <p className="section-title">Attack Breakdown</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Object.entries(distribution).filter(([k]) => k !== 'Normal').map(([type, count]) => {
                            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                            return (
                                <div key={type}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: COLOR_MAP[type] || 'var(--red)' }}>{type}</span>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{count} events ({pct}%)</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${pct}%`, background: COLOR_MAP[type] || 'var(--red)' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main ─────────────────────────────────────────────────────────

export default function EngineerDashboard() {
    const [tab, setTab] = useState('dashboard');
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [logs, setLogs] = useState([]);
    const [dist, setDist] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        api.get('/engineer/assigned-vehicles').then((r) => {
            setVehicles(r.data);
            if (r.data.length > 0) setSelectedVehicle(r.data[0].vehicle_id);
        }).catch(console.error);
    }, []);

    const fetchData = async () => {
        if (!selectedVehicle) return;
        try {
            const [l, d] = await Promise.all([
                api.get(`/engineer/vehicle-logs/${selectedVehicle}?limit=100`),
                api.get(`/engineer/attack-distribution/${selectedVehicle}`),
            ]);
            setLogs(l.data);
            setDist(d.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchData();
        const iv = setInterval(fetchData, 10000);
        return () => clearInterval(iv);
    }, [selectedVehicle]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const resp = await api.get(`/engineer/download-csv/${selectedVehicle}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedVehicle}_logs.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) { console.error(err); }
        setDownloading(false);
    };

    const attackCount = dist ? Object.entries(dist.distribution || {}).reduce((s, [k, v]) => k !== 'Normal' ? s + v : s, 0) : 0;
    const totalCount = dist ? Object.values(dist.distribution || {}).reduce((s, v) => s + v, 0) : 0;

    return (
        <div className="main-layout">
            <Sidebar activeTab={tab} onTabChange={setTab} />
            <main className="page-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">
                            {tab === 'dashboard' && 'Analysis Overview'}
                            {tab === 'logs' && 'Real-Time Logs'}
                            {tab === 'upload' && 'CSV Analysis'}
                            {tab === 'reports' && 'Forensic Reports'}
                        </h1>
                        <p className="page-subtitle">CAN Intrusion Detection — Security Engineer Console</p>
                    </div>
                    {/* Vehicle selector in header for dashboard + logs */}
                    {(tab === 'dashboard') && vehicles.length > 0 && (
                        <select className="input-field" style={{ maxWidth: 240 }} value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
                            {vehicles.map((v) => (
                                <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_id} — {v.manufacturer} {v.model}</option>
                            ))}
                        </select>
                    )}
                </div>

                {tab === 'dashboard' && <DashboardView dist={dist} attackCount={attackCount} totalCount={totalCount} vehicles={vehicles} />}
                {tab === 'logs' && (
                    <LogsView
                        logs={logs}
                        selectedVehicle={selectedVehicle}
                        vehicles={vehicles}
                        setSelectedVehicle={setSelectedVehicle}
                        onDownload={handleDownload}
                        downloading={downloading}
                    />
                )}
                {tab === 'upload' && <UploadView selectedVehicle={selectedVehicle} onUploadSuccess={fetchData} />}
                {tab === 'reports' && (
                    <ReportsView
                        dist={dist}
                        selectedVehicle={selectedVehicle}
                        vehicles={vehicles}
                        setSelectedVehicle={setSelectedVehicle}
                    />
                )}
            </main>
        </div>
    );
}
