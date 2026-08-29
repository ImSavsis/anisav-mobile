import { ReactNode, useCallback } from 'react'
import { GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native'
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  scaleTo?: number
  haptic?: boolean
}

const SPRING = { damping: 16, stiffness: 260, reduceMotion: ReduceMotion.System }

export default function AnimatedPressable({
  children,
  style,
  scaleTo = 0.96,
  haptic = false,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      scale.value = withSpring(scaleTo, SPRING)
      onPressIn?.(e)
    },
    [onPressIn, scale, scaleTo]
  )

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      scale.value = withSpring(1, SPRING)
      onPressOut?.(e)
    },
    [onPressOut, scale]
  )

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress?.(e)
    },
    [onPress, haptic]
  )

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress} {...rest}>
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  )
}
