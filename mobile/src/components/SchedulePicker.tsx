import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ModalSheet } from './ModalSheet';
import { Button } from './ui';
import { colors, radius, spacing } from '../theme';
import { defaultDeparture } from '../lib/format';

const TIME_SLOTS = Array.from({ length: 33 }, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

function dateAtTime(day: Date, time: string) {
  const [hour, minute] = time.split(':').map(Number);
  const next = new Date(day);
  next.setHours(hour, minute, 0, 0);
  return next;
}

export function SchedulePicker({
  visible,
  onClose,
  value,
  onSelect,
  title = 'Choose departure',
}: {
  visible: boolean;
  onClose: () => void;
  value: string;
  onSelect: (iso: string) => void;
  title?: string;
}) {
  const [day, setDay] = useState<Date>(() => parseISO(value));
  const [time, setTime] = useState(() => format(parseISO(value), 'HH:mm'));

  useEffect(() => {
    if (!visible) return;
    const parsed = parseISO(value);
    if (!Number.isNaN(parsed.getTime())) {
      setDay(parsed);
      setTime(format(parsed, 'HH:mm'));
    }
  }, [visible, value]);

  const days = useMemo(() => {
    const start = startOfDay(new Date());
    return Array.from({ length: 8 }, (_, index) => addDays(start, index));
  }, []);

  const candidate = dateAtTime(day, time);
  const invalid = candidate.getTime() < Date.now() + 60_000;

  return (
    <ModalSheet visible={visible} onClose={onClose} title={title}>
      <Text style={styles.label}>Date</Text>
      <View style={styles.days}>
        {days.map((date) => {
          const active = isSameDay(date, day);
          const today = isSameDay(date, new Date());
          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => setDay(date)}
              style={({ pressed }) => [styles.day, active && styles.dayActive, pressed && styles.pressed]}
            >
              <Text style={[styles.dayName, active && styles.dayNameActive]}>{today ? 'Today' : format(date, 'EEE')}</Text>
              <Text style={[styles.dayNumber, active && styles.dayNumberActive]}>{format(date, 'd')}</Text>
              <Text style={[styles.dayMonth, active && styles.dayNameActive]}>{format(date, 'MMM')}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: spacing.lg }]}>Time</Text>
      <View style={styles.slots}>
        {TIME_SLOTS.map((slot) => {
          const active = slot === time;
          const past = dateAtTime(day, slot).getTime() < Date.now() + 60_000;
          return (
            <Pressable
              key={slot}
              onPress={() => setTime(slot)}
              disabled={past}
              style={({ pressed }) => [
                styles.slot,
                active && styles.slotActive,
                past && styles.slotDisabled,
                pressed && !past ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.slotText, active && styles.slotTextActive, past && styles.slotTextDisabled]}>
                {format(dateAtTime(day, slot), 'h:mm a')}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {invalid ? <Text style={styles.warning}>Pick a departure at least a minute in the future.</Text> : null}
      <Button
        title={`Use ${format(candidate, 'EEE d MMM, h:mm a')}`}
        disabled={invalid}
        onPress={() => {
          onSelect(candidate.toISOString());
          onClose();
        }}
        style={{ marginTop: spacing.lg }}
      />
      <Text style={styles.note}>Default is tomorrow morning. Backend rejects past departure times.</Text>
    </ModalSheet>
  );
}

export function fallbackDeparture() {
  return defaultDeparture();
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '800', color: colors.ink800, marginBottom: spacing.sm },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  day: {
    width: 62,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dayActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  dayName: { fontSize: 10, fontWeight: '700', color: colors.ink500, textTransform: 'uppercase' },
  dayNameActive: { color: colors.brandDark },
  dayNumber: { fontSize: 20, fontWeight: '800', color: colors.ink },
  dayNumberActive: { color: colors.brandDark },
  dayMonth: { fontSize: 10, color: colors.ink500 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    width: '31%',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    paddingVertical: 9,
    alignItems: 'center',
  },
  slotActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  slotDisabled: { opacity: 0.35 },
  slotText: { fontSize: 12, fontWeight: '700', color: colors.ink600 },
  slotTextActive: { color: colors.white },
  slotTextDisabled: { color: colors.ink400 },
  pressed: { opacity: 0.8 },
  warning: { fontSize: 12, color: colors.danger, fontWeight: '600', marginTop: spacing.sm },
  note: { fontSize: 11, color: colors.ink400, marginTop: spacing.sm },
});
