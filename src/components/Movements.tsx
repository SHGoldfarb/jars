import type { MovementListEntry } from 'src/services/finance';
import { useMovements } from 'src/hooks/useMovements';
import { useMovementMonths } from 'src/hooks/useMovementMonths';
import { useSelectedMonth } from 'src/hooks/useSelectedMonth';
import { formatDayISO, formatYearMonth } from 'src/presentation/formatters/dateFormatters';
import { groupByDay } from 'src/presentation/movements/groupByDay';
import { GenericList } from './GenericList';
import { MonthSelector } from './MonthSelector';
import { MovementActions } from './MovementActions';
import { TransactionListItem } from './TransactionListItem';
import { TransferListItem } from './TransferListItem';
import { AllocationListItem } from './AllocationListItem';

const movementUrl = (movement: MovementListEntry) => {
  if (movement.movementType === 'transaction') {
    return `/transactions/${movement.id}/edit`;
  }
  if (movement.movementType === 'transfer') {
    return `/transfers/${movement.id}/edit`;
  }
  return `/allocations/${movement.id}/edit`;
};

export const Movements = () => {
  const { month, selectMonth } = useSelectedMonth();
  const { movements, isPending } = useMovements(month);
  const { months } = useMovementMonths();

  return (
    <>
      <MonthSelector month={month} monthsWithMovements={months} onSelectMonth={selectMonth} />
      <MovementActions month={month} />
      {groupByDay(movements).map((day) => (
        <GenericList
          key={day.dayISO}
          title={formatDayISO(day.dayISO)}
          items={day.entries.map((movement) => ({ ...movement, url: movementUrl(movement) }))}
          actions={[]}
        >
          {(item) => {
            if (item.movementType === 'transfer') {
              return <TransferListItem transfer={item} />;
            }
            if (item.movementType === 'allocation') {
              return <AllocationListItem allocation={item} />;
            }
            return <TransactionListItem transaction={item} />;
          }}
        </GenericList>
      ))}
      {movements.length === 0 && !isPending ? (
        <p className="max-w-lg mx-auto py-8 text-center text-muted-foreground text-xs/relaxed">
          No movements in {formatYearMonth(month)}
        </p>
      ) : null}
    </>
  );
};
