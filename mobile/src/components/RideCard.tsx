import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card, Divider } from './ui';
import { formatCurrency, formatDistanceKm, formatDuration, formatSmartDateTime } from '../lib/format';
import { colors, radius, spacing, typography } from '../theme';
import type { Booking, Ride, RideSearchResult } from '../types';

export function RideCard({
  ride,
  meta,
  onPress,
}: {
  ride: Ride;
  meta?: RideSearchResult;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={styles.card}>
        <View style={styles.top}>
          <View style={styles.route}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.brand }]} />
              <Text style={styles.stop} numberOfLines={1}>{ride.originAddress}</Text>
            </View>
            <View style={styles.rail} />
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.mint }]} />
              <Text style={styles.stop} numberOfLines={1}>{ride.destAddress}</Text>
            </View>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.price}>{formatCurrency(ride.pricePerSeat)}</Text>
            <Text style={styles.priceUnit}>per seat</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.time}>{formatSmartDateTime(ride.departureTime)}</Text>
          <View style={styles.seats}>
            <Ionicons name="people-outline" size={14} color={colors.ink500} />
            <Text style={styles.seatsText}>{ride.availableSeats} of {ride.totalSeats} seats</Text>
          </View>
        </View>

        {meta ? (
          <View style={styles.matchRow}>
            <Text style={styles.matchText}>{meta.matchNote}</Text>
            <Text style={styles.matchText}>
              {formatDistanceKm(meta.pickupDistanceKm)} away · {formatDuration(meta.estimatedDurationMinutes)}
            </Text>
          </View>
        ) : null}

        <Divider />

        <View style={styles.bottom}>
          <View style={styles.driver}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>{ride.driverName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.driverName}>{ride.driverName}</Text>
              <View style={styles.rating}>
                <Ionicons name="star" size={12} color={colors.amber} />
                <Text style={styles.ratingText}>{Number(ride.driverRating ?? 0).toFixed(1)}</Text>
                <Text style={styles.vehicleText}> · {ride.vehicleModel || 'Vehicle'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.badges}>
            {ride.womenOnly ? <Badge label="Women only" tone="brand" /> : null}
            <Badge label={ride.status} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function BookingCard({ booking, onPress }: { booking: Booking; onPress?: () => void }) {
  const ride = booking.ride;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={styles.card}>
        <View style={styles.bookingTop}>
          <Badge label={booking.status} />
          <Text style={styles.bookingDate}>{formatSmartDateTime(ride?.departureTime)}</Text>
        </View>
        <View style={styles.route}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: colors.brand }]} />
            <Text style={styles.stop} numberOfLines={1}>{ride?.originAddress ?? 'Pickup shared after confirmation'}</Text>
          </View>
          <View style={styles.rail} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: colors.mint }]} />
            <Text style={styles.stop} numberOfLines={1}>{ride?.destAddress ?? 'Destination shared after confirmation'}</Text>
          </View>
        </View>
        <Divider />
        <View style={styles.bookingBottom}>
          <Text style={styles.bookingMeta}>
            {booking.seats} {booking.seats === 1 ? 'seat' : 'seats'} · {ride?.driverName ?? 'Driver pending'}
          </Text>
          <Text style={styles.bookingTotal}>{formatCurrency(booking.totalAmount)}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  pressed: { opacity: 0.86 },
  top: { flexDirection: 'row', gap: spacing.md },
  route: { flex: 1 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  rail: { width: 2, height: 14, backgroundColor: colors.ink200, marginLeft: 3.5, marginVertical: 2 },
  stop: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink800 },
  priceBox: { alignItems: 'flex-end' },
  price: { fontSize: 20, fontWeight: '800', color: colors.ink },
  priceUnit: { ...typography.caption, fontSize: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  time: { fontSize: 12, fontWeight: '700', color: colors.ink600 },
  seats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seatsText: { fontSize: 11, color: colors.ink500 },
  matchRow: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.ink50,
    gap: 2,
  },
  matchText: { fontSize: 11, color: colors.ink500, lineHeight: 16 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  driver: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  driverAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitial: { fontSize: 14, fontWeight: '800', color: colors.brandDark },
  driverName: { fontSize: 13, fontWeight: '700', color: colors.ink800 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  ratingText: { fontSize: 11, fontWeight: '700', color: colors.ink600 },
  vehicleText: { fontSize: 11, color: colors.ink400 },
  badges: { alignItems: 'flex-end', gap: 4 },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  bookingDate: { fontSize: 11, color: colors.ink500 },
  bookingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  bookingMeta: { flex: 1, fontSize: 12, color: colors.ink500 },
  bookingTotal: { fontSize: 16, fontWeight: '800', color: colors.ink },
});
