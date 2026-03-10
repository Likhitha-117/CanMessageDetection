import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const roleLabel = {
        admin: '🛡️ Admin',
        owner: '🚗 Owner',
        engineer: '🔧 Engineer',
    };

    return (
        <nav className="flex items-center justify-between px-6 py-3"
            style={{
                background: 'rgba(15,23,42,0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(99,102,241,0.15)',
                position: 'sticky', top: 0, zIndex: 50,
            }}
        >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 no-underline">
                <span className="text-2xl">🛡️</span>
                <span className="font-bold text-lg"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    CAN-IDS
                </span>
            </Link>

            {/* Right side */}
            {user && (
                <div className="flex items-center gap-4">
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {user.full_name}
                    </span>
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        {roleLabel[user.role] || user.role}
                    </span>
                    <button onClick={handleLogout} className="btn-danger text-sm" style={{ padding: '6px 16px' }}>
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
}
