import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { commuteApi } from '../../services/api';
import { Badge, Button, Card, ErrorView, LoadingView, Screen } from '../../components/ui';
import { formatCurrency, formatDistanceKm, formatDuration, formatSmartDateTime } from '../../lib/format';
import { providerLabels } from '../../lib/hyderabad';
import { colors, radius, spacing, typography } from '../../theme';
import type { RootStackParamList, SearchStackParamList } from '../../navigation/types';
import type { TravelOption } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList & SearchStackParamList>;

const categoryIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  PRIVATE_CARPOOL: 'car-sport-outline',
  COMMERCIAL_SHARED_CAB: 'car-outline',
  PUBLIC_BUS: 'bus-outline',
  METRO_FEEDER: 'train-outline',
  COMPANY_SHUTTLE: 'business-outline',
  AUTO: 'car-outline',
  CAB: 'car-outline',
  EXTERNAL_CAB: 'open-outline',
};

export function CompareScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<SearchStackParamList, 'Compare'>>();
  const params = route.params;

  const query = useQuery({
    queryKey: ['commute', 'compare', params],
    queryFn: () =>
      commuteApi.compare({
        originAddress: params.originAddress,
        originLat: params.originLat,
        originLng: params.originLng,
        destAddress: params.destAddress,
        destLat: params.destLat,
        destLng: params.destLng,
        departureTime: params.departureTime,
        seats: params.seats,
        womenOnly: params.womenOnly,
        preference: params.preference,
      }),
  });

  const data = query.data;
  const recommended = data?.options.find((option) => option.key === data.recommendedOptionKey);

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
        <Ionicons name="chevron-back" size={22} color={colors.ink800} />
      </Pressable>
      <Badge label="All travel modes" tone="brand" />
      <Text style={styles.title}>Compare your commute</Text>
      <Text style={styles.subtitle}>
        {params.originName ?? params.originAddress} → {params.destName ?? params.destAddress}
      </Text>

      <Card style={styles.summary}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>DEPARTURE</Text>
            <Text style={styles.summaryValue}>{formatSmartDateTime(params.departureTime)}</Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryLabel}>SEATS</Text>
            <Text style={styles.summaryValue}>{params.seats}</Text>
          </View>
        </View>
        {data ? (
          <View style={styles.summaryStats}>
            <Stat label="Distance" value={formatDistanceKm(data.distanceKm)} />
            <Stat label="Options" value={String(data.options.length)} />
            <Stat label="Women only" value={params.womenOnly ? 'Yes' : 'No'} />
          </View>
        ) : null}
        {recommended ? (
          <View style={styles.recommended}>
            <View style={styles.recommendedIcon}>
              <Ionicons name="sparkles" size={16} color={colors.brandDark} />
            </View>
            <View style={styles.fill}>
              <Text style={styles.recommendedLabel}>RECOMMENDED</Text>
              <Text style={styles.recommendedValue}>
                {providerLabels[recommended.category] ?? recommended.category} · {formatCurrency(recommended.farePerPassenger)}
              </Text>
            </View>
          </View>
        ) : null}
      </Card>

      {query.isLoading ? <LoadingView label="Comparing fares and arrivals…" /> : null}
      {query.isError ? (
        <ErrorView
          title="Could not compare options"
          description="The comparison service is unreachable. Try again in a moment."
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {data?.options.map((option) => (
        <OptionCard
          key={option.key}
          option={option}
          onOpenRide={() => option.rideId && navigation.navigate('RideDetails', { rideId: option.rideId })}
        />
      ))}

      {data ? <Text style={styles.disclaimer}>{data.disclaimer}</Text> : null}
      <Text style={styles.note}>
        Fares and arrival times are estimates. ZEVORA does not process payments in this version; pay the provider directly
        unless stated otherwise.
      </Text>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OptionCard({ option, onOpenRide }: { option: TravelOption; onOpenRide: () => void }) {
  const canOpenExternal = Boolean(option.deepLink && /^https?:\/\//i.test(option.deepLink));
  return (
    <Card style={styles.option}>
      <View style={styles.optionTop}>
        <View style={styles.optionIdentity}>
          <View style={styles.optionIcon}>
            <Ionicons name={categoryIcon[option.category] ?? 'navigate-outline'} size={19} color={colors.brandDark} />
          </View>
          <View style={styles.fill}>
            <Text style={styles.optionProvider} numberOfLines={1}>{option.providerName}</Text>
            <Text style={styles.optionCategory}>
              {providerLabels[option.category] ?? option.category}
              {option.verified ? ' · Verified' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.optionPrice}>
          <Text style={styles.fare}>{formatCurrency(option.farePerPassenger)}</Text>
          <Text style={styles.perSeat}>per passenger</Text>
        </View>
      </View>

      <View style={styles.optionBadges}>
        <Badge label={option.source} tone={option.source === 'LIVE' ? 'success' : option.source === 'EXTERNAL' ? 'warning' : 'neutral'} />
        {option.recommended ? <Badge label="Recommended" tone="brand" /> : null}
        {option.availableSeats <= 0 ? <Badge label="Full" /> : null}
      </View>

      <View style={styles.metrics}>
        <Metric icon="time-outline" label={formatDuration(option.durationMinutes)} />
        <Metric icon="walk-outline" label={formatDistanceKm(option.walkingDistanceMeters / 1000)} />
        <Metric icon="car-outline" label={`${option.pickupEtaMinutes} min pickup`} />
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Pickup</Text>
        <Text style={styles.detailValue}>{option.pickupLabel}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Drop</Text>
        <Text style={styles.detailValue}>{option.dropLabel}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Booking</Text>
        <Text style={styles.detailValue}>{option.bookingMethod}</Text>
      </View>
      {option.note ? <Text style={styles.optionNote}>{option.note}</Text> : null}

      {option.rideId ? (
        <Button title="View carpool seats" variant="outline" onPress={onOpenRide} style={{ marginTop: spacing.md }} />
      ) : canOpenExternal && option.deepLink ? (
        <Button
          title="Open provider"
          variant="outline"
          onPress={() => void Linking.openURL(option.deepLink as string)}
          style={{ marginTop: spacing.md }}
        />
      ) : (
        <View style={styles.unavailable}>
          <Ionicons name="information-circle-outline" size={15} color={colors.ink500} />
          <Text style={styles.unavailableText}>{option.cancellationPolicy}</Text>
        </View>
      )}
    </Card>
  );
}

function Metric({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={14} color={colors.ink500} />
      <Text style={styles.metricText}>{label}</Text>
    </View>
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
  title: { ...typography.h1, marginTop: spacing.sm, fontSize: 27 },
  subtitle: { ...typography.body, marginTop: 4, marginBottom: spacing.lg },
  summary: { marginBottom: spacing.lg },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryRight: { alignItems: 'flex-end' },
  summaryLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6, color: colors.ink400 },
  summaryValue: { fontSize: 14, fontWeight: '800', color: colors.ink, marginTop: 2 },
  summaryStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.ink100, marginTop: spacing.md, paddingTop: spacing.md },
  stat: { flex: 1 },
  statValue: { fontSize: 15, fontWeight: '800', color: colors.ink },
  statLabel: { ...typography.caption, fontSize: 10, marginTop: 1 },
  recommended: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  recommendedIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  recommendedLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7, color: colors.brandDark },
  recommendedValue: { fontSize: 13, fontWeight: '700', color: colors.ink800, marginTop: 1 },
  option: { marginBottom: spacing.md },
  optionTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  optionIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  optionProvider: { fontSize: 14, fontWeight: '800', color: colors.ink800 },
  optionCategory: { fontSize: 11, color: colors.ink500, marginTop: 2 },
  optionPrice: { alignItems: 'flex-end' },
  fare: { fontSize: 19, fontWeight: '800', color: colors.ink },
  perSeat: { fontSize: 9, color: colors.ink400 },
  optionBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: spacing.md },
  metrics: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm, flexWrap: 'wrap' },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricText: { fontSize: 11, fontWeight: '600', color: colors.ink600 },
  detailRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: 3 },
  detailLabel: { width: 56, fontSize: 11, color: colors.ink400 },
  detailValue: { flex: 1, fontSize: 11, color: colors.ink600, fontWeight: '600' },
  optionNote: { ...typography.caption, marginTop: spacing.sm, lineHeight: 16 },
  unavailable: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: spacing.md },
  unavailableText: { flex: 1, fontSize: 11, color: colors.ink500, lineHeight: 16 },
  disclaimer: { ...typography.caption, marginTop: spacing.sm, lineHeight: 17, fontStyle: 'italic' },
  note: { ...typography.caption, marginTop: spacing.md, lineHeight: 17 },
});
