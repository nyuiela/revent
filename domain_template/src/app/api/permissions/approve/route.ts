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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action, txHash } = body; // action: 'approve' or 'reject'

    // Find the media item and request
    let foundRequest: PermissionRequest | null = null;
    let mediaIndex = -1;
    let requestIndex = -1;

    for (let i = 0; i < mediaItems.length; i++) {
      const requestIdx = mediaItems[i].requests.findIndex(req => req.id === requestId);
      if (requestIdx !== -1) {
        foundRequest = mediaItems[i].requests[requestIdx];
        mediaIndex = i;
        requestIndex = requestIdx;
        break;
      }
    }

    if (!foundRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Update request status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    mediaItems[mediaIndex].requests[requestIndex] = {
      ...foundRequest,
      status: newStatus,
      txHash
    };

    return NextResponse.json({
      success: true,
      request: mediaItems[mediaIndex].requests[requestIndex]
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
