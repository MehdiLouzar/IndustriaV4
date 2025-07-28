import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AProposPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto px-4 py-12 space-y-6">
        <h1 className="text-3xl font-bold text-center">À propos</h1>
        <p className="text-gray-600 text-center">Découvrez l'histoire de ZonesPro.</p>
      </div>
      <Footer />
    </main>
  );
}
