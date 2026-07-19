import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { api, imageUrl } from '../../src/lib/api'
import type { CollectionType, Episode, Release, TimecodeItem } from '../../src/lib/types'
import { useAuth } from '../../src/lib/AuthContext'
import { getAllLocalProgress, saveLocalProgress } from '../../src/lib/localProgress'
import { isInWishlist, toggleWishlist } from '../../src/lib/wishlist'
import { colors, radius, spacing } from '../../src/lib/theme'
import Loader from '../../src/components/Loader'
import Chip from '../../src/components/Chip'
import Player from '../../src/components/Player'

const COLLECTION_LABELS: Record<CollectionType, string> = {
  WATCHING: 'Смотрю',
  PLANNED: 'Запланировано',
  WATCHED: 'Просмотрено',
  POSTPONED: 'Отложено',
  ABANDONED: 'Брошено',
}

function formatBytes(n: number): string {
  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(1)} ${units[i]}`
}

function extractCollectionType(items: unknown, releaseId: number): CollectionType | null {
  if (!Array.isArray(items)) return null
  for (const item of items) {
    if (item && typeof item === 'object' && 'release_id' in item && 'type_of_collection' in item) {
      const o = item as { release_id: number; type_of_collection: CollectionType }
      if (o.release_id === releaseId) return o.type_of_collection
    }
  }
  return null
}

function extractIsFavorite(items: unknown, releaseId: number): boolean {
  if (!Array.isArray(items)) return false
  return items.some((item) => {
    if (typeof item === 'number') return item === releaseId
    if (item && typeof item === 'object' && 'release_id' in item) {
      return (item as { release_id: number }).release_id === releaseId
    }
    return false
  })
}

export default function TitleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  const [release, setRelease] = useState<Release | null>(null)
  const [error, setError] = useState(false)
  const [selectedEp, setSelectedEp] = useState<Episode | null>(null)
  const [timecodes, setTimecodes] = useState<Map<string, TimecodeItem>>(new Map())
  const [saved, setSaved] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [collectionType, setCollectionType] = useState<CollectionType | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    setRelease(null)
    setError(false)
    setSelectedEp(null)
    api
      .release(id)
      .then((r) => {
        setRelease(r)
        setSelectedEp(r.episodes?.[0] ?? null)
      })
      .catch(() => setError(true))
  }, [id])

  useEffect(() => {
    if (!release) return
    isInWishlist(release.id).then(setSaved)
  }, [release])

  useEffect(() => {
    getAllLocalProgress().then((local) => {
      const merged = new Map<string, TimecodeItem>(
        Object.entries(local).map(([epId, p]) => [
          epId,
          { release_episode_id: epId, time: p.time, is_watched: p.is_watched },
        ])
      )
      setTimecodes(merged)
    })

    if (!user) return
    api
      .timecodes()
      .then((items) => {
        setTimecodes((prev) => {
          const next = new Map(prev)
          for (const i of items) next.set(i.release_episode_id, i)
          return next
        })
      })
      .catch(() => {})
  }, [user, id])

  useEffect(() => {
    if (!user || !release) return
    api
      .collectionIds()
      .then((ids) => setCollectionType(extractCollectionType(ids, release.id)))
      .catch(() => {})
    api
      .favoriteIds()
      .then((ids) => setIsFavorite(extractIsFavorite(ids, release.id)))
      .catch(() => {})
  }, [user, release])

  const poster = useMemo(
    () => imageUrl(release?.poster?.optimized?.preview || release?.poster?.preview),
    [release]
  )

  const saveTimecode = useCallback(
    (episodeId: string, time: number, isWatched: boolean) => {
      saveLocalProgress(episodeId, time, isWatched)
      if (user) api.timecodeSave(episodeId, time, isWatched).catch(() => {})
      setTimecodes((prev) => {
        const next = new Map(prev)
        next.set(episodeId, { release_episode_id: episodeId, time, is_watched: isWatched })
        return next
      })
    },
    [user]
  )

  function goToNextEpisode() {
    if (!release?.episodes || !selectedEp) return
    const idx = release.episodes.findIndex((e) => e.id === selectedEp.id)
    const next = release.episodes[idx + 1]
    if (next) setSelectedEp(next)
  }

  async function handleToggleWishlist() {
    if (!release) return
    const nowSaved = await toggleWishlist(release)
    setSaved(nowSaved)
  }

  async function pickCollection(type: CollectionType) {
    if (!release) return
    setBusy(true)
    try {
      await api.collectionAdd(release.id, type)
      setCollectionType(type)
    } finally {
      setBusy(false)
      setListOpen(false)
    }
  }

  async function removeFromList() {
    if (!release) return
    setBusy(true)
    try {
      await api.collectionRemove(release.id)
      setCollectionType(null)
    } finally {
      setBusy(false)
      setListOpen(false)
    }
  }

  async function toggleFavorite() {
    if (!release) return
    setBusy(true)
    try {
      if (isFavorite) await api.favoriteRemove(release.id)
      else await api.favoriteAdd(release.id)
      setIsFavorite(!isFavorite)
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Тайтл не найден</Text>
      </View>
    )
  }

  if (!release) return <Loader label="Загружаем..." />

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing(10) }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        {poster && <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />}
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{release.name.main}</Text>
          {release.name.english && <Text style={styles.englishTitle}>{release.name.english}</Text>}

          <View style={styles.chipRow}>
            <Chip>{release.type?.description}</Chip>
            <Chip>{release.year}</Chip>
            <Chip>{release.season?.description}</Chip>
            <Chip>{release.age_rating?.label}</Chip>
            {release.is_ongoing && <Chip accent>Онгоинг</Chip>}
            {release.episodes_total != null && <Chip>{release.episodes_total} эп.</Chip>}
          </View>

          <View style={styles.actionsRow}>
            {user && (
              <Pressable
                onPress={() => setListOpen(true)}
                disabled={busy}
                style={[styles.listButton, collectionType && styles.listButtonActive]}
              >
                <Text style={styles.listButtonText}>
                  {collectionType ? COLLECTION_LABELS[collectionType] : '+ В список'}
                </Text>
              </Pressable>
            )}
            {user && (
              <Pressable onPress={toggleFavorite} disabled={busy} style={styles.iconButton}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFavorite ? colors.accent : colors.textDim}
                />
              </Pressable>
            )}
            <Pressable onPress={handleToggleWishlist} style={styles.iconButton}>
              <Ionicons
                name={saved ? 'star' : 'star-outline'}
                size={18}
                color={saved ? colors.accent : colors.textDim}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {!!release.genres?.length && (
        <View style={styles.genreRow}>
          {release.genres.map((g) => (
            <Chip key={g.id}>{g.name}</Chip>
          ))}
        </View>
      )}

      {release.description && <Text style={styles.description}>{release.description}</Text>}

      {selectedEp && (
        <View style={styles.playerWrap}>
          <Player
            key={selectedEp.id}
            episode={selectedEp}
            resumeAt={timecodes.get(selectedEp.id)?.time}
            onProgress={(t) => saveTimecode(selectedEp.id, t, false)}
            onEnded={() => {
              saveTimecode(selectedEp.id, 0, true)
              goToNextEpisode()
            }}
          />
        </View>
      )}

      {!!release.episodes?.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Серии</Text>
          <FlatList
            horizontal
            data={release.episodes}
            keyExtractor={(ep) => ep.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.episodeList}
            renderItem={({ item: ep }) => {
              const tc = timecodes.get(ep.id)
              const isSelected = selectedEp?.id === ep.id
              return (
                <Pressable
                  onPress={() => setSelectedEp(ep)}
                  style={[styles.episodeButton, isSelected && styles.episodeButtonActive]}
                >
                  <View style={styles.episodeRow}>
                    <Text style={styles.episodeLabel}>Серия {ep.ordinal}</Text>
                    {tc?.is_watched && <Text style={styles.episodeCheck}>✓</Text>}
                  </View>
                  {ep.name && (
                    <Text numberOfLines={1} style={styles.episodeName}>
                      {ep.name}
                    </Text>
                  )}
                  {tc && !tc.is_watched && ep.duration ? (
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(100, (tc.time / ep.duration) * 100)}%` },
                        ]}
                      />
                    </View>
                  ) : null}
                </Pressable>
              )
            }}
          />
        </View>
      )}

      {!!release.torrents?.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Торренты</Text>
          {release.torrents.map((t) => (
            <View key={t.id} style={styles.torrentRow}>
              <View style={styles.torrentInfo}>
                <Text numberOfLines={1} style={styles.torrentLabel}>
                  {t.label}
                </Text>
                <Text style={styles.torrentMeta}>
                  {formatBytes(t.size)} · {t.quality?.description} · {t.seeders} сидов
                </Text>
              </View>
              <Pressable onPress={() => Linking.openURL(t.magnet)} style={styles.magnetButton}>
                <Text style={styles.magnetButtonText}>Magnet</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={listOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setListOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setListOpen(false)}>
          <View style={[styles.actionSheet, { paddingBottom: insets.bottom + spacing(4) }]}>
            {(Object.keys(COLLECTION_LABELS) as CollectionType[]).map((type) => (
              <Pressable key={type} onPress={() => pickCollection(type)} style={styles.actionSheetRow}>
                <Text
                  style={[
                    styles.actionSheetText,
                    collectionType === type && styles.actionSheetTextActive,
                  ]}
                >
                  {COLLECTION_LABELS[type]}
                </Text>
              </Pressable>
            ))}
            {collectionType && (
              <Pressable onPress={removeFromList} style={styles.actionSheetRow}>
                <Text style={styles.actionSheetRemove}>Убрать из списка</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setListOpen(false)} style={styles.actionSheetRow}>
              <Text style={styles.actionSheetCancel}>Отмена</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.textFaint,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(2),
  },
  poster: {
    width: 110,
    aspectRatio: 2 / 3,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  englishTitle: {
    color: colors.textFaint,
    fontSize: 12,
    marginTop: spacing(0.5),
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1.5),
    marginTop: spacing(2.5),
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginTop: spacing(3),
  },
  listButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radius.full,
  },
  listButtonActive: {
    backgroundColor: colors.surfaceRaised,
  },
  listButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1.5),
    paddingHorizontal: spacing(4),
    marginTop: spacing(3.5),
  },
  description: {
    color: colors.textDim,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing(4),
    marginTop: spacing(3.5),
  },
  playerWrap: {
    paddingHorizontal: spacing(4),
    marginTop: spacing(5),
  },
  section: {
    marginTop: spacing(5),
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing(2),
    paddingHorizontal: spacing(4),
  },
  episodeList: {
    paddingHorizontal: spacing(4),
    gap: spacing(2),
  },
  episodeButton: {
    width: 130,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing(3),
  },
  episodeButtonActive: {
    backgroundColor: colors.accent,
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  episodeLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  episodeCheck: {
    color: colors.text,
    fontSize: 11,
  },
  episodeName: {
    color: colors.textFaint,
    fontSize: 11,
    marginTop: spacing(1),
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.full,
    marginTop: spacing(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  torrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    marginHorizontal: spacing(4),
    marginBottom: spacing(2),
  },
  torrentInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing(3),
  },
  torrentLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  torrentMeta: {
    color: colors.textFaint,
    fontSize: 11,
    marginTop: spacing(1),
  },
  magnetButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radius.full,
  },
  magnetButtonText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing(3),
    paddingHorizontal: spacing(4),
  },
  actionSheetRow: {
    paddingVertical: spacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  actionSheetText: {
    color: colors.text,
    fontSize: 15,
  },
  actionSheetTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  actionSheetRemove: {
    color: '#ff6b6b',
    fontSize: 15,
  },
  actionSheetCancel: {
    color: colors.textFaint,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
})
