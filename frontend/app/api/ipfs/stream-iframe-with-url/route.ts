import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamUrl = searchParams.get('streamUrl') || 'http://207.180.247.72:8889/ethAccra';

    // Read the stream-iframe.html file
    const filePath = path.join(process.cwd(), 'public', 'stream-iframe.html');

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'stream-iframe.html file not found' },
        { status: 404 }
      );
    }

    let fileContent = fs.readFileSync(filePath, 'utf-8');

    // Replace the default stream URL with the provided one
    fileContent = fileContent.replace(
      'value="http://207.180.247.72:8889/ethAccra"',
      `value="${streamUrl}"`
    );

    // Also update the iframe src if it exists
    fileContent = fileContent.replace(
      'src="http://207.180.247.72:8889/ethAccra"',
      `src="${streamUrl}"`
    );

    // Add a comment with the stream URL for reference
    fileContent = fileContent.replace(
      '<head>',
      `<head>\n    <!-- Stream URL: ${streamUrl} -->`
    );

    // Create a unique filename with stream URL hash
    const streamUrlHash = Buffer.from(streamUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const fileName = `stream-iframe-${streamUrlHash}.html`;

    // Add file to IPFS
    const result = await uploadToIPFS(fileContent, fileName);
    const cid = result.Hash;

    console.log(`Stream iframe with URL ${streamUrl} uploaded to IPFS with CID: ${cid}`);

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
      fileName: fileName,
      streamUrl: streamUrl,
      size: fileContent.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error uploading stream iframe with URL to IPFS:', error);

    return NextResponse.json(
      {
        error: 'Failed to upload stream iframe with URL to IPFS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamUrl = searchParams.get('streamUrl') || 'http://207.180.247.72:8889/ethAccra';

    // Read the stream-iframe.html file
    const filePath = path.join(process.cwd(), 'public', 'stream-iframe.html');

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'stream-iframe.html file not found' },
        { status: 404 }
      );
    }

    let fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileStats = fs.statSync(filePath);

    // Show what the modified content would look like
    const modifiedContent = fileContent
      .replace(
        'value="http://207.180.247.72:8889/ethAccra"',
        `value="${streamUrl}"`
      )
      .replace(
        'src="http://207.180.247.72:8889/ethAccra"',
        `src="${streamUrl}"`
      );

    // Return file information without uploading
    return NextResponse.json({
      success: true,
      fileName: 'stream-iframe.html',
      streamUrl: streamUrl,
      size: fileContent.length,
      modifiedSize: modifiedContent.length,
      lastModified: fileStats.mtime.toISOString(),
      preview: modifiedContent.substring(0, 500) + '...',
      message: 'Use POST method to upload to IPFS with embedded stream URL'
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
