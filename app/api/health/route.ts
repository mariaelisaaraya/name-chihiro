import { NextResponse } from 'next/server'

// Health check endpoint for prove-server availability
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Prove server is running',
    timestamp: new Date().toISOString()
  })
}
