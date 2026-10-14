import { useId, useRef, useState } from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { Input } from 'src/components/ui/input';
import { cn } from 'src/lib/utils';

// The suggestions worth offering for what has been typed: those containing it, ignoring case.
// One that already is exactly the value would complete nothing, so it is left out.
const matchesFor = (suggestions: string[], value: string): string[] => {
  const typed = value.toLowerCase();
  return suggestions.filter(
    (suggestion) => suggestion !== value && suggestion.toLowerCase().includes(typed)
  );
};

// A text input that offers to complete from a list. It renders its own list rather than using a
// `<datalist>`, because Firefox for Android never shows a datalist's suggestions.
export const FormFieldSuggestInput = ({
  suggestions,
  value,
  onChange,
  onKeyDown,
  inputRef,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'ref'> & {
  suggestions: string[];
  value: string;
  onChange: (value: string) => void;
  inputRef: (input: HTMLInputElement | null) => void;
}) => {
  const listId = useId();
  const input = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  // The match the arrow keys have moved to, which Enter picks.
  const [highlighted, setHighlighted] = useState<number | null>(null);

  const matches = matchesFor(suggestions, value);
  const expanded = open && matches.length > 0;
  const optionId = (index: number) => `${listId}-${String(index)}`;

  const close = () => {
    setOpen(false);
    setHighlighted(null);
  };

  const choose = (suggestion: string) => {
    onChange(suggestion);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!expanded) {
        setOpen(true);
        return;
      }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      const from = highlighted ?? (step === 1 ? -1 : matches.length);
      setHighlighted((from + step + matches.length) % matches.length);
      return;
    }
    const suggestion = highlighted === null ? undefined : matches[highlighted];
    if (expanded && e.key === 'Enter' && suggestion !== undefined) {
      // Picking the suggestion is what this Enter is for, so it does not also submit or move on.
      e.preventDefault();
      choose(suggestion);
      return;
    }
    onKeyDown?.(e);
  };

  return (
    <PopoverPrimitive.Root
      open={expanded}
      onOpenChange={(next) => {
        if (!next) {
          close();
        }
      }}
    >
      <PopoverPrimitive.Anchor asChild>
        <Input
          {...props}
          ref={(element) => {
            input.current = element;
            inputRef(element);
          }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={
            expanded && highlighted !== null ? optionId(highlighted) : undefined
          }
          // The browser's own form history would cover the list.
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlighted(null);
          }}
          onClick={() => {
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          // The user is typing into the input, so focus has to stay there both when the list
          // opens and when it closes.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}
          // The input sits outside the list, but touching it is not leaving the field.
          onInteractOutside={(e) => {
            if (e.target === input.current) {
              e.preventDefault();
            }
          }}
          className="z-50 max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          <ul id={listId} role="listbox">
            {matches.map((suggestion, index) => (
              // The keyboard drives the list from the input, through aria-activedescendant, so an
              // option only ever takes a pointer.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={suggestion}
                id={optionId(index)}
                role="option"
                aria-selected={index === highlighted}
                className={cn(
                  'flex min-h-7 cursor-default items-center rounded-md px-2 py-1 text-xs/relaxed select-none',
                  index === highlighted && 'bg-accent text-accent-foreground'
                )}
                // Keeps focus in the input, which a press on the list would otherwise take.
                onPointerDown={(e) => {
                  e.preventDefault();
                }}
                onPointerEnter={() => {
                  setHighlighted(index);
                }}
                onClick={() => {
                  choose(suggestion);
                }}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
