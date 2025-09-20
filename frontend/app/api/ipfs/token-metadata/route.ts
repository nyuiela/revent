import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenId, metadata } = body;

    // Validate tokenId is 64-char hex
    if (!tokenId || typeof tokenId !== 'string' || !/^[0-9a-fA-F]{64}$/.test(tokenId)) {
      return NextResponse.json(
        { error: "Token ID must be a 64-character hexadecimal string" },
        { status: 400 }
      );
    }

    // Validate metadata exists
    if (!metadata) {
      return NextResponse.json(
        { error: "Metadata is required" },
        { status: 400 }
      );
    }

    const pinataJwt = process.env.PINATA_JWT;

    if (!pinataJwt) {
      return NextResponse.json(
        { error: "Server missing PINATA_JWT" },
        { status: 500 }
      );
    }

    // Create the folder structure: token-metadata/{tokenId}.json
    const fileName = `${tokenId}.json`;
    const folderPath = "token-metadata";

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify({
        pinataOptions: {
          cidVersion: 1,
          wrapWithDirectory: true,
          customPinPolicy: {
            regions: [
              {
                id: "FRA1",
                desiredReplicationCount: 1
              },
              {
                id: "NYC1",
                desiredReplicationCount: 1
              }
            ]
          }
        },
        pinataMetadata: {
          name: `token-metadata-${tokenId}`,
          keyvalues: {
            type: "token-metadata",
            tokenId: tokenId,
            folder: folderPath
          }
        },
        pinataContent: metadata,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Pinata upload failed:", err);
      return NextResponse.json(
        { error: "Pinata upload failed", details: err },
        { status: 502 }
      );
    }

    const json = await res.json();
    const cid: string = json.IpfsHash;

    // The metadata is stored directly at the CID (no subfolder structure)
    const metadataUri = `ipfs://${cid}`;

    return NextResponse.json({
      cid,
      metadataUri,
      fileName,
      tokenId
    });
  } catch (e: unknown) {
    console.error("Token metadata upload error:", e);
    return NextResponse.json(
      { error: "Unexpected error uploading token metadata to IPFS", details: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
