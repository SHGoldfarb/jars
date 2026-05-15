import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from 'src/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from 'src/components/ui/field';
import { Input } from 'src/components/ui/input';
import type { SubmitEvent } from 'react';
import { createAccount } from 'src/services/finance';

// TODO: use a form library (tanstack form?)

const appFormPrefix = 'jars-app-form';

const fieldIds = {
  name: `${appFormPrefix}-account-name`,
};

export const AccountsNew = () => {
  const navigate = useNavigate();
  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = data.get(fieldIds.name);
    if (!name || typeof name !== 'string') return;

    try {
      await createAccount({ name: name });
      await navigate({ to: '/accounts' });
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };
  return (
    <div className="w-full max-w-md p-6 ">
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Create Account</FieldLegend>
            <FieldDescription>WIP description</FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={fieldIds.name}>Account Name</FieldLabel>
                <Input
                  id={fieldIds.name}
                  name={fieldIds.name}
                  placeholder="Savings Account"
                  required
                />
                <FieldDescription>WIP description</FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSeparator />
          <Field orientation="horizontal">
            <Button type="submit">Submit</Button>
            <Link to={'/accounts'}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};
