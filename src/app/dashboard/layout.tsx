import { SessionProvider } from '@/components/session-provider'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { ErrorBoundary } from '@/components/error-boundary'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role === 'super_admin') {
    redirect('/admin')
  }

  return (
    <SessionProvider>
        <div className="flex min-h-screen dash-surface">
        <DashboardSidebar />
        <main className="flex-1 lg:pl-0 pt-14 lg:pt-0 relative z-[1]">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {/* INMYBOX ENHANCEMENT: S3 — Error boundary prevents full-page crash */}
            <ErrorBoundary fallbackTitle="Dashboard error">
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </SessionProvider>
  )
}
