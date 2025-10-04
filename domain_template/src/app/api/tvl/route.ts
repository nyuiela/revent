import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for TVL (in production, use a database)
const tvlData = {
  totalValue: 125000, // Starting value
  lastUpdated: new Date().toISOString()
};

export async function GET() {
  return NextResponse.json(tvlData);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Update TVL
    tvlData.totalValue += amount;
    tvlData.lastUpdated = new Date().toISOString();

    return NextResponse.json(tvlData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update TVL' },
      { status: 500 }
    );
  }
}
