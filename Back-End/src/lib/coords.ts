import proj4 from 'proj4'

// Parameters matching EPSG:26191 (Lambert Nord Maroc)
const lambertMA =
  '+proj=lcc +lat_1=33.3 +lat_0=33.3 +lon_0=-5.4 +k_0=0.999625769 +x_0=500000 +y_0=300000 +ellps=clrk80ign +towgs84=31,146,47,0,0,0,0 +units=m +no_defs'

export function lambertToWGS84(x: number, y: number): [number, number] {
  const [lon, lat] = proj4(lambertMA, proj4.WGS84, [x, y])
  return [lon, lat]
}

export function polygonCentroid(vertices: { lambertX: number, lambertY: number }[]): [number, number] | null {
  if (!vertices.length) return null
  const pts = vertices.map(v => [v.lambertX, v.lambertY])
  if (pts.length < 3) {
    const sum = pts.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0,0])
    return [sum[0] / pts.length, sum[1] / pts.length]
  }
  let area = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    const f = x1 * y2 - x2 * y1
    area += f
    cx += (x1 + x2) * f
    cy += (y1 + y2) * f
  }
  area *= 0.5
  if (area === 0) {
    const sum = pts.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0,0])
    return [sum[0] / pts.length, sum[1] / pts.length]
  }
  cx /= (6 * area)
  cy /= (6 * area)
  return [cx, cy]
}

export function addLatLonToParcel<T extends { lambertX: number | null | undefined, lambertY: number | null | undefined, vertices?: any[] }>(parcel: T): T & { latitude?: number, longitude?: number } {
  let point: [number, number] | null = null
  if (parcel.vertices && parcel.vertices.length) {
    const verts = [...parcel.vertices].sort((a, b) => a.seq - b.seq)
    parcel.vertices = verts.map(v => {
      const [lon, lat] = lambertToWGS84(v.lambertX, v.lambertY)
      return { ...v, lon, lat }
    })
    const c = polygonCentroid(verts)
    if (c) point = c
  }
  if (!point && parcel.lambertX != null && parcel.lambertY != null) {
    point = [parcel.lambertX, parcel.lambertY]
  }
  if (point) {
    const [lon, lat] = lambertToWGS84(point[0], point[1])
    ;(parcel as any).latitude = lat
    ;(parcel as any).longitude = lon
  }
  return parcel as any
}

export function addLatLonToZone<T extends { lambertX: number | null | undefined, lambertY: number | null | undefined, vertices?: any[], parcels?: any[] }>(zone: T): T & { latitude?: number, longitude?: number } {
  if (zone.vertices && zone.vertices.length) {
    const verts = [...zone.vertices].sort((a, b) => a.seq - b.seq)
    zone.vertices = verts.map(v => {
      const [lon, lat] = lambertToWGS84(v.lambertX, v.lambertY)
      return { ...v, lon, lat }
    })
    const c = polygonCentroid(verts)
    if (c) {
      const [lon, lat] = lambertToWGS84(c[0], c[1])
      ;(zone as any).latitude = lat
      ;(zone as any).longitude = lon
    }
  }
  if ((zone as any).latitude == null && zone.lambertX != null && zone.lambertY != null) {
    const [lon, lat] = lambertToWGS84(zone.lambertX, zone.lambertY)
    ;(zone as any).latitude = lat
    ;(zone as any).longitude = lon
  }
  if (zone.parcels) {
    zone.parcels = zone.parcels.map(p => addLatLonToParcel(p))
  }
  return zone as any
}

