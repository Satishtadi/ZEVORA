import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driversApi, ridesApi } from '../../services/api';
import { getApiErrorMessage } from '../../lib/api';
import { LocationPicker } from '../../components/LocationPicker';
import { SchedulePicker, fallbackDeparture } from '../../components/SchedulePicker';
import { Badge, Button, Card, ErrorView, LoadingView, Screen, SeatStepper, TextField } from '../../components/ui';
import { formatSmartDateTime } from '../../lib/format';
import { hyderabadLocations, type HydLocation } from '../../lib/hyderabad';
import { colors, radius, spacing, typography } from '../../theme';
import type { DriverRidesStackParamList, DriverTabParamList, RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList & DriverTabParamList & DriverRidesStackParamList>;

export function PublishRideScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ['driver', 'profile'], queryFn: driversApi.profile });

  const [origin, setOrigin] = useState<HydLocation>(hyderabadLocations[0]);
  const [dest, setDest] = useState<HydLocation>(hyderabadLocations[2]);
  const [departure, setDeparture] = useState(fallbackDeparture);
  const [vehicleId, setVehicleId] = useState('');
  const [seats, setSeats] = useState(1);
  const [price, setPrice] = useState('200');
  const [womenOnly, setWomenOnly] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const [picker, setPicker] = useState<'origin' | 'dest' | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const driver = profileQuery.data;
  const approved = driver?.status === 'APPROVED';
  const verifiedVehicles = (driver?.vehicles ?? []).filter((vehicle) => vehicle.verified);
  const selectedVehicle = verifiedVehicles.find((vehicle) => vehicle.id === vehicleId) ?? verifiedVehicles[0];
  const maxSeats = Math.min(12, selectedVehicle?.seatCapacity ?? 1);

  const createMutation = useMutation({
    mutationFn: () => {
      const priceValue = Number(price);
      return ridesApi.create({
        vehicleId: selectedVehicle?.id as string,
        originAddress: origin.address,
        originLat: origin.lat,
        originLng: origin.lng,
        destAddress: dest.address,
        destLat: dest.lat,
        destLng: dest.lng,
        departureTime: departure,
        totalSeats: seats,
        pricePerSeat: priceValue,
        womenOnly,
        recurring,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rides'] }),
        queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] }),
      ]);
      Alert.alert('Ride published', 'Your seats are now visible to passengers searching this route.');
      navigation.navigate('MyRides');
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Could not publish this ride.')),
  });

  function submit() {
    if (!approved) {
      setFormError('Your driver profile must be APPROVED before publishing rides.');
      return;
    }
    if (!selectedVehicle) {
      setFormError('Add and verify a vehicle before publishing a ride.');
      return;
    }
    if (origin.address === dest.address) {
      setFormError('Pickup and drop must be different locations.');
      return;
    }
    const priceValue = Number(price);
    if (!Number.isFinite(priceValue) || priceValue < 0 || priceValue > 10000) {
      setFormError('Enter a fare between ₹0 and ₹10,000 per seat.');
      return;
    }
    if (new Date(departure).getTime() <= Date.now()) {
      setFormError('Departure must be in the future.');
      return;
    }
    if (seats > maxSeats) {
      setFormError('Seats cannot exceed the verified vehicle capacity.');
      return;
    }
    setFormError(null);
    createMutation.mutate();
  }

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <Text style={styles.title}>Publish a ride</Text>
        <LoadingView label="Loading driver profile…" />
      </Screen>
    );
  }

  if (profileQuery.isError || !driver) {
    return (
      <Screen>
        <Text style={styles.title}>Publish a ride</Text>
        <ErrorView
          title="Driver profile unavailable"
          description="Register as a driver and wait for verification before publishing rides."
          onRetry={() => void profileQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.ink800} />
        </Pressable>
        <View style={styles.fill}>
          <Text style={styles.title}>Publish a ride</Text>
          <Text style={styles.subtitle}>Offer a verified vehicle and open seats.</Text>
        </View>
      </View>

      {!approved ? (
        <View style={styles.blocked}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.amber} />
          <View style={styles.fill}>
            <Text style={styles.blockedTitle}>Driver approval required</Text>
            <Text style={styles.blockedCopy}>
              Your driver status is {driver.status}. Ride publishing is blocked until an admin approves your driver profile.
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.section}>Vehicle</Text>
      <Card>
        {verifiedVehicles.length === 0 ? (
          <View style={styles.noVehicle}>
            <Ionicons name="car-outline" size={24} color={colors.brand} />
            <Text style={styles.noVehicleTitle}>No verified vehicles</Text>
            <Text style={styles.noVehicleCopy}>
              Add a vehicle first. Admin verification is required before it can be used for rides.
            </Text>
            <Button
              title="Manage vehicles"
              variant="outline"
              onPress={() => navigation.navigate('DriverVehicles')}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : (
          verifiedVehicles.map((vehicle) => {
            const active = selectedVehicle?.id === vehicle.id;
            return (
              <Pressable
                key={vehicle.id}
                onPress={() => {
                  setVehicleId(vehicle.id);
                  setSeats(1);
                }}
                style={({ pressed }) => [styles.vehicle, active && styles.vehicleActive, pressed && { opacity: 0.85 }]}
              >
                <View style={[styles.vehicleIcon, active && styles.vehicleIconActive]}>
                  <Ionicons name="car-sport-outline" size={19} color={active ? colors.brand : colors.ink500} />
                </View>
                <View style={styles.fill}>
                  <Text style={styles.vehicleName}>
                    {[vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle'}
                  </Text>
                  <Text style={styles.vehiclePlate}>{vehicle.plateNumber} · {vehicle.seatCapacity} seats</Text>
                </View>
                <Badge label="Verified" tone="success" />
              </Pressable>
            );
          })
        )}
        {driver.vehicles.some((vehicle) => !vehicle.verified) ? (
          <Text style={styles.vehicleNote}>
            {driver.vehicles.filter((vehicle) => !vehicle.verified).length} vehicle(s) are awaiting admin verification and cannot
            be selected yet.
          </Text>
        ) : null}
      </Card>

      <Text style={styles.section}>Route</Text>
      <Card>
        <Pressable onPress={() => setPicker('origin')} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
          <Ionicons name="radio-button-on" size={17} color={colors.brand} />
          <View style={styles.fill}>
            <Text style={styles.rowLabel}>PICKUP</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{origin.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={colors.ink400} />
        </Pressable>
        <Pressable onPress={() => setPicker('dest')} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
          <Ionicons name="location" size={17} color={colors.mint} />
          <View style={styles.fill}>
            <Text style={styles.rowLabel}>DROP</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{dest.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={colors.ink400} />
        </Pressable>
        <Pressable onPress={() => setScheduleOpen(true)} style={({ pressed }) => [styles.row, styles.schedule, pressed && { opacity: 0.8 }]}>
          <Ionicons name="calendar-outline" size={17} color={colors.brand} />
          <View style={styles.fill}>
            <Text style={styles.rowLabel}>DEPARTURE</Text>
            <Text style={styles.rowValue}>{formatSmartDateTime(departure)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={colors.ink400} />
        </Pressable>
      </Card>

      <Text style={styles.section}>Seats and fare</Text>
      <Card>
        <View style={styles.inlineRow}>
          <View style={styles.fill}>
            <Text style={styles.fieldLabel}>Open seats</Text>
            <Text style={styles.hint}>Max {maxSeats} for this vehicle.</Text>
          </View>
          <SeatStepper value={seats} onChange={setSeats} max={maxSeats} />
        </View>
        <TextField
          label="Fare per seat (₹)"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="200"
          hint="Between ₹0 and ₹10,000."
        />
        <Toggle label="Women-only ride" hint="Restrict bookings to women passengers." value={womenOnly} onChange={setWomenOnly} />
        <Toggle label="Recurring commute" hint="Marks this as a regular commute ride." value={recurring} onChange={setRecurring} />
      </Card>

      <Text style={styles.section}>Notes</Text>
      <Card>
        <TextField
          value={notes}
          onChangeText={setNotes}
          placeholder="Pickup instructions, luggage space, music preference…"
          multiline
          numberOfLines={3}
          maxLength={500}
          style={styles.textarea}
        />
        <Text style={styles.hint}>{notes.length}/500 characters</Text>
      </Card>

      {formError ? (
        <View style={styles.error}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{formError}</Text>
        </View>
      ) : null}

      <Button
        title="Publish ride"
        loading={createMutation.isPending}
        disabled={!approved || verifiedVehicles.length === 0}
        onPress={submit}
        style={{ marginTop: spacing.lg }}
      />
      <Text style={styles.footnote}>
        Published rides appear immediately. The backend validates driver approval, vehicle verification and seat capacity.
      </Text>

      <LocationPicker visible={picker === 'origin'} onClose={() => setPicker(null)} title="Pickup" selected={origin} onSelect={setOrigin} />
      <LocationPicker visible={picker === 'dest'} onClose={() => setPicker(null)} title="Drop" selected={dest} onSelect={setDest} />
      <SchedulePicker visible={scheduleOpen} onClose={() => setScheduleOpen(false)} value={departure} onSelect={setDeparture} />
    </Screen>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (next: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggleRow}>
      <View style={styles.fill}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.sm },
  back: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h1, marginTop: spacing.sm, fontSize: 27 },
  subtitle: { ...typography.body, marginTop: 3 },
  blocked: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  blockedTitle: { fontSize: 13, fontWeight: '800', color: '#8a5a00' },
  blockedCopy: { fontSize: 11, color: '#8a5a00', lineHeight: 16, marginTop: 2 },
  section: { ...typography.h3, marginTop: spacing.xl, marginBottom: spacing.sm },
  noVehicle: { alignItems: 'center', paddingVertical: spacing.lg },
  noVehicleTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: spacing.sm },
  noVehicleCopy: { ...typography.caption, textAlign: 'center', marginTop: 4, lineHeight: 17 },
  vehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink200,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  vehicleActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  vehicleIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' },
  vehicleIconActive: { backgroundColor: colors.white },
  vehicleName: { fontSize: 13, fontWeight: '800', color: colors.ink800 },
  vehiclePlate: { fontSize: 11, color: colors.ink500, marginTop: 2 },
  vehicleNote: { fontSize: 10, color: colors.ink400, lineHeight: 15, marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink200,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  schedule: { backgroundColor: colors.ink50, borderColor: 'transparent', marginBottom: 0 },
  rowLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6, color: colors.ink400 },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.ink800, marginTop: 1 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.ink800 },
  hint: { ...typography.caption, marginTop: 2, lineHeight: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  toggle: { width: 46, height: 27, borderRadius: 14, backgroundColor: colors.ink200, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.brand },
  knob: { width: 21, height: 21, borderRadius: 11, backgroundColor: colors.white },
  knobOn: { alignSelf: 'flex-end' },
  textarea: { minHeight: 88, textAlignVertical: 'top', paddingTop: spacing.md },
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
  footnote: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm, fontSize: 10, lineHeight: 15 },
});
