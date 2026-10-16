import { formatCurrency, countItems } from '@/lib/format';

/** Rincian item + total, dipakai di halaman tracking & nota. */
export default function OrderSummary({ order }) {
  const items = order.items || [];
  const total = order.total ?? 0;

  return (
    <div className="stack">
      {items.map((it, i) => (
        <div
          key={`${it.id || it.name}-${i}`}
          className="row between gap-3"
          style={{ padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}
        >
          <span className="row gap-2" style={{ minWidth: 0 }}>
            <span
              className="mono"
              style={{
                fontWeight: 700,
                color: 'var(--brand-strong)',
                minWidth: 26,
              }}
            >
              {it.qty}×
            </span>
            <span style={{ fontWeight: 600 }}>{it.name}</span>
          </span>
          <span className="mono" style={{ fontWeight: 650 }}>
            {formatCurrency((it.price || 0) * (it.qty || 0))}
          </span>
        </div>
      ))}

      <div
        className="row between"
        style={{ paddingTop: 14, marginTop: 4 }}
      >
        <span className="h3">
          Total
          <span className="small muted" style={{ fontWeight: 500 }}>
            {' '}
            · {countItems(items)} item
          </span>
        </span>
        <span className="h3" style={{ color: 'var(--brand-strong)' }}>
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
