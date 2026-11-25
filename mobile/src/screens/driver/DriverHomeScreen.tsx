import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useAuth } from '../../lib/auth';
import { driversApi, ridesApi } from '../../services/api';
import { getApiErrorMessage } from '../../lib/api';
import { DriverRideCard } from '../../components/DriverRideCard';
import { Badge, Button, Card, ErrorView, LoadingView, Screen, SectionTitle } from '../../components/ui';
import { formatCurrency } from '../../lib/format';
import { colors, radius, spacing, typography } from '../../theme';
import type { DriverTabParamList, RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList & DriverTabParamList>;

async function coordinates() {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}

export function DriverHomeScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const profileQuery = useQuery({ queryKey: ['driver', 'profile'], queryFn: driversApi.profile });
  const ridesQuery = useQuery({ queryKey: ['rides', 'mine'], queryFn: ridesApi.mine });

  const availabilityMutation = useMutation({
    mutationFn: async (available: boolean) => {
      const coords = available ? await coordinates() : null;
      return driversApi.setAvailability(available, coords?.latitude, coords?.longitude);
    },
    onSuccess: async () => {
      setAvailabilityError(null);
      await queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] });
    },
    onError: (err) => setAvailabilityError(getApiErrorMessage(err, 'Could not update availability.')),
  });

  const driver = profileQuery.data;
  const rides = ridesQuery.data ?? [];
  const activeRides = rides.filter((ride) => ride.status === 'PUBLISHED' || ride.status === 'IN_PROGRESS' || ride.status === 'FULL');
  const firstName = user?.fullName?.split(' ')[0] ?? 'Driver';
  const approved = driver?.status === 'APPROVED';

  return (
    <Screen
      refreshing={profileQuery.isRefetching || ridesQuery.isRefetching}
      onRefresh={() => {
        void profileQuery.refetch();
        void ridesQuery.refetch();
      }}
    >
      <Text style={styles.greeting}>Driver dashboard</Text>
      <Text style={styles.name}>Hello, {firstName}</Text>

      {profileQuery.isLoading ? <LoadingView label="Loading driver profile…" /> : null}
      {profileQuery.isError ? (
        <ErrorView
          title="Driver profile unavailable"
          description="This account has no driver profile, or the backend is offline. Register as a driver from the passenger profile first."
          onRetry={() => void profileQuery.refetch()}
        />
      ) : null}

      {driver ? (
        <>
          <View style={[styles.hero, !approved && styles.heroPending]}>
            <View style={styles.heroTop}>
              <View style={styles.fill}>
                <Text style={styles.heroLabel}>AVAILABILITY</Text>
                <Text style={styles.heroTitle}>{driver.available ? 'Ready for ride requests' : 'Offline for new rides'}</Text>
                <Text style={styles.heroCopy}>
                  {driver.available
                    ? 'Passengers can see your published rides. Toggle off when you finish driving.'
                    : 'Publish rides at any time. Availability communicates that you are online.'}
                </Text>
              </View>
              <Switch
                value={driver.available}
                disabled={availabilityMutation.isPending}
                onValueChange={(value) => availabilityMutation.mutate(value)}
                trackColor={{ false: 'rgba(255,255,255,0.25)', true: colors.mint }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.heroBadges}>
              <Badge label={driver.status} tone={approved ? 'success' : driver.status === 'REJECTED' ? 'danger' : 'warning'} />
              <Badge label={driver.driverType} />
              <Badge label={driver.licenseVerified ? 'License verified' : 'License pending'} tone={driver.licenseVerified ? 'success' : 'warning'} />
            </View>
          </View>

          {availabilityError ? <Text style={styles.error}>{availabilityError}</Text> : null}
          {!approved ? (
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={18} color={colors.amber} />
              <Text style={styles.noticeText}>
                Ride publishing requires APPROVED driver status. An admin must verify your profile and license from the web
                portal before you can publish.
              </Text>
            </View>
          ) : null}

          <View style={styles.stats}>
            <Stat icon="star" label="Rating" value={Number(driver.rating ?? 0).toFixed(1)} />
            <Stat icon="car-sport" label="Rides" value={String(driver.totalRides)} />
            <Stat icon="albums" label="Vehicles" value={String(driver.vehicles.length)} />
          </View>

          <View style={styles.quickRow}>
            <Quick icon="add-circle-outline" label="Publish ride" onPress={() => navigation.navigate('DriverRides', { screen: 'PublishRide' })} />
            <Quick icon="list-outline" label="My rides" onPress={() => navigation.navigate('DriverRides', { screen: 'MyRides' })} />
            <Quick icon="people-outline" label="Requests" onPress={() => navigation.navigate('DriverRequests')} />
          </View>

          <SectionTitle
            action={
              <Pressable onPress={() => navigation.navigate('DriverRides', { screen: 'MyRides' })}>
                <Text style={styles.link}>View all</Text>
              </Pressable>
            }
          >
            Active rides
          </SectionTitle>
          {ridesQuery.isLoading ? <LoadingView label="Loading your rides…" /> : null}
          {ridesQuery.isError ? (
            <ErrorView title="Could not load rides" onRetry={() => void ridesQuery.refetch()} />
          ) : null}
          {ridesQuery.isSuccess && activeRides.length === 0 ? (
            <Card style={styles.empty}>
              <Text style={styles.emptyTitle}>No active rides</Text>
              <Text style={styles.emptyCopy}>Publish a seat to start receiving passenger bookings.</Text>
              {approved ? (
                <Button
                  title="Publish a ride"
                  variant="outline"
                  onPress={() => navigation.navigate('DriverRides', { screen: 'PublishRide' })}
                  style={{ marginTop: spacing.md }}
                />
              ) : null}
            </Card>
          ) : null}
          {activeRides.slice(0, 3).map((ride) => (
            <DriverRideCard
              key={ride.id}
              ride={ride}
              onPress={() => navigation.navigate('DriverRequests')}
            />
          ))}

          <Card style={styles.earnings}>
            <View>
              <Text style={styles.earningsLabel}>FARE VALUE ON ACTIVE RIDES</Text>
              <Text style={styles.earningsValue}>
                {formatCurrency(activeRides.reduce((sum, ride) => sum + ride.pricePerSeat * (ride.totalSeats - ride.availableSeats), 0))}
              </Text>
            </View>
            <Text style={styles.earningsNote}>
              Estimated booked seat value. Settlement and payout workflows are not exposed by the backend API yet.
            </Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={17} color={colors.brand} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Quick({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, pressed && { opacity: 0.8 }]}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={20} color={colors.brandDark} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  greeting: { ...typography.caption, fontSize: 13, marginTop: spacing.sm },
  name: { ...typography.h1, marginTop: 1, marginBottom: spacing.lg, fontSize: 28 },
  hero: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: spacing.lg },
  heroPending: { backgroundColor: '#20263a' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: 'rgba(255,255,255,0.55)' },
  heroTitle: { fontSize: 18, fontWeight: '800', color: colors.white, marginTop: 3 },
  heroCopy: { fontSize: 11, color: 'rgba(255,255,255,0.66)', lineHeight: 16, marginTop: 5 },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  error: { fontSize: 12, color: colors.danger, fontWeight: '600', marginTop: spacing.sm },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  noticeText: { flex: 1, fontSize: 11, color: '#8a5a00', lineHeight: 16 },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink100,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 19, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 10, color: colors.ink500 },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  quick: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink100,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  quickIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', color: colors.ink600 },
  link: { fontSize: 12, fontWeight: '800', color: colors.brand },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  emptyCopy: { ...typography.caption, textAlign: 'center', marginTop: 5, lineHeight: 17 },
  earnings: { marginTop: spacing.md, backgroundColor: colors.brandSoft, borderColor: '#ddd7ff' },
  earningsLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7, color: colors.brandDark },
  earningsValue: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 3 },
  earningsNote: { fontSize: 10, color: colors.ink500, marginTop: spacing.sm, lineHeight: 15 },
});
