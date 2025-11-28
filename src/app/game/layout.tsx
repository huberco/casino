import ChatView from '@/components/Chat/ChatView';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen  relative">
      <div className="flex  mx-auto relative z-10">
        <main className="flex-1 md:p-6 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
