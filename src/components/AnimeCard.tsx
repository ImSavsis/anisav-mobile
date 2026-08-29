import { useEffect, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { Release } from '../lib/types'
import { imageUrl } from '../lib/api'
import { colors, font, radius, spacing } from '../lib/theme'
import { isInWishlist, onWishlistChange, toggleWishlist } from '../lib/wishlist'
import AnimatedPressable from './AnimatedPressable'
import AccentGradient from './AccentGradient'

interface AnimeCardProps {
  release: Release
  onPress?: () => void
}

export default function AnimeCard({ release, onPress }: AnimeCardProps) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let mounted = true
    isInWishlist(release.id).then((v) => mounted && setSaved(v))
    const unsubscribe = onWishlistChange(() => {
      isInWishlist(release.id).then((v) => mounted && setSaved(v))
    })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [release.id])

  async function handleToggleWishlist() {
    const nowSaved = await toggleWishlist(release)
    setSaved(nowSaved)
  }

  const poster = imageUrl(release.poster?.optimized?.preview || release.poster?.preview)

  return (
    <AnimatedPressable onPress={onPress} style={styles.container}>
      <View style={styles.posterWrap}>
        {poster && <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />}

        <View style={styles.topLeftCol}>
          {release.is_ongoing && (
            <AccentGradient style={styles.badge}>
              <Text style={styles.badgeText}>ONGOING</Text>
            </AccentGradient>
          )}
          {release.episodes_total != null && (
            <View style={[styles.badge, styles.badgeMuted]}>
              <Text style={styles.badgeText}>{release.episodes_total} эп.</Text>
            </View>
          )}
        </View>

        <View style={styles.starButtonWrap}>
          <AnimatedPressable hitSlop={10} onPress={handleToggleWishlist} scaleTo={0.8} haptic style={styles.starButton}>
            <Ionicons
              name={saved ? 'star' : 'star-outline'}
              size={14}
              color={saved ? colors.accent2 : colors.text}
            />
          </AnimatedPressable>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.title}>
        {release.name.main}
      </Text>
      <Text numberOfLines={1} style={styles.meta}>
        {release.season?.description} {release.year} · {release.type?.description}
      </Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  posterWrap: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  topLeftCol: {
    position: 'absolute',
    top: spacing(1.5),
    left: spacing(1.5),
    gap: spacing(1),
  },
  badge: {
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeMuted: {
    backgroundColor: colors.overlay,
  },
  badgeText: {
    color: colors.text,
    fontFamily: font.mono,
    fontSize: 8.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  starButtonWrap: {
    position: 'absolute',
    top: spacing(1.5),
    right: spacing(1.5),
  },
  starButton: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing(2),
    color: colors.text,
    fontFamily: font.medium,
    fontSize: 13,
    lineHeight: 16,
  },
  meta: {
    marginTop: spacing(1),
    color: colors.textFaint,
    fontFamily: font.regular,
    fontSize: 11,
  },
})
