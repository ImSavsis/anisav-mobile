import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'anisav:progress'

interface ProgressEntry {
  time: number
  is_watched: boolean
}

async function readAll(): Promise<Record<string, ProgressEntry>> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

async function writeAll(data: Record<string, ProgressEntry>): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data))
}

export async function getLocalProgress(episodeId: string): Promise<ProgressEntry | undefined> {
  return (await readAll())[episodeId]
}

export async function getAllLocalProgress(): Promise<Record<string, ProgressEntry>> {
  return readAll()
}

export async function saveLocalProgress(
  episodeId: string,
  time: number,
  isWatched: boolean
): Promise<void> {
  const all = await readAll()
  all[episodeId] = { time, is_watched: isWatched }
  await writeAll(all)
}
