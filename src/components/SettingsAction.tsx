import { Button } from 'components/ui/button';
import { Card, CardContent, CardHeader } from 'components/ui/card';
import { SettingsActionFileTrigger } from './SettingsActionFileTrigger';

interface SettingsActionCopy {
  title: string;
  description: string;
  warning?: string;
}

export type SettingsActionProps = SettingsActionCopy &
  (
    | { kind: 'button'; onAction: () => void }
    | { kind: 'file'; accept: string; confirmation?: string; onFile: (file: File) => void }
  );

export const SettingsAction = (props: SettingsActionProps) => {
  const { title, description, warning } = props;

  return (
    <Card role="region" aria-label={title} size="sm">
      <CardHeader>
        <p className="text-xs/relaxed text-muted-foreground">{description}</p>
        {warning ? <p className="text-xs/relaxed font-medium text-destructive">{warning}</p> : null}
      </CardHeader>
      <CardContent>
        {props.kind === 'file' ? (
          <SettingsActionFileTrigger
            title={title}
            accept={props.accept}
            confirmation={props.confirmation}
            onFile={props.onFile}
          />
        ) : (
          <Button variant={warning ? 'destructive' : 'default'} onClick={props.onAction}>
            {title}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
