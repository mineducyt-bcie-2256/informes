import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return new NextResponse('Missing lat/lon', { status: 400 })
  }

  const mapUrl =
    `https://staticmap.openstreetmap.de/staticmap.php` +
    `?center=${lat},${lon}&zoom=16&size=600x280` +
    `&markers=${lat},${lon},red-marker`

  try {
    const res = await fetch(mapUrl, {
      headers: { 'User-Agent': 'SCAS-BCIE/1.0' },
    })

    if (!res.ok) {
      return new NextResponse('Map fetch failed', { status: 502 })
    }

    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'image/png',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse('Map unavailable', { status: 502 })
  }
}
