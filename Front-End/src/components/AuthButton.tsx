'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Settings, UserCog } from 'lucide-react';
import Link from 'next/link';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
    );
  }

  if (!session) {
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-100 text-red-800 text-xs">Admin</Badge>;
      case 'MANAGER':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Manager</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Utilisateur</Badge>;
    }
  };

  const canAccessAdmin = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex flex-col items-end">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{session.user.name}</span>
          {getRoleBadge(session.user.role)}
        </div>
        {session.user.company && (
          <span className="text-xs text-gray-600">{session.user.company}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {canAccessAdmin && (
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <UserCog className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Admin</span>
            </Button>
          </Link>
        )}

        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">Profil</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">Déconnexion</span>
        </Button>
      </div>
    </div>
  );
}
