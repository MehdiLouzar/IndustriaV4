import { applyCors, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { lambertToWGS84, polygonCentroid } from "@/lib/coords";

export async function GET() {
  const zones = await prisma.zone.findMany({
    select: {
      id: true,
      name: true,
      lambertX: true,
      lambertY: true,
      latitude: true,
      longitude: true,
      status: true,
      parcels: { select: { status: true, isFree: true } },
      activities: { select: { activity: { select: { icon: true } } } },
      amenities: { select: { amenity: { select: { icon: true } } } },
      vertices: { select: { seq: true, lambertX: true, lambertY: true } },
    },
  });

  const features = zones.map(z => {
    let lat: number | null = null
    let lon: number | null = null
    if (z.vertices.length) {
      const verts = z.vertices.sort((a, b) => a.seq - b.seq)
      const c = polygonCentroid(verts)
      if (c) {
        ;[lon, lat] = lambertToWGS84(c[0], c[1])
      }
    }
    if (lat == null && z.latitude != null && z.longitude != null) {
      lat = z.latitude
      lon = z.longitude
    }
    if (lat == null && z.lambertX != null && z.lambertY != null) {
      ;[lon, lat] = lambertToWGS84(z.lambertX, z.lambertY)
    }
    if (lat == null || lon == null) return null
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lon, lat] },
      properties: {
        id: z.id,
        name: z.name,
        status: z.status,
        availableParcels: z.parcels.filter(p => p.status === 'AVAILABLE' && p.isFree).length,
        activityIcons: z.activities.map(a => a.activity.icon).filter(Boolean),
        amenityIcons: z.amenities.map(a => a.amenity.icon).filter(Boolean),
      }
    };
  }).filter(Boolean);

  return applyCors(Response.json({ type: "FeatureCollection", features }));
}

export function OPTIONS() {
  return corsOptions();
}
