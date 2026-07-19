import type {
  CatalogFilters,
  CatalogResponse,
  CollectionType,
  Genre,
  HistoryItem,
  Release,
  ScheduleDay,
  ScheduleNow,
  TimecodeItem,
  UserProfile,
  ValueDescription,
} from './types'
import { getToken } from './auth'

const GATEWAY = 'https://api.savsis.xyz/api/anilibria'
const API_BASE = `${GATEWAY}/api/v1`

export function imageUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${GATEWAY}${path}`
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init)
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `AniLiberty API ${res.status}: ${path}`)
  return data as T
}

async function authReq<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken()
  if (!token) throw new Error('Не авторизован')
  return req<T>(path, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
}

export const api = {
  latest: (limit = 14) => req<Release[]>(`/anime/releases/latest?limit=${limit}`),
  random: (limit = 5) => req<Release[]>(`/anime/releases/random?limit=${limit}`),
  recommended: (limit = 10, releaseId?: number) =>
    req<Release[]>(
      `/anime/releases/recommended?limit=${limit}${releaseId ? `&release_id=${releaseId}` : ''}`
    ),
  scheduleWeek: () => req<ScheduleDay[]>('/anime/schedule/week'),
  scheduleNow: () => req<ScheduleNow>('/anime/schedule/now'),

  genres: () => req<Genre[]>('/anime/genres'),
  genreReleases: (genreId: number, page = 1, limit = 24) =>
    req<CatalogResponse>(`/anime/genres/${genreId}/releases?page=${page}&limit=${limit}`),

  release: (idOrAlias: string | number) => req<Release>(`/anime/releases/${idOrAlias}`),

  search: (query: string) =>
    req<Release[]>(`/app/search/releases?query=${encodeURIComponent(query)}`),

  catalog: (filters: CatalogFilters, page = 1, limit = 24) =>
    req<CatalogResponse>('/anime/catalog/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, limit, f: filters }),
    }),

  refGenres: () => req<Genre[]>('/anime/catalog/references/genres'),
  refTypes: () => req<ValueDescription[]>('/anime/catalog/references/types'),
  refYears: () => req<number[]>('/anime/catalog/references/years'),
  refSorting: () =>
    req<Array<ValueDescription & { label: string }>>('/anime/catalog/references/sorting'),
  refAgeRatings: () =>
    req<Array<ValueDescription & { label: string }>>('/anime/catalog/references/age-ratings'),
  refSeasons: () => req<ValueDescription[]>('/anime/catalog/references/seasons'),

  login: (login: string, password: string) =>
    req<{ token: string; error?: string }>('/accounts/users/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    }),
  logout: () => authReq('/accounts/users/auth/logout', { method: 'POST' }),
  profile: () => authReq<UserProfile>('/accounts/users/me/profile'),

  favoritesList: (page = 1, limit = 48) =>
    authReq<CatalogResponse>(`/accounts/users/me/favorites/releases?page=${page}&limit=${limit}`, {
      method: 'POST',
      body: JSON.stringify({ page, limit }),
    }),
  favoriteAdd: (releaseId: number) =>
    authReq('/accounts/users/me/favorites', {
      method: 'POST',
      body: JSON.stringify([{ release_id: releaseId }]),
    }),
  favoriteRemove: (releaseId: number) =>
    authReq('/accounts/users/me/favorites', {
      method: 'DELETE',
      body: JSON.stringify([{ release_id: releaseId }]),
    }),
  favoriteIds: () => authReq<unknown>('/accounts/users/me/favorites/ids'),

  collectionList: (type: CollectionType, page = 1, limit = 48) =>
    authReq<CatalogResponse>(
      `/accounts/users/me/collections/releases?type_of_collection=${type}&page=${page}&limit=${limit}`
    ),
  collectionAdd: (releaseId: number, type: CollectionType) =>
    authReq('/accounts/users/me/collections', {
      method: 'POST',
      body: JSON.stringify([{ release_id: releaseId, type_of_collection: type }]),
    }),
  collectionRemove: (releaseId: number) =>
    authReq('/accounts/users/me/collections', {
      method: 'DELETE',
      body: JSON.stringify([{ release_id: releaseId }]),
    }),
  collectionIds: () => authReq<unknown>('/accounts/users/me/collections/ids'),

  historyList: () => authReq<{ data: HistoryItem[] }>('/accounts/users/me/views/history'),

  timecodes: () => authReq<TimecodeItem[]>('/accounts/users/me/views/timecodes'),
  timecodeSave: (releaseEpisodeId: string, time: number, isWatched: boolean) =>
    authReq('/accounts/users/me/views/timecodes', {
      method: 'POST',
      body: JSON.stringify([{ release_episode_id: releaseEpisodeId, time, is_watched: isWatched }]),
    }),
}
