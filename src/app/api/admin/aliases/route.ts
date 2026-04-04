import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-guard'
import { createAlias, listAliases, updateAlias, deleteAlias } from '@/lib/services/alias.service'
import { z } from 'zod'

const createAliasSchema = z.object({
  alias: z.string().min(3, 'Alias is required'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  notes: z.string().optional(),
})

// GET /api/admin/aliases
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenantId') || undefined

  const aliases = await listAliases({ tenantId })
  return NextResponse.json(aliases)
}

// POST /api/admin/aliases
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = createAliasSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const alias = await createAlias(parsed.data)
    return NextResponse.json({ success: true, alias }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// PATCH /api/admin/aliases
export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { aliasId, ...data } = body

    if (!aliasId) {
      return NextResponse.json({ error: 'aliasId is required' }, { status: 400 })
    }

    const alias = await updateAlias(aliasId, data)
    return NextResponse.json({ success: true, alias })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// DELETE /api/admin/aliases
export async function DELETE(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(req.url)
  const aliasId = url.searchParams.get('id')

  if (!aliasId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  await deleteAlias(aliasId)
  return NextResponse.json({ success: true })
}
