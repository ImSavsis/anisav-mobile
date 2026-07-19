import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Release } from './types'

const KEY = 'anisav:wishlist'

type Listener = () => void
const listeners = new Set<Listener>()

async function read(): Promise<Release[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

async function write(items: Release[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items))
  listeners.forEach((l) => l())
}

export function getWishlist(): Promise<Release[]> {
  return read()
}

export async function isInWishlist(releaseId: number): Promise<boolean> {
  return (await read()).some((r) => r.id === releaseId)
}

export async function addToWishlist(release: Release): Promise<void> {
  const items = await read()
  if (items.some((r) => r.id === release.id)) return
  await write([release, ...items])
}

export async function removeFromWishlist(releaseId: number): Promise<void> {
  await write((await read()).filter((r) => r.id !== releaseId))
}

export async function toggleWishlist(release: Release): Promise<boolean> {
  const inList = await isInWishlist(release.id)
  if (inList) await removeFromWishlist(release.id)
  else await addToWishlist(release)
  return !inList
}

export function onWishlistChange(cb: Listener): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
