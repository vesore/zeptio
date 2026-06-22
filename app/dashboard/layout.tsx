import DashboardNav from './_components/DashboardNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardNav />
      {children}
    </>
  )
}
