import { useId } from 'react';
import { cn } from 'src/lib/utils';

// A titled group of related settings cards.
export const SettingsSection = ({
  title,
  danger,
  children,
}: {
  title: string;
  // Marks the group whose actions destroy data, so it reads as different before anything in it
  // is read.
  danger?: boolean;
  children: React.ReactNode;
}) => {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        id={headingId}
        className={cn(
          'px-1 text-xs font-medium',
          danger ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        {title}
      </h2>
      {children}
    </section>
  );
};
