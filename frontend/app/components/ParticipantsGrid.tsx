"use client";

import { useState, useEffect } from "react";
import { getName } from "@coinbase/onchainkit/identity";
import { ProfileList } from "ethereum-identity-kit";

type ParticipantsGridProps = {
  addresses: string[];
  maxItems?: number;
};

export default function ParticipantsGrid({ addresses, maxItems = 4 }: ParticipantsGridProps) {
  const [ensNames, setEnsNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // const profile = {
  //   address: '0x5d3Ea15f2bB7a53955AF7B55E20Aa9166975aF44' as `0x${string}`,
  //   tags: ['revent', 'base'],
  // }
  const profiles = addresses.map((address) => ({
    address: address as `0x${string}`,
    tags: ['revent', 'base'],
  }));

  useEffect(() => {
    async function fetchEnsNames() {
      if (!addresses || addresses.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const names = await Promise.all(
          addresses.slice(0, maxItems).map(async (address) => {
            try {
              const name = await getName({ address: address as `0x${string}` });
              return name || address; // Fallback to address if no ENS name
            } catch {
              console.log(`No ENS name found for ${address}`);
              return address; // Fallback to address
            }
          })
        );
        setEnsNames(names);
      } catch (error) {
        console.error("Error fetching ENS names:", error);
        setEnsNames(addresses.slice(0, maxItems));
      } finally {
        setLoading(false);
      }
    }

    fetchEnsNames();
  }, [addresses, maxItems]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: maxItems }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-[var(--events-card-border)] rounded-lg p-3 h-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {ensNames.map((nameOrAddress, index) => (
        <div key={index} className="transform origin-center">
          {/* <ProfileCard addressOrName={nameOrAddress} className="" /> */}
          <ProfileList
            profiles={profiles}
            showTags={true}
            showHeaderImage={true}
            // showProfileTooltip={true}
            onProfileClick={(profile) => console.log('Clicked:', profile)}
          // className="cursor-pointer"
          />
        </div>
      ))}
    </div>
  );
}
