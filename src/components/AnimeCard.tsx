import { useEffect, useRef, useState } from 'react'
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { Release } from '../lib/types'
import { imageUrl } from '../lib/api'
import { colors, radius, spacing } from '../lib/theme'
import { isInWishlist, onWishlistChange, toggleWishlist } from '../lib/wishlist'

interface AnimeCardProps {
  release: Release
  onPress?: () => void
}

export default function AnimeCard({ release, onPress }: AnimeCardProps) {
  const [saved, setSaved] = useState(false)
  const scale = useRef(new Animated.Value(1)).current

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

  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()
  }

  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()
  }

  async function handleToggleWishlist() {
    const nowSaved = await toggleWishlist(release)
    setSaved(nowSaved)
  }

  const poster = imageUrl(release.poster?.optimized?.preview || release.poster?.preview)

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        <View style={styles.posterWrap}>
          {poster && <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />}

          <View style={styles.topLeftCol}>
            {release.is_ongoing && (
              <View style={styles.badgeAccent}>
                <Text style={styles.badgeText}>ONGOING</Text>
              </View>
            )}
            {release.episodes_total != null && (
              <View style={styles.badgeMuted}>
                <Text style={styles.badgeText}>{release.episodes_total} эп.</Text>
              </View>
            )}
          </View>

          <Pressable hitSlop={10} onPress={handleToggleWishlist} style={styles.starButton}>
            <Ionicons
              name={saved ? 'star' : 'star-outline'}
              size={15}
              color={saved ? colors.accent : colors.text}
            />
          </Pressable>
        </View>

        <Text numberOfLines={2} style={styles.title}>
          {release.name.main}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {release.season?.description} {release.year} · {release.type?.description}
        </Text>
      </Animated.View>
    </Pressable>
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
  badgeAccent: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeMuted: {
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  starButton: {
    position: 'absolute',
    top: spacing(1.5),
    right: spacing(1.5),
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
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  meta: {
    marginTop: spacing(1),
    color: colors.textFaint,
    fontSize: 11,
  },
})
