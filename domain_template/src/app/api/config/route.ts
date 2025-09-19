import { NextResponse } from 'next/server';
import { getTenantConfig, getTenantFromRequest } from '@/lib/config';

export async function GET(req: Request) {
  try {
    const tenant = await getTenantFromRequest(req);
    const config = await getTenantConfig(null, tenant || undefined);
    
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error: any) {
    console.error('Config API error:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Configuration not found' }), 
      { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
