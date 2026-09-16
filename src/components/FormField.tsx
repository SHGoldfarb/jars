import { Input } from 'src/components/ui/input';
import { FormFieldSelect } from 'src/components/FormFieldSelect';
import { FormFieldWrapper } from 'src/components/FormFieldWrapper';
import { formUtils } from 'src/lib/formUtils';
import type { FormFieldReader, FormFieldSpec } from 'src/lib/formSpec';

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
  onEnter,
}: {
  spec: FormFieldSpec<TValues>;
  field: BoundField;
  read: FormFieldReader<TValues>;
  // The field the user should be filling next: a select opens, a text input takes focus.
  active: boolean;
  inputRef: (input: HTMLInputElement | null) => void;
  onSelected: (value: string) => void;
  onEnter?: () => void;
}) => (
  <FormFieldWrapper field={field} label={spec.label}>
    {spec.kind === 'date' ? <Input type="datetime-local" {...formUtils.inputProps(field)} /> : null}
    {spec.kind === 'text' ? (
      <Input
        ref={inputRef}
        // The form owns the focus flow, and an active field is the one the user came here to
        // fill, so landing on it is the point rather than a surprise.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={active}
        inputMode={spec.inputMode}
        placeholder={spec.placeholder}
        required={spec.required}
        {...formUtils.inputProps(field)}
        onKeyDown={(e) => {
          if (onEnter && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onEnter();
          }
        }}
      />
    ) : null}
    {spec.kind === 'select' ? (
      <FormFieldSelect
        field={field}
        placeholder={spec.placeholder}
        options={typeof spec.options === 'function' ? spec.options(read) : spec.options}
        defaultOpen={active}
        onChange={onSelected}
      />
    ) : null}
  </FormFieldWrapper>
);
