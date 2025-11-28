import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // This endpoint simply checks if the request has authentication cookies
    // It's used by the WebSocket context to verify cookies are available before connecting
    
    const cookies = request.cookies
    if (cookies) {
      return NextResponse.json({ 
        success: true, 
        hasCookies: true,
        cookieNames: Array.from(cookies)
      })
    } else {
      console.log('❌ No authentication cookies found')
      return NextResponse.json({ 
        success: true, 
        hasCookies: false,
        cookieNames: []
      })
    }
  } catch (error) {
    console.error('Error checking authentication cookies:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check authentication cookies',
        hasCookies: false
      },
      { status: 500 }
    )
  }
}
