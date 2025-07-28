import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function EmploisPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto px-4 py-12 space-y-6">
        <h1 className="text-3xl font-bold text-center">Offre d'emplois</h1>
        <p className="text-gray-600 text-center">Consultez nos postes disponibles.</p>
      </div>
      <Footer />
    </main>
  );
}
