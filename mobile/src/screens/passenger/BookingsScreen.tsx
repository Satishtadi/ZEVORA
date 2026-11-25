import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../../services/api';
import { BookingCard } from '../../components/RideCard';
import { Button, Card, Chip, ErrorView, LoadingView, Screen } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';
import type { PassengerTabParamList, RootStackParamList } from '../../navigation/types';
import type { Booking, BookingStatus } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList & PassengerTabParamList>;
type Filter = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const UPCOMING: BookingStatus[] = ['REQUESTED', 'CONFIRMED', 'IN_PROGRESS'];

function matches(booking: Booking, filter: Filter) {
  if (filter === 'ALL') return true;
  if (filter === 'UPCOMING') return UPCOMING.includes(booking.status);
  if (filter === 'COMPLETED') return booking.status === 'COMPLETED';
  return booking.status === 'CANCELLED';
}

export function BookingsScreen() {
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<Filter>('ALL');
  const query = useQuery({ queryKey: ['bookings', 'list'], queryFn: () => bookingsApi.mine(0, 50) });

  const bookings = query.data?.items ?? [];
  const filtered = useMemo(() => bookings.filter((booking) => matches(booking, filter)), [bookings, filter]);
  const upcomingCount = bookings.filter((booking) => UPCOMING.includes(booking.status)).length;

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>My bookings</Text>
      <Text style={styles.subtitle}>
        {upcomingCount > 0 ? `${upcomingCount} upcoming ${upcomingCount === 1 ? 'ride' : 'rides'} in your plan.` : 'Every shared ride, in one place.'}
      </Text>

      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <Chip key={item.key} label={item.label} active={filter === item.key} onPress={() => setFilter(item.key)} />
        ))}
      </View>

      {query.isLoading ? <LoadingView label="Loading bookings…" /> : null}
      {query.isError ? (
        <ErrorView
          title="Could not load bookings"
          description="Check your connection and API configuration, then retry."
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {query.isSuccess && bookings.length === 0 ? (
        <Card style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="ticket-outline" size={26} color={colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyCopy}>Find a verified carpool seat and your first booking will appear here.</Text>
          <Button
            title="Find a ride"
            onPress={() => navigation.navigate('PassengerTabs', { screen: 'SearchTab', params: { screen: 'Search' } })}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : null}

      {query.isSuccess && bookings.length > 0 && filtered.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing in {FILTERS.find((item) => item.key === filter)?.label.toLowerCase()}</Text>
          <Text style={styles.emptyCopy}>Switch filters to see the rest of your booking history.</Text>
        </Card>
      ) : null}

      {filtered.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, marginTop: spacing.sm },
  subtitle: { ...typography.body, marginTop: 4 },
  filters: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginVertical: spacing.lg },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, marginTop: spacing.sm },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  emptyCopy: { ...typography.caption, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
