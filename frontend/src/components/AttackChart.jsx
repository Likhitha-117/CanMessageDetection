import { Pie, Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler,
} from 'chart.js';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler
);

// --- Theme Constants ---
const COLORS = {
    Normal: '#00E676', // Success Green
    DoS: '#FF3B3B',    // Red
    Fuzzing: '#FF8C42', // Orange
    Replay: '#B39DDB',  // Purple
    Spoofing: '#FFD93D', // Yellow
    Accent: '#00C2FF',  // Electric Blue
};

const DARK_TOOLTIP = {
    backgroundColor: 'rgba(11, 11, 11, 0.95)',
    titleColor: '#FFFFFF',
    bodyColor: '#A0A0A0',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8,
    displayColors: true,
    boxPadding: 6,
    bodyFont: { family: 'Inter', size: 12 },
    titleFont: { family: 'Inter', weight: 'bold', size: 13 },
};

// ── Pie Chart ──────────────────────────────────────────────────

export function AttackPieChart({ distribution }) {
    if (!distribution) return null;

    const data = {
        labels: Object.keys(distribution),
        datasets: [{
            data: Object.values(distribution),
            backgroundColor: Object.keys(distribution).map(k => COLORS[k] || COLORS.Accent),
            borderWidth: 2,
            borderColor: '#0B0B0B',
            hoverOffset: 12,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#A0A0A0',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: { family: 'Inter', size: 11, weight: '500' },
                },
            },
            tooltip: DARK_TOOLTIP,
        },
        cutout: '70%',
    };

    return (
        <div className="glass-card animate-fadein" style={{ height: 340 }}>
            <p className="section-title">Attack Distribution</p>
            <div style={{ height: 260 }}>
                <Pie data={data} options={options} />
            </div>
        </div>
    );
}

// ── Bar Chart ──────────────────────────────────────────────────

export function AttackBarChart({ distribution }) {
    if (!distribution) return null;

    const data = {
        labels: Object.keys(distribution),
        datasets: [{
            label: 'Detection Count',
            data: Object.values(distribution),
            backgroundColor: Object.keys(distribution).map(k => `${COLORS[k] || COLORS.Accent}CC`),
            borderRadius: 6,
            barThickness: 32,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: DARK_TOOLTIP,
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#666', font: { size: 10 } },
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.03)' },
                ticks: { color: '#666', font: { size: 10 } },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="glass-card animate-fadein" style={{ height: 340 }}>
            <p className="section-title">Class Breakdown</p>
            <div style={{ height: 260 }}>
                <Bar data={data} options={options} />
            </div>
        </div>
    );
}

// ── Timeline Chart ─────────────────────────────────────────────

export function TimelineChart({ timeline }) {
    if (!timeline || timeline.length === 0) return null;

    const data = {
        labels: timeline.map(t => new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        datasets: [{
            label: 'Probability',
            data: timeline.map(t => t.confidence),
            borderColor: COLORS.Accent,
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                gradient.addColorStop(0, 'rgba(0, 194, 255, 0.25)');
                gradient.addColorStop(1, 'rgba(0, 194, 255, 0)');
                return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            borderWidth: 2,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: DARK_TOOLTIP,
        },
        scales: {
            x: {
                hidden: true,
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.03)' },
                ticks: { color: '#666', font: { size: 10 } },
                suggestedMin: 0,
                suggestedMax: 1,
            },
        },
        interaction: { intersect: false, mode: 'index' },
    };

    return (
        <div className="glass-card animate-fadein" style={{ height: 340 }}>
            <p className="section-title">Prediction Confidence Trend</p>
            <div style={{ height: 260 }}>
                <Line data={data} options={options} />
            </div>
        </div>
    );
}
