import { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../../src/lib/api'
import type { Release, ScheduleDay } from '../../src/lib/types'
import { colors, spacing } from '../../src/lib/theme'
import Loader from '../../src/components/Loader'
import Row from '../../src/components/Row'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 7]

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets()
  const [week, setWeek] = useState<ScheduleDay[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setWeek(await api.scheduleWeek())
    } catch {
      setWeek([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!week) return <Loader label="Загружаем расписание..." />

  const byDay = new Map<number, Release[]>()
  for (const item of week) {
    if (!item.release) continue
    const day = item.release.publish_day?.value ?? 0
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(item.release)
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing(4),
        paddingBottom: insets.bottom + spacing(8),
      }}
      refreshControl={
        <RefreshControl tintColor={colors.accent} refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Расписание выхода серий</Text>
      {DAY_ORDER.filter((day) => byDay.has(day)).map((day) => {
        const releases = byDay.get(day)!
        return (
          <Row
            key={day}
            title={releases[0].publish_day?.description ?? ''}
            releases={releases}
          />
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: spacing(4),
  },
})
