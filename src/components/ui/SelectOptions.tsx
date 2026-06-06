import { SelectContent, SelectItem } from './select';

export const SelectOptions = ({ options }: { options: { value: string; label: string }[] }) => (
  <SelectContent>
    {options.map((option) => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
);
