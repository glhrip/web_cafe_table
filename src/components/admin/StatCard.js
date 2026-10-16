import Icon from '@/components/Icon';

const TONES = {
  brand: { bg: 'var(--brand-soft)', fg: 'var(--brand-strong)' },
  warning: { bg: 'var(--warning-bg)', fg: 'var(--warning)' },
  info: { bg: 'var(--info-bg)', fg: 'var(--info)' },
  success: { bg: 'var(--success-bg)', fg: 'var(--success)' },
};

/** Kartu ringkasan statistik di dashboard admin. */
export default function StatCard({ icon, label, value, hint, tone = 'brand' }) {
  const t = TONES[tone] || TONES.brand;
  return (
    <div className="card card-pad row gap-3" style={{ alignItems: 'center' }}>
      <span
        className="row"
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: t.bg,
          color: t.fg,
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={22} />
      </span>
      <div className="stack" style={{ minWidth: 0 }}>
        <span className="tiny faint">{label}</span>
        <span className="h2" style={{ lineHeight: 1.1 }}>
          {value}
        </span>
        {hint ? <span className="tiny faint">{hint}</span> : null}
      </div>
    </div>
  );
}
