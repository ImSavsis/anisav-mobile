import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../lib/theme'

interface LoaderProps {
  label?: string
}

export default function Loader({ label }: LoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(24),
    gap: spacing(3),
  },
  label: {
    color: colors.textDim,
    fontSize: 13,
  },
})
