'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export default function AuthButton() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/login">
        <Button variant="outline" size="sm">
          <User className="w-4 h-4 mr-2" />
          Connexion
        </Button>
      </Link>
      <Link href="/auth/register">
        <Button className="header-red text-white hover:opacity-90" size="sm">
          S'inscrire
        </Button>
      </Link>
    </div>
  );
}
