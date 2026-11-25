import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card, Divider } from './ui';
import { formatCurrency, formatSmartDateTime } from '../lib/format';
import { colors, spacing, typography } from '../theme';
import type { Ride } from '../types';

export function DriverRideCard({ ride, onPress }: { ride: Ride; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [pressed && { opacity: 0.86 }]}>
      <Card style={styles.card}>
        <View style={styles.top}>
          <Badge label={ride.status} />
          <Text style={styles.time}>{formatSmartDateTime(ride.departureTime)}</Text>
        </View>
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
        <Divider />
        <View style={styles.bottom}>
          <View style={styles.metric}>
            <Ionicons name="people-outline" size={15} color={colors.ink500} />
            <Text style={styles.metricText}>{ride.availableSeats}/{ride.totalSeats} seats open</Text>
          </View>
          <View style={styles.metric}>
            <Ionicons name="car-outline" size={15} color={colors.ink500} />
            <Text style={styles.metricText}>{ride.vehiclePlate || ride.vehicleModel}</Text>
          </View>
          <Text style={styles.price}>{formatCurrency(ride.pricePerSeat)}</Text>
        </View>
        {ride.womenOnly ? (
          <View style={styles.womenOnly}>
            <Ionicons name="woman-outline" size={13} color={colors.brandDark} />
            <Text style={styles.womenOnlyText}>Women-only ride</Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  time: { fontSize: 11, fontWeight: '700', color: colors.ink600 },
  route: { gap: 2 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  rail: { width: 2, height: 13, backgroundColor: colors.ink200, marginLeft: 3.5, marginVertical: 2 },
  stop: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink800 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricText: { fontSize: 11, color: colors.ink500 },
  price: { marginLeft: 'auto', fontSize: 17, fontWeight: '800', color: colors.ink },
  womenOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandSoft,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: spacing.sm,
  },
  womenOnlyText: { fontSize: 10, fontWeight: '700', color: colors.brandDark },
});
