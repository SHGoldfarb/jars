// The shape a form works in: every field is a raw string typed into an input, and the form's
// schema is what turns those strings into domain types.
type FormValues = Record<string, string>;

// What a caller's own values type has to be to drive a form: string-valued throughout. Stated
// this way rather than as `Record<string, string>` so an interface satisfies it too - an
// interface gets no implicit index signature, and the value types are declared as interfaces.
type StringValued<TValues> = Record<keyof TValues, string>;

type FormFieldName<TValues> = keyof TValues & string;

// How a dynamic option list reads what is filled in so far. It is a reader rather than a values
// object because the form holds the unbranded shape, which cannot be narrowed back to the
// caller's field names - while a reader still checks every name it is asked for.
type FormFieldReader<TValues> = (name: FormFieldName<TValues>) => string;

interface FormFieldOption {
  value: string;
  label: string;
}

interface FormFieldDate<TValues> {
  kind: 'date';
  name: FormFieldName<TValues>;
  label: string;
}

interface FormFieldText<TValues> {
  kind: 'text';
  name: FormFieldName<TValues>;
  label: string;
  placeholder?: string;
  inputMode?: 'decimal';
  required?: boolean;
}

interface FormFieldSelect<TValues> {
  kind: 'select';
  name: FormFieldName<TValues>;
  label: string;
  placeholder: string;
  // A list, or one derived from what is filled in so far - which is how a selector narrows on
  // another field's choice.
  options: FormFieldOption[] | ((read: FormFieldReader<TValues>) => FormFieldOption[]);
  // Emptied when this field changes. An emptied field is active again, so it re-enters the
  // focus flow on its own.
  clears?: FormFieldName<TValues>[];
  // A field the user may leave empty. It never becomes the active one and the fields after it
  // look straight past it, so an optional selector the user skips cannot stall the form on
  // itself or hold up everything behind it.
  optional?: boolean;
}

type FormFieldSpec<TValues> =
  | FormFieldDate<TValues>
  | FormFieldText<TValues>
  | FormFieldSelect<TValues>;

// All the focus flow reads off a field: where it sits and what kind of control it is. Widening
// the specs to this keeps these helpers free of the caller's value type.
interface FormFieldPosition {
  kind: FormFieldSpec<FormValues>['kind'];
  name: string;
  optional?: boolean;
}

// The field the focus flow treats as the one before this one: the closest preceding field the
// user has to fill. An optional field is skipped over, so leaving it empty does not read as
// "the form has not got this far yet".
const previousRequiredField = (
  fields: FormFieldPosition[],
  index: number
): FormFieldPosition | undefined => fields.slice(0, index).findLast((field) => !field.optional);

// A field is active - the one the user should be filling next - when it is empty and the field
// before it is not. The first field has nothing before it, so it is active whenever it is empty.
// An optional field is never active: it is there to be reached for, not to be walked into.
// An active select opens; an active text input takes focus.
const isFieldActive = (fields: FormFieldPosition[], index: number, values: FormValues): boolean => {
  const field = fields[index];
  if (field.optional || values[field.name]) {
    return false;
  }

  const previous = previousRequiredField(fields, index);
  return !previous || values[previous.name] !== '';
};

// A select re-opens for a new choice by being re-mounted, which is what changing its key does.
// Only a select before it can change in a way that should re-open it: a date always holds a
// value, and a text field would re-mount it on every keystroke.
//
// Every select from the last required one onwards counts, not just the immediately preceding
// field: choosing a required category has to re-open what follows even when an optional
// subcategory sits in between, and choosing that optional subcategory has to re-open it too,
// so a field the user did reach for leads on rather than dead-ending.
const fieldKey = (fields: FormFieldPosition[], index: number, values: FormValues): string => {
  const field = fields[index];
  const previous = previousRequiredField(fields, index);

  if (field.kind !== 'select' || previous?.kind !== 'select') {
    return field.name;
  }

  const preceding = fields
    .slice(fields.indexOf(previous), index)
    .filter(({ kind }) => kind === 'select')
    .map(({ name }) => values[name]);

  return `${field.name} - ${preceding.join(' - ')}`;
};

// The text input a select hands focus to once it has a value: the very next field, and only if
// it is one, which is what makes the last select of a form the one that jumps to the amount.
const textFieldAfterSelect = (fields: FormFieldPosition[], index: number): string | undefined => {
  const next = index + 1 < fields.length ? fields[index + 1] : undefined;
  return next?.kind === 'text' ? next.name : undefined;
};

// Where Enter in a text input goes. Without one, Enter submits, which is what the last text
// field of a form should do.
const nextTextField = (fields: FormFieldPosition[], index: number): string | undefined =>
  fields.slice(index + 1).find((field) => field.kind === 'text')?.name;

export const formSpec = {
  isFieldActive,
  fieldKey,
  textFieldAfterSelect,
  nextTextField,
};

export type { FormFieldOption, FormFieldReader, FormFieldSpec, FormValues, StringValued };
