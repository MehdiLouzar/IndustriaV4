import AdminHeader from '@/components/AdminHeader';
import AdminGuard from '@/components/AdminGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminHeader />
      <main className="pt-6">{children}</main>
    </AdminGuard>
  );
}
