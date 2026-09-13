import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { yearMonth, YearMonthKey } from 'src/lib/yearMonth';
import { formatYearMonth } from 'src/presentation/formatters/dateFormatters';
import { Button } from './ui/button';
import { Select, SelectTrigger, SelectValue } from './ui/select';
import { SelectOptions } from './ui/SelectOptions';

export const MonthSelector = ({
  month,
  monthsWithMovements,
  onSelectMonth,
}: {
  month: YearMonthKey;
  monthsWithMovements: YearMonthKey[];
  onSelectMonth: (month: YearMonthKey) => void;
}) => {
  // The trigger reads its label off the matching option, so the selected month is always offered,
  // even once the arrows have stepped into a month that holds nothing. The current month joins it
  // so "today" stays one click away.
  const options = [...new Set([...monthsWithMovements, month, yearMonth.current()])]
    .sort(yearMonth.compareDescending)
    .map((key) => ({ value: key, label: formatYearMonth(key) }));

  return (
    <nav
      aria-label="Month navigation"
      className="max-w-lg mx-auto flex items-center justify-center gap-2 py-3"
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous month"
        onClick={() => {
          onSelectMonth(yearMonth.shift(month, -1));
        }}
      >
        <ChevronLeftIcon />
      </Button>
      <Select
        value={month}
        onValueChange={(value) => {
          onSelectMonth(YearMonthKey.parse(value));
        }}
      >
        <SelectTrigger aria-label="Month">
          <SelectValue />
        </SelectTrigger>
        <SelectOptions options={options} />
      </Select>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next month"
        onClick={() => {
          onSelectMonth(yearMonth.shift(month, 1));
        }}
      >
        <ChevronRightIcon />
      </Button>
    </nav>
  );
};
