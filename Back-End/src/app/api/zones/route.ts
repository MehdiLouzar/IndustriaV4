import { applyCors, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { ZoneStatus } from "@prisma/client";
import { addLatLonToZone } from "@/lib/coords";
import crypto from "crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const where: any = {};
  if (url.searchParams.get("regionId")) {
    where.regionId = url.searchParams.get("regionId");
  }
  if (url.searchParams.get("zoneTypeId")) {
    where.zoneTypeId = url.searchParams.get("zoneTypeId");
  }
  if (url.searchParams.get("status")) {
    where.status = url.searchParams.get("status") as ZoneStatus;
  }
  if (url.searchParams.get("minArea")) {
    where.totalArea = { gte: parseFloat(url.searchParams.get("minArea") as string) };
  }
  if (url.searchParams.get("maxArea")) {
    where.totalArea = { ...(where.totalArea || {}), lte: parseFloat(url.searchParams.get("maxArea") as string) };
  }
  if (url.searchParams.get("minPrice")) {
    where.price = { gte: parseFloat(url.searchParams.get("minPrice") as string) };
  }
  if (url.searchParams.get("maxPrice")) {
    where.price = { ...(where.price || {}), lte: parseFloat(url.searchParams.get("maxPrice") as string) };
  }

  const zones = await prisma.zone.findMany({
    where,
    include: {
      parcels: { include: { vertices: true } },
      region: true,
      zoneType: true,
      activities: { include: { activity: true } },
      amenities: { include: { amenity: true } },
      vertices: true,
    },
  });
  const mapped = zones.map(z => addLatLonToZone(z));
  return applyCors(Response.json(mapped));
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { vertices, activityIds, amenityIds, ...zoneData } = data;

    const zone = await prisma.zone.create({
      data: {
        ...zoneData,
        vertices: Array.isArray(vertices)
          ? { createMany: { data: vertices } }
          : undefined,
      },
    });

    if (Array.isArray(activityIds)) {
      await prisma.zoneActivity.createMany({
        data: activityIds.map((id: string) => ({
          id: crypto.randomUUID(),
          zoneId: zone.id,
          activityId: id,
        })),
      });
    }

    if (Array.isArray(amenityIds)) {
      await prisma.zoneAmenity.createMany({
        data: amenityIds.map((id: string) => ({
          id: crypto.randomUUID(),
          zoneId: zone.id,
          amenityId: id,
        })),
      });
    }

    const full = await prisma.zone.findUnique({
      where: { id: zone.id },
      include: {
        parcels: { include: { vertices: true } },
        region: true,
        zoneType: true,
        activities: { include: { activity: true } },
        amenities: { include: { amenity: true } },
        vertices: true,
      },
    });
    return applyCors(Response.json(addLatLonToZone(full!), { status: 201 }));
  } catch (error) {
    return applyCors(new Response('Invalid data', { status: 400 }));
  }
}

export function OPTIONS() {
  return corsOptions();
}
