import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const pinataJwt = process.env.PINATA_JWT;

    if (!pinataJwt) {
      return NextResponse.json(
        { error: "Server missing PINATA_JWT" },
        { status: 500 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Pinata with token metadata group settings
    const uploadFormData = new FormData();
    uploadFormData.append('file', new Blob([buffer]), file.name);

    const pinataMetadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        type: "token-image",
        project: "revents",
        originalName: file.name
      }
    });

    uploadFormData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
      // Custom pin policy for token metadata group
      // customPinPolicy: {
      //   regions: [
      //     {
      //       id: "FRA1",
      //       desiredReplicationCount: 1
      //     }
      //   ]
      // }
    });

    uploadFormData.append('pinataOptions', pinataOptions);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: uploadFormData,
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
      gateway: "https://revents.io/ipfs/",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Unexpected error uploading to IPFS", details: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
