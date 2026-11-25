import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModalSheet } from './ModalSheet';
import { hyderabadLocations, type HydLocation } from '../lib/hyderabad';
import { colors, radius, spacing } from '../theme';

export function LocationPicker({
  visible,
  onClose,
  title,
  selected,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  selected?: HydLocation | null;
  onSelect: (location: HydLocation) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return hyderabadLocations;
    return hyderabadLocations.filter(
      (location) => location.name.toLowerCase().includes(term) || location.address.toLowerCase().includes(term),
    );
  }, [query]);

  return (
    <ModalSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.ink400} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Hyderabad landmarks"
          placeholderTextColor={colors.ink400}
          style={styles.searchInput}
          autoCorrect={false}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.ink400} />
          </Pressable>
        ) : null}
      </View>
      {filtered.map((location) => {
        const active = selected?.address === location.address;
        return (
          <Pressable
            key={location.address}
            onPress={() => {
              onSelect(location);
              onClose();
            }}
            style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.pressed]}
          >
            <View style={[styles.pin, active && styles.pinActive]}>
              <Ionicons name="location" size={16} color={active ? colors.brand : colors.ink500} />
            </View>
            <View style={styles.fill}>
              <Text style={styles.name}>{location.name}</Text>
              <Text style={styles.address}>{location.address}</Text>
            </View>
            {active ? <Ionicons name="checkmark-circle" size={20} color={colors.brand} /> : null}
          </Pressable>
        );
      })}
      {filtered.length === 0 ? <Text style={styles.empty}>No curated locations match “{query}”.</Text> : null}
      <Text style={styles.note}>ZEVORA mobile uses curated Hyderabad pickup points. Map search is not connected yet.</Text>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink200,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: 46,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  rowActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  pressed: { opacity: 0.8 },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.ink100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinActive: { backgroundColor: colors.white },
  name: { fontSize: 14, fontWeight: '700', color: colors.ink800 },
  address: { fontSize: 12, color: colors.ink500, marginTop: 2 },
  empty: { fontSize: 13, color: colors.ink500, textAlign: 'center', paddingVertical: spacing.lg },
  note: { fontSize: 11, color: colors.ink400, marginTop: spacing.md, lineHeight: 16 },
});
