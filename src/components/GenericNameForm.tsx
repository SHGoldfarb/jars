import type { LinkProps } from '@tanstack/react-router';
import * as z from 'zod';
import { Form } from 'src/components/Form';
import type { FormFieldSpec, FormValues } from 'src/lib/formSpec';

export const GenericNameForm = ({
  initialName,
  title,
  onSubmit,
  onCancelRoute,
  onDelete,
  fieldName,
  placeholder,
  disableDeleteButton,
}: {
  initialName?: string;
  title: string;
  onSubmit: (name: string) => void;
  onCancelRoute: LinkProps['to'];
  onDelete?: () => void;
  fieldName: string;
  placeholder: string;
  disableDeleteButton?: boolean;
}) => {
  // The name is the only field, so the browser's own `required` is still what guards it; the
  // schema is here to give the form its parsed shape.
  const fields: FormFieldSpec<FormValues>[] = [
    { kind: 'text', name: fieldName, label: 'Name', placeholder, required: true },
  ];

  return (
    <Form
      title={title}
      fields={fields}
      defaultValues={{ [fieldName]: initialName ?? '' }}
      schema={z.object({ [fieldName]: z.string() })}
      onSubmit={(values) => {
        onSubmit(values[fieldName]);
        return Promise.resolve();
      }}
      defaultErrorMessage="Error saving"
      cancel={{ to: onCancelRoute }}
      onDelete={onDelete}
      deleteDisabled={disableDeleteButton}
    />
  );
};
