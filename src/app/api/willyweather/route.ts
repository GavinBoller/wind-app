
import { NextResponse } from 'next/server';

const API_KEY = process.env.WILLYWEATHER_API_KEY || 'MjExOWZlYWFmNGEyZTQzYTIyZDNlN2';
const BASE_URL = 'https://api.willyweather.com.au/v2';
const PLATFORM = process.env.WILLYWEATHER_PLATFORM || 'web';

export async function GET(request: Request) {
  const { pathname, searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const id = searchParams.get('id');

  // /api/willyweather?search=...
  if (search) {
    const url = `${BASE_URL}/${API_KEY}/locations?search=${encodeURIComponent(search)}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // /api/willyweather/info?id=...
  if (pathname.includes('/info')) {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const url = `${BASE_URL}/${API_KEY}/locations/${id}/info.json?platform=${PLATFORM}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // /api/willyweather/observations?id=...
  if (pathname.includes('/observations')) {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const url = `${BASE_URL}/${API_KEY}/locations/${id}/observations.json?platform=${PLATFORM}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
}
