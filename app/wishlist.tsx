import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Release } from '../src/lib/types'
import { getWishlist, onWishlistChange } from '../src/lib/wishlist'
import { colors, spacing } from '../src/lib/theme'
import AnimeCard from '../src/components/AnimeCard'
import Loader from '../src/components/Loader'

export default function WishlistScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [items, setItems] = useState<Release[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    getWishlist().then(setItems)
  }, [])

  useEffect(() => {
    load()
    return onWishlistChange(load)
  }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const numColumns = Math.max(3, Math.floor((width - spacing(4) * 2) / 120))

  const paddedItems = useMemo(() => {
    if (!items) return []
    const remainder = items.length % numColumns
    if (remainder === 0) return items
    return [...items, ...Array(numColumns - remainder).fill(null)]
  }, [items, numColumns])

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing(2) }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Понравилось</Text>
          <Text style={styles.headerSubtitle}>Локальный список на этом устройстве</Text>
        </View>
      </View>

      {!items && <Loader />}

      {items && items.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Пока пусто — нажми на звёздочку у тайтла, чтобы добавить сюда
          </Text>
        </View>
      )}

      {items && items.length > 0 && (
        <FlatList
          key={`grid-${numColumns}`}
          data={paddedItems}
          numColumns={numColumns}
          keyExtractor={(item, index) => (item ? String(item.id) : `empty-${index}`)}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + spacing(6) }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
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
  headerSubtitle: {
    color: colors.textFaint,
    fontSize: 11,
    marginTop: spacing(0.5),
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(8),
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
