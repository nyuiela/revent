import { NextRequest, NextResponse } from 'next/server';

interface PermissionRequest {
  id: string;
  mediaId: string;
  requester: string;
  requesterName: string;
  amount: number;
  accessRights: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  txHash?: string;
}

interface MediaItem {
  id: string;
  url: string;
  title: string;
  price: number;
  accessRights: string;
  owner: string;
  ownerName: string;
  createdAt: number;
  requests: PermissionRequest[];
}

// In-memory storage (use database in production)
const mediaItems: MediaItem[] = [
  {
    id: '1',
    url: '/stream.jpg',
    title: 'Image_HD_Dec 15 2:30 PM_a1b2c3',
    price: 0.5,
    accessRights: 'read',
    owner: '0x1234...5678',
    ownerName: 'MediaOwner1',
    createdAt: Date.now() - 86400000,
    requests: []
  },
  {
    id: '2',
    url: '/stream.jpg',
    title: 'Video_SD_Dec 14 4:15 PM_d4e5f6',
    price: 1.2,
    accessRights: 'write',
    owner: '0xabcd...efgh',
    ownerName: 'MediaOwner2',
    createdAt: Date.now() - 172800000,
    requests: []
  }
];

export async function GET() {
  return NextResponse.json(mediaItems);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaId, requester, requesterName, amount, accessRights, txHash } = body;

    // Find the media item
    const mediaIndex = mediaItems.findIndex(item => item.id === mediaId);
    if (mediaIndex === -1) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Create new permission request
    const newRequest: PermissionRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mediaId,
      requester,
      requesterName,
      amount,
      accessRights,
      status: 'pending',
      createdAt: Date.now(),
      txHash
    };

    // Add request to media item
    mediaItems[mediaIndex].requests.push(newRequest);

    return NextResponse.json(newRequest);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
