import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quick Assessment · Zeptio',
  description: 'Three quick challenges to find your starting level.',
}

export default function CalibrationLayout({ children }: { children: React.ReactNode }) {
  return children
}
