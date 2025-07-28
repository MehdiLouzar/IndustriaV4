import { applyCors, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.amenity.findMany();
  return applyCors(Response.json(items));
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const item = await prisma.amenity.create({ data });
    return applyCors(Response.json(item, { status: 201 }));
  } catch {
    return applyCors(new Response('Invalid data', { status: 400 }));
  }
}

export function OPTIONS() {
  return corsOptions();
}
