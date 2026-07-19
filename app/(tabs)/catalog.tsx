import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { api } from '../../src/lib/api'
import type { CatalogFilters, Genre, Release, ValueDescription } from '../../src/lib/types'
import { colors, radius, spacing } from '../../src/lib/theme'
import AnimeCard from '../../src/components/AnimeCard'
import Loader from '../../src/components/Loader'
import Chip from '../../src/components/Chip'

type SortOpt = ValueDescription & { label: string }

const LIMIT = 24
const DEFAULT_SORTING = 'FRESH_AT_DESC'

function getColumns() {
  const width = Dimensions.get('window').width
  return Math.max(2, Math.floor(width / 180))
}

export default function CatalogScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [columns, setColumns] = useState(getColumns)
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', () => setColumns(getColumns()))
    return () => sub.remove()
  }, [])

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400)
    return () => clearTimeout(t)
  }, [query])
  const isSearching = debouncedQuery.length > 0

  const [refGenres, setRefGenres] = useState<Genre[]>([])
  const [refTypes, setRefTypes] = useState<ValueDescription[]>([])
  const [refSeasons, setRefSeasons] = useState<ValueDescription[]>([])
  const [refSorting, setRefSorting] = useState<SortOpt[]>([])

  useEffect(() => {
    api.refGenres().then(setRefGenres).catch(() => {})
    api.refTypes().then(setRefTypes).catch(() => {})
    api.refSeasons().then(setRefSeasons).catch(() => {})
    api.refSorting().then(setRefSorting).catch(() => {})
  }, [])

  const [sorting, setSorting] = useState(DEFAULT_SORTING)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([])

  const [filtersVisible, setFiltersVisible] = useState(false)
  const [draftSorting, setDraftSorting] = useState(DEFAULT_SORTING)
  const [draftGenres, setDraftGenres] = useState<number[]>([])
  const [draftTypes, setDraftTypes] = useState<string[]>([])
  const [draftSeasons, setDraftSeasons] = useState<string[]>([])

  function openFilters() {
    setDraftSorting(sorting)
    setDraftGenres(selectedGenres)
    setDraftTypes(selectedTypes)
    setDraftSeasons(selectedSeasons)
    setFiltersVisible(true)
  }

  function applyFilters() {
    setSorting(draftSorting)
    setSelectedGenres(draftGenres)
    setSelectedTypes(draftTypes)
    setSelectedSeasons(draftSeasons)
    setFiltersVisible(false)
  }

  function resetFilters() {
    setDraftSorting(DEFAULT_SORTING)
    setDraftGenres([])
    setDraftTypes([])
    setDraftSeasons([])
    setSorting(DEFAULT_SORTING)
    setSelectedGenres([])
    setSelectedTypes([])
    setSelectedSeasons([])
    setFiltersVisible(false)
  }

  function toggleDraftGenre(id: number) {
    setDraftGenres((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }
  function toggleDraftType(value: string) {
    setDraftTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }
  function toggleDraftSeason(value: string) {
    setDraftSeasons((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  const activeFilterCount = selectedGenres.length + selectedTypes.length + selectedSeasons.length

  const filters: CatalogFilters = useMemo(
    () => ({
      genres: selectedGenres.length ? selectedGenres : undefined,
      types: selectedTypes.length ? selectedTypes : undefined,
      seasons: selectedSeasons.length ? selectedSeasons : undefined,
      sorting,
    }),
    [selectedGenres, selectedTypes, selectedSeasons, sorting]
  )

  const [results, setResults] = useState<Release[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setResults(null)
    setPage(1)

    if (isSearching) {
      api
        .search(debouncedQuery)
        .then((data) => {
          if (cancelled) return
          setResults(data)
          setTotalPages(1)
        })
        .catch(() => {
          if (!cancelled) setResults([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    } else {
      api
        .catalog(filters, 1, LIMIT)
        .then((res) => {
          if (cancelled) return
          setResults(res.data)
          setTotalPages(res.meta.pagination.total_pages)
        })
        .catch(() => {
          if (!cancelled) setResults([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [filters, isSearching, debouncedQuery])

  function loadMore() {
    if (isSearching || loading || loadingMore || page >= totalPages) return
    const nextPage = page + 1
    setLoadingMore(true)
    api
      .catalog(filters, nextPage, LIMIT)
      .then((res) => {
        setResults((prev) => (prev ? [...prev, ...res.data] : res.data))
        setPage(nextPage)
        setTotalPages(res.meta.pagination.total_pages)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  const paddedResults = useMemo(() => {
    if (!results) return []
    const remainder = results.length % columns
    if (remainder === 0) return results
    return [...results, ...Array(columns - remainder).fill(null)]
  }, [results, columns])

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>{isSearching ? `Поиск: "${debouncedQuery}"` : 'Каталог'}</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск аниме..."
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textFaint} />
            </Pressable>
          )}
        </View>

        {!isSearching && (
          <Pressable style={styles.filterButton} onPress={openFilters}>
            <Ionicons name="options" size={18} color={colors.text} />
            <Text style={styles.filterButtonText}>Фильтры</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        )}
      </View>

      {loading ? (
        <Loader label="Загрузка..." />
      ) : results && results.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="file-tray-outline" size={40} color={colors.textFaint} />
          <Text style={styles.emptyText}>Ничего не найдено</Text>
        </View>
      ) : (
        <FlatList
          key={`grid-${columns}`}
          data={paddedResults}
          keyExtractor={(item, index) => (item ? String(item.id) : `filler-${index}`)}
          numColumns={columns}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing(6) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          renderItem={({ item }) => (
            <View style={styles.cardCell}>
              {item && (
                <AnimeCard release={item} onPress={() => router.push(`/title/${item.alias || item.id}`)} />
              )}
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : (
              <View style={{ height: spacing(4) }} />
            )
          }
        />
      )}

      <Modal
        visible={filtersVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFiltersVisible(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing(4) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Фильтры</Text>
              <Pressable hitSlop={8} onPress={() => setFiltersVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textDim} />
              </Pressable>
            </View>

            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              <FilterSection title="Сортировка">
                <View style={styles.chipsWrap}>
                  {refSorting.map((s) => (
                    <Pressable key={s.value} onPress={() => setDraftSorting(s.value)}>
                      <Chip accent={draftSorting === s.value}>{s.label}</Chip>
                    </Pressable>
                  ))}
                </View>
              </FilterSection>

              <FilterSection title="Тип">
                <View style={styles.chipsWrap}>
                  {refTypes.map((t) => (
                    <Pressable key={t.value} onPress={() => toggleDraftType(t.value)}>
                      <Chip accent={draftTypes.includes(t.value)}>{t.description}</Chip>
                    </Pressable>
                  ))}
                </View>
              </FilterSection>

              <FilterSection title="Сезон">
                <View style={styles.chipsWrap}>
                  {refSeasons.map((s) => (
                    <Pressable key={s.value} onPress={() => toggleDraftSeason(s.value)}>
                      <Chip accent={draftSeasons.includes(s.value)}>{s.description}</Chip>
                    </Pressable>
                  ))}
                </View>
              </FilterSection>

              <FilterSection title="Жанры">
                <View style={styles.chipsWrap}>
                  {refGenres.map((g) => (
                    <Pressable key={g.id} onPress={() => toggleDraftGenre(g.id)}>
                      <Chip accent={draftGenres.includes(g.id)}>{g.name}</Chip>
                    </Pressable>
                  ))}
                </View>
              </FilterSection>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <Pressable style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Сбросить</Text>
              </Pressable>
              <Pressable style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Применить</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    paddingHorizontal: spacing(4),
    paddingTop: spacing(3),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(3),
    paddingBottom: spacing(2),
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.full,
    paddingHorizontal: spacing(3),
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    padding: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.full,
    paddingHorizontal: spacing(3),
    height: 40,
  },
  filterButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(3),
    paddingBottom: spacing(24),
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing(4),
    paddingTop: spacing(2),
    gap: spacing(4),
  },
  row: {
    gap: spacing(3),
  },
  cardCell: {
    flex: 1,
  },
  footerLoader: {
    paddingVertical: spacing(6),
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '85%',
    paddingHorizontal: spacing(4),
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing(2),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(3),
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sheetBody: {
    marginBottom: spacing(2),
  },
  filterSection: {
    marginBottom: spacing(4),
  },
  filterSectionTitle: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing(2),
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: spacing(3),
    paddingTop: spacing(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  resetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  resetButtonText: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '700',
  },
  applyButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  applyButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
})
