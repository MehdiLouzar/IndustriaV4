'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Crown, Quote } from 'lucide-react';
import Image from 'next/image';

export default function DiscoursRoyaux() {
  const discours = [
    {
      id: 1,
      date: "8 octobre 2021",
      occasion: "Discours de Sa Majesté le Roi Mohammed VI, que Dieu L'assiste, adressé au Parlement à l'occasion de l'ouverture de la 1ère session de la 1ère année législative de la 11ème législature",
      extrait: `Aussi, dans la perspective de la mise en œuvre du modèle de développement, le nouveau gouvernement doit définir les priorités et les projets à mettre en chantier au cours de son mandat et mobiliser les ressources nécessaires pour assurer leur financement.

Cette même logique doit guider la mise en œuvre de la réforme des entreprises et établissements publics et présider à la réforme fiscale, qu'il convient de conforter, avec la plus grande célérité, par une nouvelle charte compétitive de l'investissement.`,
    },
    {
      id: 2,
      date: "14 octobre 2022", 
      occasion: "Discours de Sa Majesté le Roi Mohammed VI, que Dieu L'assiste, adressé au Parlement à l'occasion de l'ouverture de la 1ère session de la 2ème année législative de la 11ème législature",
      extrait: `Nous préconisons, à nouveau, qu'une attention particulière soit portée aux investissements et aux initiatives des membres de la communauté marocaine résidant à l'étranger.

Pour atteindre les objectifs souhaités, Nous avons exhorté le gouvernement, en partenariat avec les secteurs privé et bancaire, à traduire leurs engagements respectifs dans un «Pacte National pour l'Investissement».

Ce dispositif vise à mobiliser 550 milliards de dirhams d'investissements et à créer 500 mille emplois, au cours de la période 2022-2026.`,
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-900 to-red-700 py-16 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discours Royaux
            </h1>
            <p className="text-xl text-red-100 max-w-2xl mx-auto leading-relaxed">
              Les orientations de Sa Majesté le Roi Mohammed VI concernant le développement économique et l'investissement au Royaume du Maroc
            </p>
          </div>
        </div>
      </section>

      {/* Royal Portrait Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl mx-auto">
            <div className="w-full md:w-1/3">
              <div className="relative">
                <div className="w-64 h-80 mx-auto relative overflow-hidden rounded-lg shadow-lg border-4 border-yellow-600">
                  {/* Placeholder pour la photo officielle de Sa Majesté */}
                  <div className="w-full h-full bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center">
                    <Image src="/Photo-officiel-Sa-Majeste-le-Roi-Mohammed-VI.webp" alt="Photo officiel de Sa Majesté Le Roi Mohammed VI" />
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-2/3 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Sa Majesté le Roi Mohammed VI
              </h2>
              <p className="text-lg text-red-700 mb-4 font-semibold">
                Que Dieu L'assiste
              </p>
              <p className="text-gray-700 leading-relaxed">
                Les discours de Sa Majesté constituent une feuille de route stratégique pour le développement économique du Royaume, 
                orientant les politiques d'investissement et de modernisation des entreprises publiques et privées.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Discours Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Extraits des Discours Royaux
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Orientations stratégiques pour l'investissement et le développement économique
            </p>
          </div>

          <div className="space-y-8 max-w-4xl mx-auto">
            {discours.map((discours, index) => (
              <Card key={discours.id} className="border-2 border-red-100 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-red-700" />
                        <Badge variant="outline" className="border-red-300 text-red-700">
                          {discours.date}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg text-gray-900 leading-relaxed">
                        {discours.occasion}
                      </CardTitle>
                    </div>
                    <Quote className="w-8 h-8 text-red-300 flex-shrink-0 ml-4" />
                  </div>
                </CardHeader>
                <CardContent className="py-6">
                  <div className="prose prose-lg max-w-none">
                    {discours.extrait.split('\n\n').map((paragraphe, pIndex) => (
                      <p key={pIndex} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                        {paragraphe}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Note légale */}
          <div className="mt-12 text-center">
            <div className="max-w-2xl mx-auto p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note :</strong> Ces extraits sont présentés dans le cadre de l'information sur les orientations royales 
                concernant l'investissement et le développement économique. Les textes intégraux des discours sont disponibles 
                sur les sites officiels du Royaume du Maroc.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}