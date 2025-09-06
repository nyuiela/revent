import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple IPFS upload function using fetch
async function uploadToIPFS(content: string, fileName: string) {
  const formData = new FormData();
  const blob = new Blob([content], { type: 'text/html' });
  formData.append('file', blob, fileName);

  const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': process.env.IPFS_AUTH || '',
    },
  });

  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.statusText}`);
  }

  return await response.json();
}

export async function POST() {
  try {
    // Read the stream-iframe.html file
    const filePath = path.join(process.cwd(), 'public', 'stream-iframe.html');

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'stream-iframe.html file not found' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Add file to IPFS
    const result = await uploadToIPFS(fileContent, 'stream-iframe.html');
    const cid = result.Hash;

    console.log(`Stream iframe uploaded to IPFS with CID: ${cid}`);

    // Return the CID and IPFS gateway URL
    return NextResponse.json({
      success: true,
      cid: cid,
      ipfsUrl: `https://ipfs.io/ipfs/${cid}`,
      gatewayUrls: [
        `https://ipfs.io/ipfs/${cid}`,
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`,
        `https://dweb.link/ipfs/${cid}`,
      ],
      fileName: 'stream-iframe.html',
      size: fileContent.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error uploading stream iframe to IPFS:', error);

    return NextResponse.json(
      {
        error: 'Failed to upload stream iframe to IPFS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Read the stream-iframe.html file
    const filePath = path.join(process.cwd(), 'public', 'stream-iframe.html');

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'stream-iframe.html file not found' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileStats = fs.statSync(filePath);

    // Return file information without uploading
    return NextResponse.json({
      success: true,
      fileName: 'stream-iframe.html',
      size: fileContent.length,
      lastModified: fileStats.mtime.toISOString(),
      content: fileContent,
      message: 'Use POST method to upload to IPFS and get CID'
    });

  } catch (error) {
    console.error('Error reading stream iframe file:', error);

    return NextResponse.json(
      {
        error: 'Failed to read stream iframe file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
