#!/usr/bin/env node

const { create } = require("ipfs-http-client");
const fs = require("fs");
const path = require("path");

// IPFS configuration
const IPFS_CONFIG = {
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
};

async function uploadToIPFS() {
  try {
    console.log("🚀 Initializing IPFS client...");
    const ipfs = create(IPFS_CONFIG);

    // Files to upload
    const filesToUpload = [
      {
        path: path.join(__dirname, "../public/stream-viewer.html"),
        name: "stream-viewer.html",
      },
      {
        path: path.join(__dirname, "../public/stream-viewer-advanced.html"),
        name: "stream-viewer-advanced.html",
      },
    ];

    console.log("📁 Uploading files to IPFS...");

    for (const file of filesToUpload) {
      if (!fs.existsSync(file.path)) {
        console.log(`❌ File not found: ${file.path}`);
        continue;
      }

      console.log(`📤 Uploading ${file.name}...`);

      const fileContent = fs.readFileSync(file.path);
      const result = await ipfs.add({
        path: file.name,
        content: fileContent,
      });

      console.log(`✅ Uploaded ${file.name}`);
      console.log(`   CID: ${result.cid.toString()}`);
      console.log(`   IPFS URL: https://ipfs.io/ipfs/${result.cid.toString()}`);
      console.log(
        `   Gateway URL: https://gateway.pinata.cloud/ipfs/${result.cid.toString()}`,
      );
      console.log("");
    }

    // Create a directory with both files
    console.log("📁 Creating directory with all files...");

    const directoryFiles = [];
    for (const file of filesToUpload) {
      if (fs.existsSync(file.path)) {
        const fileContent = fs.readFileSync(file.path);
        directoryFiles.push({
          path: file.name,
          content: fileContent,
        });
      }
    }

    if (directoryFiles.length > 0) {
      const directoryResult = await ipfs.add(directoryFiles);
      console.log(`✅ Created directory`);
      console.log(`   Directory CID: ${directoryResult.cid.toString()}`);
      console.log(
        `   Directory URL: https://ipfs.io/ipfs/${directoryResult.cid.toString()}`,
      );
      console.log(
        `   Gateway URL: https://gateway.pinata.cloud/ipfs/${directoryResult.cid.toString()}`,
      );
    }

    console.log("🎉 Upload complete!");
    console.log("");
    console.log("📋 Next steps:");
    console.log("1. Use the CIDs above to access your HTML files");
    console.log("2. Set up ENS names to point to these CIDs");
    console.log("3. Share the ENS names for easy access");
  } catch (error) {
    console.error("❌ Upload failed:", error);
    process.exit(1);
  }
}

// Run the upload
uploadToIPFS();
