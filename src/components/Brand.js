'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTenant } from './TenantProvider';

/**
 * Logo + nama cafe. Nama & logo diambil dari tenant aktif (branding),
 * jadi tiap cafe tampil beda tanpa mengubah kode.
 */
export default function Brand({ href, subtitle, size = 'md' }) {
  const tenant = useTenant();
  const name = tenant?.name || 'Cafe';
  const logo = tenant?.logo;

  const markSize = size === 'lg' ? 52 : 38;

  const mark = (
    <>
      <span
        className="brand-mark"
        style={{
          width: markSize,
          height: markSize,
          fontSize: size === 'lg' ? 1.5 : 1.15,
          overflow: 'hidden',
        }}
      >
        {logo ? (
          <Image
            src={logo}
            alt={name}
            width={markSize}
            height={markSize}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            unoptimized
          />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </span>
      <span className="stack">
        <span
          className="brand-name"
          style={size === 'lg' ? { fontSize: '1.35rem' } : undefined}
        >
          {name}
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
    <Link href={href} className="brand" aria-label={`${name} — beranda`}>
      {mark}
    </Link>
  );
}
