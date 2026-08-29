import { ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { gradients } from '../lib/theme'

interface AccentGradientProps {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

export default function AccentGradient({ children, style }: AccentGradientProps) {
  return (
    <LinearGradient colors={gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  )
}
