import { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing } from '../lib/theme'

interface ChipProps {
  children: ReactNode
  accent?: boolean
}

export default function Chip({ children, accent }: ChipProps) {
  return (
    <View style={[styles.chip, accent && styles.chipAccent]}>
      <Text style={[styles.text, accent && styles.textAccent]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  chipAccent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  text: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  textAccent: {
    color: colors.text,
  },
})
