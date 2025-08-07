export {};

import proj4 from 'proj4';

// Lambert Conformal Conic projection used for Morocco
const lambertMA =
  '+proj=lcc +lat_1=33.3 +lat_0=33.3 +lon_0=-5.4 +k_0=0.999625769 +x_0=500000 +y_0=300000 +ellps=clrk80ign +towgs84=31,146,47,0,0,0,0 +units=m +no_defs';

type RawZone = {
  id: string;
  name: string;
  status: string;
  availableParcels: number;
  activityIcons: string[];
  amenityIcons: string[];
  description?: string;
  price?: string;
  area?: string;
  location?: string;
  coordinates: [number, number] | [number, number][];
};

type ZoneFeature = {
  geometry: { type: string; coordinates: [number, number] | [number, number][] };
  properties: {
    id: string;
    name: string;
    status: string;
    availableParcels: number;
    activityIcons: string[];
    amenityIcons: string[];
    description?: string;
    price?: string;
    area?: string;
    location?: string;
  };
};

// Basic Ramer–Douglas–Peucker simplification
function simplify(points: [number, number][], tolerance = 0.0001): [number, number][] {
  if (points.length <= 2) return points;
  const sqTol = tolerance * tolerance;

  const sqSegDist = (p: [number, number], a: [number, number], b: [number, number]) => {
    let x = a[0];
    let y = a[1];
    let dx = b[0] - x;
    let dy = b[1] - y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = b[0];
        y = b[1];
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p[0] - x;
    dy = p[1] - y;
    return dx * dx + dy * dy;
  };

  const rdp = (pts: [number, number][], start: number, end: number, out: [number, number][]) => {
    let maxDist = 0;
    let index = start;

    for (let i = start + 1; i < end; i++) {
      const dist = sqSegDist(pts[i], pts[start], pts[end]);
      if (dist > maxDist) {
        index = i;
        maxDist = dist;
      }
    }
    if (maxDist > sqTol) {
      if (index - start > 1) rdp(pts, start, index, out);
      out.push(pts[index]);
      if (end - index > 1) rdp(pts, index, end, out);
    }
  };

  const last = points.length - 1;
  const out: [number, number][] = [points[0]];
  rdp(points, 0, last, out);
  out.push(points[last]);
  return out;
}

const ctx: DedicatedWorkerGlobalScope = self as any;

ctx.onmessage = (e: MessageEvent<RawZone[]>) => {
  const zones = e.data.map((z) => {
    const coords = z.coordinates;
    let geometry: ZoneFeature['geometry'];
    if (Array.isArray((coords as unknown[])[0])) {
      const projected = (coords as [number, number][]).map(([x, y]) => {
        const [lon, lat] = proj4(lambertMA, proj4.WGS84, [x, y]);
        return [lat, lon] as [number, number];
      });
      geometry = { type: 'Polygon', coordinates: simplify(projected) };
    } else {
      const [x, y] = coords as [number, number];
      const [lon, lat] = proj4(lambertMA, proj4.WGS84, [x, y]);
      geometry = { type: 'Point', coordinates: [lat, lon] };
    }

    return {
      geometry,
      properties: {
        id: z.id,
        name: z.name,
        status: z.status,
        availableParcels: z.availableParcels,
        activityIcons: z.activityIcons || [],
        amenityIcons: z.amenityIcons || [],
        description: z.description,
        price: z.price,
        area: z.area,
        location: z.location,
      },
    } as ZoneFeature;
  });

  ctx.postMessage(zones);
};
