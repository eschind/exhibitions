import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Exhibitions',
  description: 'A personal log of art exhibitions visited.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-black">
        <header className="border-b border-black">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-6 flex items-baseline justify-between">
            <Link href="/" className="text-2xl md:text-3xl font-bold tracking-tight">
              Exhibitions
            </Link>
            <Link
              href="/new"
              className="text-xs uppercase tracking-widest border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
            >
              Add new
            </Link>
          </div>
        </header>
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 md:px-12 py-10 md:py-16">
          {children}
        </main>
        <footer className="border-t border-black mt-20">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-6 text-xs uppercase tracking-widest text-neutral-500">
            Personal Exhibition Log
          </div>
        </footer>
      </body>
    </html>
  )
}
