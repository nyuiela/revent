// Utility functions for Farcaster integration

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  verifiedAddresses: string[];
}

export interface FarcasterUsernameProof {
  timestamp: number;
  name: string;
  owner: string;
  signature: string;
  fid: number;
  type: string;
}

/**
 * Get Farcaster username from an Ethereum address
 * This function attempts to find a Farcaster user by their verified Ethereum address
 */
export async function getFarcasterUsernameFromAddress(address: string): Promise<string | null> {
  try {
    // First, try to get the FID from the address using Farcaster's API
    const response = await fetch(`https://api.farcaster.xyz/v2/verifications?address=${address}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.result && data.result.verifications && data.result.verifications.length > 0) {
      const verification = data.result.verifications[0];
      const fid = verification.fid;

      // Now get the username from the FID
      const userResponse = await fetch(`https://api.farcaster.xyz/v2/user?fid=${fid}`);

      if (!userResponse.ok) {
        throw new Error(`HTTP error! status: ${userResponse.status}`);
      }

      const userData = await userResponse.json();

      if (userData.result && userData.result.user && userData.result.user.username) {
        return userData.result.user.username;
      }
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch Farcaster username for address ${address}:`, error);
    return null;
  }
}

/**
 * Format address for display (truncate middle)
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get display name for an address - either Farcaster username or formatted address
 */
export async function getDisplayName(address: string): Promise<{ name: string; isFarcaster: boolean }> {
  const farcasterUsername = await getFarcasterUsernameFromAddress(address);

  if (farcasterUsername) {
    return {
      name: `@${farcasterUsername}`,
      isFarcaster: true
    };
  }

  return {
    name: formatAddress(address),
    isFarcaster: false
  };
}
