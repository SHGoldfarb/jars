import { Field, FieldError, FieldLabel } from 'src/components/ui/field';

import { formUtils } from 'src/lib/formUtils';

export const TransactionFormFieldWrapper = ({
  field,
  label,
  children,
}: {
  field: {
    name: string;
    state: {
      meta: {
        errors: unknown[];
      };
    };
  };
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {children}
      <FieldError>{formUtils.getFirstErrorMessage(field.state.meta.errors)}</FieldError>
    </Field>
  );
};
