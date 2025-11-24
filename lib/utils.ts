import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function roleFromToken(token?: string | null): string | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    
    const json = JSON.parse(typeof window !== 'undefined' ? atob(payload) : Buffer.from(payload, 'base64').toString('utf8'))
    const candidate = json.role || json.roles || json.papel || json.user?.role || json['role']
    if (!candidate) return null
    return String(candidate).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  } catch (e) {
    return null
  }
}
