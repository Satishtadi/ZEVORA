import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ridesApi, type RideSearchParams } from '../../services/api';
import { LocationPicker } from '../../components/LocationPicker';
import { SchedulePicker, fallbackDeparture } from '../../components/SchedulePicker';
import { RideCard } from '../../components/RideCard';
import { Badge, Button, Card, ErrorView, LoadingView, Screen, SeatStepper } from '../../components/ui';
import { formatSmartDateTime } from '../../lib/format';
import { hyderabadLocations, type HydLocation } from '../../lib/hyderabad';
import { colors, radius, spacing, typography } from '../../theme';
import type { RootStackParamList, SearchStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList & SearchStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [origin, setOrigin] = useState<HydLocation>(hyderabadLocations[0]);
  const [dest, setDest] = useState<HydLocation>(hyderabadLocations[2]);
  const [departure, setDeparture] = useState(fallbackDeparture);
  const [seats, setSeats] = useState(1);
  const [womenOnly, setWomenOnly] = useState(false);
  const [picker, setPicker] = useState<'origin' | 'dest' | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [params, setParams] = useState<RideSearchParams | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resultsQuery = useQuery({
    queryKey: ['rides', 'search', params],
    queryFn: () => ridesApi.search(params as RideSearchParams),
    enabled: Boolean(params),
  });

  function search() {
    if (origin.address === dest.address) {
      setFormError('Pickup and drop must be different locations.');
      return;
    }
    setFormError(null);
    setParams({
      originLat: origin.lat,
      originLng: origin.lng,
      destLat: dest.lat,
      destLng: dest.lng,
      departureTime: departure,
      seats,
      womenOnly,
    });
  }

  function compare() {
    navigation.navigate('Compare', {
      originName: origin.name,
      originAddress: origin.address,
      originLat: origin.lat,
      originLng: origin.lng,
      destName: dest.name,
      destAddress: dest.address,
      destLat: dest.lat,
      destLng: dest.lng,
      departureTime: departure,
      seats,
      womenOnly,
    });
  }

  const results = resultsQuery.data ?? [];

  return (
    <Screen>
      <View style={styles.heading}>
        <Badge label="Find a ride" tone="brand" />
        <Text style={styles.title}>Where are you headed?</Text>
        <Text style={styles.subtitle}>Search verified carpool seats across the city.</Text>
      </View>

      <Card>
        <Text style={styles.label}>Route</Text>
        <Pressable onPress={() => setPicker('origin')} style={({ pressed }) => [styles.location, pressed && styles.pressed]}>
          <View style={[styles.pin, { backgroundColor: colors.brandSoft }]}>
            <Ionicons name="radio-button-on" size={16} color={colors.brand} />
          </View>
          <View style={styles.fill}>
            <Text style={styles.locationHint}>PICKUP</Text>
            <Text style={styles.locationText} numberOfLines={1}>{origin.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
        </Pressable>
        <Pressable onPress={() => setPicker('dest')} style={({ pressed }) => [styles.location, pressed && styles.pressed]}>
          <View style={[styles.pin, { backgroundColor: colors.mintSoft }]}>
            <Ionicons name="location" size={16} color={colors.mint} />
          </View>
          <View style={styles.fill}>
            <Text style={styles.locationHint}>DROP</Text>
            <Text style={styles.locationText} numberOfLines={1}>{dest.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
        </Pressable>

        <Pressable onPress={() => setScheduleOpen(true)} style={({ pressed }) => [styles.when, pressed && styles.pressed]}>
          <Ionicons name="calendar-outline" size={18} color={colors.brand} />
          <View style={styles.fill}>
            <Text style={styles.locationHint}>DEPARTURE</Text>
            <Text style={styles.locationText}>{formatSmartDateTime(departure)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
        </Pressable>

        <View style={styles.stepperRow}>
          <View>
            <Text style={styles.label}>Seats</Text>
            <Text style={styles.hint}>Maximum 4 seats per booking.</Text>
          </View>
          <SeatStepper value={seats} onChange={setSeats} />
        </View>

        <Pressable onPress={() => setWomenOnly((value) => !value)} style={styles.toggleRow}>
          <View style={styles.fill}>
            <Text style={styles.label}>Women-only rides</Text>
            <Text style={styles.hint}>Show rides reserved for women passengers.</Text>
          </View>
          <View style={[styles.toggle, womenOnly && styles.toggleOn]}>
            <View style={[styles.knob, womenOnly && styles.knobOn]} />
          </View>
        </Pressable>

        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <Button title="Search rides" onPress={search} left={<Ionicons name="search" size={18} color={colors.white} />} />

        <Pressable onPress={compare} style={({ pressed }) => [styles.compareButton, pressed && styles.pressed]}>
          <Ionicons name="git-compare-outline" size={18} color={colors.brandDark} />
          <Text style={styles.compareText}>Compare all travel modes</Text>
        </Pressable>
      </Card>

      {params ? (
        <View style={styles.results}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Available seats</Text>
            {resultsQuery.isSuccess ? (
              <Text style={styles.resultsCount}>{results.length} {results.length === 1 ? 'ride' : 'rides'}</Text>
            ) : null}
          </View>
          {resultsQuery.isLoading ? <LoadingView label="Finding rides near you…" /> : null}
          {resultsQuery.isError ? (
            <ErrorView
              title="Search failed"
              description="Check the backend connection and try again."
              onRetry={() => void resultsQuery.refetch()}
            />
          ) : null}
          {resultsQuery.isSuccess && results.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="car-outline" size={24} color={colors.brand} />
              </View>
              <Text style={styles.emptyTitle}>No carpool seats matched</Text>
              <Text style={styles.emptyCopy}>
                Try a nearby landmark, a later departure, or compare bus, metro and cab options.
              </Text>
              <Button title="Compare alternatives" variant="outline" onPress={compare} style={{ marginTop: spacing.md }} />
            </Card>
          ) : null}
          {results.map((result) => (
            <RideCard
              key={result.ride.id}
              ride={result.ride}
              meta={result}
              onPress={() => navigation.navigate('RideDetails', { rideId: result.ride.id })}
            />
          ))}
        </View>
      ) : (
        <Card style={styles.tip}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb-outline" size={20} color={colors.amber} />
          </View>
          <View style={styles.fill}>
            <Text style={styles.tipTitle}>Pick a landmark, not an exact address</Text>
            <Text style={styles.tipCopy}>
              Curated Hyderabad pickup points keep matching reliable until live map search is connected.
            </Text>
          </View>
        </Card>
      )}

      <LocationPicker
        visible={picker === 'origin'}
        onClose={() => setPicker(null)}
        title="Choose pickup"
        selected={origin}
        onSelect={setOrigin}
      />
      <LocationPicker
        visible={picker === 'dest'}
        onClose={() => setPicker(null)}
        title="Choose drop"
        selected={dest}
        onSelect={setDest}
      />
      <SchedulePicker
        visible={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        value={departure}
        onSelect={setDeparture}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  heading: { marginBottom: spacing.lg, marginTop: spacing.sm },
  title: { ...typography.h1, marginTop: spacing.sm, fontSize: 27 },
  subtitle: { ...typography.body, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '800', color: colors.ink800 },
  hint: { ...typography.caption, marginTop: 2, lineHeight: 16 },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: colors.white,
  },
  pin: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  locationHint: { fontSize: 9, fontWeight: '800', color: colors.ink400, letterSpacing: 0.6 },
  locationText: { fontSize: 14, fontWeight: '700', color: colors.ink800, marginTop: 1 },
  pressed: { opacity: 0.8 },
  when: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.ink50,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg, marginBottom: spacing.md },
  toggle: { width: 46, height: 27, borderRadius: 14, backgroundColor: colors.ink200, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.brand },
  knob: { width: 21, height: 21, borderRadius: 11, backgroundColor: colors.white },
  knobOn: { alignSelf: 'flex-end' },
  error: { fontSize: 12, fontWeight: '600', color: colors.danger, marginBottom: spacing.sm },
  compareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, marginTop: spacing.sm },
  compareText: { fontSize: 13, fontWeight: '800', color: colors.brandDark },
  results: { marginTop: spacing.xl },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  resultsTitle: { ...typography.h3 },
  resultsCount: { ...typography.caption, fontWeight: '700' },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  emptyCopy: { ...typography.caption, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.lg },
  tipIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.amberSoft, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 13, fontWeight: '800', color: colors.ink800 },
  tipCopy: { ...typography.caption, marginTop: 3, lineHeight: 17 },
});
