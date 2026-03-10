// SVG stat card icons — no emoji
const ICONS = {
    blue: {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
        color: 'var(--accent-primary)',
        bg: 'var(--accent-glow)',
        border: 'var(--accent-border-strong)',
    },
    green: {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        ),
        color: 'var(--success)',
        bg: 'var(--success-dim)',
        border: 'rgba(0, 230, 118, 0.2)',
    },
    red: {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        color: 'var(--red)',
        bg: 'var(--red-dim)',
        border: 'rgba(255, 59, 59, 0.2)',
    },
    yellow: {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
        color: 'var(--yellow)',
        bg: 'var(--yellow-dim)',
        border: 'rgba(255, 217, 61, 0.2)',
    },
    cyan: {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" />
                <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
        ),
        color: 'var(--accent-primary)',
        bg: 'var(--accent-glow)',
        border: 'var(--accent-border-strong)',
    },
    purple: {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        color: 'var(--purple)',
        bg: 'var(--purple-dim)',
        border: 'rgba(179, 157, 219, 0.2)',
    },
};

export default function SummaryCards({ cards }) {
    return (
        <div className="grid-stats">
            {cards.map((card, i) => {
                const theme = ICONS[card.color] || ICONS.blue;
                return (
                    <div
                        key={i}
                        className="stat-card animate-fadein"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                                    {card.label}
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                                    {card.value ?? '—'}
                                </div>
                            </div>
                            <div style={{
                                width: 44, height: 44, flexShrink: 0,
                                background: theme.bg,
                                border: `1px solid ${theme.border}`,
                                borderRadius: 12,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: theme.color,
                            }}>
                                {theme.icon}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
