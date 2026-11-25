import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { roleLabels } from '../lib/roles';
import { Avatar, Badge, Button, Card, Screen } from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';

export function PortalUnsupportedScreen() {
  const { user, logout } = useAuth();

  function confirmLogout() {
    Alert.alert('Sign out?', 'You will return to the ZEVORA sign-in screen.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.icon}>
          <Ionicons name="desktop-outline" size={30} color={colors.brand} />
        </View>
        <Badge label="Web portal required" tone="warning" />
        <Text style={styles.title}>Use the ZEVORA web app</Text>
        <Text style={styles.copy}>
          Your role is managed from a desktop workspace. The mobile app currently supports passenger and driver journeys only.
        </Text>
      </View>

      {user ? (
        <Card style={styles.account}>
          <View style={styles.identity}>
            <Avatar name={user.fullName} size={48} />
            <View style={styles.fill}>
              <Text style={styles.name}>{user.fullName}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
            <Badge label={roleLabels[user.role] ?? user.role} tone="brand" />
          </View>
        </Card>
      ) : null}

      <Text style={styles.section}>Continue on the web</Text>
      <Card>
        <Row icon="shield-checkmark-outline" title="Admin" copy="Users, drivers, safety, pricing, reports, audit logs and settings." />
        <Row icon="business-outline" title="Corporate" copy="Employees, office locations, company shuttles and reports." />
        <Row icon="bus-outline" title="Operator" copy="Routes, schedules, fleet, drivers and settlements." />
      </Card>
      <Text style={styles.note}>
        Sign in to the same web deployment with this account. Mobile admin tools are intentionally out of scope for this release.
      </Text>

      <Button title="Sign out" variant="outline" onPress={confirmLogout} style={{ marginTop: spacing.xl }} />
      <Text style={styles.footer}>ZEVORA · Move Smart. Travel Together.</Text>
    </Screen>
  );
}

function Row({ icon, title, copy }: { icon: keyof typeof Ionicons.glyphMap; title: string; copy: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.brandDark} />
      </View>
      <View style={styles.fill}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowCopy}>{copy}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hero: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h1, textAlign: 'center', fontSize: 28, marginTop: spacing.md },
  copy: { ...typography.body, textAlign: 'center', marginTop: spacing.sm, lineHeight: 21 },
  account: {},
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: 15, fontWeight: '800', color: colors.ink },
  email: { ...typography.caption, marginTop: 2 },
  section: { ...typography.h3, marginTop: spacing.xl, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  rowIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 13, fontWeight: '800', color: colors.ink800 },
  rowCopy: { fontSize: 11, color: colors.ink500, marginTop: 2, lineHeight: 16 },
  note: { ...typography.caption, textAlign: 'center', marginTop: spacing.md, lineHeight: 17 },
  footer: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl, fontSize: 10 },
});
