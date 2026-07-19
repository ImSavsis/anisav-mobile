import { api } from './api'
import { getAllLocalProgress } from './localProgress'
import { getToken } from './auth'
import type { Episode, Release } from './types'

export interface ContinueWatchingItem {
  release: Release
  episode: Episode
  time: number
}

export async function getContinueWatching(limit = 12): Promise<ContinueWatchingItem[]> {
  const merged = new Map<string, { time: number; is_watched: boolean }>()

  for (const [id, p] of Object.entries(await getAllLocalProgress())) merged.set(id, p)

  const token = await getToken()
  if (token) {
    try {
      const remote = await api.timecodes()
      for (const t of remote) merged.set(t.release_episode_id, { time: t.time, is_watched: t.is_watched })
    } catch {}
  }

  const candidates = [...merged.entries()]
    .filter(([, p]) => !p.is_watched && p.time > 10)
    .slice(0, limit)

  const resolved = await Promise.all(
    candidates.map(async ([id, p]) => {
      try {
        const { release, ...episode } = await api.episode(id)
        return { release, episode, time: p.time }
      } catch {
        return null
      }
    })
  )

  return resolved.filter((x): x is ContinueWatchingItem => x !== null)
}
