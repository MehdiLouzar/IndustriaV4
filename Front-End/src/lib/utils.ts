import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl() {
  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
}

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const url = new URL(path, getBaseUrl())
    const headers = new Headers(init?.headers)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) headers.set('Authorization', `Bearer ${token}`)
    }
    const res = await fetch(url.toString(), { ...init, headers })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.error(err)
    return null
  }
}
