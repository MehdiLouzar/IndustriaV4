'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { login } from '@/lib/auth-actions';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userInfo: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      
      if (result.success) {
        router.push('/admin');
      } else {
        setError(result.error || 'Une erreur est survenue lors de la connexion');
      }
    } catch (error) {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@industria.ma', role: 'Administrateur', password: 'password123' },
    { email: 'manager@industria.ma', role: 'Manager', password: 'password123' },
    { email: 'demo@entreprise.ma', role: 'Utilisateur', password: 'password123' },
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-industria-gray-light to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-8 h-8 text-industria-brown-gold" />
            <h1 className="text-2xl font-bold text-gray-900">Industria</h1>
          </div>
          <p className="text-gray-600">Plateforme B2B Zones Industrielles</p>
        </div>

        {/* Formulaire de connexion */}
        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Connectez-vous à votre compte professionnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-industria-gray-light border border-industria-brown-gold rounded-lg text-industria-brown-gold">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@entreprise.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full header-red text-white hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/auth/register"
                className="text-sm text-industria-brown-gold hover:underline"
              >
                Pas encore de compte ? S'inscrire
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Comptes de démo */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Comptes de démonstration</CardTitle>
            <CardDescription className="text-xs">
              Cliquez pour remplir automatiquement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoAccounts.map((account, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => fillDemoAccount(account.email, account.password)}
              >
                <span>{account.role}</span>
                <span className="text-gray-500">{account.email}</span>
              </Button>
            ))}
            <p className="text-xs text-gray-500 mt-2">
              Mot de passe pour tous les comptes : password123
            </p>
          </CardContent>
        </Card>

        {/* Retour à l'accueil */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-industria-brown-gold"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}