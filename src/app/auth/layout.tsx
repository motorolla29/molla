import type { ReactNode } from 'react';

export const metadata = {
  title: 'Molla | Авторизация',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
