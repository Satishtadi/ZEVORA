import { Select } from '@/components/ui';

interface EntitySwitcherProps {
  label: string;
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}

export function EntitySwitcher({ label, items, value, onChange }: EntitySwitcherProps) {
  if (items.length <= 1) return null;
  return (
    <Select
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      wrapperClassName="w-64"
    >
      {items.map((item) => (
        <option key={item.id} value={item.id}>{item.label}</option>
      ))}
    </Select>
  );
}
