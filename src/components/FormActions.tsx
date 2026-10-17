import { Link, type LinkProps } from '@tanstack/react-router';
import { Button } from 'src/components/ui/button';
import { Field } from 'src/components/ui/field';

export const FormActions = ({
  cancel,
  onDelete,
  deleteDisabled,
  secondary,
}: {
  cancel: Pick<LinkProps, 'to' | 'search'>;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  secondary?: { label: string; disabled: boolean; onClick: () => void };
}) => (
  <Field orientation="horizontal">
    <Button type="submit">Submit</Button>
    <Link to={cancel.to} search={cancel.search}>
      <Button variant="outline" type="button">
        Cancel
      </Button>
    </Link>
    {onDelete ? (
      <Button variant="destructive" type="button" onClick={onDelete} disabled={!!deleteDisabled}>
        Delete
      </Button>
    ) : null}
    {secondary ? (
      <Button
        variant="secondary"
        type="button"
        onClick={secondary.onClick}
        disabled={secondary.disabled}
      >
        {secondary.label}
      </Button>
    ) : null}
  </Field>
);
