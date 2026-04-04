import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-guard'
import { getTenantForAdmin } from '@/lib/services/provisioning.service'

// GET /api/admin/tenants/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const tenant = await getTenantForAdmin(params.id)

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  return NextResponse.json(tenant)
}
