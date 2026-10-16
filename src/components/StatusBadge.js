import { STATUS_META } from '@/lib/constants';

/** Badge status pesanan dengan warna sesuai tone. */
export default function StatusBadge({ status, full = false }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span className={`badge badge-${meta.tone}`}>
      {full ? meta.label : meta.short}
    </span>
  );
}
