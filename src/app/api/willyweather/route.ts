
import { NextResponse } from 'next/server';

const API_KEY = process.env.WILLYWEATHER_API_KEY || 'MjExOWZlYWFmNGEyZTQzYTIyZDNlN2';
const BASE_URL = 'https://api.willyweather.com.au/v2';
const PLATFORM = process.env.WILLYWEATHER_PLATFORM || 'web';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const id = searchParams.get('id');
  const type = searchParams.get('type');

  // /api/willyweather?search=...
  if (search) {
    const url = `${BASE_URL}/${API_KEY}/search.json?query=${encodeURIComponent(search)}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const text = await response.text();
      if (!response.ok) {
        console.error('[WillyWeather Proxy] Error response:', response.status, text);
        return NextResponse.json({ error: text, status: response.status }, { status: 500 });
      }
      try {
        const data = JSON.parse(text);
        console.log('[WillyWeather Proxy] Search API returned:', JSON.stringify(data));
        return NextResponse.json(data);
      } catch (parseErr) {
        console.error('[WillyWeather Proxy] JSON parse error:', parseErr, text);
        return NextResponse.json({ error: 'Invalid JSON from WillyWeather', details: text }, { status: 500 });
      }
    } catch (error: any) {
      console.error('[WillyWeather Proxy] Exception:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // /api/willyweather?id=...&type=info
  if (type === 'info') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const url = `${BASE_URL}/${API_KEY}/locations/${id}/info.json?platform=${PLATFORM}`;
    console.log('[WillyWeather Proxy] Info API URL:', url);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const text = await response.text();
      if (!response.ok) {
        console.error('[WillyWeather Proxy] Info API error:', response.status, text);
        return NextResponse.json({ error: text, status: response.status }, { status: 500 });
      }
      try {
        const data = JSON.parse(text);
        console.log('[WillyWeather Proxy] Info API returned:', JSON.stringify(data));
        return NextResponse.json(data);
      } catch (parseErr) {
        console.error('[WillyWeather Proxy] Info JSON parse error:', parseErr, text);
        return NextResponse.json({ error: 'Invalid JSON from WillyWeather', details: text }, { status: 500 });
      }
    } catch (error: any) {
      console.error('[WillyWeather Proxy] Info Exception:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // /api/willyweather?id=...&type=observations
  if (type === 'observations') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const url = `${BASE_URL}/${API_KEY}/locations/${id}/observations.json?platform=${PLATFORM}`;
    console.log('[WillyWeather Proxy] Observations API URL:', url);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const text = await response.text();
      if (!response.ok) {
        console.error('[WillyWeather Proxy] Observations API error:', response.status, text);
        return NextResponse.json({ error: text, status: response.status }, { status: 500 });
      }
      try {
        const data = JSON.parse(text);
        console.log('[WillyWeather Proxy] Observations API returned:', JSON.stringify(data));
        return NextResponse.json(data);
      } catch (parseErr) {
        console.error('[WillyWeather Proxy] Observations JSON parse error:', parseErr, text);
        return NextResponse.json({ error: 'Invalid JSON from WillyWeather', details: text }, { status: 500 });
      }
    } catch (error: any) {
      console.error('[WillyWeather Proxy] Observations Exception:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
}
