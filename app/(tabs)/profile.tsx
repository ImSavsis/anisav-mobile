import { useRef } from 'react'
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useAuth } from '../../src/lib/AuthContext'
import { imageUrl } from '../../src/lib/api'
import { colors, radius, spacing } from '../../src/lib/theme'
import Loader from '../../src/components/Loader'
import Footer from '../../src/components/Footer'

interface ProfileRowProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  danger?: boolean
}

function ProfileRow({ icon, label, onPress, danger }: ProfileRowProps) {
  const scale = useRef(new Animated.Value(1)).current

  function pressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start()
  }

  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[styles.row, { transform: [{ scale }] }]}>
        <View style={styles.rowLeft}>
          <Ionicons name={icon} size={19} color={danger ? colors.accent : colors.textDim} />
          <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        </View>
        {!danger && <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />}
      </Animated.View>
    </Pressable>
  )
}

function LoginButton() {
  const router = useRouter()
  const scale = useRef(new Animated.Value(1)).current

  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()
  }

  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()
  }

  return (
    <Pressable
      onPress={() => router.push('/login')}
      onPressIn={pressIn}
      onPressOut={pressOut}
    >
      <Animated.View style={[styles.loginButton, { transform: [{ scale }] }]}>
        <Text style={styles.loginButtonText}>Войти</Text>
      </Animated.View>
    </Pressable>
  )
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Loader label="Загрузка..." />
      </View>
    )
  }

  const avatarUri = user
    ? imageUrl(user.avatar?.optimized?.preview || user.avatar?.preview)
    : undefined

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing(6) }}
    >
      <Text style={styles.title}>Профиль</Text>

      {user ? (
        <View style={styles.userHeader}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {user.nickname?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <Text style={styles.nickname}>{user.nickname}</Text>
        </View>
      ) : (
        <View style={styles.loggedOutWrap}>
          <View style={styles.loggedOutIconCircle}>
            <Ionicons name="person" size={30} color={colors.textDim} />
          </View>
          <Text style={styles.loggedOutTitle}>Вы не вошли в аккаунт</Text>
          <Text style={styles.loggedOutText}>
            Войдите в аккаунт AniLiberty, чтобы синхронизировать избранное, списки и историю
            просмотра между устройствами
          </Text>
          <LoginButton />
        </View>
      )}

      <View style={styles.section}>
        <ProfileRow
          icon="star-outline"
          label="Понравилось"
          onPress={() => router.push('/wishlist')}
        />
        {user && (
          <>
            <ProfileRow
              icon="list-outline"
              label="Мои списки"
              onPress={() => router.push('/account/lists')}
            />
            <ProfileRow
              icon="time-outline"
              label="История"
              onPress={() => router.push('/account/history')}
            />
          </>
        )}
      </View>

      {user && (
        <View style={styles.section}>
          <ProfileRow icon="log-out-outline" label="Выйти" onPress={logout} danger />
        </View>
      )}

      <Footer />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    paddingHorizontal: spacing(4),
    marginTop: spacing(2),
    marginBottom: spacing(4),
  },
  userHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing(4),
    marginBottom: spacing(6),
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
  nickname: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing(3),
  },
  loggedOutWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing(6),
    marginBottom: spacing(6),
  },
  loggedOutIconCircle: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedOutTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing(4),
    textAlign: 'center',
  },
  loggedOutText: {
    color: colors.textFaint,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing(2),
    lineHeight: 18,
  },
  loginButton: {
    marginTop: spacing(5),
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing(8),
    paddingVertical: spacing(3),
  },
  loginButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: spacing(4),
    marginBottom: spacing(4),
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
  },
  rowLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  rowLabelDanger: {
    color: colors.accent,
  },
})
