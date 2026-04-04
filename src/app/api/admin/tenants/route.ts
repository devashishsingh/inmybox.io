import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-guard'
import { provisionTenant, listTenantsForAdmin, updateTenant } from '@/lib/services/provisioning.service'
import { z } from 'zod'

const createTenantSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactEmail: z.string().email('Valid email required'),
  primaryDomain: z.string().min(3, 'Domain is required'),
  reportAlias: z.string().optional(),
  timezone: z.string().optional(),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).optional(),
  notes: z.string().optional(),
  inviteEmail: z.string().email().optional(),
})

// GET /api/admin/tenants — list all tenants
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(req.url)
  const search = url.searchParams.get('search') || undefined
  const status = url.searchParams.get('status') || undefined
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '25')

  const result = await listTenantsForAdmin({ search, status, page, limit })
  return NextResponse.json(result)
}

// POST /api/admin/tenants — provision a new tenant
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = createTenantSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const result = await provisionTenant(parsed.data)

    return NextResponse.json({
      success: true,
      tenant: result.tenant,
      domain: result.domain,
      alias: result.alias,
      invitation: result.invitation
        ? { id: result.invitation.id, email: result.invitation.email, token: result.invitation.token }
        : null,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// PATCH /api/admin/tenants — update a tenant
export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { tenantId, ...data } = body

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const tenant = await updateTenant(tenantId, data)
    return NextResponse.json({ success: true, tenant })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
