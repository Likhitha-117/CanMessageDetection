import { useState, useRef, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';
import api from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ── Icons ─────────────────────────────────────────────────────── */
const FileIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
);
const CheckIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

/* ── Attack badge helper ─────────────────────────────────────── */
const ATTACK_COLORS = {
    DoS: { bg: 'var(--red-dim)', color: 'var(--red)', border: 'rgba(255,59,59,0.25)' },
    Fuzzing: { bg: 'var(--orange-dim)', color: 'var(--orange)', border: 'rgba(255,140,66,0.25)' },
    Replay: { bg: 'var(--purple-dim)', color: 'var(--purple)', border: 'rgba(179,157,219,0.25)' },
    Spoofing: { bg: 'var(--yellow-dim)', color: 'var(--yellow)', border: 'rgba(255,217,61,0.25)' },
    Normal: { bg: 'var(--success-dim)', color: 'var(--success)', border: 'rgba(0,230,118,0.25)' },
};
const AttackBadge = ({ label }) => {
    const c = ATTACK_COLORS[label] || ATTACK_COLORS.Normal;
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 6,
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase', background: c.bg, color: c.color,
            border: `1px solid ${c.border}`,
        }}>{label}</span>
    );
};

/* ── Confidence bar ─────────────────────────────────────────── */
const ConfBar = ({ value }) => {
    const pct = Math.round(value * 100);
    const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--orange)' : 'var(--yellow)';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color, minWidth: 34 }}>{pct}%</span>
        </div>
    );
};

/* ── CSV Export ─────────────────────────────────────────────── */
function downloadCsv(summary, distribution, attackLogs, filename) {
    const rows = [
        ['# CSV Dataset Analysis Report'],
        ['# Generated', new Date().toISOString()],
        ['# File', filename],
        [],
        ['## Summary'],
        ['Total Logs', summary.total_logs],
        ['Total Sequences', summary.total_sequences],
        ['Attacks Detected', summary.attack_count],
        ['Normal Sequences', summary.normal_count],
        ['Attack Rate (%)', summary.attack_percentage],
        [],
        ['## Attack Distribution'],
        ...Object.entries(distribution).map(([k, v]) => [k, v]),
        [],
        ['## Detailed Attack Logs'],
        ['Timestamp', 'CAN ID', 'Payload', 'Attack Type', 'Confidence'],
        ...attackLogs.map(l => [l.timestamp, l.can_id, l.payload, l.label_name, (l.confidence * 100).toFixed(1) + '%']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attack_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

const PAGE_SIZE = 25;
const ATTACK_TYPES = ['All', 'DoS', 'Fuzzing', 'Replay', 'Spoofing'];

/* ── Chart colours ──────────────────────────────────────────── */
const CHART_COLORS = [
    'rgba(255,59,59,0.85)',
    'rgba(255,140,66,0.85)',
    'rgba(179,157,219,0.85)',
    'rgba(255,217,61,0.85)',
];
const CHART_BORDERS = [
    'rgba(255,59,59,1)',
    'rgba(255,140,66,1)',
    'rgba(179,157,219,1)',
    'rgba(255,217,61,1)',
];

/* ══════════════════════════════════════════════════════════════
   Result View
══════════════════════════════════════════════════════════════ */
function AnalysisResult({ data, filename, onReset }) {
    const { summary, attack_distribution: dist, attack_logs: allLogs } = data;

    const [filter, setFilter] = useState('All');
    const [sortDir, setSortDir] = useState('desc'); // 'desc' = highest confidence first
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        let logs = filter === 'All' ? allLogs : allLogs.filter(l => l.label_name === filter);
        logs = [...logs].sort((a, b) =>
            sortDir === 'desc' ? b.confidence - a.confidence : a.confidence - b.confidence
        );
        return logs;
    }, [allLogs, filter, sortDir]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const labels = Object.keys(dist);
    const chartData = {
        labels,
        datasets: [{
            label: 'Detected Attacks',
            data: Object.values(dist),
            backgroundColor: CHART_COLORS,
            borderColor: CHART_BORDERS,
            borderWidth: 1.5,
            borderRadius: 6,
        }],
    };
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1a1a1a',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                titleColor: '#fff',
                bodyColor: '#a0a0a0',
                callbacks: { label: ctx => ` ${ctx.raw} sequences` },
            },
        },
        scales: {
            x: {
                ticks: { color: '#a0a0a0', font: { size: 11 } },
                grid: { color: 'rgba(255,255,255,0.04)' },
            },
            y: {
                ticks: { color: '#a0a0a0', font: { size: 11 } },
                grid: { color: 'rgba(255,255,255,0.04)' },
                beginAtZero: true,
            },
        },
    };

    const statCard = (label, value, accent) => (
        <div style={{
            padding: '16px 20px', borderRadius: 14,
            background: accent ? 'rgba(255,59,59,0.06)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${accent ? 'rgba(255,59,59,0.15)' : 'var(--border)'}`,
        }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: accent ? 'var(--red)' : 'var(--text-primary)' }}>{value}</div>
        </div>
    );

    return (
        <div className="animate-fadein" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--success)', fontWeight: 700 }}>
                    <div style={{ padding: 4, background: 'rgba(0,230,118,0.1)', borderRadius: '50%', display: 'flex' }}>
                        <CheckIcon />
                    </div>
                    Analysis Complete — <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.85rem' }}>{filename}</span>
                </div>
                <button
                    onClick={() => downloadCsv(summary, dist, allLogs, filename)}
                    className="btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    id="download-report-btn"
                >
                    <DownloadIcon /> Download Report
                </button>
            </div>

            {/* ── Section 1: Summary Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {statCard('Logs Processed', summary.total_logs.toLocaleString())}
                {statCard('Attacks Detected', summary.attack_count.toLocaleString(), true)}
                {statCard('Attack Rate', `${summary.attack_percentage}%`, summary.attack_percentage > 0)}
            </div>

            {/* ── Section 2: Distribution Chart ── */}
            <div className="glass-card-flat">
                <div className="section-title">Attack Distribution</div>
                <div style={{ height: 180 }}>
                    <Bar data={chartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
                </div>
                {/* Legend row */}
                <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                    {labels.map((lbl, i) => (
                        <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: CHART_COLORS[i] }} />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lbl}: <strong style={{ color: 'var(--text-primary)' }}>{dist[lbl]}</strong></span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Section 3: Attack Table ── */}
            <div className="glass-card-flat">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                    <div className="section-title" style={{ marginBottom: 0 }}>
                        Detected Attack Logs
                        <span style={{ marginLeft: 8, color: 'var(--accent-primary)', fontSize: '0.75rem' }}>({filtered.length})</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {/* Filter */}
                        <select
                            id="attack-type-filter"
                            value={filter}
                            onChange={e => { setFilter(e.target.value); setPage(1); }}
                            className="input-field"
                            style={{ padding: '6px 10px', fontSize: '0.78rem', width: 'auto' }}
                        >
                            {ATTACK_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
                        </select>
                        {/* Sort toggle */}
                        <button
                            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                            className="btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            title="Sort by confidence"
                        >
                            Confidence {sortDir === 'desc' ? '↓' : '↑'}
                        </button>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No attacks found for the selected filter.
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>CAN ID</th>
                                        <th>Payload (Hex)</th>
                                        <th>Attack Type</th>
                                        <th style={{ minWidth: 140 }}>Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageSlice.map((log, idx) => (
                                        <tr key={idx}>
                                            <td className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                {log.timestamp.toFixed(3)}
                                            </td>
                                            <td className="mono" style={{ fontWeight: 600 }}>
                                                {log.can_id.toUpperCase()}
                                            </td>
                                            <td className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                                                {log.payload}
                                            </td>
                                            <td><AttackBadge label={log.label_name} /></td>
                                            <td><ConfBar value={log.confidence} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="btn-secondary btn-sm"
                                >← Prev</button>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    Page {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="btn-secondary btn-sm"
                                >Next →</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Reset ── */}
            <button onClick={onReset} className="btn-secondary" style={{ width: '100%' }} id="scan-another-btn">
                Scan Another File
            </button>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   Upload View
══════════════════════════════════════════════════════════════ */
export default function DatasetUpload({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef();

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f && f.name.endsWith('.csv')) {
            setFile(f);
            setError('');
        } else {
            setError('Please select a valid CSV file.');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        setProgress(0);
        const formData = new FormData();
        formData.append('file', file);
        const savedName = file.name;

        try {
            const res = await api.post('/analysis/upload-dataset', formData, {
                onUploadProgress: (ev) => setProgress(Math.round((ev.loaded * 100) / ev.total)),
            });
            setResult({ ...res.data, _filename: savedName });
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || 'Analysis failed. Check file format.');
        } finally {
            setLoading(false);
            setFile(null);
        }
    };

    if (result) {
        return (
            <AnalysisResult
                data={result}
                filename={result._filename}
                onReset={() => { setResult(null); setError(''); }}
            />
        );
    }

    return (
        <div className="glass-card animate-fadein">
            {/* Drop zone */}
            <div
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f?.name.endsWith('.csv')) setFile(f);
                }}
                style={{
                    border: '2px dashed var(--border)', borderRadius: 14, padding: '40px 20px',
                    textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                    background: 'rgba(255,255,255,0.01)', marginBottom: 20,
                }}
            >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept=".csv" />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <FileIcon />
                </div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {file ? file.name : 'Click or Drag CSV to analyze'}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Standard CAN log format · All rows must have dlc=8
                </p>
            </div>

            {loading && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                        <span>Processing dataset…</span>
                        <span>{progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s' }} />
                    </div>
                </div>
            )}

            {error && (
                <div className="alert-error" style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <button
                id="start-scan-btn"
                onClick={handleUpload}
                disabled={!file || loading}
                className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
                {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Start Security Scan'}
            </button>
        </div>
    );
}
