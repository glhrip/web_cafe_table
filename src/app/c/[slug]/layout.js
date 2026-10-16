'use client';

import { use } from 'react';
import TenantProvider from '@/components/TenantProvider';

/**
 * Layout untuk semua halaman milik satu cafe (/c/[slug]/*).
 * Membungkus dengan TenantProvider supaya branding & tema tersedia
 * di seluruh halaman (menu, tracking, admin).
 */
export default function TenantLayout({ children, params }) {
  const { slug } = use(params);
  return <TenantProvider slug={slug}>{children}</TenantProvider>;
}
