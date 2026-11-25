import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi, ridesApi } from '../../services/api';
import { Avatar, Badge, Button, Card, ErrorView, LoadingView, Screen } from '../../components/ui';
import { formatCurrency, formatSmartDateTime, formatRelative } from '../../lib/format';
import { colors, radius, spacing, typography } from '../../theme';
import type { DriverRidesStackParamList, DriverTabParamList, RootStackParamList } from '../../navigation/types';
import type { Ride } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList & DriverTabParamList & DriverRidesStackParamList>;

const ACTIVE = new Set(['DRAFT', 'PUBLISHED', 'FULL', 'IN_PROGRESS']);

export function DriverRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const ridesQuery = useQuery({ queryKey: ['rides', 'mine'], queryFn: ridesApi.mine });
  const rides = (ridesQuery.data ?? []).filter((ride) => ACTIVE.has(ride.status));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && rides.length > 0) setSelectedId(rides[0].id);
    if (selectedId && rides.length > 0 && !rides.some((ride) => ride.id === selectedId)) {
      setSelectedId(rides[0].id);
    }
  }, [rides, selectedId]);

  const selectedRide = rides.find((ride) => ride.id === selectedId) ?? null;
  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'ride', selectedId],
    queryFn: () => bookingsApi.forRide(selectedId as string),
    enabled: Boolean(selectedId),
  });

  const bookings = bookingsQuery.data ?? [];
  const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS');
  const seatsBooked = confirmed.reduce((sum, booking) => sum + booking.seats, 0);
  const valueBooked = confirmed.reduce((sum, booking) => sum + booking.fareAmount, 0);

  return (
    <Screen
      refreshing={ridesQuery.isRefetching || bookingsQuery.isRefetching}
      onRefresh={() => {
        void ridesQuery.refetch();
        if (selectedId) void bookingsQuery.refetch();
      }}
    >
      <Text style={styles.title}>Passenger requests</Text>
      <Text style={styles.subtitle}>Seat bookings for the rides you publish.</Text>

      {ridesQuery.isLoading ? <LoadingView label="Loading your rides…" /> : null}
      {ridesQuery.isError ? (
        <ErrorView title="Could not load rides" description="Check the backend connection and retry." onRetry={() => void ridesQuery.refetch()} />
      ) : null}

      {ridesQuery.isSuccess && rides.length === 0 ? (
        <Card style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={26} color={colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>No active rides</Text>
          <Text style={styles.emptyCopy}>Publish a ride to see passenger bookings and seat counts here.</Text>
          <Button
            title="Publish a ride"
            onPress={() => navigation.navigate('DriverRides', { screen: 'PublishRide' })}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : null}

      {rides.length > 0 ? (
        <>
          <Text style={styles.pickLabel}>SELECT RIDE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ridePicker}>
            {rides.map((ride) => (
              <RideTab key={ride.id} ride={ride} active={ride.id === selectedId} onPress={() => setSelectedId(ride.id)} />
            ))}
          </ScrollView>
        </>
      ) : null}

      {selectedRide ? (
        <>
          <Card style={styles.summary}>
            <View style={styles.summaryTop}>
              <Badge label={selectedRide.status} />
              <Text style={styles.summaryTime}>{formatSmartDateTime(selectedRide.departureTime)}</Text>
            </View>
            <Text style={styles.summaryRoute}>{selectedRide.originAddress} → {selectedRide.destAddress}</Text>
            <View style={styles.summaryStats}>
              <SummaryStat label="Bookings" value={String(bookings.length)} />
              <SummaryStat label="Seats booked" value={`${seatsBooked}/${selectedRide.totalSeats}`} />
              <SummaryStat label="Seat value" value={formatCurrency(valueBooked)} />
            </View>
            <Button
              title="Manage this ride"
              variant="outline"
              onPress={() => navigation.navigate('DriverRides', { screen: 'MyRides' })}
              style={{ marginTop: spacing.md }}
            />
          </Card>

          <View style={styles.info}>
            <Ionicons name="information-circle-outline" size={16} color={colors.ink500} />
            <Text style={styles.infoText}>
              Bookings are auto-confirmed by the backend. There is no accept/reject endpoint, so this app does not show those
              actions.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Booked passengers</Text>
          {bookingsQuery.isLoading ? <LoadingView label="Loading passenger bookings…" /> : null}
          {bookingsQuery.isError ? (
            <ErrorView
              title="Could not load bookings"
              description="Try again when the backend is reachable."
              onRetry={() => void bookingsQuery.refetch()}
            />
          ) : null}
          {bookingsQuery.isSuccess && bookings.length === 0 ? (
            <Card style={styles.emptySmall}>
              <Text style={styles.emptyTitle}>No passengers yet</Text>
              <Text style={styles.emptyCopy}>New bookings for this ride will appear here automatically.</Text>
            </Card>
          ) : null}

          {bookings.map((booking) => (
            <Card key={booking.id} style={styles.booking}>
              <View style={styles.bookingTop}>
                <Avatar name={booking.passengerName} size={38} />
                <View style={styles.fill}>
                  <Text style={styles.passenger}>{booking.passengerName || 'Passenger'}</Text>
                  <Text style={styles.bookingMeta}>
                    {booking.seats} {booking.seats === 1 ? 'seat' : 'seats'} · {formatRelative(booking.createdAt)}
                  </Text>
                </View>
                <Badge label={booking.status} tone={booking.status === 'CONFIRMED' ? 'success' : 'neutral'} />
              </View>
              <View style={styles.bookingBottom}>
                <Text style={styles.bookingRef}>#{booking.id.slice(0, 8)}</Text>
                <Text style={styles.bookingFare}>{formatCurrency(booking.totalAmount)}</Text>
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

function RideTab({ ride, active, onPress }: { ride: Ride; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.rideTab, active && styles.rideTabActive, pressed && { opacity: 0.85 }]}>
      <Text style={[styles.rideTabTime, active && styles.rideTabTimeActive]}>{formatSmartDateTime(ride.departureTime)}</Text>
      <Text style={[styles.rideTabRoute, active && styles.rideTabRouteActive]} numberOfLines={1}>
        {ride.originAddress.split(',')[0]} → {ride.destAddress.split(',')[0]}
      </Text>
      <Text style={[styles.rideTabSeats, active && styles.rideTabSeatsActive]}>
        {ride.totalSeats - ride.availableSeats}/{ride.totalSeats} booked
      </Text>
    </Pressable>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryStatValue}>{value}</Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  title: { ...typography.h1, marginTop: spacing.sm },
  subtitle: { ...typography.body, marginTop: 4 },
  pickLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7, color: colors.ink400, marginTop: spacing.lg, marginBottom: spacing.sm },
  ridePicker: { gap: spacing.sm, paddingBottom: spacing.sm },
  rideTab: {
    width: 190,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  rideTabActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  rideTabTime: { fontSize: 10, fontWeight: '700', color: colors.ink500 },
  rideTabTimeActive: { color: colors.brandDark },
  rideTabRoute: { fontSize: 13, fontWeight: '800', color: colors.ink800, marginTop: 3 },
  rideTabRouteActive: { color: colors.brandDark },
  rideTabSeats: { fontSize: 10, color: colors.ink500, marginTop: 3 },
  rideTabSeatsActive: { color: colors.brandDark },
  summary: { marginTop: spacing.sm },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTime: { fontSize: 11, color: colors.ink500 },
  summaryRoute: { fontSize: 14, fontWeight: '700', color: colors.ink800, marginTop: spacing.md, lineHeight: 20 },
  summaryStats: { flexDirection: 'row', marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.ink100, paddingTop: spacing.md },
  summaryStat: { flex: 1 },
  summaryStatValue: { fontSize: 16, fontWeight: '800', color: colors.ink },
  summaryStatLabel: { fontSize: 10, color: colors.ink500, marginTop: 1 },
  info: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: spacing.md, paddingHorizontal: 2 },
  infoText: { flex: 1, fontSize: 10, color: colors.ink500, lineHeight: 15 },
  sectionTitle: { ...typography.h3, marginTop: spacing.xl, marginBottom: spacing.sm },
  booking: { marginBottom: spacing.sm },
  bookingTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  passenger: { fontSize: 13, fontWeight: '800', color: colors.ink800 },
  bookingMeta: { fontSize: 11, color: colors.ink500, marginTop: 2 },
  bookingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.ink100 },
  bookingRef: { fontSize: 10, color: colors.ink400 },
  bookingFare: { fontSize: 15, fontWeight: '800', color: colors.ink },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, marginTop: spacing.lg },
  emptySmall: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  emptyCopy: { ...typography.caption, textAlign: 'center', marginTop: 5, lineHeight: 17 },
});
