export const colors = {
  background: '#0A0A13',
  surface: '#12121D',
  surfaceCard: '#161623',
  surfaceRaised: '#1C1C2C',
  accent: '#FF3D5A',
  accent2: '#FF8A4C',
  accentSoft: 'rgba(255,61,90,0.16)',
  text: '#F4F3F7',
  textDim: 'rgba(244,243,247,0.64)',
  textFaint: 'rgba(244,243,247,0.38)',
  border: 'rgba(244,243,247,0.08)',
  overlay: 'rgba(5,5,10,0.6)',
}

export const gradients = {
  accent: [colors.accent, colors.accent2] as const,
  scrim: ['transparent', colors.background] as const,
}

export const radius = {
  sm: 7,
  md: 12,
  lg: 18,
  full: 999,
}

export const spacing = (n: number) => n * 4

export const font = {
  display: 'Inter_800ExtraBold',
  heading: 'Inter_700Bold',
  medium: 'Inter_600SemiBold',
  body: 'Inter_500Medium',
  regular: 'Inter_400Regular',
  mono: 'SpaceMono_700Bold',
  monoRegular: 'SpaceMono_400Regular',
}

export const motion = {
  ease: [0.16, 1, 0.3, 1] as const,
  fast: 220,
  base: 380,
  slow: 550,
}

export const label = {
  fontFamily: font.mono,
  fontSize: 10,
  letterSpacing: 0.9,
  textTransform: 'uppercase' as const,
}
