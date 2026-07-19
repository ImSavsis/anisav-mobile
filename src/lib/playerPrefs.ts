import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'anisav:playerPrefs'

export interface PlayerPrefs {
  autoSkipOpening: boolean
  autoSkipEnding: boolean
  autoPlayNext: boolean
}

const DEFAULTS: PlayerPrefs = {
  autoSkipOpening: false,
  autoSkipEnding: false,
  autoPlayNext: true,
}

export async function loadPlayerPrefs(): Promise<PlayerPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export async function savePlayerPrefs(prefs: PlayerPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs))
}
