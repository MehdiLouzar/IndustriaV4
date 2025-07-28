import { applyCors, corsOptions } from "@/lib/cors";
// Back-End/src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return applyCors(
        NextResponse.json(
          { message: 'Email et mot de passe requis' },
          { status: 400 }
        )
      );
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.isActive) {
      return applyCors(
        NextResponse.json(
          { message: 'Identifiants invalides' },
          { status: 401 }
        )
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return applyCors(
        NextResponse.json(
          { message: 'Identifiants invalides' },
          { status: 401 }
        )
      );
    }

    // Log connexion
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        description: `Connexion réussie pour ${user.email}`
      }
    });

    return applyCors(
      NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role,
        }
      })
    );

  } catch (error) {
    console.error('Erreur de connexion:', error);
    return applyCors(
      NextResponse.json(
        { message: 'Erreur interne du serveur' },
        { status: 500 }
      )
    );
  }
}
export function OPTIONS() {
  return corsOptions();
}
