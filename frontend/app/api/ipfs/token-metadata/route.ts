import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pinataJwt = process.env.PINATA_JWT;

    if (!pinataJwt) {
      return NextResponse.json(
        { error: "Server missing PINATA_JWT" },
        { status: 500 }
      );
    }

    // Use a specific group for token metadata
    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify({
        pinataOptions: {
          cidVersion: 1,
          // You can specify a custom group here if you have one set up in Pinata
          // customPinPolicy: {
          //   regions: [
          //     {
          //       id: "FRA1",
          //       desiredReplicationCount: 1
          //     }
          //   ]
          // }
        },
        pinataMetadata: {
          name: body?.name || "token-metadata",
          keyvalues: {
            type: "token-metadata",
            project: "revents"
          }
        },
        pinataContent: body?.content ?? body,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: "Pinata upload failed", details: err },
        { status: 502 }
      );
    }

    const json = await res.json();
    const cid: string = json.IpfsHash;

    // Use your custom domain for the IPFS gateway
    const uri = `https://revents.io/ipfs/${cid}`;
    const ipfsUri = `ipfs://${cid}`;

    return NextResponse.json({
      cid,
      uri, // Your custom domain URL
      ipfsUri, // Standard IPFS URI
      gateway: "https://revents.io/ipfs/"
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Unexpected error uploading to IPFS", details: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}