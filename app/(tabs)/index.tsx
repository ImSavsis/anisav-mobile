import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, imageUrl } from '../../src/lib/api'
import { getContinueWatching, ContinueWatchingItem } from '../../src/lib/continueWatching'
import type { Release, ScheduleDay } from '../../src/lib/types'
import { colors, radius, spacing } from '../../src/lib/theme'
import Row from '../../src/components/Row'
import Loader from '../../src/components/Loader'
import Footer from '../../src/components/Footer'

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [latest, setLatest] = useState<Release[] | null>(null)
  const [recommended, setRecommended] = useState<Release[]>([])
  const [today, setToday] = useState<ScheduleDay[]>([])
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const heroOpacity = useRef(new Animated.Value(0)).current
  const heroTranslate = useRef(new Animated.Value(16)).current
  const buttonScale = useRef(new Animated.Value(1)).current

  const load = useCallback(async () => {
    const [latestRes, recommendedRes, scheduleRes, continueRes] = await Promise.all([
      api.latest(21).catch(() => [] as Release[]),
      api.recommended(14).catch(() => [] as Release[]),
      api.scheduleNow().catch(() => null),
      getContinueWatching().catch(() => [] as ContinueWatchingItem[]),
    ])
    setLatest(latestRes)
    setRecommended(recommendedRes)
    setToday(scheduleRes?.today?.filter((s) => s.release) ?? [])
    setContinueWatching(continueRes)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!latest) return
    heroOpacity.setValue(0)
    heroTranslate.setValue(16)
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(heroTranslate, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start()
  }, [latest, heroOpacity, heroTranslate])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  function pressButtonIn() {
    Animated.spring(buttonScale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start()
  }

  function pressButtonOut() {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()
  }

  if (!latest) {
    return <Loader label="Загрузка..." />
  }

  const hero = latest[0]

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing(4) }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {hero && (
        <Animated.View
          style={[
            styles.hero,
            { opacity: heroOpacity, transform: [{ translateY: heroTranslate }] },
          ]}
        >
          <Image
            source={{ uri: imageUrl(hero.poster?.optimized?.preview || hero.poster?.preview) }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroOverlayBottom} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Новинка</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {hero.name.main}
            </Text>
            {!!hero.description && (
              <Text style={styles.heroDescription} numberOfLines={2}>
                {hero.description}
              </Text>
            )}
            <Pressable
              onPress={() => router.push(`/title/${hero.alias || hero.id}`)}
              onPressIn={pressButtonIn}
              onPressOut={pressButtonOut}
            >
              <Animated.View style={[styles.heroButton, { transform: [{ scale: buttonScale }] }]}>
                <Text style={styles.heroButtonText}>Смотреть</Text>
              </Animated.View>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {continueWatching.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Продолжить просмотр</Text>
          <FlatList
            data={continueWatching}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.episode.id}
            contentContainerStyle={{ paddingHorizontal: spacing(4), gap: spacing(3) }}
            renderItem={({ item }) => (
              <Pressable
                style={styles.continueCard}
                onPress={() => router.push(`/title/${item.release.alias || item.release.id}`)}
              >
                <Image
                  source={{
                    uri: imageUrl(item.release.poster?.optimized?.preview || item.release.poster?.preview),
                  }}
                  style={styles.continueImage}
                  resizeMode="cover"
                />
                <View style={styles.continueOverlay}>
                  <Text style={styles.continueEpisode}>Серия {item.episode.ordinal}</Text>
                  {!!item.episode.duration && (
                    <View style={styles.continueBarTrack}>
                      <View
                        style={[
                          styles.continueBarFill,
                          { width: `${Math.min(100, (item.time / item.episode.duration) * 100)}%` },
                        ]}
                      />
                    </View>
                  )}
                </View>
              </Pressable>
            )}
          />
        </View>
      )}

      <Row title="Онгоинги сегодня" releases={today.map((s) => s.release)} />
      <Row title="Последние обновления" releases={latest} />
      <Row title="Рекомендуем" releases={recommended} />

      <Footer />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginTop: spacing(5),
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing(3),
    paddingHorizontal: spacing(4),
  },
  continueCard: {
    width: 110,
  },
  continueImage: {
    width: 110,
    height: 165,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceCard,
  },
  continueOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing(2),
  },
  continueEpisode: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: spacing(1),
  },
  continueBarTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    overflow: 'hidden',
  },
  continueBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  hero: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: 460,
    backgroundColor: colors.surface,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18,18,18,0.35)',
  },
  heroOverlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
    backgroundColor: colors.background,
    opacity: 0.85,
  },
  heroContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing(4),
  },
  heroBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing(2),
  },
  heroBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  heroDescription: {
    marginTop: spacing(2),
    color: colors.textDim,
    fontSize: 14,
    lineHeight: 19,
  },
  heroButton: {
    marginTop: spacing(4),
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(3),
    borderRadius: radius.full,
  },
  heroButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
})
