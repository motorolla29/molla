import { ReactNode } from 'react';

export default function MessengerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full bg-gray-50">
      {children}
    </div>
  );
}
