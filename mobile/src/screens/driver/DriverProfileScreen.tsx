import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { driversApi } from '../../services/api';
import { Avatar, Badge, Button, Card, Divider, ErrorView, LoadingView, Screen } from '../../components/ui';
import { roleLabels } from '../../lib/roles';
import { colors, radius, spacing, typography } from '../../theme';
import type { DriverTabParamList, RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList & DriverTabParamList>;

export function DriverProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const query = useQuery({ queryKey: ['driver', 'profile'], queryFn: driversApi.profile });
  const driver = query.data;

  function confirmLogout() {
    Alert.alert('Sign out?', 'You will need to sign in again to manage your rides.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Driver profile</Text>
        <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.bell} hitSlop={8}>
          <Ionicons name="notifications-outline" size={21} color={colors.ink800} />
        </Pressable>
      </View>

      {query.isLoading ? <LoadingView label="Loading driver profile…" /> : null}
      {query.isError || !driver ? (
        <ErrorView
          title="Driver profile unavailable"
          description="Contact support or register as a driver from the passenger profile."
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {driver ? (
        <>
          <Card style={styles.hero}>
            <View style={styles.identity}>
              <Avatar name={driver.fullName} size={58} />
              <View style={styles.fill}>
                <Text style={styles.name}>{driver.fullName}</Text>
                <Text style={styles.email}>{driver.email}</Text>
                <View style={styles.badges}>
                  <Badge label={driver.status} tone={driver.status === 'APPROVED' ? 'success' : driver.status === 'REJECTED' ? 'danger' : 'warning'} />
                  <Badge label={driver.driverType} tone="brand" />
                </View>
              </View>
            </View>
            <Divider />
            <View style={styles.stats}>
              <Stat value={Number(driver.rating ?? 0).toFixed(1)} label="Rating" />
              <Stat value={String(driver.totalRides)} label="Rides" />
              <Stat value={String(driver.vehicles.length)} label="Vehicles" />
            </View>
          </Card>

          <Text style={styles.section}>Verification</Text>
          <Card>
            <VerifyRow label="Driver profile" description={`Status: ${driver.status}`} verified={driver.status === 'APPROVED'} />
            <Divider />
            <VerifyRow label="Driving licence" description={driver.licenseNumber} verified={driver.licenseVerified} />
            <Divider />
            <VerifyRow label="Identity" description="Checked by ZEVORA operations" verified={driver.identityVerified} />
            <Text style={styles.note}>
              Verification is managed by admins on the web portal. Document upload is not exposed in the mobile app.
            </Text>
          </Card>

          <Text style={styles.section}>Vehicles</Text>
          <Card>
            {driver.vehicles.length === 0 ? (
              <Text style={styles.note}>No vehicles on file. Add one to begin verification.</Text>
            ) : (
              driver.vehicles.map((vehicle, index) => (
                <View key={vehicle.id}>
                  {index > 0 ? <Divider /> : null}
                  <View style={styles.vehicleRow}>
                    <View style={styles.vehicleIcon}>
                      <Ionicons name="car-outline" size={18} color={colors.brand} />
                    </View>
                    <View style={styles.fill}>
                      <Text style={styles.vehicleName}>
                        {[vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle'}
                      </Text>
                      <Text style={styles.vehicleMeta}>{vehicle.plateNumber} · {vehicle.seatCapacity} seats</Text>
                    </View>
                    <Badge label={vehicle.verified ? 'Verified' : 'Pending'} tone={vehicle.verified ? 'success' : 'warning'} />
                  </View>
                </View>
              ))
            )}
            <Button
              title="Manage vehicles"
              variant="outline"
              onPress={() => navigation.navigate('DriverVehicles')}
              style={{ marginTop: spacing.md }}
            />
          </Card>

          <Text style={styles.section}>Account</Text>
          <Card>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Phone</Text>
              <Text style={styles.accountValue}>{driver.phone}</Text>
            </View>
            <Divider />
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Role</Text>
              <Text style={styles.accountValue}>{user ? roleLabels[user.role] : driver.driverType}</Text>
            </View>
            <Divider />
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Availability</Text>
              <Text style={styles.accountValue}>{driver.available ? 'Online' : 'Offline'}</Text>
            </View>
          </Card>

          <Pressable onPress={() => void Linking.openURL('tel:112')} style={styles.emergency}>
            <Ionicons name="call" size={18} color={colors.danger} />
            <View style={styles.fill}>
              <Text style={styles.emergencyTitle}>Emergency: call 112</Text>
              <Text style={styles.emergencyCopy}>Police, ambulance and fire response across India.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
          </Pressable>

          <Button title="Sign out" variant="outline" onPress={confirmLogout} style={{ marginTop: spacing.lg }} />

          <Text style={styles.footer}>
            ZEVORA mobile supports the driver journey. Corporate, operator and admin tools are available on the web app.
          </Text>
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function VerifyRow({ label, description, verified }: { label: string; description: string; verified: boolean }) {
  return (
    <View style={styles.verifyRow}>
      <View style={[styles.verifyIcon, { backgroundColor: verified ? colors.mintSoft : colors.amberSoft }]}>
        <Ionicons name={verified ? 'checkmark' : 'time-outline'} size={17} color={verified ? colors.mint : colors.amber} />
      </View>
      <View style={styles.fill}>
        <Text style={styles.verifyLabel}>{label}</Text>
        <Text style={styles.verifyDescription}>{description}</Text>
      </View>
      <Badge label={verified ? 'Verified' : 'Pending'} tone={verified ? 'success' : 'warning'} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  title: { ...typography.h1 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { marginTop: spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontSize: 18, fontWeight: '800', color: colors.ink },
  email: { ...typography.caption, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: spacing.sm, flexWrap: 'wrap' },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 10, color: colors.ink500, marginTop: 1 },
  section: { ...typography.h3, marginTop: spacing.xl, marginBottom: spacing.sm },
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  verifyIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  verifyLabel: { fontSize: 13, fontWeight: '700', color: colors.ink800 },
  verifyDescription: { fontSize: 11, color: colors.ink500, marginTop: 1 },
  note: { ...typography.caption, marginTop: spacing.md, lineHeight: 16, fontSize: 10 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 },
  vehicleIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  vehicleName: { fontSize: 13, fontWeight: '700', color: colors.ink800 },
  vehicleMeta: { fontSize: 11, color: colors.ink500, marginTop: 1 },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 3 },
  accountLabel: { fontSize: 12, color: colors.ink500 },
  accountValue: { fontSize: 12, fontWeight: '700', color: colors.ink800, textAlign: 'right' },
  emergency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  emergencyTitle: { fontSize: 13, fontWeight: '800', color: '#b42323' },
  emergencyCopy: { fontSize: 10, color: '#b42323', marginTop: 2, lineHeight: 15 },
  footer: { ...typography.caption, textAlign: 'center', marginTop: spacing.lg, fontSize: 10, lineHeight: 16 },
});
