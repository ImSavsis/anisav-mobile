import { useCallback, useEffect, useState } from 'react'
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { HistoryItem } from '../../src/lib/types'
import { api, imageUrl } from '../../src/lib/api'
import { useAuth } from '../../src/lib/AuthContext'
import { colors, radius, spacing } from '../../src/lib/theme'
import Loader from '../../src/components/Loader'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function HistoryScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<HistoryItem[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    return api
      .historyList()
      .then((res) => setItems(res.data.filter((item) => item.release && item.release_episode)))
      .catch(() => setItems([]))
  }, [])

  useEffect(() => {
    if (!user) return
    load()
  }, [user, load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing(2) }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>История просмотра</Text>
      </View>

      {authLoading && <Loader />}

      {!authLoading && !user && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Войдите, чтобы видеть историю просмотра</Text>
          <Pressable style={styles.loginButton} onPress={() => router.push('/login')}>
            <Text style={styles.loginButtonText}>Войти</Text>
          </Pressable>
        </View>
      )}

      {!authLoading && user && !items && <Loader />}

      {!authLoading && user && items && items.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>История пуста</Text>
        </View>
      )}

      {!authLoading && user && items && items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing(6) }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          }
          renderItem={({ item }) => {
            const thumb = imageUrl(
              item.release.poster?.optimized?.thumbnail || item.release.poster?.thumbnail
            )
            return (
              <Pressable
                style={styles.row}
                onPress={() => router.push(`/title/${item.release.alias || item.release.id}`)}
              >
                {thumb && <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />}
                <View style={styles.rowInfo}>
                  <Text numberOfLines={1} style={styles.rowTitle}>
                    {item.release.name.main}
                  </Text>
                  <Text numberOfLines={1} style={styles.rowMeta}>
                    Серия {item.release_episode.ordinal}
                    {item.release_episode.name ? ` — ${item.release_episode.name}` : ''}
                  </Text>
                  <Text style={styles.rowDate}>{formatDate(item.updated_at)}</Text>
                </View>
                {item.is_watched ? (
                  <View style={styles.badgeMuted}>
                    <Text style={styles.badgeMutedText}>Просмотрено</Text>
                  </View>
                ) : (
                  <View style={styles.badgeAccent}>
                    <Text style={styles.badgeAccentText}>В процессе</Text>
                  </View>
                )}
              </Pressable>
            )
          }}
        />
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
  list: {
    padding: spacing(4),
    gap: spacing(2),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    backgroundColor: colors.surfaceCard,
    padding: spacing(2.5),
    borderRadius: radius.md,
  },
  thumb: {
    width: 48,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
    gap: spacing(0.5),
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rowMeta: {
    color: colors.textFaint,
    fontSize: 12,
  },
  rowDate: {
    color: colors.textFaint,
    fontSize: 11,
  },
  badgeMuted: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radius.sm,
  },
  badgeMutedText: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeAccent: {
    backgroundColor: 'rgba(254,54,53,0.2)',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radius.sm,
  },
  badgeAccentText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
})
