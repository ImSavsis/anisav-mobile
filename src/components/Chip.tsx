import { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, font, radius, spacing } from '../lib/theme'
import AccentGradient from './AccentGradient'

interface ChipProps {
  children: ReactNode
  accent?: boolean
  mono?: boolean
}

export default function Chip({ children, accent, mono }: ChipProps) {
  const textStyle = [styles.text, mono && styles.textMono, accent && styles.textAccent]

  if (accent) {
    return (
      <AccentGradient style={[styles.chip, mono && styles.chipMono]}>
        <Text style={textStyle}>{children}</Text>
      </AccentGradient>
    )
  }

  return (
    <View style={[styles.chip, mono && styles.chipMono, styles.chipDefault]}>
      <Text style={textStyle}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  chipMono: {
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderRadius: radius.sm,
  },
  chipDefault: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  text: {
    fontFamily: font.body,
    color: colors.textDim,
    fontSize: 12,
  },
  textMono: {
    fontFamily: font.mono,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text,
  },
  textAccent: {
    color: '#fff',
  },
})
