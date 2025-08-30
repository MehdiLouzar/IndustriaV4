/**
 * Composant Footer - Pied de page complet du site Industria
 * 
 * Fournit un pied de page riche avec :
 * - Boutons d'action rapide (appel, contact, rendez-vous)
 * - Liens de navigation structurés (Média, Groupe)
 * - Informations de contact avec icônes
 * - Réseaux sociaux et liens institutionnels
 * - Modal de prise de rendez-vous intégrée
 * - Copyright automatique avec année courante
 * 
 * Design responsive qui s'adapte aux différentes tailles d'écran
 * avec reorganisation automatique des éléments.
 * 
 * @returns Composant React du pied de page
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

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
            <Button asChild variant="ghost" className="header-brown text-white hover:opacity-90 flex items-center gap-2">
              <a href="/contact">
                <Mail className="w-5 h-5" />
                Être contacté
              </a>
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
            <div className="space-y-2">
              <h4 className="font-semibold">Contactez-nous sur</h4>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-industria-yellow-gold" />
                <span className="text-xl font-bold">+212 6 60 51 78 85</span>

                {/* Small inline icon link (optional) */}
                <a
                  href="https://wa.me/212660517885?text=Bonjour%20Industria%2C%20j%27aimerais%20avoir%20plus%20d%27infos."
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Nous écrire sur WhatsApp"
                  className="ml-2 inline-flex items-center"
                  title="WhatsApp"
                >
                </a>
              </div>

              {/* Buttons row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <Button className="w-full header-brown text-white hover:opacity-90">
                  <a href="/contact">Être contacté</a>
                </Button>

                <Button className="w-full bg-[#25D366] text-white hover:bg-[#1EBE5C] focus-visible:ring-[#25D366]">
                  <a href="https://wa.me/212660517885?text=Bonjour%20Industria%2C%20j%27aimerais%20avoir%20plus%20d%27infos.">WhatsApp</a>
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom footer */}
      <div className="bg-gray-900 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Building2 className="w-6 h-6 text-industria-yellow-gold" />
              <span className="text-sm">© INDUSTRIA {currentYear} - Powered by Industria</span>
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
