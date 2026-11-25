import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { getApiErrorMessage } from '../../lib/api';
import { Button, Card, Screen, TextField } from '../../components/ui';
import { colors, radius, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      setError('Complete every field to create your account.');
      return;
    }
    if (!/^(\+91)?[6-9]\d{9}$/.test(phone.trim())) {
      setError('Enter a valid Indian mobile number, e.g. 9876543210.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      Alert.alert(
        'Account created',
        'You are signed in as a passenger. Phone/email verification is not connected in this frontend yet.',
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please review your details.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.ink800} />
        </Pressable>
        <View style={styles.badge}>
          <Ionicons name="leaf" size={14} color={colors.brand} />
          <Text style={styles.badgeText}>PASSENGER SIGN UP</Text>
        </View>
        <Text style={styles.title}>Join the shared commute</Text>
        <Text style={styles.subtitle}>Create a passenger account in under a minute.</Text>
      </View>

      <Card>
        <TextField
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your name"
          autoCapitalize="words"
          autoCorrect={false}
        />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="Indian mobile number"
          value={phone}
          onChangeText={setPhone}
          placeholder="9876543210"
          keyboardType="phone-pad"
          maxLength={13}
          hint="Used for account sign-in and safety follow-up."
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Re-enter password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        {error ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button title="Create account" onPress={submit} loading={loading} />

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={16} color={colors.ink500} />
          <Text style={styles.noticeText}>
            Registration creates a PASSENGER account. Driver onboarding is available after sign-in from the profile screen
            when the backend supports it.
          </Text>
        </View>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.link}>Sign in</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { marginTop: spacing.md, marginBottom: spacing.lg },
  back: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: spacing.md,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: colors.brandDark },
  title: { ...typography.h1 },
  subtitle: { ...typography.body, marginTop: 6 },
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
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.ink50,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  noticeText: { flex: 1, fontSize: 11, color: colors.ink500, lineHeight: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.xl },
  footerText: { ...typography.body },
  link: { fontSize: 14, fontWeight: '800', color: colors.brand },
});
