import { Outlet } from '@tanstack/react-router';
import { Navbar } from './Navbar';

const routes = [
  { name: 'Income', href: '/categories/income' },
  { name: 'Expense', href: '/categories/expense' },
];

export const Categories = () => {
  return (
    <>
      <Navbar routes={routes} />
      <Outlet />
    </>
  );
};
