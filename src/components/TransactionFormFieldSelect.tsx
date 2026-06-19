import { Select, SelectTrigger, SelectValue } from 'src/components/ui/select';
import { SelectOptions } from './ui/SelectOptions';

export const TransactionFormFieldSelect = <
  T extends {
    state: { value: string | undefined };
    handleChange: (value: T['state']['value']) => unknown;
    name: string;
  },
>({
  field,
  placeholder,
  options,
  onChange,
  defaultOpen,
  open,
  onOpenChange,
}: {
  field: T;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange?: (value: T['state']['value']) => void;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  return (
    <Select
      value={field.state.value}
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      onValueChange={(value) => {
        onChange?.(value);
        field.handleChange(value);
      }}
    >
      <SelectTrigger id={field.name}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectOptions options={options} />
    </Select>
  );
};
