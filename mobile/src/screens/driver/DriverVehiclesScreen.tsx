import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '../../services/api';
import { getApiErrorMessage } from '../../lib/api';
import { ModalSheet } from '../../components/ModalSheet';
import { Badge, Button, Card, ErrorView, LoadingView, Screen, SeatStepper, TextField } from '../../components/ui';
import { colors, radius, spacing, typography } from '../../theme';

export function DriverVehiclesScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['driver', 'profile'], queryFn: driversApi.profile });
  const [open, setOpen] = useState(false);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [error, setError] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: () =>
      driversApi.addVehicle({
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        plateNumber: plate.trim().toUpperCase(),
        color: color.trim() || undefined,
        seatCapacity: capacity,
      }),
    onSuccess: async () => {
      setOpen(false);
      setMake('');
      setModel('');
      setPlate('');
      setColor('');
      setCapacity(4);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] });
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not add this vehicle.')),
  });

  const vehicles = query.data?.vehicles ?? [];

  function submit() {
    if (!plate.trim()) {
      setError('Registration plate is required.');
      return;
    }
    if (plate.trim().length > 20) {
      setError('Plate number must be 20 characters or fewer.');
      return;
    }
    setError(null);
    addMutation.mutate();
  }

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={styles.header}>
        <View style={styles.fill}>
          <Text style={styles.title}>Vehicles</Text>
          <Text style={styles.subtitle}>Vehicles available for your published rides.</Text>
        </View>
        <Button
          title="Add"
          onPress={() => {
            setError(null);
            setOpen(true);
          }}
          left={<Ionicons name="add" size={17} color={colors.white} />}
          style={styles.addButton}
        />
      </View>

      <View style={styles.notice}>
        <Ionicons name="shield-checkmark-outline" size={17} color={colors.amber} />
        <Text style={styles.noticeText}>
          New vehicles start unverified. An admin must verify a vehicle before it can be used to publish rides.
        </Text>
      </View>

      {query.isLoading ? <LoadingView label="Loading vehicles…" /> : null}
      {query.isError ? (
        <ErrorView
          title="Could not load vehicles"
          description="This account may not have a driver profile yet."
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && vehicles.length === 0 ? (
        <Card style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="car-outline" size={26} color={colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>No vehicles yet</Text>
          <Text style={styles.emptyCopy}>Add your car details to start the verification process.</Text>
          <Button title="Add a vehicle" onPress={() => setOpen(true)} style={{ marginTop: spacing.md }} />
        </Card>
      ) : null}

      {vehicles.map((vehicle) => (
        <Card key={vehicle.id} style={styles.vehicle}>
          <View style={styles.vehicleTop}>
            <View style={styles.vehicleIcon}>
              <Ionicons name="car-sport-outline" size={22} color={colors.brandDark} />
            </View>
            <View style={styles.fill}>
              <Text style={styles.vehicleName}>
                {[vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle'}
              </Text>
              <Text style={styles.plate}>{vehicle.plateNumber}</Text>
            </View>
            <Badge label={vehicle.verified ? 'Verified' : 'Pending'} tone={vehicle.verified ? 'success' : 'warning'} />
          </View>
          <View style={styles.vehicleMeta}>
            <View style={styles.metric}>
              <Ionicons name="people-outline" size={15} color={colors.ink500} />
              <Text style={styles.metricText}>{vehicle.seatCapacity} seats</Text>
            </View>
            {vehicle.color ? (
              <View style={styles.metric}>
                <Ionicons name="color-palette-outline" size={15} color={colors.ink500} />
                <Text style={styles.metricText}>{vehicle.color}</Text>
              </View>
            ) : null}
          </View>
          {!vehicle.verified ? <Text style={styles.pendingNote}>Waiting for admin verification. It cannot be selected when publishing.</Text> : null}
        </Card>
      ))}

      <ModalSheet visible={open} onClose={() => setOpen(false)} title="Add a vehicle">
        <Card>
          <TextField label="Make" value={make} onChangeText={setMake} placeholder="Maruti Suzuki" autoCapitalize="words" />
          <TextField label="Model" value={model} onChangeText={setModel} placeholder="Baleno" autoCapitalize="words" />
          <TextField
            label="Registration plate"
            value={plate}
            onChangeText={setPlate}
            placeholder="TS09EA1234"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
          />
          <TextField label="Color" value={color} onChangeText={setColor} placeholder="White" autoCapitalize="words" />
          <View style={styles.capacityRow}>
            <View style={styles.fill}>
              <Text style={styles.capacityLabel}>Seat capacity</Text>
              <Text style={styles.capacityHint}>Including driver. Maximum 12.</Text>
            </View>
            <SeatStepper value={capacity} onChange={setCapacity} max={12} />
          </View>
        </Card>
        {error ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <Button title="Add vehicle" loading={addMutation.isPending} onPress={submit} style={{ marginTop: spacing.md }} />
        <Text style={styles.modalNote}>The backend creates the vehicle as unverified. Admin approval is a web-portal step.</Text>
      </ModalSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.sm },
  title: { ...typography.h1 },
  subtitle: { ...typography.body, marginTop: 4 },
  addButton: { minHeight: 42, paddingHorizontal: spacing.md },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  noticeText: { flex: 1, fontSize: 11, color: '#8a5a00', lineHeight: 16 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { ...typography.h3 },
  emptyCopy: { ...typography.caption, textAlign: 'center', marginTop: 5, lineHeight: 17 },
  vehicle: { marginBottom: spacing.sm },
  vehicleTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  vehicleIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  vehicleName: { fontSize: 14, fontWeight: '800', color: colors.ink800 },
  plate: { fontSize: 12, fontWeight: '700', color: colors.ink500, marginTop: 2, letterSpacing: 0.5 },
  vehicleMeta: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricText: { fontSize: 11, color: colors.ink500 },
  pendingNote: { fontSize: 10, color: '#a16207', marginTop: spacing.sm, lineHeight: 15 },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  capacityLabel: { fontSize: 13, fontWeight: '700', color: colors.ink800 },
  capacityHint: { ...typography.caption, marginTop: 2 },
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
  modalNote: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm, fontSize: 10, lineHeight: 15 },
});
