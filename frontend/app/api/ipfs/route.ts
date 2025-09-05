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

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify({
        pinataOptions: { cidVersion: 1 },
        pinataMetadata: { name: body?.name || "stream-event" },
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
    const uri = `ipfs://${cid}`;

    return NextResponse.json({ cid, uri });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Unexpected error uploading to IPFS", details: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}


