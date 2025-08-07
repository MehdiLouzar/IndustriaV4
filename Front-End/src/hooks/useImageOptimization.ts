import { useState, useCallback, useMemo } from 'react'

export interface OptimizedImage {
  file: File
  url: string
  thumbnail?: string
  compressed?: Blob
}

interface UseImageOptimizationOptions {
  maxSize?: number // Taille max en bytes (défaut: 2MB)
  maxWidth?: number // Largeur max en pixels (défaut: 1920)
  maxHeight?: number // Hauteur max en pixels (défaut: 1080)
  quality?: number // Qualité JPEG (0-1, défaut: 0.8)
  thumbnailSize?: number // Taille des miniatures (défaut: 150px)
}

export function useImageOptimization(options: UseImageOptimizationOptions = {}) {
  const {
    maxSize = 2 * 1024 * 1024, // 2MB
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    thumbnailSize = 150
  } = options

  const [images, setImages] = useState<OptimizedImage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Fonction pour compresser une image
  const compressImage = useCallback(async (file: File): Promise<{ compressed: Blob; thumbnail: string }> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }
        
        // Créer l'image compressée
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        // Créer la miniature
        const thumbCanvas = document.createElement('canvas')
        const thumbCtx = thumbCanvas.getContext('2d')!
        const thumbRatio = Math.min(thumbnailSize / width, thumbnailSize / height)
        
        thumbCanvas.width = width * thumbRatio
        thumbCanvas.height = height * thumbRatio
        thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height)
        
        canvas.toBlob(
          (compressed) => {
            resolve({
              compressed: compressed!,
              thumbnail: thumbCanvas.toDataURL('image/jpeg', 0.7)
            })
          },
          'image/jpeg',
          quality
        )
      }
      
      img.src = URL.createObjectURL(file)
    })
  }, [maxWidth, maxHeight, quality, thumbnailSize])

  const addImages = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    
    const processedImages: OptimizedImage[] = []
    
    for (const file of files) {
      if (file.size <= maxSize && file.type.startsWith('image/')) {
        try {
          const { compressed, thumbnail } = await compressImage(file)
          
          processedImages.push({
            file,
            url: URL.createObjectURL(file),
            thumbnail,
            compressed
          })
        } catch (error) {
          console.error('Erreur lors de la compression:', error)
          // Ajouter l'image originale en cas d'erreur
          processedImages.push({
            file,
            url: URL.createObjectURL(file)
          })
        }
      }
    }
    
    setImages(prev => [...prev, ...processedImages])
    setIsProcessing(false)
  }, [maxSize, compressImage])

  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      const removed = newImages.splice(index, 1)[0]
      
      // Nettoyer les URLs d'objet
      if (removed) {
        URL.revokeObjectURL(removed.url)
        if (removed.thumbnail) {
          URL.revokeObjectURL(removed.thumbnail)
        }
      }
      
      return newImages
    })
  }, [])

  const clearImages = useCallback(() => {
    images.forEach(img => {
      URL.revokeObjectURL(img.url)
      if (img.thumbnail) {
        URL.revokeObjectURL(img.thumbnail)
      }
    })
    setImages([])
  }, [images])

  // Stats utiles
  const stats = useMemo(() => {
    const totalOriginalSize = images.reduce((acc, img) => acc + img.file.size, 0)
    const totalCompressedSize = images.reduce((acc, img) => acc + (img.compressed?.size || img.file.size), 0)
    const compressionRatio = totalOriginalSize > 0 ? (1 - totalCompressedSize / totalOriginalSize) * 100 : 0
    
    return {
      count: images.length,
      originalSize: totalOriginalSize,
      compressedSize: totalCompressedSize,
      compressionRatio: Math.round(compressionRatio),
      isProcessing
    }
  }, [images, isProcessing])

  return {
    images,
    addImages,
    removeImage,
    clearImages,
    stats,
    isProcessing
  }
}