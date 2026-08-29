import { ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated'

interface RevealProps {
  index?: number
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export default function Reveal({ index = 0, children, style }: RevealProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45)
        .springify()
        .damping(18)
        .stiffness(160)
        .reduceMotion(ReduceMotion.System)}
      style={style}
    >
      {children}
    </Animated.View>
  )
}
