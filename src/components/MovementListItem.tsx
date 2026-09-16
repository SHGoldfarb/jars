import { ItemContent, ItemMedia } from './ui/item';

export const MovementListItem = ({
  icon,
  contentLeft,
  contentMiddle,
  contentRight,
}: {
  icon: React.ReactNode;
  contentLeft: React.ReactNode;
  contentMiddle: React.ReactNode;
  contentRight: React.ReactNode;
}) => {
  return (
    <>
      <ItemMedia variant="icon">{icon}</ItemMedia>
      <ItemContent className="max-w-1/5 w-1/5">{contentLeft}</ItemContent>
      <ItemContent>{contentMiddle}</ItemContent>
      <ItemContent className="ml-auto items-end">{contentRight}</ItemContent>
    </>
  );
};
