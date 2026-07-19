import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useEvent, useEventListener } from 'expo'
import { VideoView, useVideoPlayer } from 'expo-video'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { Episode, EpisodeSkip } from '../lib/types'
import { colors, radius, spacing } from '../lib/theme'
import { loadPlayerPrefs, savePlayerPrefs, PlayerPrefs } from '../lib/playerPrefs'

const QUALITIES = [
  { key: 'hls_1080', label: '1080p' },
  { key: 'hls_720', label: '720p' },
  { key: 'hls_480', label: '480p' },
] as const

type QualityKey = (typeof QUALITIES)[number]['key']

interface PlayerProps {
  episode: Episode
  resumeAt?: number
  onProgress?: (time: number) => void
  onEnded?: () => void
}

export default function Player({ episode, resumeAt, onProgress, onEnded }: PlayerProps) {
  const available = QUALITIES.filter((q) => episode[q.key])
  const [quality, setQuality] = useState<QualityKey | undefined>(available[0]?.key)
  const [prefs, setPrefs] = useState<PlayerPrefs>({
    autoSkipOpening: false,
    autoSkipEnding: false,
    autoPlayNext: true,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [showSkip, setShowSkip] = useState<'opening' | 'ending' | null>(null)
  const skippedRanges = useRef<Set<string>>(new Set())
  const resumeRef = useRef(resumeAt && resumeAt > 5 ? resumeAt : 0)

  useEffect(() => {
    loadPlayerPrefs().then(setPrefs)
  }, [])

  function updatePrefs(patch: Partial<PlayerPrefs>) {
    setPrefs((p) => {
      const next = { ...p, ...patch }
      savePlayerPrefs(next)
      return next
    })
  }

  const source =
    quality && episode[quality] ? { uri: episode[quality] as string, contentType: 'hls' as const } : null

  const player = useVideoPlayer(source, (p) => {
    p.timeUpdateEventInterval = 0.5
    p.play()
  })

  useEventListener(player, 'sourceLoad', () => {
    if (resumeRef.current > 5) player.currentTime = resumeRef.current
    resumeRef.current = 0
  })

  useEventListener(player, 'playToEnd', () => {
    reportProgress()
    onEnded?.()
  })

  const { status } = useEvent(player, 'statusChange', { status: player.status })
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  })

  const reportProgress = useCallback(() => {
    if (player.currentTime > 3) onProgress?.(player.currentTime)
  }, [player, onProgress])

  useEffect(() => {
    const id = setInterval(reportProgress, 10000)
    return () => clearInterval(id)
  }, [reportProgress])

  useEffect(() => {
    function checkRange(range: EpisodeSkip | null | undefined, key: string, auto: boolean): boolean {
      if (!range || currentTime < range.start || currentTime >= range.stop) return false
      if (auto) {
        if (!skippedRanges.current.has(key)) {
          skippedRanges.current.add(key)
          player.currentTime = range.stop
        }
        return false
      }
      return true
    }

    if (checkRange(episode.opening, 'opening', prefs.autoSkipOpening)) setShowSkip('opening')
    else if (checkRange(episode.ending, 'ending', prefs.autoSkipEnding)) setShowSkip('ending')
    else setShowSkip(null)
  }, [currentTime, episode.opening, episode.ending, prefs.autoSkipOpening, prefs.autoSkipEnding, player])

  function skip() {
    if (showSkip === 'opening' && episode.opening) player.currentTime = episode.opening.stop
    if (showSkip === 'ending' && episode.ending) player.currentTime = episode.ending.stop
    setShowSkip(null)
  }

  function selectQuality(key: QualityKey) {
    resumeRef.current = player.currentTime
    setQuality(key)
    setShowSettings(false)
  }

  return (
    <View style={styles.wrapper}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
      />

      {status === 'loading' && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {showSkip && (
        <Pressable onPress={skip} style={styles.skipButton}>
          <Ionicons name="play-skip-forward" size={14} color={colors.text} />
          <Text style={styles.skipText}>
            Пропустить {showSkip === 'opening' ? 'опенинг' : 'эндинг'}
          </Text>
        </Pressable>
      )}

      <Pressable
        hitSlop={10}
        onPress={() => setShowSettings((v) => !v)}
        style={styles.gearButton}
      >
        <Ionicons name="settings-sharp" size={16} color={colors.text} />
      </Pressable>

      {showSettings && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSettings(false)} />
          <View style={styles.settingsPanel}>
            {available.length > 1 && (
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>Качество</Text>
                <View style={styles.qualityRow}>
                  {available.map((q) => (
                    <Pressable
                      key={q.key}
                      onPress={() => selectQuality(q.key)}
                      style={[styles.qualityChip, quality === q.key && styles.qualityChipActive]}
                    >
                      <Text style={styles.qualityChipText}>{q.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.divider} />

            <ToggleRow
              label="Пропускать опенинг"
              value={prefs.autoSkipOpening}
              onChange={(v) => updatePrefs({ autoSkipOpening: v })}
            />
            <ToggleRow
              label="Пропускать эндинг"
              value={prefs.autoSkipEnding}
              onChange={(v) => updatePrefs({ autoSkipEnding: v })}
            />
            <ToggleRow
              label="Авто-следующая серия"
              value={prefs.autoPlayNext}
              onChange={(v) => updatePrefs({ autoPlayNext: v })}
            />
          </View>
        </>
      )}
    </View>
  )
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <View style={styles.settingsRow}>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.accent }}
        thumbColor={colors.text}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    position: 'absolute',
    bottom: spacing(16),
    right: spacing(3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radius.sm,
  },
  skipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  gearButton: {
    position: 'absolute',
    top: spacing(2),
    right: spacing(2),
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsPanel: {
    position: 'absolute',
    top: spacing(9),
    right: spacing(2),
    width: 220,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing(3),
    gap: spacing(2),
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  settingsLabel: {
    color: colors.textDim,
    fontSize: 12,
    flexShrink: 1,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: spacing(1),
  },
  qualityChip: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  qualityChipActive: {
    backgroundColor: colors.accent,
  },
  qualityChipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
})
