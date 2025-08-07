"use client"

import { useState, useEffect, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  threshold?: number
}

export const useInfiniteScroll = (
  fetchNextPage: () => void,
  options: UseInfiniteScrollOptions
) => {
  const { hasNextPage, isFetchingNextPage, threshold = 0.8 } = options
  const [isFetching, setIsFetching] = useState(false)

  const handleScroll = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) return

    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = document.documentElement.scrollTop
    const clientHeight = document.documentElement.clientHeight
    
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

    if (scrollPercentage >= threshold && !isFetching) {
      setIsFetching(true)
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, threshold, isFetching])

  useEffect(() => {
    if (!isFetchingNextPage) {
      setIsFetching(false)
    }
  }, [isFetchingNextPage])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return { isFetching }
}