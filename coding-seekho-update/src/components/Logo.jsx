export default function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="LLC World">
      <div className="brand-mark">
        <span>L</span><span>L</span><span>C</span>
      </div>
      {!compact && <div><strong>LLC World</strong><small>Little Long Concept</small></div>}
    </div>
  );
}
