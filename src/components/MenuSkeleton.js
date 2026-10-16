/** Skeleton kartu menu saat memuat. */
export default function MenuSkeleton({ count = 6 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: 20,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ overflow: 'hidden' }}>
          <div className="skeleton" style={{ aspectRatio: '4 / 3', borderRadius: 0 }} />
          <div style={{ padding: 16 }}>
            <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 12, width: '100%', marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 18 }} />
            <div className="row between">
              <div className="skeleton" style={{ height: 18, width: 90 }} />
              <div className="skeleton" style={{ height: 34, width: 90, borderRadius: 999 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
