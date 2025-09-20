import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for view counts (in production, use a database)
const viewCounts = new Map<string, number>();

// Track recent views to prevent duplicate tracking (simple rate limiting)
const recentViews = new Map<string, number>();
const RATE_LIMIT_WINDOW = 300000; // 5 minutes - increased to prevent excessive calls

// Track views per session to prevent duplicate tracking from same user
const sessionViews = new Map<string, Set<string>>();

// Cleanup old sessions periodically to prevent memory leaks
const SESSION_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
let lastCleanup = Date.now();

function cleanupOldSessions() {
  const now = Date.now();
  if (now - lastCleanup > SESSION_CLEANUP_INTERVAL) {
    // Clear empty sessions
    for (const [sessionId, viewedEvents] of sessionViews.entries()) {
      if (viewedEvents.size === 0) {
        sessionViews.delete(sessionId);
      }
    }
    lastCleanup = now;
  }
}

// Track a view for an event
export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Cleanup old sessions
    cleanupOldSessions();

    // Get client IP for session tracking
    const clientIP = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Check if this session has already viewed this event
    if (!sessionViews.has(clientIP)) {
      sessionViews.set(clientIP, new Set());
    }

    const userViewedEvents = sessionViews.get(clientIP)!;

    if (userViewedEvents.has(eventId)) {
      // User has already viewed this event in this session
      return NextResponse.json({
        success: true,
        viewCount: viewCounts.get(eventId) || 0,
        alreadyViewed: true
      });
    }

    // Check rate limiting to prevent excessive calls
    const now = Date.now();
    const lastViewTime = recentViews.get(eventId);

    if (lastViewTime && (now - lastViewTime) < RATE_LIMIT_WINDOW) {
      // Rate limited - return current count without incrementing
      return NextResponse.json({
        success: true,
        viewCount: viewCounts.get(eventId) || 0,
        rateLimited: true
      });
    }

    // Increment view count
    const currentCount = viewCounts.get(eventId) || 0;
    viewCounts.set(eventId, currentCount + 1);
    recentViews.set(eventId, now);
    userViewedEvents.add(eventId);

    return NextResponse.json({
      success: true,
      viewCount: viewCounts.get(eventId)
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}

// Get view count for an event
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const viewCount = viewCounts.get(eventId) || 0;

    return NextResponse.json({ viewCount });
  } catch (error) {
    console.error('Error getting view count:', error);
    return NextResponse.json({ error: 'Failed to get view count' }, { status: 500 });
  }
}

// Get view counts for multiple events
export async function PUT(request: NextRequest) {
  try {
    // Check if request has body
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
    }

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

    const { eventIds } = parsedBody;

    if (!Array.isArray(eventIds)) {
      return NextResponse.json({ error: 'eventIds must be an array' }, { status: 400 });
    }

    const viewCountsMap = eventIds.reduce((acc, eventId) => {
      acc[eventId] = viewCounts.get(eventId) || 0;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ viewCounts: viewCountsMap });
  } catch (error) {
    console.error('Error getting view counts:', error);
    return NextResponse.json({ error: 'Failed to get view counts' }, { status: 500 });
  }
}
