import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useAuth } from '../src/lib/AuthContext'
import { colors, font, radius, spacing } from '../src/lib/theme'
import AnimatedPressable from '../src/components/AnimatedPressable'
import AccentGradient from '../src/components/AccentGradient'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { login, error, clearError } = useAuth()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit() {
    if (!loginValue.trim() || !password) return
    setSubmitting(true)
    try {
      await login(loginValue.trim(), password)
      router.back()
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = !submitting && !!loginValue.trim() && !!password

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + spacing(4) }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable
        hitSlop={12}
        onPress={() => router.back()}
        style={[styles.closeButton, { top: insets.top + spacing(2) }]}
      >
        <Ionicons name="close" size={22} color={colors.textDim} />
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Вход в AniLiberty</Text>
        <Text style={styles.subtitle}>Используй логин и пароль своего аккаунта на aniliberty.top</Text>

        <View style={styles.form}>
          <TextInput
            value={loginValue}
            onChangeText={(v) => {
              setLoginValue(v)
              clearError()
            }}
            placeholder="Логин или email"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={(v) => {
              setPassword(v)
              clearError()
            }}
            placeholder="Пароль"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={{ marginTop: spacing(6), opacity: canSubmit ? 1 : 0.4 }}>
          <AnimatedPressable onPress={onSubmit} disabled={!canSubmit} haptic>
            <AccentGradient style={styles.submitButton}>
              <Text style={styles.submitText}>{submitting ? '...' : 'Войти'}</Text>
            </AccentGradient>
          </AnimatedPressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    right: spacing(4),
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing(6),
  },
  title: {
    color: colors.text,
    fontFamily: font.heading,
    fontSize: 22,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textFaint,
    fontFamily: font.regular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing(2),
    lineHeight: 18,
  },
  form: {
    marginTop: spacing(8),
    gap: spacing(3),
  },
  input: {
    backgroundColor: colors.surfaceCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    color: colors.text,
    fontFamily: font.body,
    fontSize: 15,
  },
  error: {
    color: colors.accent,
    fontFamily: font.body,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing(4),
  },
  submitButton: {
    borderRadius: radius.full,
    paddingVertical: spacing(3.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontFamily: font.heading,
    fontSize: 15,
  },
})
