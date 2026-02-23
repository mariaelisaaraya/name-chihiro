import { NextRequest, NextResponse } from 'next/server'

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

    const commit = '0x' + '0'.repeat(64)

    return NextResponse.json({
      commit,
      message: 'Placeholder commit - implement with Poseidon2'
    })

  } catch (error) {
    console.error('Commit API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
