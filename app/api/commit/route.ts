import { NextRequest, NextResponse } from 'next/server'

// Endpoint for computing Poseidon2 commit without generating full proof
// Faster than /prove for just getting the commit hash

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { name_secret, salt_hex } = await request.json()

    if (!name_secret || !salt_hex) {
      return NextResponse.json(
        { error: 'Missing name_secret or salt_hex' },
        { status: 400 }
      )
    }

    // TODO: Implement Poseidon2 hash computation
    // This requires @noir-lang/noir_js or direct Poseidon2 implementation
    console.log('[v0] Commit API called with:', { name_secret: '***', salt_hex })

    // Placeholder: In production, compute Poseidon2(name_secret, salt_hex)
    const commit = '0x' + '0'.repeat(64)

    return NextResponse.json({
      commit,
      message: 'Placeholder commit - implement with Poseidon2'
    })

  } catch (error) {
    console.error('[v0] Commit API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
