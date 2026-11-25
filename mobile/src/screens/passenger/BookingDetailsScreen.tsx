import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../../services/api';
import { getApiErrorMessage } from '../../lib/api';
import { Badge, Button, Card, Divider, ErrorView, LoadingView, Screen } from '../../components/ui';
import { formatCurrency, formatSmartDateTime } from '../../lib/format';
import { colors, radius, spacing, typography } from '../../theme';
import type { PassengerTabParamList, RootStackParamList } from '../../navigation/types';
import type { CancelResponse } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList & PassengerTabParamList>;

export function BookingDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'BookingDetails'>>();
  const queryClient = useQueryClient();
  const [cancelResult, setCancelResult] = useState<CancelResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['booking', route.params.bookingId],
    queryFn: () => bookingsApi.get(route.params.bookingId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.cancel(route.params.bookingId, 'Cancelled from mobile app'),
    onSuccess: async (result) => {
      setCancelResult(result);
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['booking', route.params.bookingId] }),
        queryClient.invalidateQueries({ queryKey: ['ride'] }),
      ]);
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Could not cancel this booking.')),
  });

  const shareMutation = useMutation({
    mutationFn: () => bookingsApi.share(route.params.bookingId),
    onSuccess: async (response) => {
      setActionError(null);
      await Share.share({
        message: `Track my ZEVORA ride: ${response.publicPath}\nShare token: ${response.token}`,
        title: 'ZEVORA ride tracking',
      });
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Could not create a share link.')),
  });

  function confirmCancel() {
    Alert.alert(
      'Cancel this booking?',
      'Your seat will be released. Backend cancellation and refund rules apply.',
      [
        { text: 'Keep booking', style: 'cancel' },
        { text: 'Cancel booking', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ],
    );
  }

  const booking = query.data;

  if (query.isLoading) {
    return (
      <Screen>
        <BackButton onPress={() => navigation.goBack()} />
        <LoadingView label="Loading booking…" />
      </Screen>
    );
  }

  if (query.isError || !booking) {
    return (
      <Screen>
        <BackButton onPress={() => navigation.goBack()} />
        <ErrorView
          title="Booking unavailable"
          description="The booking could not be loaded. It may belong to another account or the backend is offline."
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const ride = booking.ride;
  const canCancel = booking.status === 'REQUESTED' || booking.status === 'CONFIRMED';
  const cancellation = cancelResult?.booking ?? booking;

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <View style={styles.fill}>
          <Badge label={cancellation.status} />
          <Text style={styles.title}>Booking details</Text>
          <Text style={styles.subtitle}>Created {formatSmartDateTime(booking.createdAt)}</Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.total}>{formatCurrency(booking.totalAmount)}</Text>
          <Badge label={booking.paymentStatus} tone={booking.paymentStatus === 'PAID' ? 'success' : 'warning'} />
        </View>
      </View>

      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Journey</Text>
          <Text style={styles.bookingId}>#{booking.id.slice(0, 8)}</Text>
        </View>
        {ride ? (
          <>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.brand }]} />
              <Text style={styles.stop}>{ride.originAddress}</Text>
            </View>
            <View style={styles.rail} />
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.mint }]} />
              <Text style={styles.stop}>{ride.destAddress}</Text>
            </View>
            <Divider />
            <View style={styles.rowBetween}>
              <Text style={styles.meta}>{formatSmartDateTime(ride.departureTime)}</Text>
              <Text style={styles.meta}>{ride.vehiclePlate || 'Vehicle pending'}</Text>
            </View>
            <View style={styles.driverRow}>
              <Ionicons name="person-circle-outline" size={17} color={colors.ink500} />
              <Text style={styles.meta}>{ride.driverName || 'Driver pending'}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.meta}>Ride details are no longer available.</Text>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Fare breakdown</Text>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Seat fare × {booking.seats}</Text>
          <Text style={styles.fareValue}>{formatCurrency(booking.fareAmount)}</Text>
        </View>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Platform fee</Text>
          <Text style={styles.fareValue}>{formatCurrency(booking.platformFee)}</Text>
        </View>
        <Divider />
        <View style={styles.fareRow}>
          <Text style={styles.fareTotalLabel}>Total</Text>
          <Text style={styles.fareTotal}>{formatCurrency(booking.totalAmount)}</Text>
        </View>
        <Text style={styles.fine}>Payment status is tracked by the backend; no card payment is collected in the app.</Text>
      </Card>

      {cancellation.cancellationReason ? (
        <Card style={[styles.card, styles.cancelCard]}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Cancellation</Text>
            <Badge label="Cancelled" tone="danger" />
          </View>
          <Text style={styles.meta}>{cancellation.cancellationReason}</Text>
          {cancellation.cancelledAt ? <Text style={styles.fine}>{formatSmartDateTime(cancellation.cancelledAt)}</Text> : null}
        </Card>
      ) : null}

      {actionError ? (
        <View style={styles.error}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{actionError}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Share live-tracking link"
          variant="outline"
          loading={shareMutation.isPending}
          onPress={() => shareMutation.mutate()}
          left={<Ionicons name="share-social-outline" size={18} color={colors.ink800} />}
        />
        {ride ? (
          <Button
            title="View ride again"
            variant="ghost"
            onPress={() => navigation.navigate('RideDetails', { rideId: booking.rideId })}
          />
        ) : null}
        <Button
          title="Safety & emergency"
          variant="ghost"
          onPress={() => navigation.navigate('PassengerTabs', { screen: 'SafetyTab' })}
          left={<Ionicons name="shield-checkmark-outline" size={18} color={colors.ink600} />}
        />
        {canCancel ? (
          <Button
            title="Cancel booking"
            variant="danger"
            loading={cancelMutation.isPending}
            onPress={confirmCancel}
          />
        ) : null}
      </View>

      {cancelResult?.alternatives?.length ? (
        <View style={styles.alternatives}>
          <Text style={styles.sectionTitle}>Alternative rides</Text>
          <Text style={styles.sectionCopy}>The backend returned these seats after your cancellation.</Text>
          {cancelResult.alternatives.map((alternative) => (
            <Pressable
              key={alternative.rideId}
              onPress={() => navigation.navigate('RideDetails', { rideId: alternative.rideId })}
              style={({ pressed }) => [styles.alternative, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.fill}>
                <Text style={styles.altDriver}>{alternative.driverName}</Text>
                <Text style={styles.meta}>
                  {formatSmartDateTime(alternative.departureTime)} · {alternative.availableSeats} seats
                </Text>
                <Text style={styles.fine}>Nearby alternative · pickup {alternative.pickupDistanceKm.toFixed(1)} km away</Text>
              </View>
              <Text style={styles.altPrice}>{formatCurrency(alternative.pricePerSeat)}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.back} hitSlop={10}>
      <Ionicons name="chevron-back" size={22} color={colors.ink800} />
    </Pressable>
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
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
  title: { ...typography.h1, marginTop: spacing.sm, fontSize: 28 },
  subtitle: { ...typography.caption, marginTop: 3 },
  totalBox: { alignItems: 'flex-end', gap: 6 },
  total: { fontSize: 23, fontWeight: '800', color: colors.ink },
  card: { marginBottom: spacing.md },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.ink, marginBottom: spacing.md },
  bookingId: { fontSize: 10, fontWeight: '700', color: colors.ink400, letterSpacing: 0.4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  rail: { width: 2, height: 13, backgroundColor: colors.ink200, marginLeft: 3.5, marginVertical: 2 },
  stop: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink800 },
  meta: { fontSize: 12, color: colors.ink500, marginTop: 3 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  fareLabel: { fontSize: 13, color: colors.ink600 },
  fareValue: { fontSize: 13, fontWeight: '700', color: colors.ink800 },
  fareTotalLabel: { fontSize: 14, fontWeight: '800', color: colors.ink },
  fareTotal: { fontSize: 17, fontWeight: '800', color: colors.ink },
  fine: { fontSize: 11, color: colors.ink400, lineHeight: 16, marginTop: spacing.sm },
  cancelCard: { backgroundColor: colors.dangerSoft, borderColor: '#f7c9c9' },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: { flex: 1, fontSize: 12, color: '#b42323', fontWeight: '600', lineHeight: 17 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  alternatives: { marginTop: spacing.xl },
  sectionTitle: { ...typography.h3 },
  sectionCopy: { ...typography.caption, marginTop: 3, marginBottom: spacing.md },
  alternative: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink100,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  altDriver: { fontSize: 13, fontWeight: '800', color: colors.ink800 },
  altPrice: { fontSize: 16, fontWeight: '800', color: colors.ink },
});
