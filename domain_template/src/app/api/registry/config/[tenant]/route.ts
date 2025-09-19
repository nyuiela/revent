import { NextResponse } from 'next/server';

// Simple in-memory registry for development
// In production, replace with Redis, database, or file storage
const registry = new Map<string, any>();

// Example tenant configurations
const exampleConfigs = {
  'ethaccra': {
    owner: '0x1234567890123456789012345678901234567890',
    eventId: '1',
    chainId: 84532,
    contract: '0xabcdef1234567890abcdef1234567890abcdef12',
    subgraph: 'https://api.studio.thegraph.com/query/ethaccra/meetup',
    name: 'ETHAccra Meetup',
    description: 'Amazing blockchain event in Accra',
    theme: {
      accent: '#7c3aed',
      mode: 'dark',
      background: '#000000',
      primary: '#ffffff',
      secondary: '#f3f4f6'
    },
    features: {
      ticketing: true,
      chat: true,
      streaming: true,
      gallery: true,
      analytics: true
    },
    configSource: 'registry',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'web3summit': {
    owner: '0xabcdef1234567890abcdef1234567890abcdef12',
    eventId: '2',
    chainId: 1,
    contract: '0x1234567890abcdef1234567890abcdef12345678',
    subgraph: 'https://api.studio.thegraph.com/query/web3summit/event',
    name: 'Web3 Summit 2024',
    description: 'The biggest Web3 conference',
    theme: {
      accent: '#00ff88',
      mode: 'light',
      background: '#ffffff',
      primary: '#000000',
      secondary: '#666666'
    },
    features: {
      ticketing: true,
      chat: false,
      streaming: true,
      gallery: false,
      analytics: true
    },
    configSource: 'registry',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

// Initialize registry with example configs
Object.entries(exampleConfigs).forEach(([tenant, config]) => {
  registry.set(tenant, config);
});

export async function GET(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  const { tenant } = params;
  
  try {
    const config = registry.get(tenant);
    
    if (!config) {
      return new NextResponse(
        JSON.stringify({ error: 'Tenant not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      }
    });
    
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  const { tenant } = params;
  
  try {
    const config = await request.json();
    
    // Validate required fields
    if (!config.owner || !config.chainId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: owner, chainId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Update config
    const updatedConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
      configSource: 'registry'
    };
    
    registry.set(tenant, updatedConfig);
    
    return NextResponse.json(updatedConfig, {
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  const { tenant } = params;
  
  try {
    const deleted = registry.delete(tenant);
    
    if (!deleted) {
      return new NextResponse(
        JSON.stringify({ error: 'Tenant not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
