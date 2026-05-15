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
import type { SubmitEvent } from 'react';

// TODO: use a form library (tanstack form?)

const appFormPrefix = 'jars-app-form';

const fieldIds = {
  name: `${appFormPrefix}-account-name`,
};

export const AccountForm = ({
  initialName,
  title,
  onSubmit,
  onCancelRoute,
  onDelete,
}: {
  initialName?: string;
  title: string;
  onSubmit: (name: string) => void;
  onCancelRoute: string;
  onDelete?: () => void;
}) => {
  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = data.get(fieldIds.name);
    if (!name || typeof name !== 'string') return;

    onSubmit(name);
  };
  return (
    <div className="w-full max-w-md p-6 ">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>{title}</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={fieldIds.name}>Account Name</FieldLabel>
                <Input
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- user navigates here manually -> autofocus is fine
                  autoFocus
                  id={fieldIds.name}
                  name={fieldIds.name}
                  placeholder="Savings Account"
                  required
                  defaultValue={initialName}
                />
              </Field>
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
