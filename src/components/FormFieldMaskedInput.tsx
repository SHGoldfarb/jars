import { useLayoutEffect, useRef } from 'react';
import { Input } from 'src/components/ui/input';
import type { FormFieldMask } from 'src/lib/formSpec';

// The caret position in `text` that has `count` characters of parsed value before it.
const caretAfter = (mask: FormFieldMask, text: string, count: number): number => {
  for (let position = 0; position <= text.length; position++) {
    if (mask.parse(text.slice(0, position)).length >= count) {
      return position;
    }
  }
  return text.length;
};

export const FormFieldMaskedInput = ({
  mask,
  value,
  onChange,
  inputRef,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'ref'> & {
  mask: FormFieldMask;
  value: string;
  onChange: (value: string) => void;
  inputRef: (input: HTMLInputElement | null) => void;
}) => {
  const input = useRef<HTMLInputElement | null>(null);
  // How much of the parsed value sat before the caret when the user last typed. Reformatting
  // moves characters around it, so the caret is put back after the same amount of value rather
  // than at the same offset - otherwise a separator appearing would shift it.
  const pendingCaret = useRef<number | null>(null);

  useLayoutEffect(() => {
    const element = input.current;
    const count = pendingCaret.current;
    pendingCaret.current = null;
    if (element && count !== null && document.activeElement === element) {
      const position = caretAfter(mask, element.value, count);
      element.setSelectionRange(position, position);
    }
  });

  return (
    <Input
      {...props}
      ref={(element) => {
        input.current = element;
        inputRef(element);
      }}
      value={mask.format(value)}
      onChange={(e) => {
        const typed = e.target.value;
        const caret = e.target.selectionStart ?? typed.length;
        pendingCaret.current = mask.parse(typed.slice(0, caret)).length;
        onChange(mask.parse(typed));
      }}
    />
  );
};
