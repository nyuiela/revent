import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Secure-ish HMAC verification
// Token format: base64url(JSON payload).base64url(HMAC_SHA256(payload, VERIFY_SHARED_SECRET))
// Payload example: { userId: '0xabc', eventId: 'evt_123', role: 'owner', exp: 1735689600 }

function base64urlDecode(input: string) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = input.length % 4;
  if (pad) input += '='.repeat(4 - pad);
  return Buffer.from(input, 'base64');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const secret = process.env.VERIFY_SHARED_SECRET;
  if (!secret) {
    // Fail closed in production; for local dev you can set any secret
    return NextResponse.json({ valid: false, reason: 'server_not_configured' }, { status: 500 });
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const [payloadB64, sigB64] = parts;
  const payloadBuf = base64urlDecode(payloadB64);
  const signatureBuf = base64urlDecode(sigB64);

  // Verify HMAC
  const h = crypto.createHmac('sha256', secret).update(payloadBuf).digest();
  const validSig = crypto.timingSafeEqual(h, signatureBuf);
  if (!validSig) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  let payload: Record<string, unknown> | null = null;
  try {
    payload = JSON.parse(payloadBuf.toString('utf8'));
  } catch {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  // Check expiration if provided
  if (payload?.exp && Date.now() / 1000 > Number(payload.exp)) {
    return NextResponse.json({ valid: false, reason: 'expired' }, { status: 200 });
  }

  // Only allow owners/admins
  const role = payload?.role;
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const eventId = String(payload?.eventId || 'evt_unknown');
  const userId = String(payload?.userId || 'user_unknown');

  return NextResponse.json(
    { valid: true, role, eventId, userId },
    { status: 200 }
  );
}


