import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Match Day ATL',
  description: 'FIFA World Cup 2026 · Atlanta fan transit guide',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full overflow-hidden bg-gray-950 text-white">
        {children}
      </body>
    </html>
  );
}
