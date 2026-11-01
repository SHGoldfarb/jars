import { Outlet } from '@tanstack/react-router';
import { SegmentedNav } from './SegmentedNav';

const routes = [
  { name: 'Income', href: '/categories/income' },
  { name: 'Expense', href: '/categories/expense' },
];

export const Categories = () => {
  return (
    <>
      <SegmentedNav label="Category kind" routes={routes} />
      <Outlet />
    </>
  );
};
