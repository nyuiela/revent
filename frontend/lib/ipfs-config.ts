/**
 * IPFS Configuration for Revents
 * 
 * This file contains configuration for different IPFS groups:
 * 1. General IPFS uploads (existing)
 * 2. Token metadata group (revents.io domain)
 */

export const IPFS_CONFIG = {
  // General IPFS group (existing)
  GENERAL: {
    endpoint: '/api/ipfs',
    gateway: 'https://gateway.pinata.cloud/ipfs/',
    domain: 'gateway.pinata.cloud'
  },

  // Token metadata group (your custom domain)
  TOKEN_METADATA: {
    endpoint: '/api/ipfs/token-metadata',
    gateway: 'https://revents.io/ipfs/',
    domain: 'revents.io',
    group: 'token-metadata'
  },

  // Token images group (your custom domain)
  TOKEN_IMAGES: {
    endpoint: '/api/ipfs/token-images',
    gateway: 'https://revents.io/ipfs/',
    domain: 'revents.io',
    group: 'token-images'
  }
} as const;

/**
 * Get the appropriate IPFS URL based on the type
 */
export function getIPFSUrl(cid: string, type: 'general' | 'token-metadata' | 'token-images' = 'general'): string {
  const config = type === 'general' ? IPFS_CONFIG.GENERAL :
    type === 'token-metadata' ? IPFS_CONFIG.TOKEN_METADATA :
      IPFS_CONFIG.TOKEN_IMAGES;

  return `${config.gateway}${cid}`;
}

/**
 * Get the IPFS URI (ipfs://) for a given CID
 */
export function getIPFSUri(cid: string): string {
  return `ipfs://${cid}`;
}

/**
 * Extract CID from various IPFS URL formats
 */
export function extractCID(url: string): string | null {
  // Handle ipfs:// URLs
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', '');
  }

  // Handle gateway URLs
  const patterns = [
    /https:\/\/revents\.io\/ipfs\/([a-zA-Z0-9]+)/,
    /https:\/\/gateway\.pinata\.cloud\/ipfs\/([a-zA-Z0-9]+)/,
    /https:\/\/ipfs\.io\/ipfs\/([a-zA-Z0-9]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}
