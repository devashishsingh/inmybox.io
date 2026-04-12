import { SessionProvider } from '@/components/session-provider'
import { AdminSidebar } from '@/components/admin-sidebar'
import { ErrorBoundary } from '@/components/error-boundary'

export const metadata = {
  title: 'Admin Panel',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-slate-950">
        <AdminSidebar />
        <main className="flex-1 lg:pl-0 pt-14 lg:pt-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {/* INMYBOX ENHANCEMENT: S3 — Error boundary prevents full-page crash */}
            <ErrorBoundary fallbackTitle="Admin panel error">
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </SessionProvider>
  )
}
