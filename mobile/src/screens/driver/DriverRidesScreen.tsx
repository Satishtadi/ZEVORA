import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ridesApi } from '../../services/api';
import { getApiErrorMessage } from '../../lib/api';
import { DriverRideCard } from '../../components/DriverRideCard';
import { ModalSheet } from '../../components/ModalSheet';
import { Badge, Button, Card, Chip, Divider, ErrorView, LoadingView, Screen } from '../../components/ui';
import { formatCurrency, formatSmartDateTime } from '../../lib/format';
import { colors, radius, spacing, typography } from '../../theme';
import type { DriverRidesStackParamList, DriverTabParamList, RootStackParamList } from '../../navigation/types';
import type { Ride, RideStatus } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList & DriverTabParamList & DriverRidesStackParamList>;
type Filter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const ACTIVE_STATUSES: RideStatus[] = ['DRAFT', 'PUBLISHED', 'FULL', 'IN_PROGRESS'];

export function DriverRidesScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selected, setSelected] = useState<Ride | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({ queryKey: ['rides', 'mine'], queryFn: ridesApi.mine });
  const rides = query.data ?? [];

  const filtered = useMemo(() => {
    return rides.filter((ride) => {
      if (filter === 'ALL') return true;
      if (filter === 'ACTIVE') return ACTIVE_STATUSES.includes(ride.status);
      if (filter === 'COMPLETED') return ride.status === 'COMPLETED';
      return ride.status === 'CANCELLED';
    });
  }, [rides, filter]);

  async function refreshAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['rides'] }),
      queryClient.invalidateQueries({ queryKey: ['bookings'] }),
    ]);
  }

  const completeMutation = useMutation({
    mutationFn: (id: string) => ridesApi.complete(id),
    onSuccess: async () => {
      setSelected(null);
      setActionError(null);
      await refreshAll();
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Could not complete this ride.')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ridesApi.cancel(id, 'Cancelled by driver from mobile app'),
    onSuccess: async () => {
      setSelected(null);
      setActionError(null);
      await refreshAll();
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Could not cancel this ride.')),
  });

  function confirmComplete(ride: Ride) {
    Alert.alert('Mark ride complete?', 'This closes the ride and should be done after all passengers arrive.', [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Complete ride', onPress: () => completeMutation.mutate(ride.id) },
    ]);
  }

  function confirmCancel(ride: Ride) {
    Alert.alert('Cancel this ride?', 'Passengers with confirmed seats will be affected. The backend cancellation rules apply.', [
      { text: 'Keep ride', style: 'cancel' },
      { text: 'Cancel ride', style: 'destructive', onPress: () => cancelMutation.mutate(ride.id) },
    ]);
  }

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={styles.header}>
        <View style={styles.fill}>
          <Text style={styles.title}>My rides</Text>
          <Text style={styles.subtitle}>Publish and manage the seats you offer.</Text>
        </View>
        <Button
          title="Publish"
          onPress={() => navigation.navigate('PublishRide')}
          left={<Ionicons name="add" size={17} color={colors.white} />}
          style={styles.publish}
        />
      </View>

      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <Chip key={item.key} label={item.label} active={filter === item.key} onPress={() => setFilter(item.key)} />
        ))}
      </View>

      {query.isLoading ? <LoadingView label="Loading your rides…" /> : null}
      {query.isError ? (
        <ErrorView title="Could not load rides" description="Check the backend and try again." onRetry={() => void query.refetch()} />
      ) : null}
      {query.isSuccess && rides.length === 0 ? (
        <Card style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="car-sport-outline" size={26} color={colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>No rides published</Text>
          <Text style={styles.emptyCopy}>Add a verified vehicle, then publish your first shared seat.</Text>
          <Button title="Publish a ride" onPress={() => navigation.navigate('PublishRide')} style={{ marginTop: spacing.md }} />
        </Card>
      ) : null}
      {query.isSuccess && rides.length > 0 && filtered.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={styles.emptyTitle}>No {filter.toLowerCase()} rides</Text>
          <Text style={styles.emptyCopy}>Switch filters to see the rest of your published rides.</Text>
        </Card>
      ) : null}

      {filtered.map((ride) => (
        <DriverRideCard
          key={ride.id}
          ride={ride}
          onPress={() => {
            setActionError(null);
            setSelected(ride);
          }}
        />
      ))}

      <ModalSheet visible={Boolean(selected)} onClose={() => setSelected(null)} title="Manage ride">
        {selected ? (
          <>
            <Card>
              <View style={styles.modalTop}>
                <Badge label={selected.status} />
                <Text style={styles.modalTime}>{formatSmartDateTime(selected.departureTime)}</Text>
              </View>
              <Text style={styles.modalRoute}>{selected.originAddress}</Text>
              <Text style={styles.modalArrow}>↓</Text>
              <Text style={styles.modalRoute}>{selected.destAddress}</Text>
              <Divider />
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Seats booked</Text>
                <Text style={styles.modalValue}>{selected.totalSeats - selected.availableSeats} of {selected.totalSeats}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Fare per seat</Text>
                <Text style={styles.modalValue}>{formatCurrency(selected.pricePerSeat)}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Vehicle</Text>
                <Text style={styles.modalValue}>{selected.vehicleModel} · {selected.vehiclePlate}</Text>
              </View>
            </Card>
            {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
            <View style={styles.actions}>
              <Button
                title="View passenger requests"
                variant="outline"
                onPress={() => {
                  setSelected(null);
                  navigation.navigate('DriverRequests');
                }}
              />
              {selected.status === 'PUBLISHED' || selected.status === 'FULL' || selected.status === 'IN_PROGRESS' ? (
                <Button
                  title="Mark as completed"
                  variant="secondary"
                  loading={completeMutation.isPending}
                  onPress={() => confirmComplete(selected)}
                />
              ) : null}
              {ACTIVE_STATUSES.includes(selected.status) ? (
                <Button
                  title="Cancel ride"
                  variant="danger"
                  loading={cancelMutation.isPending}
                  onPress={() => confirmCancel(selected)}
                />
              ) : null}
            </View>
          </>
        ) : null}
      </ModalSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.sm },
  title: { ...typography.h1 },
  subtitle: { ...typography.body, marginTop: 4 },
  publish: { minHeight: 42, paddingHorizontal: spacing.md },
  filters: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginVertical: spacing.lg },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  emptyCopy: { ...typography.caption, textAlign: 'center', marginTop: 5, lineHeight: 18 },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTime: { fontSize: 11, color: colors.ink500 },
  modalRoute: { fontSize: 14, fontWeight: '700', color: colors.ink800 },
  modalArrow: { fontSize: 14, color: colors.ink400, marginVertical: 2, marginLeft: 2 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 3 },
  modalLabel: { fontSize: 12, color: colors.ink500 },
  modalValue: { fontSize: 12, fontWeight: '700', color: colors.ink800, textAlign: 'right', flex: 1 },
  error: { fontSize: 12, color: colors.danger, fontWeight: '600', marginTop: spacing.md },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
