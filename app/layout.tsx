import type {Metadata} from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'ArchHUB',
  description: 'Advanced architectural rendering engine for interior design visualization.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-[#f5f5f5] text-[#1a1a1a] antialiased selection:bg-zinc-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
