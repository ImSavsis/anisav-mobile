import { FlatList, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { Release } from '../lib/types'
import { colors, spacing } from '../lib/theme'
import AnimeCard from './AnimeCard'

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
      <FlatList
        horizontal
        data={releases}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <AnimeCard
              release={item}
              onPress={() => router.push(`/title/${item.alias || item.id}`)}
            />
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing(4),
  },
  heading: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing(2),
    paddingHorizontal: spacing(4),
  },
  list: {
    paddingHorizontal: spacing(4),
    gap: spacing(3),
  },
  item: {
    width: CARD_WIDTH,
  },
})
