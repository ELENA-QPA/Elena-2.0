import NProgressBar from '@/components/n-progress-bar';
import { Toaster } from '@/components/ui/sonner';
import '@/lib/di/reflect-metadata';
import { QueryProvider } from '@/providers/QueryProvider';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QP Alliance',
  description: 'QP Alliance - Plataforma de gestión empresarial',
  metadataBase: new URL('https://qp-alliance.vercel.app/'),
  icons: 'https://qp-alliance.vercel.app/logo.png',

  openGraph: {
    title: 'QP Alliance',
    description: 'QP Alliance - Plataforma de gestión empresarial',
    images: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='es' suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <Toaster />
          <NProgressBar>
            <QueryProvider>{children}</QueryProvider>
          </NProgressBar>
        </ThemeProvider>
      </body>
    </html>
  );
}
