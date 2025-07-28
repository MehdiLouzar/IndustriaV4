'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Calendar, Mail, Facebook, Youtube, Instagram, Twitter, Building2 } from 'lucide-react';
import AppointmentForm from './AppointmentForm';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showForm, setShowForm] = useState(false);


  const mediaLinks = [
    { title: 'Communiqués de presse', href: '/media/communiques' },
    { title: 'Actualités', href: '/media/actualites' },
    { title: 'Rapports', href: '/media/rapports' },
  ];

  const groupLinks = [
    { title: 'À propos', href: '/groupe/a-propos' },
    { title: 'Chiffres clés', href: '/groupe/chiffres' },
    { title: 'Engagement citoyen', href: '/groupe/engagement' },
    { title: 'Offre d\'emplois', href: '/groupe/emplois' },
    { title: 'Candidature', href: '/groupe/candidature' },
    { title: 'Politique de recrutement', href: '/groupe/recrutement' },
  ];

  return (
    <>
    <footer className="bg-gray-800 text-white">
      {/* Action buttons */}
      <div className="bg-gray-700 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Button variant="ghost" className="text-white hover:bg-gray-600 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Appel (Centre d'appel)
            </Button>
            <Button variant="ghost" className="text-white hover:bg-gray-600 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Être contacté
            </Button>
            <Button
              className="header-red text-white hover:opacity-90 flex items-center gap-2"
              onClick={() => setShowForm(true)}
            >
              <Calendar className="w-5 h-5" />
              Prise de rendez-vous
            </Button>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Média */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Média</h3>
            <ul className="space-y-2">
              {mediaLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-gray-300 hover:text-white transition-colors text-sm">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Le Groupe */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Le Groupe</h3>
            <ul className="space-y-2">
              {groupLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-gray-300 hover:text-white transition-colors text-sm">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Suivez-nous</h3>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="w-10 h-10 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Contactez-nous sur</h4>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-400" />
                <span className="text-xl font-bold">+212 5 37 57 20 00</span>
              </div>
              <Button
                className="w-full header-red text-white hover:opacity-90 mt-3"
                onClick={() => setShowForm(true)}
              >
                Prise de rendez-vous
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="bg-gray-900 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Building2 className="w-6 h-6 text-red-400" />
              <span className="text-sm">© ZONES-PRO {currentYear} - Powered by ZonesPro</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <a href="/actualites" className="text-gray-300 hover:text-white">Actualités</a>
              <a href="/evenements" className="text-gray-300 hover:text-white">Événements</a>
              <a href="/mediatheque" className="text-gray-300 hover:text-white">Médiathèque</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
    {showForm && <AppointmentForm onClose={() => setShowForm(false)} />}
    </>
  );
}
