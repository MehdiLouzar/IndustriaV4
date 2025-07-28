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
    const res = await fetch(url.toString(), init)
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.error(err)
    return null
  }
}
