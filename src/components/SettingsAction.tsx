import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from 'components/ui/card';
import { SettingsActionButtonTrigger } from './SettingsActionButtonTrigger';
import { SettingsActionFileTrigger } from './SettingsActionFileTrigger';

interface SettingsActionCopy {
  title: string;
  description: string;
  warning?: string;
  // Choices that shape what the action does, shown above its trigger.
  options?: ReactNode;
}

export type SettingsActionProps = SettingsActionCopy &
  (
    | { kind: 'button'; confirmation?: string; onAction: () => void }
    | { kind: 'file'; accept: string; confirmation?: string; onFile: (file: File) => void }
  );

export const SettingsAction = (props: SettingsActionProps) => {
  const { title, description, warning, options } = props;

  return (
    <Card role="region" aria-label={title} size="sm">
      <CardHeader>
        <p className="text-xs/relaxed text-muted-foreground">{description}</p>
        {warning ? <p className="text-xs/relaxed font-medium text-destructive">{warning}</p> : null}
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        {options}
        {props.kind === 'file' ? (
          <SettingsActionFileTrigger
            title={title}
            accept={props.accept}
            confirmation={props.confirmation}
            onFile={props.onFile}
          />
        ) : (
          <SettingsActionButtonTrigger
            title={title}
            variant={warning ? 'destructive' : 'default'}
            confirmation={props.confirmation}
            onAction={props.onAction}
          />
        )}
      </CardContent>
    </Card>
  );
};
