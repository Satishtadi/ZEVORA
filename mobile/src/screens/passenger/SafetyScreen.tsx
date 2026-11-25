import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { safetyApi } from '../../services/api';
import { getApiErrorMessage } from '../../lib/api';
import { Badge, Button, Card, ErrorView, LoadingView, Screen, TextField } from '../../components/ui';
import { formatSmartDateTime } from '../../lib/format';
import { colors, radius, spacing, typography } from '../../theme';

async function currentCoordinates() {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}

export function SafetyScreen() {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [sosError, setSosError] = useState<string | null>(null);

  const eventsQuery = useQuery({ queryKey: ['safety', 'events'], queryFn: safetyApi.events });

  const sosMutation = useMutation({
    mutationFn: async () => {
      const coords = await currentCoordinates();
      return safetyApi.sos(
        undefined,
        coords?.latitude,
        coords?.longitude,
        'Emergency SOS raised from ZEVORA mobile app',
      );
    },
    onSuccess: async (event) => {
      setSosError(null);
      await queryClient.invalidateQueries({ queryKey: ['safety', 'events'] });
      Alert.alert(
        'SOS sent',
        `A safety event was created (${event.id.slice(0, 8)}). If you are in immediate danger, call 112 now.`,
      );
    },
    onError: (err) => setSosError(getApiErrorMessage(err, 'SOS could not be sent. Call 112 immediately.')),
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      const coords = await currentCoordinates();
      return safetyApi.report({
        type: 'INCIDENT',
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        note: note.trim(),
      });
    },
    onSuccess: async () => {
      setNote('');
      setReportError(null);
      await queryClient.invalidateQueries({ queryKey: ['safety', 'events'] });
      Alert.alert('Report submitted', 'The ZEVORA safety team can review this incident.');
    },
    onError: (err) => setReportError(getApiErrorMessage(err, 'Could not submit the safety report.')),
  });

  function confirmSos() {
    Alert.alert(
      'Send an emergency SOS?',
      'This creates a safety event with your location if permission is granted. Call 112 for immediate help.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send SOS', style: 'destructive', onPress: () => sosMutation.mutate() },
      ],
    );
  }

  return (
    <Screen refreshing={eventsQuery.isRefetching} onRefresh={() => void eventsQuery.refetch()}>
      <Text style={styles.title}>Safety centre</Text>
      <Text style={styles.subtitle}>Emergency actions and incident reporting for every ZEVORA ride.</Text>

      <View style={styles.sosCard}>
        <View style={styles.sosHeading}>
          <View style={styles.sosIcon}>
            <Ionicons name="shield-half" size={26} color={colors.white} />
          </View>
          <View style={styles.fill}>
            <Text style={styles.sosLabel}>EMERGENCY</Text>
            <Text style={styles.sosTitle}>Need help right now?</Text>
          </View>
        </View>
        <Text style={styles.sosCopy}>
          Send an SOS event to ZEVORA with your last known location. This does not replace calling emergency services.
        </Text>
        {sosError ? <Text style={styles.sosError}>{sosError}</Text> : null}
        <Pressable
          onPress={confirmSos}
          disabled={sosMutation.isPending}
          style={({ pressed }) => [styles.sosButton, (pressed || sosMutation.isPending) && { opacity: 0.82 }]}
        >
          <Ionicons name="warning" size={22} color={colors.danger} />
          <Text style={styles.sosButtonText}>{sosMutation.isPending ? 'Sending SOS…' : 'Send SOS'}</Text>
        </Pressable>
        <View style={styles.hotlines}>
          <Hotline label="Police / ambulance" number="112" />
          <Hotline label="Women helpline" number="181" />
        </View>
      </View>

      <Text style={styles.section}>Report an incident</Text>
      <Card>
        <TextField
          label="What happened?"
          value={note}
          onChangeText={setNote}
          placeholder="Describe the incident, location and anyone involved."
          multiline
          numberOfLines={4}
          style={styles.textarea}
        />
        <Text style={styles.hint}>
          Reports are private to ZEVORA safety staff. Location is attached only when permission is granted.
        </Text>
        {reportError ? <Text style={styles.formError}>{reportError}</Text> : null}
        <Button
          title="Submit incident report"
          variant="secondary"
          loading={reportMutation.isPending}
          disabled={!note.trim()}
          onPress={() => reportMutation.mutate()}
        />
      </Card>

      <Text style={styles.section}>Your safety history</Text>
      {eventsQuery.isLoading ? <LoadingView label="Loading safety events…" /> : null}
      {eventsQuery.isError ? (
        <ErrorView
          title="Could not load safety events"
          description="Try again when the backend is reachable."
          onRetry={() => void eventsQuery.refetch()}
        />
      ) : null}
      {eventsQuery.isSuccess && (eventsQuery.data?.length ?? 0) === 0 ? (
        <Card style={styles.empty}>
          <Ionicons name="shield-checkmark-outline" size={26} color={colors.mint} />
          <Text style={styles.emptyTitle}>No safety events</Text>
          <Text style={styles.emptyCopy}>SOS and incident reports you raise will be listed here.</Text>
        </Card>
      ) : null}
      {eventsQuery.data?.map((event) => (
        <Card key={event.id} style={styles.event}>
          <View style={styles.eventTop}>
            <Badge label={event.type} tone={event.type === 'SOS' ? 'danger' : 'warning'} />
            <Badge label={event.status} tone={event.status === 'RESOLVED' ? 'success' : 'neutral'} />
          </View>
          <Text style={styles.eventNote}>{event.note || 'No note provided.'}</Text>
          <Text style={styles.eventTime}>{formatSmartDateTime(event.createdAt)}</Text>
          {event.latitude != null && event.longitude != null ? (
            <Text style={styles.eventLocation}>
              {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)}
            </Text>
          ) : null}
        </Card>
      ))}

      <Text style={styles.footer}>
        ZEVORA stores safety events through the backend. In a life-threatening emergency, contact local authorities first.
      </Text>
    </Screen>
  );
}

function Hotline({ label, number }: { label: string; number: string }) {
  return (
    <Pressable
      onPress={() => void Linking.openURL(`tel:${number}`)}
      style={({ pressed }) => [styles.hotline, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.fill}>
        <Text style={styles.hotlineLabel}>{label}</Text>
        <Text style={styles.hotlineNumber}>{number}</Text>
      </View>
      <Ionicons name="call" size={17} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  title: { ...typography.h1, marginTop: spacing.sm },
  subtitle: { ...typography.body, marginTop: 4, marginBottom: spacing.lg },
  sosCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  sosHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sosIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  sosLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: '#ffb4b4' },
  sosTitle: { fontSize: 19, fontWeight: '800', color: colors.white, marginTop: 2 },
  sosCopy: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 18, marginTop: spacing.md },
  sosError: { fontSize: 12, color: '#ffb4b4', fontWeight: '700', marginTop: spacing.sm },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    minHeight: 50,
    marginTop: spacing.lg,
  },
  sosButtonText: { fontSize: 15, fontWeight: '800', color: colors.danger },
  hotlines: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  hotline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  hotlineLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)' },
  hotlineNumber: { fontSize: 15, fontWeight: '800', color: colors.white },
  section: { ...typography.h3, marginTop: spacing.xl, marginBottom: spacing.sm },
  textarea: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  hint: { ...typography.caption, marginTop: -4, marginBottom: spacing.md, lineHeight: 16 },
  formError: { fontSize: 12, color: colors.danger, fontWeight: '600', marginBottom: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: spacing.sm },
  emptyCopy: { ...typography.caption, marginTop: 4, textAlign: 'center' },
  event: { marginBottom: spacing.sm },
  eventTop: { flexDirection: 'row', gap: 6, marginBottom: spacing.sm },
  eventNote: { ...typography.body, fontSize: 14 },
  eventTime: { ...typography.caption, marginTop: spacing.sm },
  eventLocation: { fontSize: 10, color: colors.ink400, marginTop: 4, fontVariant: ['tabular-nums'] },
  footer: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl, fontSize: 10, lineHeight: 16 },
});
