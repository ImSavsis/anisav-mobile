import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { Release } from '../lib/types'
import { colors, font, spacing } from '../lib/theme'
import AnimeCard from './AnimeCard'
import Reveal from './Reveal'

interface RowProps {
  title: string
  releases: Release[]
}

const CARD_WIDTH = 132

export default function Row({ title, releases }: RowProps) {
  const router = useRouter()

  if (!releases.length) return null

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {releases.map((item, i) => (
          <Reveal key={item.id} index={i} style={styles.item}>
            <AnimeCard release={item} onPress={() => router.push(`/title/${item.alias || item.id}`)} />
          </Reveal>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing(4),
  },
  heading: {
    color: colors.text,
    fontFamily: font.heading,
    fontSize: 17,
    letterSpacing: -0.2,
    marginBottom: spacing(2),
    paddingHorizontal: spacing(4),
  },
  list: {
    gap: spacing(3),
    paddingHorizontal: spacing(4),
  },
  item: {
    width: CARD_WIDTH,
  },
})
