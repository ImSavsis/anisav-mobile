import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, imageUrl } from '../../src/lib/api'
import type { Genre } from '../../src/lib/types'
import { colors, radius, spacing } from '../../src/lib/theme'
import Loader from '../../src/components/Loader'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface GenreTileProps {
  genre: Genre
  onPress: () => void
}

function GenreTile({ genre, onPress }: GenreTileProps) {
  const scale = useRef(new Animated.Value(1)).current
  const image = imageUrl(genre.image?.optimized?.preview || genre.image?.preview)

  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()
  }

  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.tileWrap}>
      <Animated.View style={[styles.tile, { transform: [{ scale }] }]}>
        {image && <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />}
        <View style={styles.overlay} />
        <View style={styles.overlayBottom} />
        <View style={styles.content}>
          <Text numberOfLines={2} style={styles.name}>
            {genre.name}
          </Text>
          {genre.total_releases != null && (
            <Text style={styles.count}>{genre.total_releases} тайтлов</Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  )
}

export default function GenresScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [genres, setGenres] = useState<Genre[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.genres()
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setGenres(data)
    } catch {
      setGenres([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!genres) return <Loader label="Загружаем жанры..." />

  return (
    <FlatList
      style={styles.screen}
      data={genres}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[
        styles.list,
        { paddingTop: insets.top + spacing(4), paddingBottom: insets.bottom + spacing(8) },
      ]}
      refreshControl={
        <RefreshControl tintColor={colors.accent} refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={<Text style={styles.title}>Жанры</Text>}
      renderItem={({ item }) => (
        <GenreTile
          genre={item}
          onPress={() =>
            router.push({ pathname: '/(tabs)/catalog', params: { genre: String(item.id) } })
          }
        />
      )}
    />
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing(4),
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing(4),
  },
  row: {
    justifyContent: 'space-between',
  },
  tileWrap: {
    width: '48%',
    marginBottom: spacing(3),
  },
  tile: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.55,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing(3),
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  count: {
    color: colors.textFaint,
    fontSize: 11,
    marginTop: spacing(0.5),
  },
})
