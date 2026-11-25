import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import { Badge, ErrorView, LoadingView, Screen } from '../../components/ui';
import { formatRelative } from '../../lib/format';
import { colors, radius, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const iconByType: Record<string, keyof typeof Ionicons.glyphMap> = {
  BOOKING: 'ticket-outline',
  CANCELLATION: 'close-circle-outline',
  SAFETY: 'shield-outline',
  SYSTEM: 'settings-outline',
  PAYMENT: 'card-outline',
  VERIFICATION: 'checkmark-circle-outline',
};

export function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['notifications', 'list'], queryFn: notificationsApi.list });

  const readMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] }),
      ]);
    },
  });

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
        <Ionicons name="chevron-back" size={22} color={colors.ink800} />
      </Pressable>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Booking updates, safety notices and account messages.</Text>

      {query.isLoading ? <LoadingView label="Loading notifications…" /> : null}
      {query.isError ? (
        <ErrorView
          title="Could not load notifications"
          description="Check the backend connection and retry."
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && (query.data?.length ?? 0) === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={26} color={colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>You are all caught up</Text>
          <Text style={styles.emptyCopy}>New booking and safety updates will appear here.</Text>
        </View>
      ) : null}

      {query.data?.map((notification) => (
        <Pressable
          key={notification.id}
          onPress={() => {
            if (!notification.read) readMutation.mutate(notification.id);
          }}
          style={({ pressed }) => [
            styles.item,
            !notification.read && styles.unread,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.icon}>
            <Ionicons name={iconByType[notification.type] ?? 'notifications-outline'} size={19} color={colors.brandDark} />
          </View>
          <View style={styles.fill}>
            <View style={styles.itemTop}>
              <Text style={styles.itemTitle} numberOfLines={1}>{notification.title}</Text>
              {!notification.read ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.message}>{notification.message}</Text>
            <View style={styles.itemBottom}>
              <Badge label={notification.type} />
              <Text style={styles.time}>{formatRelative(notification.createdAt)}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </Screen>
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
  title: { ...typography.h1, marginTop: spacing.sm },
  subtitle: { ...typography.body, marginTop: 4, marginBottom: spacing.lg },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.h3 },
  emptyCopy: { ...typography.caption, marginTop: 4, textAlign: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink100,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  unread: { borderColor: colors.brand, backgroundColor: '#fbfaff' },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: colors.ink800 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
  message: { fontSize: 12, color: colors.ink500, lineHeight: 17, marginTop: 4 },
  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.sm },
  time: { fontSize: 10, color: colors.ink400 },
});
