import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, statusTone, typography } from '../theme';

export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  padded = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
}) {
  const contentStyle = [styles.screenContent, padded && styles.screenPadding];
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, padded && styles.screenPadding]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.ink800} />
        </Pressable>
      ) : null}
      <View style={styles.fill}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: keyof typeof typography }) {
  return <Text {...props} style={[typography[variant], style]} />;
}

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  left,
  right,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  left?: ReactNode;
  right?: ReactNode;
  style?: ViewStyle;
}) {
  const palette: Record<ButtonVariant, { bg: string; border: string; text: string; spinner: string }> = {
    primary: { bg: colors.brand, border: colors.brand, text: colors.white, spinner: colors.white },
    secondary: { bg: colors.ink, border: colors.ink, text: colors.white, spinner: colors.white },
    outline: { bg: colors.white, border: colors.ink200, text: colors.ink800, spinner: colors.brand },
    ghost: { bg: 'transparent', border: 'transparent', text: colors.ink600, spinner: colors.brand },
    danger: { bg: colors.danger, border: colors.danger, text: colors.white, spinner: colors.white },
  };
  const tone = palette[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: tone.bg, borderColor: tone.border },
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading ? styles.pressed : null,
        style,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={tone.spinner} />
      ) : (
        <View style={styles.buttonInner}>
          {left}
          <Text style={[styles.buttonLabel, { color: tone.text }]}>{title}</Text>
          {right}
        </View>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, tone }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand' }) {
  const custom = {
    neutral: { bg: colors.ink100, text: colors.ink600 },
    success: { bg: colors.mintSoft, text: '#0d8f80' },
    warning: { bg: colors.amberSoft, text: '#a16207' },
    danger: { bg: colors.dangerSoft, text: '#b42323' },
    brand: { bg: colors.brandSoft, text: colors.brandDark },
  }[tone ?? 'neutral'];
  const palette = statusTone[label] ?? custom;
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>{label.replace(/_/g, ' ')}</Text>
    </View>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function TextField({ label, hint, error, style, ...props }: TextInputProps & { label?: string; hint?: string; error?: string }) {
  return (
    <Field label={label} hint={hint} error={error}>
      <TextInput
        placeholderTextColor={colors.ink400}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
    </Field>
  );
}

export function SeatStepper({
  value,
  onChange,
  min = 1,
  max = 4,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={({ pressed }) => [styles.stepperButton, value <= min && styles.buttonDisabled, pressed && styles.pressed]}
        accessibilityLabel="Remove a seat"
      >
        <Ionicons name="remove" size={20} color={value <= min ? colors.ink400 : colors.ink800} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={({ pressed }) => [styles.stepperButton, value >= max && styles.buttonDisabled, pressed && styles.pressed]}
        accessibilityLabel="Add a seat"
      >
        <Ionicons name="add" size={20} color={value >= max ? colors.ink400 : colors.ink800} />
      </Pressable>
    </View>
  );
}

export function Avatar({ name, size = 44 }: { name?: string | null; size?: number }) {
  const label = (name ?? 'Z')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.brandDark, fontWeight: '800', fontSize: size * 0.36 }}>{label}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.brand} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function ErrorView({ title = 'Something went wrong', description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <View style={styles.state}>
      <View style={[styles.stateIcon, { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {description ? <Text style={styles.stateText}>{description}</Text> : null}
      {onRetry ? <Button title="Try again" variant="outline" onPress={onRetry} style={{ marginTop: spacing.md }} /> : null}
    </View>
  );
}

export function EmptyView({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Ionicons name="leaf-outline" size={26} color={colors.brand} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {description ? <Text style={styles.stateText}>{description}</Text> : null}
      {action ? <View style={{ marginTop: spacing.md }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  screenContent: { paddingBottom: spacing.xxl },
  screenPadding: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h2 },
  headerSubtitle: { ...typography.caption, marginTop: 2, lineHeight: 17 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3 },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  buttonLabel: { fontSize: 15, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.82 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ink100,
    ...shadow,
  },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  field: { gap: 6, marginBottom: spacing.md },
  fieldLabel: { ...typography.label },
  fieldHint: { ...typography.caption },
  fieldError: { fontSize: 12, color: colors.danger, fontWeight: '600' },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.ink,
  },
  inputError: { borderColor: colors.danger },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepperButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { fontSize: 20, fontWeight: '800', color: colors.ink, minWidth: 26, textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.ink100, marginVertical: spacing.md },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.ink600 },
  chipTextActive: { color: colors.brandDark },
  state: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  stateIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  stateTitle: { fontSize: 17, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  stateText: { ...typography.caption, marginTop: 6, textAlign: 'center', lineHeight: 19 },
});
