import { applyCors, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await prisma.amenity.findUnique({ where: { id } });
  if (!item) return applyCors(new Response('Not Found', { status: 404 }));
  return applyCors(Response.json(item));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json();
    const item = await prisma.amenity.update({ where: { id }, data });
    return applyCors(Response.json(item));
  } catch {
    return applyCors(new Response('Invalid data', { status: 400 }));
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.amenity.delete({ where: { id } });
    return applyCors(new Response(null, { status: 204 }));
  } catch {
    return applyCors(new Response('Not Found', { status: 404 }));
  }
}

export function OPTIONS() {
  return corsOptions();
}
