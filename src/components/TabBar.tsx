import { useEffect, useState } from 'react'
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs'
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { colors, radius } from '../lib/theme'
import AccentGradient from './AccentGradient'

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  catalog: 'grid',
  genres: 'pricetags',
  schedule: 'calendar',
  profile: 'person',
}

const SPRING = { damping: 18, stiffness: 220, reduceMotion: ReduceMotion.System }
const BAR_PAD = 6

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const [barWidth, setBarWidth] = useState(0)
  const indicatorX = useSharedValue(0)
  const count = state.routes.length
  const slotWidth = barWidth / count

  function onLayout(e: LayoutChangeEvent) {
    setBarWidth(e.nativeEvent.layout.width)
  }

  useEffect(() => {
    if (barWidth <= 0) return
    indicatorX.value = withSpring((barWidth / count) * state.index, SPRING)
  }, [state.index, barWidth, count, indicatorX])

  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: indicatorX.value }],
      width: slotWidth > 0 ? slotWidth - BAR_PAD * 2 : 0,
    }),
    [slotWidth]
  )

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + 10 }]}>
      <BlurView intensity={45} tint="dark" style={styles.bar} onLayout={onLayout}>
        {barWidth > 0 && (
          <Animated.View style={[styles.indicator, indicatorStyle]}>
            <AccentGradient style={StyleSheet.absoluteFill} />
          </Animated.View>
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const focused = state.index === index
          const base = ICONS[route.name] ?? 'ellipse'
          const iconName = (focused ? base : `${base}-outline`) as keyof typeof Ionicons.glyphMap

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) {
              Haptics.selectionAsync()
              navigation.navigate(route.name)
            }
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityLabel={typeof options.title === 'string' ? options.title : route.name}
            >
              <Ionicons name={iconName} size={19} color={focused ? '#fff' : colors.textFaint} />
            </Pressable>
          )
        })}
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '86%',
    maxWidth: 320,
    padding: BAR_PAD,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  indicator: {
    position: 'absolute',
    top: BAR_PAD,
    bottom: BAR_PAD,
    left: BAR_PAD,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
