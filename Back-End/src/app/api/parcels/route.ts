import { applyCors, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { addLatLonToParcel } from "@/lib/coords";

export async function GET() {
  const items = await prisma.parcel.findMany({ include: { vertices: true } });
  const mapped = items.map(addLatLonToParcel);
  return applyCors(Response.json(mapped));
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { vertices, ...parcelData } = data;
    const item = await prisma.parcel.create({
      data: {
        ...parcelData,
        vertices: vertices && Array.isArray(vertices)
          ? { createMany: { data: vertices } }
          : undefined,
      },
      include: { vertices: true },
    });
    return applyCors(Response.json(addLatLonToParcel(item), { status: 201 }));
  } catch {
    return applyCors(new Response('Invalid data', { status: 400 }));
  }
}

export function OPTIONS() {
  return corsOptions();
}
