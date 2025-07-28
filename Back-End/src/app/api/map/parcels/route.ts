import { applyCors, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { lambertToWGS84, polygonCentroid } from "@/lib/coords";

export async function GET() {
  const parcels = await prisma.parcel.findMany({
    select: {
      id: true,
      reference: true,
      lambertX: true,
      lambertY: true,
      latitude: true,
      longitude: true,
      zoneId: true,
      isShowroom: true,
      status: true,
      vertices: { select: { seq: true, lambertX: true, lambertY: true } },
    },
  });

  const features = parcels
    .map((p) => {
      let lat: number | null = null;
      let lon: number | null = null;
      if (p.vertices.length) {
        const verts = p.vertices.sort((a, b) => a.seq - b.seq);
        const c = polygonCentroid(verts);
        if (c) {
          ;[lon, lat] = lambertToWGS84(c[0], c[1]);
        }
      }
      if (lat == null && p.latitude != null && p.longitude != null) {
        lat = p.latitude;
        lon = p.longitude;
      }
      if (lat == null && p.lambertX != null && p.lambertY != null) {
        ;[lon, lat] = lambertToWGS84(p.lambertX, p.lambertY);
      }
      if (lat == null || lon == null) return null;
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon, lat] },
        properties: {
          id: p.id,
          reference: p.reference,
          zoneId: p.zoneId,
          isShowroom: p.isShowroom,
          status: p.status,
        },
      };
    })
    .filter(Boolean);

  return applyCors(Response.json({ type: "FeatureCollection", features }));
}

export function OPTIONS() {
  return corsOptions();
}
