import { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '../routes';

type Props = {
  children?: ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <QueryProvider>
      {children}
      <RouterProvider router={router} />
      {/* <RouterDevtools router={router} /> */}
    </QueryProvider>
  );
}
