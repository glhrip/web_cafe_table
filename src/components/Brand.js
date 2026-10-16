import Link from 'next/link';
import { CAFE_NAME } from '@/lib/constants';

/** Logo + nama cafe. Bisa dijadikan link ke beranda. */
export default function Brand({ href = '/', subtitle, size = 'md' }) {
  const mark = (
    <>
      <span
        className="brand-mark"
        style={size === 'lg' ? { width: 52, height: 52, fontSize: 1.5 } : undefined}
      >
        {CAFE_NAME.charAt(0).toUpperCase()}
      </span>
      <span className="stack">
        <span
          className="brand-name"
          style={size === 'lg' ? { fontSize: '1.35rem' } : undefined}
        >
          {CAFE_NAME}
        </span>
        {subtitle ? (
          <span className="tiny faint" style={{ lineHeight: 1 }}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </>
  );

  if (!href) return <div className="brand">{mark}</div>;

  return (
    <Link href={href} className="brand" aria-label={`${CAFE_NAME} — beranda`}>
      {mark}
    </Link>
  );
}
