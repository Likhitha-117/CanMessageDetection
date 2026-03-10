import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// SVG Icons — no emoji
const Icons = {
    Dashboard: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    Logs: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    Upload: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
    ),
    Reports: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    Users: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Vehicle: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" />
            <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
    ),
    Shield: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    Logout: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
};

const ROLE_CONFIG = {
    admin: [
        { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard' },
        { id: 'users', label: 'User Approvals', icon: 'Users' },
        { id: 'vehicles', label: 'Vehicles', icon: 'Vehicle' },
        { id: 'logs', label: 'System Logs', icon: 'Logs' },
    ],
    owner: [
        { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard' },
        { id: 'vehicles', label: 'My Vehicles', icon: 'Vehicle' },
        { id: 'logs', label: 'Live Logs', icon: 'Logs' },
        { id: 'reports', label: 'Reports', icon: 'Reports' },
    ],
    engineer: [
        { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard' },
        { id: 'logs', label: 'Live Logs', icon: 'Logs' },
        { id: 'upload', label: 'CSV Analysis', icon: 'Upload' },
        { id: 'reports', label: 'Reports', icon: 'Reports' },
    ],
};

const ROLE_LABEL = {
    admin: 'Administrator',
    owner: 'Vehicle Owner',
    engineer: 'Security Engineer',
};

export default function Sidebar({ activeTab, onTabChange }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const tabs = ROLE_CONFIG[user?.role] || [];

    return (
        <aside className="sidebar animate-fadein-left">
            <div className="sidebar-logo">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--accent-border)',
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--accent-primary)',
                        flexShrink: 0,
                    }}>
                        {Icons.Shield}
                    </div>
                    <div className="logo-text">
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            CAN-IDS
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 500, textTransform: 'uppercase' }}>
                            Intrusion Detection
                        </div>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Navigation</div>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                        style={{ background: 'none', border: activeTab === tab.id ? '1px solid rgba(0,194,255,0.2)' : '1px solid transparent', width: '100%', textAlign: 'left' }}
                    >
                        <span style={{ color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                            {Icons[tab.icon]}
                        </span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    marginBottom: 8,
                }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.full_name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {ROLE_LABEL[user?.role] || user?.role}
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="sidebar-item"
                    style={{ width: '100%', background: 'none', border: '1px solid transparent', color: 'var(--text-muted)' }}
                >
                    <span style={{ color: 'var(--red)' }}>{Icons.Logout}</span>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
