import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { CollectionType, Release } from '../../src/lib/types'
import { api } from '../../src/lib/api'
import { useAuth } from '../../src/lib/AuthContext'
import { colors, spacing } from '../../src/lib/theme'
import AnimeCard from '../../src/components/AnimeCard'
import Loader from '../../src/components/Loader'
import Chip from '../../src/components/Chip'

type TabKey = CollectionType | 'FAVORITES'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'WATCHING', label: 'Смотрю' },
  { key: 'PLANNED', label: 'Запланировано' },
  { key: 'WATCHED', label: 'Просмотрено' },
  { key: 'POSTPONED', label: 'Отложено' },
  { key: 'ABANDONED', label: 'Брошено' },
  { key: 'FAVORITES', label: 'Избранное' },
]

export default function MyListsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<TabKey>('WATCHING')
  const [releases, setReleases] = useState<Release[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback((currentTab: TabKey) => {
    const req =
      currentTab === 'FAVORITES' ? api.favoritesList(1, 48) : api.collectionList(currentTab, 1, 48)
    return req.then((res) => setReleases(res.data)).catch(() => setReleases([]))
  }, [])

  useEffect(() => {
    if (!user) return
    setReleases(null)
    load(tab)
  }, [tab, user, load])

  async function onRefresh() {
    setRefreshing(true)
    await load(tab)
    setRefreshing(false)
  }

  const numColumns = Math.max(3, Math.floor((width - spacing(4) * 2) / 120))

  const paddedReleases = useMemo(() => {
    if (!releases) return []
    const remainder = releases.length % numColumns
    if (remainder === 0) return releases
    return [...releases, ...Array(numColumns - remainder).fill(null)]
  }, [releases, numColumns])

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing(2) }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Мои списки</Text>
      </View>

      {authLoading && <Loader />}

      {!authLoading && !user && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Войдите, чтобы видеть свои списки</Text>
          <Pressable style={styles.loginButton} onPress={() => router.push('/login')}>
            <Text style={styles.loginButtonText}>Войти</Text>
          </Pressable>
        </View>
      )}

      {!authLoading && user && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {TABS.map((t) => (
              <Pressable key={t.key} onPress={() => setTab(t.key)}>
                <Chip accent={tab === t.key}>{t.label}</Chip>
              </Pressable>
            ))}
          </ScrollView>

          {!releases && <Loader />}

          {releases && releases.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Список пуст</Text>
            </View>
          )}

          {releases && releases.length > 0 && (
            <FlatList
              key={`grid-${numColumns}`}
              data={paddedReleases}
              numColumns={numColumns}
              keyExtractor={(item, index) => (item ? String(item.id) : `empty-${index}`)}
              columnWrapperStyle={styles.row}
              contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + spacing(6) }]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.accent}
                  colors={[colors.accent]}
                />
              }
              renderItem={({ item }) =>
                item ? (
                  <View style={styles.gridItem}>
                    <AnimeCard release={item} onPress={() => router.push(`/title/${item.alias || item.id}`)} />
                  </View>
                ) : (
                  <View style={styles.gridItem} />
                )
              }
            />
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(3),
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
  },
  tabs: {
    gap: spacing(2),
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(3),
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(8),
    gap: spacing(4),
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(3),
    borderRadius: 999,
  },
  loginButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    padding: spacing(4),
    gap: spacing(3),
  },
  row: {
    gap: spacing(3),
  },
  gridItem: {
    flex: 1,
  },
})
