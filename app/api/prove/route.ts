import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const { name_secret, salt_hex } = await request.json()

    if (!name_secret || !salt_hex) {
      return NextResponse.json(
        { error: 'Missing name_secret or salt_hex' },
        { status: 400 }
      )
    }

    const response = {
      commit: '0x' + '0'.repeat(64),
      proof_hex: '0x' + '0'.repeat(1024),
      vk_hex: '0x' + '0'.repeat(512),
      public_inputs: [name_secret],
      message: 'Placeholder proof - implement with Noir circuits'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Prove API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
