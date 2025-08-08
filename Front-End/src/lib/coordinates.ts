// Utilitaires pour la conversion des coordonnées Lambert vers WGS84 (longitude/latitude)

export interface LambertCoordinate {
  x: number  // lambertX
  y: number  // lambertY
}

export interface WGS84Coordinate {
  longitude: number
  latitude: number
}

export interface CoordinateWithBoth extends LambertCoordinate, WGS84Coordinate {}

// Paramètres de projection Lambert II étendu (EPSG:27572) vers WGS84 (EPSG:4326)
// Ces valeurs sont approximatives pour le Maroc - à ajuster selon le système de coordonnées exact utilisé
const LAMBERT_PARAMS = {
  // Centre de projection approximatif pour le Maroc
  centralMeridian: -5.0, // longitude centrale
  centralParallel: 33.3, // latitude centrale
  falseEasting: 500000,
  falseNorthing: 300000,
  scaleFactor: 0.9996
}

/**
 * Convertit les coordonnées Lambert vers WGS84 (longitude/latitude)
 * ATTENTION: Cette conversion est approximative et doit être ajustée selon le système exact utilisé au Maroc
 */
export function lambertToWGS84(lambert: LambertCoordinate): WGS84Coordinate {
  // Conversion approximative - À remplacer par une vraie transformation de projection
  // Pour une conversion précise, utiliser une bibliothèque comme proj4js
  
  const { x, y } = lambert
  
  // Transformation approximative (à ajuster)
  const longitude = LAMBERT_PARAMS.centralMeridian + (x - LAMBERT_PARAMS.falseEasting) / 111320
  const latitude = LAMBERT_PARAMS.centralParallel + (y - LAMBERT_PARAMS.falseNorthing) / 110540
  
  return {
    longitude: Math.round(longitude * 1000000) / 1000000, // 6 décimales
    latitude: Math.round(latitude * 1000000) / 1000000   // 6 décimales
  }
}

/**
 * Convertit un tableau de coordonnées Lambert vers WGS84
 */
export function convertVerticesLambertToWGS84(vertices: LambertCoordinate[]): CoordinateWithBoth[] {
  return vertices.map(vertex => ({
    ...vertex,
    ...lambertToWGS84(vertex)
  }))
}

/**
 * Calcule le centre (centroïde) d'un polygone en coordonnées Lambert
 */
export function calculateCentroid(vertices: LambertCoordinate[]): LambertCoordinate {
  if (vertices.length === 0) {
    return { x: 0, y: 0 }
  }
  
  const sumX = vertices.reduce((sum, vertex) => sum + vertex.x, 0)
  const sumY = vertices.reduce((sum, vertex) => sum + vertex.y, 0)
  
  return {
    x: sumX / vertices.length,
    y: sumY / vertices.length
  }
}

/**
 * Calcule le centre d'un polygone et le convertit en WGS84
 */
export function calculateCentroidWGS84(vertices: LambertCoordinate[]): WGS84Coordinate {
  const centroidLambert = calculateCentroid(vertices)
  return lambertToWGS84(centroidLambert)
}

/**
 * Formate les coordonnées WGS84 pour l'affichage
 */
export function formatWGS84(coord: WGS84Coordinate): string {
  return `${coord.latitude.toFixed(6)}°N, ${Math.abs(coord.longitude).toFixed(6)}°${coord.longitude >= 0 ? 'E' : 'W'}`
}

/**
 * Formate les coordonnées Lambert pour l'affichage
 */
export function formatLambert(coord: LambertCoordinate): string {
  return `X: ${coord.x.toLocaleString()}, Y: ${coord.y.toLocaleString()}`
}

/**
 * Crée un lien Google Maps à partir de coordonnées WGS84
 */
export function createGoogleMapsLink(coord: WGS84Coordinate): string {
  return `https://www.google.com/maps?q=${coord.latitude},${coord.longitude}`
}

/**
 * Valide si des coordonnées Lambert sont dans une plage raisonnable pour le Maroc
 */
export function validateLambertCoordinates(coord: LambertCoordinate): boolean {
  // Plages approximatives pour le Maroc en Lambert
  const MIN_X = 200000
  const MAX_X = 800000
  const MIN_Y = 100000
  const MAX_Y = 600000
  
  return coord.x >= MIN_X && coord.x <= MAX_X && coord.y >= MIN_Y && coord.y <= MAX_Y
}

/**
 * Valide si des coordonnées WGS84 sont dans une plage raisonnable pour le Maroc
 */
export function validateWGS84Coordinates(coord: WGS84Coordinate): boolean {
  // Plages approximatives pour le Maroc
  const MIN_LONGITUDE = -13.0  // Ouest du Maroc
  const MAX_LONGITUDE = -1.0   // Est du Maroc
  const MIN_LATITUDE = 27.0    // Sud du Maroc
  const MAX_LATITUDE = 36.0    // Nord du Maroc
  
  return coord.longitude >= MIN_LONGITUDE && coord.longitude <= MAX_LONGITUDE && 
         coord.latitude >= MIN_LATITUDE && coord.latitude <= MAX_LATITUDE
}