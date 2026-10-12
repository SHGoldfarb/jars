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

// How a text input shows a value other than the one the form holds. The form keeps the raw value
// - what its schema parses - and the input shows `format` of it; whatever the user types goes
// back through `parse` before it reaches the form.
interface FormFieldMask {
  format: (value: string) => string;
  parse: (input: string) => string;
}

interface FormFieldText<TValues> {
  kind: 'text';
  name: FormFieldName<TValues>;
  label: string;
  placeholder?: string;
  inputMode?: 'decimal';
  required?: boolean;
  mask?: FormFieldMask;
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
  // A field the user may leave empty. The focus flow walks through it only while it is offered -
  // opened because the field before it was just chosen - and otherwise looks straight past it,
  // so an optional selector the user skips cannot stall the form on itself or hold up
  // everything behind it.
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

// How far the user has got: what is filled in, and which optional fields the flow has opened and
// is still waiting on.
interface FormProgress {
  values: FormValues;
  offered: ReadonlySet<string>;
}

// Whether the focus flow walks through a field or past it: a required one always, an optional
// one only while it is offered.
const isInFlow = (field: FormFieldPosition, offered: ReadonlySet<string>): boolean =>
  !field.optional || offered.has(field.name);

// The field the focus flow treats as the one before this one: the closest preceding field it
// walks through. An optional field it is not offering is skipped over, so leaving it empty does
// not read as "the form has not got this far yet".
const previousFlowField = (
  fields: FormFieldPosition[],
  index: number,
  offered: ReadonlySet<string>
): FormFieldPosition | undefined =>
  fields.slice(0, index).findLast((field) => isInFlow(field, offered));

// The field a select must sit after for the focus flow to have reached it - the closest preceding
// required one, whatever is offered.
const previousRequiredField = (
  fields: FormFieldPosition[],
  index: number
): FormFieldPosition | undefined => fields.slice(0, index).findLast((field) => !field.optional);

// A field is active - the one the user should be filling next - when it is empty and the field
// before it is not. The first field has nothing before it, so it is active whenever it is empty.
// An optional field is active only while it is offered: it is there to be reached for, or to be
// led into right after the field it depends on, not to be walked into on its own.
// An active select opens; an active text input takes focus.
const isFieldActive = (
  fields: FormFieldPosition[],
  index: number,
  { values, offered }: FormProgress
): boolean => {
  const field = fields[index];
  if (!isInFlow(field, offered) || values[field.name]) {
    return false;
  }

  const previous = previousFlowField(fields, index, offered);
  return !previous || values[previous.name] !== '';
};

// A select re-opens for a new choice by being re-mounted, which is what changing its key does.
// Only a select before it can change in a way that should re-open it: a date always holds a
// value, and a text field would re-mount it on every keystroke.
//
// Every select from the last required one onwards counts, not just the immediately preceding
// field: choosing a required category has to re-open what follows even when an optional
// subcategory sits in between, and choosing that optional subcategory - or dismissing it, which
// ends the offer - has to re-open it too, so the flow leads on rather than dead-ending.
const fieldKey = (
  fields: FormFieldPosition[],
  index: number,
  { values, offered }: FormProgress
): string => {
  const field = fields[index];
  const previous = previousRequiredField(fields, index);

  if (field.kind !== 'select' || previous?.kind !== 'select') {
    return field.name;
  }

  const preceding = fields
    .slice(fields.indexOf(previous), index)
    .filter(({ kind }) => kind === 'select')
    .map(({ name }) => (offered.has(name) ? `${values[name]} (offered)` : values[name]));

  return `${field.name} - ${preceding.join(' - ')}`;
};

// The optional field choosing this one offers: the very next field, if it is optional.
const optionalFieldAfter = (fields: FormFieldPosition[], index: number): string | undefined => {
  const next = index + 1 < fields.length ? fields[index + 1] : undefined;
  return next?.optional ? next.name : undefined;
};

// The text input a select hands focus to once it has a value: the very next field, and only if
// it is one, which is what makes the last select of a form the one that jumps to the amount.
const textFieldAfterSelect = (fields: FormFieldPosition[], index: number): string | undefined => {
  const next = index + 1 < fields.length ? fields[index + 1] : undefined;
  return next?.kind === 'text' ? next.name : undefined;
};

// What a select offers given what is filled in so far.
const selectOptions = <TValues>(
  spec: FormFieldSelect<TValues>,
  read: FormFieldReader<TValues>
): FormFieldOption[] => (typeof spec.options === 'function' ? spec.options(read) : spec.options);

// Where Enter in a text input goes. Without one, Enter submits, which is what the last text
// field of a form should do.
const nextTextField = (fields: FormFieldPosition[], index: number): string | undefined =>
  fields.slice(index + 1).find((field) => field.kind === 'text')?.name;

export const formSpec = {
  isFieldActive,
  fieldKey,
  optionalFieldAfter,
  selectOptions,
  textFieldAfterSelect,
  nextTextField,
};

export type {
  FormFieldMask,
  FormFieldOption,
  FormFieldReader,
  FormFieldSpec,
  FormValues,
  StringValued,
};
