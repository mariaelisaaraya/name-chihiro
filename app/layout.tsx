import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Chihiro's Lost Name",
  description: 'Zero-Knowledge proof game inspired by Spirited Away',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
