import { useRef } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import type { LinkProps } from '@tanstack/react-router';
import * as z from 'zod';
import {
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from 'src/components/ui/field';
import { FormActions } from 'src/components/FormActions';
import { FormField } from 'src/components/FormField';
import { formSpec, type FormFieldSpec, type FormValues, type StringValued } from 'src/lib/formSpec';
import { formUtils } from 'src/lib/formUtils';

// How long to wait before pulling focus into the text field a select hands over to, so the
// selector has closed by the time the caret lands.
const HAND_OVER_FOCUS_DELAY_MS = 100;

export const Form = <TValues extends StringValued<TValues>, TParsed>({
  title,
  fields,
  defaultValues,
  schema,
  onSubmit,
  defaultErrorMessage,
  cancel,
  onDelete,
  deleteDisabled,
}: {
  title: string;
  // Ordered: the list is both what gets rendered and what the focus flow is derived from.
  fields: FormFieldSpec<TValues>[];
  defaultValues: TValues;
  schema: z.ZodType<TParsed, TValues>;
  onSubmit: (parsed: TParsed) => Promise<void>;
  defaultErrorMessage: string;
  cancel: Pick<LinkProps, 'to' | 'search'>;
  onDelete?: () => void;
  deleteDisabled?: boolean;
}) => {
  // The form machinery only ever moves raw strings around, so it works on the unbranded shape
  // while the props keep the caller's own value type. The fields are what a form renders, so
  // they are also exactly what it holds a value for.
  const widenedDefaults: FormValues = {};
  for (const spec of fields) {
    widenedDefaults[spec.name] = defaultValues[spec.name];
  }
  const inputs = useRef(new Map<string, HTMLInputElement | null>());

  const form = useForm({
    defaultValues: widenedDefaults,
    validators: { onSubmit: ({ value }) => formUtils.validateWithSchema(value, schema) },
    onSubmit: async ({ value, formApi }) => {
      try {
        await onSubmit(schema.parse(value));
      } catch (error) {
        const message = error instanceof Error ? error.message : defaultErrorMessage;
        formApi.setErrorMap({
          ...formApi.state.errorMap,
          onSubmit: { form: message, fields: {} },
        });
      }
    },
  });

  const values = useStore(form.store, (state) => state.values);
  // A reader accepts any of the caller's field names, so the spec keeps its key checking even
  // though what it reads from is the widened shape.
  const read = (name: string) => values[name];

  const handOverFocusTo = (name: string) => {
    // Focus the field 0.1 seconds later. Its emptiness is read off the input itself rather than
    // the `values` of this render, which are the ones from before the change and always show it
    // empty: by the time the timer fires it may have been typed into, and stealing focus then
    // lands the next keystrokes in the wrong field.
    setTimeout(() => {
      const input = inputs.current.get(name);
      if (input && !input.value) {
        input.focus();
      }
    }, HAND_OVER_FOCUS_DELAY_MS);
  };

  const handleSelected = (spec: FormFieldSpec<TValues>, index: number, value: string) => {
    if (spec.kind !== 'select') {
      return;
    }

    for (const cleared of spec.clears ?? []) {
      // Same widening as the defaults: a field name is a plain key once it reaches the form.
      const name: string = cleared;
      form.setFieldValue(name, '');
    }

    const handOverTo = formSpec.textFieldAfterSelect(fields, index);
    if (value && handOverTo) {
      handOverFocusTo(handOverTo);
    }
  };

  return (
    <div className="w-full max-w-md p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>{title}</FieldLegend>
            <FieldGroup>
              {fields.map((spec, index) => {
                const name: string = spec.name;
                const previous = index > 0 ? fields[index - 1] : undefined;
                const active = formSpec.isFieldActive(
                  values[name],
                  previous && values[previous.name]
                );
                const nextTextField = formSpec.nextTextField(fields, index);

                return (
                  <form.Field key={formSpec.fieldKey(fields, index, values)} name={name}>
                    {(field) => (
                      <FormField
                        spec={spec}
                        field={field}
                        read={read}
                        active={active}
                        inputRef={(input) => {
                          inputs.current.set(name, input);
                        }}
                        onSelected={(value) => {
                          handleSelected(spec, index, value);
                        }}
                        onEnter={
                          nextTextField
                            ? () => {
                                inputs.current.get(nextTextField)?.focus();
                              }
                            : undefined
                        }
                      />
                    )}
                  </form.Field>
                );
              })}
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldError>{formUtils.getFirstErrorMessage(form.state.errors)}</FieldError>

          <FormActions cancel={cancel} onDelete={onDelete} deleteDisabled={deleteDisabled} />
        </FieldGroup>
      </form>
    </div>
  );
};
