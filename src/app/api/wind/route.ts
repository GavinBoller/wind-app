import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const willyWeatherApiKey = process.env.WILLYWEATHER_API_KEY;

  if (!willyWeatherApiKey) {
    return new NextResponse('WillyWeather API key is not configured.', { status: 500 });
  }

  const search = searchParams.get('search');
  const locationId = searchParams.get('id');
  const type = searchParams.get('type');

  try {
    // Handle location search
    if (search) {
      const res = await fetch(
        `https://api.willyweather.com.au/v2/${willyWeatherApiKey}/search.json?query=${encodeURIComponent(search)}&types=location&forecasts=wind`,
        { next: { revalidate: 86400 } } // Cache search results for a day
      );
      if (!res.ok) {
        // Provide more detailed error logging for diagnostics
        const errorText = await res.text();
        console.error(`WillyWeather Search API Error (Status: ${res.status}): ${errorText}`);
        throw new Error('Failed to fetch from WillyWeather search API');
      }
      const data = await res.json();
      return NextResponse.json(data.locations?.location || []);
    }

    // Handle fetching detailed info for a specific location
    if (locationId && type === 'info') {
      const res = await fetch(
        `https://api.willyweather.com.au/v2/${willyWeatherApiKey}/locations/${locationId}/weather.json?observational=true`,
        { next: { revalidate: 600 } } // Cache weather info for 10 minutes
      );
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`WillyWeather Weather API Error (Status: ${res.status}): ${errorText}`);
        throw new Error('Failed to fetch from WillyWeather weather API');
      }
      const data = await res.json();
      return NextResponse.json(data);
    }

    return new NextResponse('Invalid request parameters.', { status: 400 });
  } catch (error: any) {
    console.error('WillyWeather API error:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}