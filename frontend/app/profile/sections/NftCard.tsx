"use client";

import React from "react";
import Image from "next/image";

export default function NftCard() {
  const nft = [
    {
      name: "Revent NFT",
      image: "/image/nftcard.jpg",
      description: "This is a description of the NFT",
      attributes: [
        {
          name: "Attribute 1",
          value: "Value 1"
        }
      ]
    },
    {
      name: "Revent NFT",
      image: "/image/nftcard.jpg",
      description: "This is a description of the NFT",
      attributes: [
        {
          name: "Attribute 1",
          value: "Value 1"
        }
      ]
    },
    {
      name: "Revent NFT",
      image: "/image/nftcard.jpg",
      description: "This is a description of the NFT",
      attributes: [
        {
          name: "Attribute 1",
          value: "Value 1"
        }
      ]
    },
    {
      name: "Revent NFT",
      image: "/image/nftcard.jpg",
      description: "This is a description of the NFT",
      attributes: [
        {
          name: "Attribute 1",
          value: "Value 1"
        }
      ]
    }
  ]

  return (
    <div className="rounded-2xl bg-[#F7F6FF] p-4 ring-1 ring-black/5">
      <h1 className="text-sm font-medium mb-3 flex items-center gap-2">My NFTs <span className="text-xs text-muted-foreground">({nft.length})</span></h1>
      <div className="grid grid-cols-4 gap-3 justify-center items-center">
        {nft.length === 0 && <div className="flex items-center justify-center">No NFTs</div>}

        {nft.length > 0 && nft?.map((nft) => (
          <div className="flex items-start gap-3" key={nft.name}>
            <div className="w-[5rem] h-[5rem] rounded-lg bg-white overflow-hidden">
              <Image src={nft.image} alt={nft.name} width={100} height={100} className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


