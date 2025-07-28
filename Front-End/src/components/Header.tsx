'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Menu, Phone, MapPin, Building2 } from 'lucide-react';
import AuthButton from '@/components/AuthButton';

export default function Header({ showAdminLink = false }: { showAdminLink?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const navItems = [
    {
      title: 'Média',
      items: mediaLinks,
    },
    {
      title: 'Le Groupe',
      items: groupLinks,
    },
  ];

  return (
    <header className="w-full">
      {/* Top contact bar */}
      <div className="header-red text-white py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">+212 5 37 57 20 00</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Zones Industrielles du Maroc</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white text-red-600 hover:bg-gray-100">
              Zones B2B
            </Badge>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-red-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">ZonesPro</h1>
                  <p className="text-xs text-gray-600">Zones Industrielles B2B</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                {navItems.map((item, index) => (
                  <NavigationMenuItem key={index}>
                    <NavigationMenuTrigger className="text-gray-700 hover:text-red-600">
                      {item.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-2 p-4 w-[400px]">
                        {item.items.map((subItem, subIndex) => (
                          <NavigationMenuLink
                            key={subIndex}
                            href={subItem.href}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{subItem.title}</div>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Authentication section */}
            <div className="hidden md:flex items-center gap-4">
              {showAdminLink && (
                <Link href="/admin" className="text-sm text-gray-700 hover:text-red-600">
                  Dashboard admin
                </Link>
              )}
              <AuthButton />
            </div>

            {/* Mobile menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="space-y-4 py-4">
                  {/* Mobile Auth */}
                  <div className="pb-4 border-b space-y-2">
                    {showAdminLink && (
                      <a
                        href="/admin"
                        className="block text-sm text-gray-600 hover:text-red-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard admin
                      </a>
                    )}
                    <AuthButton />
                  </div>

                  {navItems.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <div className="pl-4 space-y-1">
                        {item.items.map((subItem, subIndex) => (
                          <a
                            key={subIndex}
                            href={subItem.href}
                            className="block text-sm text-gray-600 hover:text-red-600 py-1"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {subItem.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
