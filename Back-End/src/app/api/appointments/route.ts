import { applyCors, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.appointment.findMany();
  return applyCors(Response.json(items));
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (data.parcelId) {
      const parcel = await prisma.parcel.findUnique({ where: { id: data.parcelId } });
      if (!parcel || parcel.status !== 'AVAILABLE' || !parcel.isFree) {
        return applyCors(new Response('Parcel not available', { status: 400 }));
      }
    }
    const item = await prisma.appointment.create({ data });
    return applyCors(Response.json(item, { status: 201 }));
  } catch {
    return applyCors(new Response('Invalid data', { status: 400 }));
  }
}

export function OPTIONS() {
  return corsOptions();
}
