import { Link } from '@tanstack/react-router';
import { Button } from 'src/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from 'src/components/ui/field';
import { Input } from 'src/components/ui/input';
import { useForm } from '@tanstack/react-form';

export const GenericNameForm = ({
  initialName,
  title,
  onSubmit,
  onCancelRoute,
  onDelete,
  fieldName,
  placeholder,
}: {
  initialName?: string;
  title: string;
  onSubmit: (name: string) => void;
  onCancelRoute: string;
  onDelete?: () => void;
  fieldName: string;
  placeholder: string;
}) => {
  const form = useForm({
    defaultValues: {
      [fieldName]: initialName ?? '',
    },
    onSubmit: ({ value }) => {
      onSubmit(value[fieldName]);
    },
  });

  return (
    <div className="w-full max-w-md p-6 ">
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
              <form.Field
                name={fieldName}
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      // eslint-disable-next-line jsx-a11y/no-autofocus -- user navigates here manually -> autofocus is fine
                      autoFocus
                      id={field.name}
                      name={field.name}
                      placeholder={placeholder}
                      required
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
          <FieldSeparator />
          <Field orientation="horizontal">
            <Button type="submit">Submit</Button>
            <Link to={onCancelRoute}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            {onDelete ? (
              <Button variant="destructive" type="button" onClick={onDelete}>
                Delete
              </Button>
            ) : null}
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};
