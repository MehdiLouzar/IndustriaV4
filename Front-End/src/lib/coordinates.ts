// Utilitaires pour la conversion des coordonnées Lambert vers WGS84 pour différents pays
// Support multi-pays avec configuration automatique

export interface LambertCoordinate {
  x: number  // lambertX
  y: number  // lambertY
}

export interface WGS84Coordinate {
  longitude: number
  latitude: number
}

export interface CoordinateWithBoth extends LambertCoordinate, WGS84Coordinate {}

// Interface pour les paramètres de projection récupérés depuis la DB
export interface ProjectionParams {
  srid: number
  centralMeridian: number
  centralParallel: number
  falseEasting: number
  falseNorthing: number
  scaleFactor: number
  minLongitude: number
  maxLongitude: number
  minLatitude: number
  maxLatitude: number
  minX: number
  maxX: number
  minY: number
  maxY: number
}

// Cache des paramètres par SRID
const paramsCache: Map<number, ProjectionParams> = new Map()

// Paramètres actuels (chargés dynamiquement)
let currentParams: ProjectionParams | null = null

/**
 * Récupère les paramètres de projection depuis la base de données pour un SRID donné
 */
export async function fetchProjectionParams(srid: number): Promise<ProjectionParams | null> {
  try {
    // Vérifier le cache
    if (paramsCache.has(srid)) {
      return paramsCache.get(srid)!
    }
    
    const response = await fetch(`/api/spatial-reference-systems/${srid}`)
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }
    
    const data = await response.json()
    const params: ProjectionParams = {
      srid: data.srid,
      centralMeridian: data.centralMeridian || 0,
      centralParallel: data.centralParallel || 0,
      falseEasting: data.falseEasting || 0,
      falseNorthing: data.falseNorthing || 0,
      scaleFactor: data.scaleFactor || 1.0,
      minLongitude: data.minLongitude || -180,
      maxLongitude: data.maxLongitude || 180,
      minLatitude: data.minLatitude || -90,
      maxLatitude: data.maxLatitude || 90,
      minX: data.minX || 0,
      maxX: data.maxX || 1000000,
      minY: data.minY || 0,
      maxY: data.maxY || 1000000
    }
    
    // Mettre en cache
    paramsCache.set(srid, params)
    console.log(`Paramètres de projection chargés pour SRID ${srid}`)
    return params
    
  } catch (error) {
    console.error(`Erreur lors du chargement des paramètres pour SRID ${srid}:`, error)
    return null
  }
}

/**
 * Configure les paramètres de projection pour un pays spécifique par son code
 */
export async function setCountryByCode(countryCode: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/countries/${countryCode}/default-srid`)
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }
    
    const data = await response.json()
    const srid = data.defaultSrid
    
    if (srid) {
      const params = await fetchProjectionParams(srid)
      if (params) {
        currentParams = params
        console.log(`Paramètres configurés pour le pays ${countryCode} (SRID: ${srid})`)
        return true
      }
    }
    
    console.warn(`Impossible de configurer les paramètres pour le pays: ${countryCode}`)
    return false
    
  } catch (error) {
    console.error(`Erreur lors de la configuration du pays ${countryCode}:`, error)
    return false
  }
}

/**
 * Configure des paramètres spécifiques par SRID
 */
export async function setParametersBySRID(srid: number): Promise<boolean> {
  const params = await fetchProjectionParams(srid)
  if (params) {
    currentParams = params
    return true
  }
  return false
}

/**
 * Retourne les paramètres actuels
 */
export function getCurrentParameters(): ProjectionParams | null {
  return currentParams
}

/**
 * Convertit les coordonnées Lambert vers WGS84 selon le pays configuré
 * ATTENTION: Cette conversion est approximative
 */
export function lambertToWGS84(lambert: LambertCoordinate): WGS84Coordinate {
  // Conversion approximative - À remplacer par une vraie transformation de projection
  // Pour une conversion précise, utiliser une bibliothèque comme proj4js
  
  const { x, y } = lambert
  
  // Transformation approximative avec les paramètres actuels
  const longitude = currentParams.centralMeridian + (x - currentParams.falseEasting) / 111320
  const latitude = currentParams.centralParallel + (y - currentParams.falseNorthing) / 110540
  
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
 * Teste la conversion avec les paramètres actuels
 */
export async function testConversion(lambertX: number, lambertY: number): Promise<{
  success: boolean
  input: {lambertX: number, lambertY: number}
  output?: {longitude: number, latitude: number}
  validation?: {validLambert: boolean, validWGS84: boolean}
  error?: string
}> {
  try {
    const response = await fetch('/api/map/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({lambertX, lambertY})
    })
    
    return await response.json()
  } catch (error) {
    return {
      success: false,
      input: {lambertX, lambertY},
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Valide si des coordonnées Lambert sont dans les limites du pays configuré
 */
export function validateLambertCoordinates(coord: LambertCoordinate): boolean {
  return coord.x >= currentParams.minX && coord.x <= currentParams.maxX && 
         coord.y >= currentParams.minY && coord.y <= currentParams.maxY
}

/**
 * Valide si des coordonnées WGS84 sont dans les limites du pays configuré
 */
export function validateWGS84Coordinates(coord: WGS84Coordinate): boolean {
  return coord.longitude >= currentParams.minLongitude && coord.longitude <= currentParams.maxLongitude && 
         coord.latitude >= currentParams.minLatitude && coord.latitude <= currentParams.maxLatitude
}

/**
 * Retourne la liste des pays supportés
 */
export function getSupportedCountries(): string[] {
  return Object.keys(COUNTRY_PARAMS)
}

/**
 * Retourne les informations détaillées des pays supportés
 */
export function getCountriesInfo(): Record<string, {name: string, code: string, description: string}> {
  return {
    morocco: {
      name: 'Maroc',
      code: 'MA',
      description: 'Maroc - Lambert Maroc'
    },
    france: {
      name: 'France', 
      code: 'FR',
      description: 'France - Lambert 93'
    },
    algeria: {
      name: 'Algérie',
      code: 'DZ', 
      description: 'Algérie - Lambert Algérie'
    }
  }
}

/**
 * API pour récupérer les pays supportés depuis le backend
 */
export async function fetchSupportedCountries(): Promise<{countries: string[], descriptions: Record<string, string>}> {
  try {
    const response = await fetch('/api/map/config/countries')
    const data = await response.json()
    
    if (data.success) {
      return {
        countries: data.countries,
        descriptions: data.descriptions
      }
    }
    
    // Fallback aux données statiques
    const countriesInfo = getCountriesInfo()
    return {
      countries: Object.keys(countriesInfo),
      descriptions: Object.fromEntries(
        Object.entries(countriesInfo).map(([key, info]) => [key, info.description])
      )
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des pays:', error)
    const countriesInfo = getCountriesInfo()
    return {
      countries: Object.keys(countriesInfo),
      descriptions: Object.fromEntries(
        Object.entries(countriesInfo).map(([key, info]) => [key, info.description])
      )
    }
  }
}

/**
 * API pour configurer les paramètres de pays côté backend
 */
export async function setBackendCountryParameters(country: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/map/config/country/${country}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('Erreur lors de la configuration du pays:', error)
    return false
  }
}