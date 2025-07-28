import { applyCors, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { addLatLonToZone } from "@/lib/coords";
import crypto from "crypto";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const zone = await prisma.zone.findUnique({
    where: { id },
    include: {
      parcels: { include: { vertices: true } },
      region: true,
      zoneType: true,
      activities: { include: { activity: true } },
      amenities: { include: { amenity: true } },
      vertices: true,
    },
  });

  if (!zone) {
    return applyCors(new Response("Not Found", { status: 404 }));
  }

  return applyCors(Response.json(addLatLonToZone(zone)));
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await req.json();
    const { vertices, activityIds, amenityIds, ...zoneData } = data;

    await prisma.zone.update({ where: { id }, data: zoneData });

    if (Array.isArray(vertices)) {
      await prisma.zoneVertex.deleteMany({ where: { zoneId: id } });
      await prisma.zoneVertex.createMany({
        data: vertices.map((v: any) => ({ ...v, zoneId: id })),
      });
    }

    if (Array.isArray(activityIds)) {
      await prisma.zoneActivity.deleteMany({ where: { zoneId: id } });
      await prisma.zoneActivity.createMany({
        data: activityIds.map((id: string) => ({
          id: crypto.randomUUID(),
          zoneId: id,
          activityId: id,
        })),
      });
    }

    if (Array.isArray(amenityIds)) {
      await prisma.zoneAmenity.deleteMany({ where: { zoneId: id } });
      await prisma.zoneAmenity.createMany({
        data: amenityIds.map((id: string) => ({
          id: crypto.randomUUID(),
          zoneId: id,
          amenityId: id,
        })),
      });
    }

    const zone = await prisma.zone.findUnique({
      where: { id },
      include: {
        vertices: true,
        parcels: { include: { vertices: true } },
        activities: { include: { activity: true } },
        amenities: { include: { amenity: true } },
        region: true,
        zoneType: true,
      },
    });
    return applyCors(Response.json(addLatLonToZone(zone!)));
  } catch (error) {
    return applyCors(new Response('Invalid data', { status: 400 }));
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.zone.delete({ where: { id } });
    return applyCors(new Response(null, { status: 204 }));
  } catch (error) {
    return applyCors(new Response('Not Found', { status: 404 }));
  }
}

export function OPTIONS() {
  return corsOptions();
}
