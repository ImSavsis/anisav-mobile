import { useCallback, useEffect, useState } from 'react'
import { FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, imageUrl } from '../../src/lib/api'
import type { Genre } from '../../src/lib/types'
import { colors, font, radius, spacing } from '../../src/lib/theme'
import Loader from '../../src/components/Loader'
import Reveal from '../../src/components/Reveal'
import AnimatedPressable from '../../src/components/AnimatedPressable'

interface GenreTileProps {
  genre: Genre
  index: number
  onPress: () => void
}

function GenreTile({ genre, index, onPress }: GenreTileProps) {
  const image = imageUrl(genre.image?.optimized?.preview || genre.image?.preview)

  return (
    <Reveal index={index} style={styles.tileWrap}>
      <AnimatedPressable onPress={onPress} scaleTo={0.97} style={styles.tile}>
        {image && <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />}
        <View style={styles.overlay} />
        <View style={styles.overlayBottom} />
        <View style={styles.content}>
          <Text numberOfLines={2} style={styles.name}>
            {genre.name}
          </Text>
          {genre.total_releases != null && <Text style={styles.count}>{genre.total_releases} тайтлов</Text>}
        </View>
      </AnimatedPressable>
    </Reveal>
  )
}

export default function GenresScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [genres, setGenres] = useState<Genre[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setGenres(await api.genres())
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
        { paddingTop: insets.top + spacing(4), paddingBottom: insets.bottom + spacing(24) },
      ]}
      refreshControl={
        <RefreshControl tintColor={colors.accent} refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={<Text style={styles.title}>Жанры</Text>}
      renderItem={({ item, index }) => (
        <GenreTile
          genre={item}
          index={index % 12}
          onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { genre: String(item.id) } })}
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
    fontFamily: font.display,
    fontSize: 22,
    letterSpacing: -0.3,
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
    fontFamily: font.heading,
    fontSize: 14,
  },
  count: {
    color: colors.textFaint,
    fontFamily: font.mono,
    fontSize: 10,
    marginTop: spacing(0.5),
  },
})
