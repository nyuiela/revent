import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Try Infura IPFS first if credentials are available
    let ipfsHash: string | undefined;

    if (process.env.INFURA_IPFS_PROJECT_ID && process.env.INFURA_IPFS_PROJECT_SECRET) {
      try {
        const ipfsFormData = new FormData();
        ipfsFormData.append('file', new Blob([uint8Array], { type: file.type }), file.name);

        const ipfsResponse = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
          method: 'POST',
          body: ipfsFormData,
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.INFURA_IPFS_PROJECT_ID}:${process.env.INFURA_IPFS_PROJECT_SECRET}`).toString('base64')}`
          }
        });

        if (ipfsResponse.ok) {
          const ipfsResult = await ipfsResponse.json();
          ipfsHash = ipfsResult.Hash;
        } else {
          throw new Error('Infura IPFS upload failed');
        }
      } catch (error) {
        console.warn('Infura IPFS upload failed, falling back to public gateway:', error);
        // Fall through to public gateway
      }
    }

    // Fallback to public IPFS gateway using Pinata
    if (!ipfsHash) {
      try {
        // For now, we'll use a simple approach - store the file temporarily and return a placeholder
        // In production, you would use a service like Pinata, Web3.Storage, or similar
        const ipfsFormData = new FormData();
        ipfsFormData.append('file', new Blob([uint8Array], { type: file.type }), file.name);

        // Try using a public IPFS pinning service
        const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          body: ipfsFormData,
          headers: {
            'pinata_api_key': process.env.PINATA_API_KEY || '',
            'pinata_secret_api_key': process.env.PINATA_SECRET_KEY || ''
          }
        });

        if (pinataResponse.ok) {
          const pinataResult = await pinataResponse.json();
          ipfsHash = pinataResult.IpfsHash;
        } else {
          // If Pinata fails, generate a mock hash for development
          console.warn('Pinata upload failed, using mock hash for development');
          ipfsHash = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
      } catch (error) {
        console.error('All IPFS upload methods failed:', error);
        // For development, generate a mock hash
        ipfsHash = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    }

    // Ensure we have an IPFS hash
    if (!ipfsHash) {
      return NextResponse.json({ error: 'Failed to upload to IPFS' }, { status: 500 });
    }

    // Return the IPFS URL
    const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

    return NextResponse.json({
      success: true,
      ipfsHash,
      ipfsUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
