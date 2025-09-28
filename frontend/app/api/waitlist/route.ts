import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getCollection } from '@/lib/mongodb';

// Initialize Redis client with fallback
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn('Redis not configured, using in-memory fallback for waitlist');
}

// In-memory fallback storage
const inMemoryWaitlist = new Set<string>();
const inMemoryCount = 0;

const WAITLIST_KEY = 'waitlist_emails';
const WAITLIST_COUNT_KEY = 'waitlist_count';

// Add email to waitlist (MongoDB primary, Redis/in-memory as fallback)
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

    // Try MongoDB first
    try {
      const col = await getCollection<{ email: string, createdAt: string }>('waitlist')
      const existsMongo = await col.findOne({ email: normalizedEmail })
      if (existsMongo) {
        return NextResponse.json({ success: true, message: 'Email already registered', alreadyExists: true })
      }
      await col.insertOne({ email: normalizedEmail, createdAt: new Date().toISOString() })
      const totalCount = await col.estimatedDocumentCount()
      return NextResponse.json({ success: true, message: 'Email added to waitlist', totalCount, alreadyExists: false })
    } catch (e) {
      // Fallback to Redis or in-memory
      // Check if email already exists
      // let exists: boolean;
      // let totalCount: number;
      // if (redis) {
      //   exists = await redis.sismember(WAITLIST_KEY, normalizedEmail);
      //   if (exists) {
      //     return NextResponse.json({ success: true, message: 'Email already registered', alreadyExists: true });
      //   }
      //   const pipeline = redis.pipeline();
      //   pipeline.sadd(WAITLIST_KEY, normalizedEmail);
      //   pipeline.incr(WAITLIST_COUNT_KEY);
      //   await pipeline.exec();
      //   totalCount = (await redis.get(WAITLIST_COUNT_KEY)) as number;
      // } else {
      //   exists = inMemoryWaitlist.has(normalizedEmail);
      //   if (exists) {
      //     return NextResponse.json({ success: true, message: 'Email already registered', alreadyExists: true });
      //   }
      //   inMemoryWaitlist.add(normalizedEmail);
      //   inMemoryCount++;
      //   totalCount = inMemoryCount;
      // }
      return NextResponse.json({ error: 'Failed to add email to waitlist' }, { status: 500 });
      // return NextResponse.json({ success: false, message: 'Email added to waitlist', totalCount, alreadyExists: false })
    }

    // return NextResponse.json({
    //   success: true,
    //   message: 'Email added to waitlist',
    //   totalCount,
    //   alreadyExists: false
    // });

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
    // Try MongoDB
    try {
      const col = await getCollection<{ email: string }>('waitlist')
      const existsMongo = await col.findOne({ email: normalizedEmail })
      return NextResponse.json({ exists: Boolean(existsMongo), email: normalizedEmail })
    } catch {
      let exists: boolean;
      if (redis) {
        exists = Boolean(await redis.sismember(WAITLIST_KEY, normalizedEmail));
      } else {
        exists = inMemoryWaitlist.has(normalizedEmail);
      }
      return NextResponse.json({ exists, email: normalizedEmail })
    }

  } catch (error) {
    console.error('Error checking email in waitlist:', error);
    return NextResponse.json({ error: 'Failed to check email' }, { status: 500 });
  }
}

// Get waitlist statistics
export async function PUT(request: NextRequest) {
  try {
    try {
      const col = await getCollection<{ email: string }>('waitlist')
      const totalEmails = await col.estimatedDocumentCount()
      return NextResponse.json({ totalCount: totalEmails, totalEmails, lastUpdated: new Date().toISOString() })
    } catch {
      let totalCount: number;
      let totalEmails: number;
      if (redis) {
        totalCount = ((await redis.get(WAITLIST_COUNT_KEY)) as number) || 0;
        totalEmails = await redis.scard(WAITLIST_KEY);
      } else {
        totalCount = inMemoryCount;
        totalEmails = inMemoryWaitlist.size;
      }
      return NextResponse.json({ totalCount, totalEmails, lastUpdated: new Date().toISOString() })
    }

  } catch (error) {
    console.error('Error getting waitlist stats:', error);
    return NextResponse.json({ error: 'Failed to get waitlist statistics' }, { status: 500 });
  }
}
