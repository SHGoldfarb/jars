import { Input } from 'src/components/ui/input';
import { FormFieldMaskedInput } from 'src/components/FormFieldMaskedInput';
import { FormFieldSelect } from 'src/components/FormFieldSelect';
import { FormFieldWrapper } from 'src/components/FormFieldWrapper';
import { formUtils } from 'src/lib/formUtils';
import { formSpec, type FormFieldReader, type FormFieldSpec } from 'src/lib/formSpec';

// What the form's own field API offers this component, structurally, so a field stays usable
// without naming any of TanStack Form's generics.
interface BoundField {
  name: string;
  state: { value: string; meta: { errors: unknown[] } };
  handleBlur: () => void;
  handleChange: (value: string) => void;
}

export const FormField = <TValues,>({
  spec,
  field,
  read,
  active,
  inputRef,
  onSelected,
  onClosed,
  onEnter,
}: {
  spec: FormFieldSpec<TValues>;
  field: BoundField;
  read: FormFieldReader<TValues>;
  // The field the user should be filling next: a select opens, a text input takes focus.
  active: boolean;
  inputRef: (input: HTMLInputElement | null) => void;
  onSelected: (value: string) => void;
  // A select closing, whether on a choice or dismissed without one.
  onClosed: () => void;
  onEnter?: () => void;
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    }
  };

  const suggestionsId = `${field.name}-suggestions`;

  return (
    <FormFieldWrapper field={field} label={spec.label}>
      {spec.kind === 'date' ? (
        <Input type="datetime-local" {...formUtils.inputProps(field)} />
      ) : null}
      {spec.kind === 'text' && spec.mask ? (
        <FormFieldMaskedInput
          id={field.name}
          name={field.name}
          inputRef={inputRef}
          // The form owns the focus flow, and an active field is the one the user came here to
          // fill, so landing on it is the point rather than a surprise.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={active}
          mask={spec.mask}
          inputMode={spec.inputMode}
          placeholder={spec.placeholder}
          required={spec.required}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={field.handleChange}
          onKeyDown={handleKeyDown}
        />
      ) : null}
      {spec.kind === 'text' && !spec.mask ? (
        <Input
          ref={inputRef}
          // The form owns the focus flow, and an active field is the one the user came here to
          // fill, so landing on it is the point rather than a surprise.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={active}
          inputMode={spec.inputMode}
          placeholder={spec.placeholder}
          required={spec.required}
          list={spec.suggestions ? suggestionsId : undefined}
          autoComplete={spec.suggestions ? 'off' : undefined}
          {...formUtils.inputProps(field)}
          onKeyDown={handleKeyDown}
        />
      ) : null}
      {spec.kind === 'text' && !spec.mask && spec.suggestions ? (
        <datalist id={suggestionsId}>
          {spec.suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
      {spec.kind === 'select' ? (
        <FormFieldSelect
          field={field}
          placeholder={spec.placeholder}
          options={formSpec.selectOptions(spec, read)}
          defaultOpen={active}
          onChange={onSelected}
          onOpenChange={(open) => {
            if (!open) {
              onClosed();
            }
          }}
        />
      ) : null}
    </FormFieldWrapper>
  );
};
