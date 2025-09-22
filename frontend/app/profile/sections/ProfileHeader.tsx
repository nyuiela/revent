"use client";

import React from "react";

export default function ProfileHeader() {
  return (
    <div className="flex items-center justify-between px-10">
      <button className="h-9 w-9 rounded-full bg-white grid place-items-center text-muted-foreground text-3xl font-bold">✕</button>
      <div className="text-center">
        <div className="text-xl font-semibold">nyuiela.eth</div>
        <div className="text-xs text-muted-foreground">nyuiela</div>
      </div>
      <div></div>
      {/* <button className="h-9 w-9 rounded-full bg-white shadow-md grid place-items-center text-muted-foreground">⚙️</button> */}
    </div>
  );
}


