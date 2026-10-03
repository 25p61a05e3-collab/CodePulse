import type { ReactNode } from 'react';
import { ArrowUpRight, CheckCircle2, CircleAlert, Info, Minus, ShieldCheck, Sparkles } from 'lucide-react';
import type { EvidenceType } from '../types';

export function Card({ children, className = '', accent = false }: { children: ReactNode; className?: string; accent?: boolean }) {
  return <section className={`card ${accent ? 'card-accent' : ''} ${className}`}>{children}</section>;
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

export function EvidencePill({ source }: { source: EvidenceType }) {
  const icon = source === 'AI-generated recommendation' ? <Sparkles size={12} /> : source === 'GitHub API data' ? <ArrowUpRight size={12} /> : <Info size={12} />;
  return <span className="evidence-pill">{icon}{source}</span>;
}

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'good' | 'warning' | 'danger' | 'neutral' | 'blue' }) {
  return <span className={`status-pill ${tone}`}><span className="status-dot" />{label}</span>;
}

export function ScoreRing({ score, size = 164, label = 'Health score' }: { score: number; size?: number; label?: string }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return <div className="score-ring" style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100" aria-label={`${label}: ${score} out of 100`} role="img">
      <circle className="ring-track" cx="50" cy="50" r={radius} />
      <circle className="ring-value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
    </svg>
    <div className="score-ring-copy"><strong>{score}</strong><span>/ 100</span></div>
  </div>;
}

export function ProgressBar({ value, tone = 'mint' }: { value: number; tone?: 'mint' | 'blue' | 'amber' | 'red' }) {
  return <div className="progress-track"><div className={`progress-value ${tone}`} style={{ width: `${value}%` }} /></div>;
}

export function MetricCard({ label, value, meta, icon, tone = 'mint' }: { label: string; value: string; meta: string; icon: ReactNode; tone?: 'mint' | 'blue' | 'amber' | 'red' }) {
  return <Card className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-copy"><span className="eyebrow">{label}</span><strong>{value}</strong><small>{meta}</small></div></Card>;
}

export function SeverityIcon({ severity }: { severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' }) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return <CircleAlert size={16} />;
  if (severity === 'MEDIUM') return <Minus size={16} />;
  return <CheckCircle2 size={16} />;
}

export function SecurityScore({ score }: { score: number }) {
  return <div className="security-score"><div className="security-icon"><ShieldCheck size={20} /></div><div><span className="eyebrow">Security signal</span><strong>{score}/100</strong><small>Manual review recommended</small></div></div>;
}
