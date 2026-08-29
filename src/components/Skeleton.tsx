import { useEffect } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius, spacing } from '../lib/theme'
import { useReduceMotion } from '../lib/useReduceMotion'

function Pulse({ style }: { style?: StyleProp<ViewStyle> }) {
  const reduced = useReduceMotion()
  const opacity = useSharedValue(0.5)

  useEffect(() => {
    if (reduced) return
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.System }),
      -1,
      true
    )
  }, [reduced, opacity])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return <Animated.View style={[styles.block, animatedStyle, style]} />
}

export function HeroSkeleton() {
  return <Pulse style={styles.hero} />
}

export function PosterRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <Pulse key={i} style={styles.poster} />
      ))}
    </View>
  )
}

export function GridSkeleton({ columns = 2, count = 6 }: { columns?: number; count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <Pulse key={i} style={[styles.gridItem, { width: `${100 / columns - 3}%` }]} />
      ))}
    </View>
  )
}

export function HomeSkeleton() {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ paddingTop: insets.top, flex: 1, backgroundColor: colors.background }}>
      <HeroSkeleton />
      <View style={{ marginTop: spacing(5) }}>
        <PosterRowSkeleton count={4} />
      </View>
      <View style={{ marginTop: spacing(5) }}>
        <PosterRowSkeleton count={4} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
  },
  hero: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: 420,
    borderRadius: 0,
  },
  row: {
    flexDirection: 'row',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
  },
  poster: {
    width: 104,
    aspectRatio: 2 / 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
  },
  gridItem: {
    aspectRatio: 2 / 3,
  },
})

export default Pulse
