import React, { useState } from 'react';

const BADGE_MAP = {
    Normal: 'badge-normal',
    DoS: 'badge-dos',
    Fuzzing: 'badge-fuzzing',
    Replay: 'badge-replay',
    Spoofing: 'badge-spoofing',
};

const FEATURES = ['timestamp', 'can_id', 'data_0', 'data_1', 'data_2', 'data_3', 'data_4', 'data_5', 'data_6', 'data_7'];

export default function LogTable({ logs, showRaw = false, showFeatures = false, userRole = '' }) {
    const [page, setPage] = useState(1);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAttack, setFilterAttack] = useState('All');
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc' for timestamp

    const rowsPerPage = 15;

    const toggleRow = (id) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    const formatPayload = (payload) => {
        if (!payload || !Array.isArray(payload)) return '-';
        return payload.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    };

    const getConfidenceColor = (val) => {
        if (val >= 0.9) return 'var(--success)';
        if (val >= 0.7) return 'var(--yellow)';
        return 'var(--red)';
    };

    // Filter and Sort logs
    let processedLogs = [...logs];

    // Filter by Search (CAN ID)
    if (searchTerm) {
        processedLogs = processedLogs.filter(l => l.can_id.toString().includes(searchTerm));
    }

    // Filter by Attack Type
    if (filterAttack !== 'All') {
        processedLogs = processedLogs.filter(l => (l.labelName || l.prediction) === filterAttack);
    }

    // Sort by Timestamp
    processedLogs.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    const totalPages = Math.ceil(processedLogs.length / rowsPerPage);
    const currentLogs = processedLogs.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const isEngineer = userRole === 'Engineer' || userRole === 'engineer';

    return (
        <div className="animate-fadein">
            {/* Table Controls (Only for Engineer or when needed) */}
            {isEngineer && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search by CAN ID..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    <select
                        className="input-field"
                        style={{ maxWidth: 180 }}
                        value={filterAttack}
                        onChange={(e) => { setFilterAttack(e.target.value); setPage(1); }}
                    >
                        <option value="All">All Attack Types</option>
                        {Object.keys(BADGE_MAP).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <button
                        className="btn-secondary btn-sm"
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    >
                        Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                    </button>
                </div>
            )}

            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            {isEngineer && <th>Vehicle ID</th>}
                            <th>CAN ID</th>
                            {showFeatures && <th style={{ textAlign: 'center' }}>DLC</th>}
                            {isEngineer && <th>Payload</th>}
                            <th>Prediction</th>
                            <th>Confidence</th>
                            {showRaw && !isEngineer && <th>Raw Details</th>}
                            {isEngineer && <th>Features</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {currentLogs.map((log, i) => {
                            const rowId = log._id || `log-${i}`;
                            const isExpanded = expandedRows.has(rowId);

                            return (
                                <React.Fragment key={rowId}>
                                    <tr style={{ background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                        </td>
                                        {isEngineer && (
                                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.vehicle_id}</td>
                                        )}
                                        <td>
                                            <code className="mono" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: 4 }}>
                                                {log.can_id}
                                            </code>
                                        </td>
                                        {showFeatures && <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{log.dlc || 8}</td>}
                                        {isEngineer && (
                                            <td>
                                                <code className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {formatPayload(log.payload || log.data)}
                                                </code>
                                            </td>
                                        )}
                                        <td>
                                            <span className={`badge ${BADGE_MAP[log.labelName || log.prediction] || 'badge-normal'}`}>
                                                {log.labelName || log.prediction}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ flex: 1, minWidth: 40, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                                                    <div style={{ width: `${(log.confidenceScore || log.confidence) * 100}%`, height: '100%', background: getConfidenceColor(log.confidenceScore || log.confidence), borderRadius: 2 }} />
                                                </div>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: 24, textAlign: 'right', color: getConfidenceColor(log.confidenceScore || log.confidence) }}>
                                                    {Math.round((log.confidenceScore || log.confidence) * 100)}%
                                                </span>
                                            </div>
                                        </td>
                                        {showRaw && !isEngineer && (
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.72rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {Object.entries(log.raw_features || {}).map(([k, v]) => `${k}:${v}`).join(', ')}
                                            </td>
                                        )}
                                        {isEngineer && (
                                            <td>
                                                <button
                                                    className="btn-secondary btn-sm"
                                                    style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                                                    onClick={() => toggleRow(rowId)}
                                                >
                                                    {isExpanded ? 'Hide' : 'Show'} Features
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                    {isExpanded && isEngineer && (
                                        <tr>
                                            <td colSpan={isEngineer ? 8 : (showRaw ? 6 : 5)} style={{ padding: '0 16px 16px' }}>
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: 8,
                                                    padding: 16,
                                                    borderLeft: '2px solid var(--accent-primary)',
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                                    gap: '12px 20px'
                                                }}>
                                                    {(log.extractedFeatures || []).map((val, idx) => (
                                                        <div key={idx}>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Feature {idx + 1}</div>
                                                            <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>{val.toFixed(4)}</div>
                                                        </div>
                                                    ))}
                                                    {(!log.extractedFeatures || log.extractedFeatures.length === 0) && (
                                                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>No features captured for this log.</div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        {processedLogs.length === 0 && (
                            <tr>
                                <td colSpan={isEngineer ? 8 : (showRaw ? 6 : 5)} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No log entries available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-secondary btn-sm"
                    >
                        Prev
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="btn-secondary btn-sm"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
