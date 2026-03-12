import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SPCL Project Dashboard',
  description: 'Project management and development dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
