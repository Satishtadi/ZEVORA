import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { getApiErrorMessage } from '../../lib/api';
import { Button, Card, Screen, TextField } from '../../components/ui';
import { colors, radius, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const DEMOS = [
  { label: 'Passenger demo', identifier: 'passenger@zevora.in', password: 'Passenger@123!' },
  { label: 'Driver demo', identifier: 'driver1@zevora.in', password: 'Driver@123!' },
];

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!identifier.trim() || !password) {
      setError('Enter your email/phone and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sign in failed. Check your credentials.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Z</Text>
        </View>
        <Text style={styles.brand}>ZEVORA</Text>
        <Text style={styles.tagline}>Move Smart. Travel Together.</Text>
      </View>

      <View style={styles.intro}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to find shared rides across Hyderabad.</Text>
      </View>

      <Card>
        <TextField
          label="Email or phone"
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
        />
        <View>
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            style={{ paddingRight: 48 }}
          />
          <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.eye} hitSlop={10}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.ink400} />
          </Pressable>
        </View>

        {error ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button title="Sign in" onPress={submit} loading={loading} style={{ marginTop: spacing.sm }} />

        <Text style={styles.demoLabel}>Try a seeded demo account</Text>
        <View style={styles.demoRow}>
          {DEMOS.map((demo) => (
            <Pressable
              key={demo.identifier}
              onPress={() => {
                setIdentifier(demo.identifier);
                setPassword(demo.password);
                setError(null);
              }}
              style={({ pressed }) => [styles.demoChip, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.demoChipText}>{demo.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to ZEVORA?</Text>
        <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
          <Text style={styles.link}>Create a passenger account</Text>
        </Pressable>
      </View>
      <Text style={styles.note}>Admin, corporate and operator portals are available on the ZEVORA web app.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: colors.white, fontSize: 28, fontWeight: '900' },
  brand: { marginTop: spacing.md, fontSize: 22, fontWeight: '900', letterSpacing: 3, color: colors.ink },
  tagline: { ...typography.caption, marginTop: 4, letterSpacing: 0.2 },
  intro: { marginBottom: spacing.lg },
  title: { ...typography.h1 },
  subtitle: { ...typography.body, marginTop: 6 },
  eye: { position: 'absolute', right: spacing.md, top: 40 },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: { flex: 1, fontSize: 12, color: '#b42323', fontWeight: '600', lineHeight: 17 },
  demoLabel: { ...typography.caption, marginTop: spacing.lg, marginBottom: spacing.sm, fontWeight: '700' },
  demoRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  demoChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  demoChipText: { fontSize: 12, color: colors.brandDark, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.xl, flexWrap: 'wrap' },
  footerText: { ...typography.body },
  link: { fontSize: 14, fontWeight: '800', color: colors.brand },
  note: { ...typography.caption, textAlign: 'center', marginTop: spacing.lg, lineHeight: 17 },
});
