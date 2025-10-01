"use client";

import { formatAddress } from "@/utils/farcaster";
import sdk from "@farcaster/miniapp-sdk";
import React, { useEffect } from "react";
import { useAccount } from "wagmi";

export default function ProfileHeader() {
  const { address } = useAccount();

  useEffect(() => {

    async function getUser() {
      const user = await sdk.context;
      console.log("context", user);
    }
    getUser();

  }, [address]);
  return (
    <div className="flex items-center justify-between px-10">
      <button className="h-0 w-0 rounded-full bg-background grid place-items-center text-muted-foreground text-3xl font-bold"></button>
      <div className="text-center">
        {/* <div className="text-xl font-semibold">{formatAddress(address as `0x${string}` || "")}</div> */}
        <div className="text-xs text-muted-foreground">{formatAddress(address as `0x${string}` || "")}</div>
      </div>
      <div></div>
      {/* <button className="h-9 w-9 rounded-full bg-white shadow-md grid place-items-center text-muted-foreground">⚙️</button> */}
    </div>
  );
}


