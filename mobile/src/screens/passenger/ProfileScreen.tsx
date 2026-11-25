import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { driversApi, usersApi } from '../../services/api';
import { getApiErrorMessage } from '../../lib/api';
import { LocationPicker } from '../../components/LocationPicker';
import { ModalSheet } from '../../components/ModalSheet';
import { Avatar, Badge, Button, Card, Chip, Divider, ErrorView, LoadingView, Screen, TextField } from '../../components/ui';
import { findLocation, type HydLocation } from '../../lib/hyderabad';
import { roleLabels } from '../../lib/roles';
import { colors, radius, spacing, typography } from '../../theme';
import type { PassengerTabParamList, RootStackParamList } from '../../navigation/types';
import type { DriverType, MeResponse } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList & PassengerTabParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const query = useQuery({ queryKey: ['me', 'profile'], queryFn: usersApi.me });

  if (query.isLoading) {
    return (
      <Screen>
        <Text style={styles.title}>Profile</Text>
        <LoadingView label="Loading your profile…" />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <Text style={styles.title}>Profile</Text>
        <ErrorView
          title="Could not load profile"
          description="Sign in again or retry when the backend is reachable."
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  }

  return (
    <ProfileContent
      me={query.data}
      onOpenNotifications={() => navigation.navigate('Notifications')}
      onRefreshed={() => void query.refetch()}
    />
  );
}

function ProfileContent({
  me,
  onOpenNotifications,
  onRefreshed,
}: {
  me: MeResponse;
  onOpenNotifications: () => void;
  onRefreshed: () => void;
}) {
  const { logout, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(me.fullName);
  const [home, setHome] = useState<HydLocation | null>(findLocation(me.profile.homeAddress) ?? null);
  const [work, setWork] = useState<HydLocation | null>(findLocation(me.profile.workAddress) ?? null);
  const [homeAddress, setHomeAddress] = useState(me.profile.homeAddress ?? '');
  const [workAddress, setWorkAddress] = useState(me.profile.workAddress ?? '');
  const [womenOnly, setWomenOnly] = useState(me.profile.womenOnly);
  const [emergencyName, setEmergencyName] = useState(me.profile.emergencyContactName ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(me.profile.emergencyContactPhone ?? '');
  const [picker, setPicker] = useState<'home' | 'work' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [driverOpen, setDriverOpen] = useState(false);
  const [driverType, setDriverType] = useState<DriverType>('PRIVATE_CARPOOL');
  const [license, setLicense] = useState('');
  const [driverError, setDriverError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        fullName: fullName.trim() || undefined,
        homeAddress: homeAddress || undefined,
        homeLat: home?.lat,
        homeLng: home?.lng,
        workAddress: workAddress || undefined,
        workLat: work?.lat,
        workLng: work?.lng,
        womenOnly,
        emergencyContactName: emergencyName.trim() || undefined,
        emergencyContactPhone: emergencyPhone.trim() || undefined,
      }),
    onSuccess: async () => {
      setError(null);
      setSaved(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        refreshUser(),
      ]);
      onRefreshed();
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Could not save profile changes.')),
  });

  const driverMutation = useMutation({
    mutationFn: () => driversApi.register(driverType, license.trim()),
    onSuccess: async () => {
      setDriverOpen(false);
      setDriverError(null);
      await refreshUser();
      Alert.alert(
        'Driver profile created',
        'Your driver profile is pending admin verification. You have been switched to the driver portal.',
      );
    },
    onError: (err) => setDriverError(getApiErrorMessage(err, 'Could not create a driver profile.')),
  });

  function confirmLogout() {
    Alert.alert('Sign out?', 'You will need to sign in again to access your bookings.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  return (
    <Screen>
      <View style={styles.topRow}>
        <Text style={styles.title}>Profile</Text>
        <Pressable onPress={onOpenNotifications} style={styles.bell} hitSlop={8}>
          <Ionicons name="notifications-outline" size={21} color={colors.ink800} />
        </Pressable>
      </View>

      <Card style={styles.hero}>
        <View style={styles.identity}>
          <Avatar name={me.fullName} size={58} />
          <View style={styles.fill}>
            <Text style={styles.name}>{me.fullName}</Text>
            <Text style={styles.email}>{me.email}</Text>
            <View style={styles.badges}>
              <Badge label={roleLabels[me.role] ?? me.role} tone="brand" />
              <Badge label={me.status} tone={me.status === 'ACTIVE' ? 'success' : 'danger'} />
            </View>
          </View>
        </View>
        <Divider />
        <View style={styles.verifyRow}>
          <Verify icon="mail-outline" label="Email" verified={me.emailVerified} />
          <Verify icon="call-outline" label="Phone" verified={me.phoneVerified} />
        </View>
        <Text style={styles.verifyNote}>
          Verification status comes from the backend. Document upload and OTP completion are not connected in the mobile app yet.
        </Text>
      </Card>

      <Text style={styles.section}>Commute profile</Text>
      <Card>
        <TextField label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />

        <Text style={styles.fieldLabel}>Home location</Text>
        <Pressable onPress={() => setPicker('home')} style={({ pressed }) => [styles.location, pressed && { opacity: 0.8 }]}>
          <Ionicons name="home-outline" size={17} color={colors.brand} />
          <Text style={[styles.locationText, !homeAddress && styles.placeholder]} numberOfLines={1}>
            {homeAddress || 'Choose home pickup point'}
          </Text>
          <Ionicons name="chevron-forward" size={17} color={colors.ink400} />
        </Pressable>

        <Text style={styles.fieldLabel}>Work location</Text>
        <Pressable onPress={() => setPicker('work')} style={({ pressed }) => [styles.location, pressed && { opacity: 0.8 }]}>
          <Ionicons name="business-outline" size={17} color={colors.brand} />
          <Text style={[styles.locationText, !workAddress && styles.placeholder]} numberOfLines={1}>
            {workAddress || 'Choose work drop point'}
          </Text>
          <Ionicons name="chevron-forward" size={17} color={colors.ink400} />
        </Pressable>

        <Pressable onPress={() => setWomenOnly((value) => !value)} style={styles.toggleRow}>
          <View style={styles.fill}>
            <Text style={styles.fieldLabel}>Prefer women-only rides</Text>
            <Text style={styles.hint}>Applied as a default preference when you search.</Text>
          </View>
          <View style={[styles.toggle, womenOnly && styles.toggleOn]}>
            <View style={[styles.knob, womenOnly && styles.knobOn]} />
          </View>
        </Pressable>

        <TextField
          label="Emergency contact name"
          value={emergencyName}
          onChangeText={setEmergencyName}
          placeholder="Name"
          autoCapitalize="words"
        />
        <TextField
          label="Emergency contact phone"
          value={emergencyPhone}
          onChangeText={setEmergencyPhone}
          placeholder="+91…"
          keyboardType="phone-pad"
        />

        {error ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {saved ? (
          <View style={styles.success}>
            <Ionicons name="checkmark-circle" size={16} color={colors.mint} />
            <Text style={styles.successText}>Profile saved.</Text>
          </View>
        ) : null}
        <Button title="Save changes" loading={updateMutation.isPending} onPress={() => updateMutation.mutate()} />
      </Card>

      <Text style={styles.section}>Account</Text>
      <Card>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Phone</Text>
          <Text style={styles.accountValue}>{me.phone}</Text>
        </View>
        <Divider />
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Member since</Text>
          <Text style={styles.accountValue}>{new Date(me.createdAt).getFullYear()}</Text>
        </View>
        <Divider />
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>App version</Text>
          <Text style={styles.accountValue}>Expo · SDK 58</Text>
        </View>
      </Card>

      {me.role === 'PASSENGER' ? (
        <Card style={styles.becomeDriver}>
          <View style={styles.becomeIcon}>
            <Ionicons name="car-sport" size={22} color={colors.brandDark} />
          </View>
          <Text style={styles.becomeTitle}>Drive and share your commute</Text>
          <Text style={styles.becomeCopy}>
            Register as a private carpool or commercial driver. Admin verification is required before publishing rides.
          </Text>
          <Button
            title="Become a driver"
            variant="secondary"
            onPress={() => {
              setDriverError(null);
              setDriverOpen(true);
            }}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : null}

      <Button title="Sign out" variant="outline" onPress={confirmLogout} style={{ marginTop: spacing.lg }} />

      <Text style={styles.footer}>
        ZEVORA mobile supports passenger and driver journeys. Admin, corporate and operator portals are available on the
        web app.
      </Text>

      <LocationPicker
        visible={picker === 'home'}
        onClose={() => setPicker(null)}
        title="Home location"
        selected={home}
        onSelect={(location) => {
          setHome(location);
          setHomeAddress(location.address);
        }}
      />
      <LocationPicker
        visible={picker === 'work'}
        onClose={() => setPicker(null)}
        title="Work location"
        selected={work}
        onSelect={(location) => {
          setWork(location);
          setWorkAddress(location.address);
        }}
      />

      <ModalSheet visible={driverOpen} onClose={() => setDriverOpen(false)} title="Become a driver">
        <Card>
          <Text style={styles.driverTypeLabel}>Driver type</Text>
          <View style={styles.driverTypes}>
            <Chip
              label="Private carpool"
              active={driverType === 'PRIVATE_CARPOOL'}
              onPress={() => setDriverType('PRIVATE_CARPOOL')}
            />
            <Chip
              label="Commercial"
              active={driverType === 'COMMERCIAL'}
              onPress={() => setDriverType('COMMERCIAL')}
            />
          </View>
          <TextField
            label="Driving licence number"
            value={license}
            onChangeText={setLicense}
            placeholder="TS0120230001234"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={40}
          />
          <View style={styles.driverNotice}>
            <Ionicons name="information-circle-outline" size={16} color={colors.amber} />
            <Text style={styles.driverNoticeText}>
              Creating a driver profile changes your account role. An admin must approve the profile and licence before you can
              publish rides.
            </Text>
          </View>
        </Card>
        {driverError ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{driverError}</Text>
          </View>
        ) : null}
        <Button
          title="Create driver profile"
          variant="secondary"
          loading={driverMutation.isPending}
          disabled={license.trim().length < 6}
          onPress={() => driverMutation.mutate()}
          style={{ marginTop: spacing.md }}
        />
      </ModalSheet>
    </Screen>
  );
}

function Verify({ icon, label, verified }: { icon: keyof typeof Ionicons.glyphMap; label: string; verified: boolean }) {
  return (
    <View style={styles.verify}>
      <Ionicons name={icon} size={16} color={verified ? colors.mint : colors.ink400} />
      <Text style={styles.verifyLabel}>{label}</Text>
      <Ionicons
        name={verified ? 'checkmark-circle' : 'ellipse-outline'}
        size={15}
        color={verified ? colors.mint : colors.ink400}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  title: { ...typography.h1 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { marginTop: spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontSize: 18, fontWeight: '800', color: colors.ink },
  email: { ...typography.caption, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: spacing.sm, flexWrap: 'wrap' },
  verifyRow: { flexDirection: 'row', gap: spacing.lg },
  verify: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  verifyLabel: { fontSize: 12, fontWeight: '600', color: colors.ink600 },
  verifyNote: { fontSize: 10, color: colors.ink400, marginTop: spacing.sm, lineHeight: 15 },
  section: { ...typography.h3, marginTop: spacing.xl, marginBottom: spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.ink800, marginBottom: 6 },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 48,
  },
  locationText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink800 },
  placeholder: { color: colors.ink400, fontWeight: '400' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  hint: { ...typography.caption, marginTop: 2, lineHeight: 16 },
  toggle: { width: 46, height: 27, borderRadius: 14, backgroundColor: colors.ink200, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.brand },
  knob: { width: 21, height: 21, borderRadius: 11, backgroundColor: colors.white },
  knobOn: { alignSelf: 'flex-end' },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: { flex: 1, fontSize: 12, color: '#b42323', fontWeight: '600', lineHeight: 17 },
  success: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.mintSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  successText: { fontSize: 12, color: '#0d8f80', fontWeight: '700' },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 3 },
  accountLabel: { fontSize: 12, color: colors.ink500 },
  accountValue: { fontSize: 12, fontWeight: '700', color: colors.ink800, textAlign: 'right' },
  becomeDriver: { marginTop: spacing.lg, backgroundColor: colors.brandSoft, borderColor: '#ddd7ff' },
  becomeIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  becomeTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  becomeCopy: { ...typography.caption, marginTop: 4, lineHeight: 17 },
  driverTypeLabel: { fontSize: 13, fontWeight: '700', color: colors.ink800, marginBottom: spacing.sm },
  driverTypes: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  driverNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  driverNoticeText: { flex: 1, fontSize: 11, color: '#8a5a00', lineHeight: 16 },
  footer: { ...typography.caption, textAlign: 'center', marginTop: spacing.lg, lineHeight: 17, fontSize: 10 },
});
