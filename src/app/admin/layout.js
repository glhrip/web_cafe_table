import AdminShell from '@/components/admin/AdminShell';

export const metadata = { title: 'Dashboard Admin' };

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
