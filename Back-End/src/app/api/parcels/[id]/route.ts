import { applyCors, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { addLatLonToParcel } from "@/lib/coords";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await prisma.parcel.findUnique({
    where: { id },
    include: { vertices: true },
  });
  if (!item) return applyCors(new Response('Not Found', { status: 404 }));
  return applyCors(Response.json(addLatLonToParcel(item)));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json();
    const { vertices, ...parcelData } = data;
    await prisma.parcel.update({ where: { id }, data: parcelData });
    if (Array.isArray(vertices)) {
      await prisma.parcelVertex.deleteMany({ where: { parcelId: id } });
      await prisma.parcelVertex.createMany({
        data: vertices.map((v: any) => ({ ...v, parcelId: id })),
      });
    }
    const item = await prisma.parcel.findUnique({
      where: { id },
      include: { vertices: true },
    });
    return applyCors(Response.json(addLatLonToParcel(item!)));
  } catch {
    return applyCors(new Response('Invalid data', { status: 400 }));
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.parcel.delete({ where: { id } });
    return applyCors(new Response(null, { status: 204 }));
  } catch {
    return applyCors(new Response('Not Found', { status: 404 }));
  }
}

export function OPTIONS() {
  return corsOptions();
}
