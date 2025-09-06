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

// List of stream files to upload
const STREAM_FILES = [
  'stream-iframe.html',
  'stream-embed.html',
  'stream-interface.html',
  'stream-interface-advanced.html',
  'simple-stream.html',
  'test-hls.html',
];

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specificFile = searchParams.get('file');

    let filesToUpload = STREAM_FILES;

    // If specific file requested, only upload that one
    if (specificFile && STREAM_FILES.includes(specificFile)) {
      filesToUpload = [specificFile];
    }

    const results = [];
    const uploadPromises = [];

    for (const fileName of filesToUpload) {
      const filePath = path.join(process.cwd(), 'public', fileName);

      if (!fs.existsSync(filePath)) {
        console.warn(`File ${fileName} not found, skipping...`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Create upload promise
      const uploadPromise = uploadToIPFS(fileContent, fileName).then(result => {
        const cid = result.Hash;
        return {
          fileName,
          cid,
          ipfsUrl: `https://ipfs.io/ipfs/${cid}`,
          gatewayUrls: [
            `https://ipfs.io/ipfs/${cid}`,
            `https://gateway.pinata.cloud/ipfs/${cid}`,
            `https://cloudflare-ipfs.com/ipfs/${cid}`,
            `https://dweb.link/ipfs/${cid}`,
          ],
          size: fileContent.length,
        };
      });

      uploadPromises.push(uploadPromise);
    }

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);
    results.push(...uploadResults);

    console.log(`Uploaded ${results.length} stream files to IPFS`);

    // Return results
    return NextResponse.json({
      success: true,
      uploadedFiles: results,
      totalFiles: results.length,
      timestamp: new Date().toISOString(),
      message: specificFile
        ? `Uploaded ${specificFile} to IPFS`
        : `Uploaded ${results.length} stream files to IPFS`,
    });

  } catch (error) {
    console.error('Error uploading stream files to IPFS:', error);

    return NextResponse.json(
      {
        error: 'Failed to upload stream files to IPFS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specificFile = searchParams.get('file');

    let filesToCheck = STREAM_FILES;

    // If specific file requested, only check that one
    if (specificFile && STREAM_FILES.includes(specificFile)) {
      filesToCheck = [specificFile];
    }

    const fileInfo = [];

    for (const fileName of filesToCheck) {
      const filePath = path.join(process.cwd(), 'public', fileName);

      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const fileStats = fs.statSync(filePath);

        fileInfo.push({
          fileName,
          size: fileContent.length,
          lastModified: fileStats.mtime.toISOString(),
          exists: true,
        });
      } else {
        fileInfo.push({
          fileName,
          exists: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      files: fileInfo,
      totalFiles: fileInfo.length,
      availableFiles: STREAM_FILES,
      message: 'Use POST method to upload files to IPFS and get CIDs'
    });

  } catch (error) {
    console.error('Error reading stream files:', error);

    return NextResponse.json(
      {
        error: 'Failed to read stream files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
