import { Text, TouchableOpacity, View, StyleSheet, Linking } from 'react-native'
import { colors } from '../lib/theme'

export default function Footer() {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>made by </Text>
      <TouchableOpacity onPress={() => Linking.openURL('https://im.savsis.xyz')}>
        <Text style={styles.link}>im.savsis.xyz</Text>
      </TouchableOpacity>
      <Text style={styles.text}> with </Text>
      <Text style={styles.heart}>♥</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  text: {
    color: colors.textFaint,
    fontSize: 12,
  },
  link: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  heart: {
    color: colors.accent,
    fontSize: 12,
  },
})
