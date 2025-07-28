import { applyCors, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';

export async function GET() {
  const items = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, isActive: true } });
  return applyCors(Response.json(items));
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const item = await prisma.user.create({ data });
    return applyCors(Response.json({ id: item.id, email: item.email, name: item.name, role: item.role, isActive: item.isActive }, { status: 201 }));
  } catch {
    return applyCors(new Response('Invalid data', { status: 400 }));
  }
}

export function OPTIONS() {
  return corsOptions();
}
