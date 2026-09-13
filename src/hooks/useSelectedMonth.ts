import { useNavigate, useSearch } from '@tanstack/react-router';
import { yearMonth, type YearMonthKey } from 'src/lib/yearMonth';

// The month Movements is showing. It lives in the URL, so it survives a reload and a form can
// send the user back to the month it just wrote into.
export const useSelectedMonth = () => {
  const { month } = useSearch({ from: '/movements' });
  const navigate = useNavigate({ from: '/movements' });

  const selectMonth = (next: YearMonthKey) => {
    void navigate({ search: { month: next } });
  };

  return { month: month ?? yearMonth.current(), selectMonth };
};
