import { useCallback, useEffect, useState } from 'react'
import { Image, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
} from 'react-native-reanimated'
import { api, imageUrl } from '../../src/lib/api'
import { getContinueWatching, ContinueWatchingItem } from '../../src/lib/continueWatching'
import type { Release, ScheduleDay } from '../../src/lib/types'
import { colors, font, radius, spacing } from '../../src/lib/theme'
import { useReduceMotion } from '../../src/lib/useReduceMotion'
import Row from '../../src/components/Row'
import Footer from '../../src/components/Footer'
import { HomeSkeleton } from '../../src/components/Skeleton'
import Reveal from '../../src/components/Reveal'
import AnimatedPressable from '../../src/components/AnimatedPressable'
import AccentGradient from '../../src/components/AccentGradient'

const HERO_HEIGHT = 460

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const reduced = useReduceMotion()
  const [latest, setLatest] = useState<Release[] | null>(null)
  const [recommended, setRecommended] = useState<Release[]>([])
  const [today, setToday] = useState<ScheduleDay[]>([])
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const scrollY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y
  })

  const heroStyle = useAnimatedStyle(() => {
    if (reduced) return {}
    const y = scrollY.value
    return {
      transform: [
        { translateY: interpolate(y, [-120, 0, 120], [-40, 0, 34], Extrapolation.CLAMP) },
        { scale: interpolate(y, [-120, 0], [1.15, 1], Extrapolation.CLAMP) },
      ],
    }
  })

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

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!latest) return <HomeSkeleton />

  const hero = latest[0]

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing(24) }}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {hero && (
        <View style={styles.hero}>
          <Animated.Image
            source={{ uri: imageUrl(hero.poster?.optimized?.preview || hero.poster?.preview) }}
            style={[styles.heroImage, heroStyle]}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroOverlayBottom} />

          <View style={[styles.heroContent, { paddingTop: insets.top + spacing(4) }]}>
            <View style={{ flex: 1 }} />
            <AccentGradient style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Новинка</Text>
            </AccentGradient>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {hero.name.main}
            </Text>
            {!!hero.description && (
              <Text style={styles.heroDescription} numberOfLines={2}>
                {hero.description}
              </Text>
            )}
            <View style={{ alignSelf: 'flex-start', marginTop: spacing(4) }}>
              <AnimatedPressable haptic onPress={() => router.push(`/title/${hero.alias || hero.id}`)}>
                <AccentGradient style={styles.heroButton}>
                  <Text style={styles.heroButtonText}>Смотреть</Text>
                </AccentGradient>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      )}

      {continueWatching.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Продолжить просмотр</Text>
          <View style={styles.continueRow}>
            {continueWatching.map((item, i) => (
              <Reveal key={item.episode.id} index={i} style={styles.continueCard}>
                <AnimatedPressable
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
                    <Text style={styles.continueEpisode}>СЕРИЯ {item.episode.ordinal}</Text>
                    {!!item.episode.duration && (
                      <View style={styles.continueBarTrack}>
                        <AccentGradient
                          style={[
                            styles.continueBarFill,
                            { width: `${Math.min(100, (item.time / item.episode.duration) * 100)}%` },
                          ]}
                        />
                      </View>
                    )}
                  </View>
                </AnimatedPressable>
              </Reveal>
            ))}
          </View>
        </View>
      )}

      <Row title="Онгоинги сегодня" releases={today.map((s) => s.release)} />
      <Row title="Последние обновления" releases={latest} />
      <Row title="Рекомендуем" releases={recommended} />

      <Footer />
    </Animated.ScrollView>
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
    fontFamily: font.heading,
    fontSize: 17,
    letterSpacing: -0.2,
    marginBottom: spacing(3),
    paddingHorizontal: spacing(4),
  },
  continueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(3),
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
    fontFamily: font.mono,
    fontSize: 9,
    letterSpacing: 0.4,
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
  },
  hero: {
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: colors.surface,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(10,10,19,0.3)',
  },
  heroOverlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
    backgroundColor: colors.background,
    opacity: 0.88,
  },
  heroContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    padding: spacing(4),
  },
  heroBadge: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing(2),
  },
  heroBadgeText: {
    color: '#fff',
    fontFamily: font.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontFamily: font.display,
    fontSize: 26,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  heroDescription: {
    marginTop: spacing(2),
    color: colors.textDim,
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 19,
  },
  heroButton: {
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(3),
    borderRadius: radius.full,
  },
  heroButtonText: {
    color: '#fff',
    fontFamily: font.heading,
    fontSize: 15,
  },
})
