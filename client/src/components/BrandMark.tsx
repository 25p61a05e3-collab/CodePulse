export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <div className={`brand-lockup ${compact ? 'compact' : ''}`} aria-label="CodePulse">
    <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /><i /></div>
    {!compact && <div className="brand-wordmark"><strong>Code<span>Pulse</span></strong><small>REPOSITORY INTELLIGENCE</small></div>}
  </div>;
}
