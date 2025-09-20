import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const WAITLIST_KEY = 'waitlist_emails';
const WAITLIST_COUNT_KEY = 'waitlist_count';

// Add email to waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { email } = parsedBody;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const exists = await redis.sismember(WAITLIST_KEY, normalizedEmail);
    
    if (exists) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email already registered',
        alreadyExists: true 
      });
    }

    // Add email to set and increment counter
    const pipeline = redis.pipeline();
    pipeline.sadd(WAITLIST_KEY, normalizedEmail);
    pipeline.incr(WAITLIST_COUNT_KEY);
    
    await pipeline.exec();

    // Get updated count
    const totalCount = await redis.get(WAITLIST_COUNT_KEY) as number;

    return NextResponse.json({ 
      success: true, 
      message: 'Email added to waitlist',
      totalCount,
      alreadyExists: false
    });

  } catch (error) {
    console.error('Error adding email to waitlist:', error);
    return NextResponse.json({ error: 'Failed to add email to waitlist' }, { status: 500 });
  }
}

// Check if email exists in waitlist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await redis.sismember(WAITLIST_KEY, normalizedEmail);

    return NextResponse.json({ 
      exists,
      email: normalizedEmail 
    });

  } catch (error) {
    console.error('Error checking email in waitlist:', error);
    return NextResponse.json({ error: 'Failed to check email' }, { status: 500 });
  }
}

// Get waitlist statistics
export async function PUT(request: NextRequest) {
  try {
    const totalCount = await redis.get(WAITLIST_COUNT_KEY) as number || 0;
    const totalEmails = await redis.scard(WAITLIST_KEY);

    return NextResponse.json({ 
      totalCount,
      totalEmails,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting waitlist stats:', error);
    return NextResponse.json({ error: 'Failed to get waitlist statistics' }, { status: 500 });
  }
}
