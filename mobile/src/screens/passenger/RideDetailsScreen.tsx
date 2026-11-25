import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, ridesApi } from '../../services/api';
import { getApiErrorMessage } from '../../lib/api';
import { ModalSheet } from '../../components/ModalSheet';
import { Badge, Button, Card, Divider, ErrorView, LoadingView, Screen, SeatStepper } from '../../components/ui';
import { formatCurrency, formatSmartDateTime } from '../../lib/format';
import { colors, radius, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RideDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'RideDetails'>>();
  const queryClient = useQueryClient();
  const [seats, setSeats] = useState(1);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rideQuery = useQuery({
    queryKey: ['ride', route.params.rideId],
    queryFn: () => ridesApi.get(route.params.rideId),
  });

  const bookingMutation = useMutation({
    mutationFn: (input: { seats: number; key: string }) =>
      bookingsApi.create(route.params.rideId, input.seats, input.key),
    onSuccess: async (booking) => {
      setBookingOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['rides'] }),
        queryClient.invalidateQueries({ queryKey: ['ride', route.params.rideId] }),
      ]);
      navigation.navigate('BookingDetails', { bookingId: booking.id });
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not reserve this seat.')),
  });

  const ride = rideQuery.data;
  const maxSeats = Math.min(4, ride?.availableSeats ?? 1);
  const canBook = Boolean(ride && ride.status === 'PUBLISHED' && ride.availableSeats > 0);

  if (rideQuery.isLoading) {
    return (
      <Screen>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.ink800} />
        </Pressable>
        <LoadingView label="Loading ride details…" />
      </Screen>
    );
  }

  if (rideQuery.isError || !ride) {
    return (
      <Screen>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.ink800} />
        </Pressable>
        <ErrorView
          title="Ride unavailable"
          description="This ride could not be loaded. It may have been cancelled or the backend is unreachable."
          onRetry={() => void rideQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen refreshing={rideQuery.isRefetching} onRefresh={() => void rideQuery.refetch()}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
        <Ionicons name="chevron-back" size={22} color={colors.ink800} />
      </Pressable>

      <View style={styles.titleRow}>
        <View style={styles.fill}>
          <Badge label={ride.status} tone={ride.status === 'PUBLISHED' ? 'success' : 'neutral'} />
          <Text style={styles.title}>{formatSmartDateTime(ride.departureTime)}</Text>
          <Text style={styles.subtitle}>{ride.availableSeats} of {ride.totalSeats} seats available</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.price}>{formatCurrency(ride.pricePerSeat)}</Text>
          <Text style={styles.priceUnit}>per seat</Text>
        </View>
      </View>

      <Card style={styles.routeCard}>
        <View style={styles.route}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: colors.brand }]} />
            <View style={styles.fill}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeText}>{ride.originAddress}</Text>
            </View>
          </View>
          <View style={styles.rail} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: colors.mint }]} />
            <View style={styles.fill}>
              <Text style={styles.routeLabel}>DROP</Text>
              <Text style={styles.routeText}>{ride.destAddress}</Text>
            </View>
          </View>
        </View>
        <Divider />
        <View style={styles.chips}>
          {ride.womenOnly ? <Badge label="Women only" tone="brand" /> : null}
          {ride.recurring ? <Badge label="Recurring" tone="neutral" /> : null}
          <Badge label={ride.vehicleModel || 'Vehicle'} />
        </View>
      </Card>

      <Text style={styles.section}>Your driver</Text>
      <Card>
        <View style={styles.driverRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{ride.driverName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.fill}>
            <View style={styles.nameRow}>
              <Text style={styles.driverName}>{ride.driverName}</Text>
              {ride.driverVerified ? (
                <Ionicons name="checkmark-circle" size={16} color={colors.mint} />
              ) : null}
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color={colors.amber} />
              <Text style={styles.ratingText}>{Number(ride.driverRating ?? 0).toFixed(1)} rating</Text>
              <Text style={styles.vehicleText}> · {ride.vehiclePlate}</Text>
            </View>
          </View>
        </View>
        {ride.notes ? (
          <>
            <Divider />
            <Text style={styles.noteLabel}>Driver note</Text>
            <Text style={styles.noteText}>{ride.notes}</Text>
          </>
        ) : null}
      </Card>

      <Text style={styles.section}>Fare estimate</Text>
      <Card>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Seat price × {seats}</Text>
          <Text style={styles.fareValue}>{formatCurrency(ride.pricePerSeat * seats)}</Text>
        </View>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Platform fee</Text>
          <Text style={styles.fareMuted}>Calculated at confirmation</Text>
        </View>
        <Divider />
        <View style={styles.fareRow}>
          <Text style={styles.fareTotalLabel}>Estimated total</Text>
          <Text style={styles.fareTotal}>{formatCurrency(ride.pricePerSeat * seats)}</Text>
        </View>
        <View style={styles.payNote}>
          <Ionicons name="card-outline" size={15} color={colors.ink500} />
          <Text style={styles.payNoteText}>
            Payment is not processed in-app. Settle directly with the driver after your ride.
          </Text>
        </View>
      </Card>

      {canBook ? (
        <Button
          title="Reserve a seat"
          onPress={() => {
            setError(null);
            setSeats(1);
            setBookingOpen(true);
          }}
          style={{ marginTop: spacing.lg }}
        />
      ) : (
        <View style={styles.unavailable}>
          <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.unavailableText}>This ride is no longer accepting bookings.</Text>
        </View>
      )}

      <ModalSheet visible={bookingOpen} onClose={() => setBookingOpen(false)} title="Confirm your seats">
        <Card>
          <Text style={styles.modalRoute}>{ride.originAddress} → {ride.destAddress}</Text>
          <Text style={styles.modalTime}>{formatSmartDateTime(ride.departureTime)}</Text>
          <View style={styles.modalSeats}>
            <View style={styles.fill}>
              <Text style={styles.modalSeatsLabel}>How many seats?</Text>
              <Text style={styles.modalSeatsHint}>Up to {maxSeats} available for this ride.</Text>
            </View>
            <SeatStepper value={seats} onChange={setSeats} max={maxSeats} />
          </View>
          <Divider />
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Seat fare</Text>
            <Text style={styles.fareValue}>{formatCurrency(ride.pricePerSeat * seats)}</Text>
          </View>
          <Text style={styles.modalFine}>
            The final total, including any platform fee, is returned by the backend when the booking is created.
          </Text>
        </Card>
        {error ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <Button
          title={`Reserve ${seats} ${seats === 1 ? 'seat' : 'seats'}`}
          loading={bookingMutation.isPending}
          onPress={() => {
            setError(null);
            bookingMutation.mutate({
              seats,
              key: `zevora-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            });
          }}
          style={{ marginTop: spacing.md }}
        />
        <Text style={styles.cancelNote}>Free cancellation rules are shown on the booking details screen.</Text>
      </ModalSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  back: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
  title: { ...typography.h2, marginTop: spacing.sm },
  subtitle: { ...typography.caption, marginTop: 3 },
  priceBox: { alignItems: 'flex-end' },
  price: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  priceUnit: { fontSize: 10, color: colors.ink400 },
  routeCard: { marginBottom: spacing.sm },
  route: { gap: 2 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  rail: { width: 2, height: 22, backgroundColor: colors.ink200, marginLeft: 4 },
  routeLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6, color: colors.ink400 },
  routeText: { fontSize: 14, fontWeight: '700', color: colors.ink800, marginTop: 2 },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  section: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.sm },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: colors.brandDark },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  driverName: { fontSize: 15, fontWeight: '800', color: colors.ink },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ratingText: { fontSize: 12, fontWeight: '600', color: colors.ink600 },
  vehicleText: { fontSize: 12, color: colors.ink400 },
  noteLabel: { fontSize: 11, fontWeight: '800', color: colors.ink500, marginBottom: 4 },
  noteText: { ...typography.body, fontSize: 14 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, gap: spacing.md },
  fareLabel: { fontSize: 13, color: colors.ink600 },
  fareValue: { fontSize: 14, fontWeight: '700', color: colors.ink800 },
  fareMuted: { fontSize: 11, color: colors.ink400 },
  fareTotalLabel: { fontSize: 14, fontWeight: '800', color: colors.ink },
  fareTotal: { fontSize: 18, fontWeight: '800', color: colors.ink },
  payNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: colors.ink50, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm },
  payNoteText: { flex: 1, fontSize: 11, color: colors.ink500, lineHeight: 16 },
  unavailable: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  unavailableText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#b42323' },
  modalRoute: { fontSize: 14, fontWeight: '800', color: colors.ink800 },
  modalTime: { ...typography.caption, marginTop: 3 },
  modalSeats: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  modalSeatsLabel: { fontSize: 13, fontWeight: '800', color: colors.ink800 },
  modalSeatsHint: { ...typography.caption, marginTop: 2 },
  modalFine: { fontSize: 11, color: colors.ink400, lineHeight: 16, marginTop: spacing.sm },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  errorText: { flex: 1, fontSize: 12, color: '#b42323', fontWeight: '600', lineHeight: 17 },
  cancelNote: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm, fontSize: 10 },
});
