import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen  relative">
      <div className="flex max-w-7xl mx-auto relative z-10 pb-12">
        <Sidebar />
        <main className="flex-1 p-6 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
