import { cn } from 'src/lib/utils';
import { formatTimeISO } from 'src/presentation/formatters/dateFormatters';
import { ItemContent, ItemDescription, ItemMedia, ItemTitle } from './ui/item';

// One movement as a two-line row: what it was and how much on top, where it sits underneath. The
// kind is named for screen readers - the icon already says it to everyone else.
export const MovementListItem = ({
  icon,
  iconClassName,
  kindLabel,
  title,
  meta,
  amount,
  amountClassName,
  dateISO,
}: {
  icon: React.ReactNode;
  // Tints the round badge the icon sits in.
  iconClassName: string;
  kindLabel: string;
  title: string;
  meta: React.ReactNode;
  amount: string;
  amountClassName?: string;
  // A bookmark has no date, and so no time either.
  dateISO?: string;
}) => {
  return (
    <>
      <ItemMedia
        className={cn(
          'size-9 rounded-full [&_svg]:size-4 group-has-data-[slot=item-description]/item:translate-y-0',
          iconClassName
        )}
      >
        {icon}
        <span className="sr-only">{kindLabel}</span>
      </ItemMedia>
      <ItemContent className="min-w-0 gap-0.5">
        <ItemTitle className="text-sm">{title}</ItemTitle>
        <ItemDescription className="line-clamp-1">{meta}</ItemDescription>
      </ItemContent>
      <ItemContent className="items-end gap-0.5">
        <ItemTitle className={cn('text-sm tabular-nums', amountClassName)}>{amount}</ItemTitle>
        {dateISO ? <ItemDescription>{formatTimeISO(dateISO)}</ItemDescription> : null}
      </ItemContent>
    </>
  );
};
