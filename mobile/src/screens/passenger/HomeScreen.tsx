import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { bookingsApi, commuteApi, notificationsApi } from '../../services/api';
import { BookingCard } from '../../components/RideCard';
import { Badge, Button, Card, ErrorView, LoadingView, Screen, SectionTitle } from '../../components/ui';
import { formatCurrency, formatRelative } from '../../lib/format';
import { colors, radius, spacing, typography } from '../../theme';
import type { PassengerTabParamList, RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList & PassengerTabParamList>;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const bookingsQuery = useQuery({ queryKey: ['bookings', 'home'], queryFn: () => bookingsApi.mine(0, 20) });
  const savingsQuery = useQuery({ queryKey: ['commute', 'savings'], queryFn: commuteApi.monthlySavings });
  const unreadQuery = useQuery({ queryKey: ['notifications', 'unread'], queryFn: notificationsApi.unreadCount });

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const bookings = bookingsQuery.data?.items ?? [];
  const upcoming = bookings
    .filter((booking) => booking.status === 'CONFIRMED' || booking.status === 'REQUESTED' || booking.status === 'IN_PROGRESS')
    .slice(0, 3);
  const unread = unreadQuery.data?.count ?? 0;

  return (
    <Screen
      refreshing={bookingsQuery.isRefetching}
      onRefresh={() => {
        void bookingsQuery.refetch();
        void savingsQuery.refetch();
        void unreadQuery.refetch();
      }}
    >
      <View style={styles.topRow}>
        <View style={styles.fill}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.bell} hitSlop={8}>
          <Ionicons name="notifications-outline" size={22} color={colors.ink800} />
          {unread > 0 ? <View style={styles.bellDot} /> : null}
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroCircleLarge} />
        <View style={styles.heroCircleSmall} />
        <View style={styles.heroBadge}>
          <Ionicons name="sparkles" size={13} color={colors.white} />
          <Text style={styles.heroBadgeText}>HYDERABAD SHARED COMMUTE</Text>
        </View>
        <Text style={styles.heroTitle}>Your seat to a{'\n'}smarter commute.</Text>
        <Text style={styles.heroCopy}>Find verified carpool seats or compare bus, metro, auto and cab options.</Text>
        <View style={styles.heroActions}>
          <Button title="Find a ride" variant="outline" onPress={() => navigation.navigate('SearchTab', { screen: 'Search' })} />
          <Pressable
            onPress={() =>
              navigation.navigate('SearchTab', {
                screen: 'Compare',
                params: {
                  originName: 'Kukatpally Metro',
                  originAddress: 'Kukatpally, Hyderabad',
                  originLat: 17.4948,
                  originLng: 78.3996,
                  destName: 'HITEC City (Cyber Towers)',
                  destAddress: 'HITEC City, Hyderabad',
                  destLat: 17.4483,
                  destLng: 78.3915,
                  departureTime: new Date(Date.now() + 3600_000).toISOString(),
                  seats: 1,
                  womenOnly: false,
                },
              })
            }
            style={({ pressed }) => [styles.compareLink, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.compareLinkText}>Compare all modes</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <View style={styles.quickRow}>
        <QuickAction
          icon="git-compare-outline"
          label="Compare"
          onPress={() =>
            navigation.navigate('SearchTab', {
              screen: 'Compare',
              params: {
                originAddress: 'Kukatpally, Hyderabad',
                originLat: 17.4948,
                originLng: 78.3996,
                destAddress: 'HITEC City, Hyderabad',
                destLat: 17.4483,
                destLng: 78.3915,
                departureTime: new Date(Date.now() + 3600_000).toISOString(),
                seats: 1,
                womenOnly: false,
              },
            })
          }
        />
        <QuickAction icon="ticket-outline" label="My rides" onPress={() => navigation.navigate('BookingsTab', { screen: 'Bookings' })} />
        <QuickAction icon="shield-checkmark-outline" label="Safety" onPress={() => navigation.navigate('SafetyTab')} />
      </View>

      {upcoming.length > 0 ? (
        <>
          <SectionTitle action={<Text style={styles.sectionLink} onPress={() => navigation.navigate('BookingsTab', { screen: 'Bookings' })}>View all</Text>}>
            Upcoming rides
          </SectionTitle>
          {bookingsQuery.isLoading ? (
            <LoadingView label="Loading your rides…" />
          ) : (
            upcoming.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
              />
            ))
          )}
        </>
      ) : null}

      {bookingsQuery.isError ? (
        <ErrorView
          title="Could not load your bookings"
          description="Check that the ZEVORA backend is reachable and try again."
          onRetry={() => void bookingsQuery.refetch()}
        />
      ) : null}

      <SectionTitle>Your impact</SectionTitle>
      <Card style={styles.savingsCard}>
        {savingsQuery.isLoading ? (
          <LoadingView label="Calculating savings…" />
        ) : savingsQuery.isError ? (
          <View>
            <Text style={styles.savingsTitle}>Savings unavailable</Text>
            <Text style={styles.savingsCopy}>
              The savings estimate could not be loaded. Completed shared rides will appear here.
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.savingsTop}>
              <View>
                <Text style={styles.savingsLabel}>ESTIMATED SAVINGS</Text>
                <Text style={styles.savingsAmount}>{formatCurrency(savingsQuery.data?.savings)}</Text>
              </View>
              <Badge label={`${savingsQuery.data?.completedTrips ?? 0} trips`} tone="success" />
            </View>
            <View style={styles.savingsBar}>
              <View style={styles.savingsBarFill} />
            </View>
            <Text style={styles.savingsCopy}>
              You spent {formatCurrency(savingsQuery.data?.sharedSpend)} on shared rides versus{' '}
              {formatCurrency(savingsQuery.data?.estimatedSoloSpend)} estimated solo travel.
            </Text>
          </View>
        )}
      </Card>

      {unread > 0 ? (
        <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.notice}>
          <Ionicons name="notifications" size={18} color={colors.brand} />
          <View style={styles.fill}>
            <Text style={styles.noticeTitle}>{unread} unread update{unread === 1 ? '' : 's'}</Text>
            <Text style={styles.noticeCopy}>Booking changes and safety notices appear in your inbox.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.ink400} />
        </Pressable>
      ) : null}

      <Text style={styles.updated}>{bookingsQuery.dataUpdatedAt ? `Updated ${formatRelative(new Date(bookingsQuery.dataUpdatedAt).toISOString())}` : ''}</Text>
    </Screen>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, pressed && { opacity: 0.8 }]}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={20} color={colors.brandDark} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { ...typography.caption, fontSize: 13 },
  name: { ...typography.h2, marginTop: 1 },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: { position: 'absolute', top: 9, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: colors.white },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  heroCircleLarge: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: colors.brand, opacity: 0.28, top: -90, right: -70 },
  heroCircleSmall: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: colors.mint, opacity: 0.16, bottom: -60, left: -30 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  heroBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: colors.white },
  heroTitle: { fontSize: 27, fontWeight: '800', color: colors.white, marginTop: spacing.md, lineHeight: 33, letterSpacing: -0.5 },
  heroCopy: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: spacing.sm, lineHeight: 19 },
  heroActions: { marginTop: spacing.lg, gap: spacing.sm },
  compareLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  compareLinkText: { fontSize: 13, fontWeight: '700', color: colors.white },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quick: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink100,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  quickIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', color: colors.ink600 },
  sectionLink: { fontSize: 12, fontWeight: '800', color: colors.brand },
  savingsCard: { backgroundColor: colors.white },
  savingsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  savingsLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7, color: colors.ink500 },
  savingsAmount: { fontSize: 30, fontWeight: '800', color: colors.ink, marginTop: 2, letterSpacing: -0.8 },
  savingsBar: { height: 8, borderRadius: 4, backgroundColor: colors.ink100, marginTop: spacing.md, overflow: 'hidden' },
  savingsBarFill: { width: '68%', height: '100%', borderRadius: 4, backgroundColor: colors.mint },
  savingsCopy: { ...typography.caption, marginTop: spacing.sm, lineHeight: 17 },
  savingsTitle: { ...typography.h3 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  noticeTitle: { fontSize: 13, fontWeight: '800', color: colors.ink800 },
  noticeCopy: { fontSize: 11, color: colors.ink500, marginTop: 2, lineHeight: 16 },
  updated: { ...typography.caption, textAlign: 'center', marginTop: spacing.lg, fontSize: 10 },
});
