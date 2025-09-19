import 'server-only';
import { cache } from 'react';

export type TenantConfig = {
  owner: string;
  eventId?: string;
  chainId: number;
  contract?: string;
  subgraph?: string;
  name?: string;
  description?: string;
  theme?: {
    accent?: string;
    mode?: 'light' | 'dark' | 'auto';
    background?: string;
    primary?: string;
    secondary?: string;
  };
  features?: {
    ticketing?: boolean;
    chat?: boolean;
    streaming?: boolean;
    gallery?: boolean;
    analytics?: boolean;
  };
  configSource?: string;
  createdAt?: string;
  updatedAt?: string;
};

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { 
    next: { revalidate: 60 },
    headers: {
      'User-Agent': 'Revent-Domain-Template/1.0'
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function loadFromIpfs(cidOrUrl: string): Promise<TenantConfig | null> {
  try {
    const url = cidOrUrl.startsWith('ipfs://')
      ? `https://ipfs.io/ipfs/${cidOrUrl.slice('ipfs://'.length)}`
      : cidOrUrl;
    const config = await fetchJson(url);
    return validateConfig(config);
  } catch {
    return null;
  }
}

async function loadFromRegistry(tenant: string): Promise<TenantConfig | null> {
  try {
    const base = process.env.CONFIG_REGISTRY_BASE;
    if (!base) {
      // Fallback to local registry for development
      const config = await fetchJson(`/api/registry/config/${tenant}`);
      return validateConfig(config);
    }
    
    const config = await fetchJson(`${base}/config/${tenant}.json`);
    return validateConfig(config);
  } catch {
    return null;
  }
}

async function loadFromEns(tenant: string): Promise<TenantConfig | null> {
  try {
    // TODO: Implement ENS resolver integration
    // This would use your durin L1/L2 resolver to fetch TXT records
    // Example: resolve(tenant).txt('revent:config') → IPFS CID or direct JSON
    return null;
  } catch {
    return null;
  }
}

function validateConfig(config: any): TenantConfig | null {
  if (!config || typeof config !== 'object') return null;
  
  // Basic validation
  if (!config.owner || typeof config.owner !== 'string') return null;
  if (!config.chainId || typeof config.chainId !== 'number') return null;
  
  // Normalize owner address (ensure checksum)
  try {
    config.owner = config.owner.toLowerCase();
  } catch {
    return null;
  }
  
  return {
    owner: config.owner,
    eventId: config.eventId,
    chainId: config.chainId,
    contract: config.contract,
    subgraph: config.subgraph,
    name: config.name || 'Revent Event',
    description: config.description,
    theme: {
      accent: config.theme?.accent || '#7c3aed',
      mode: config.theme?.mode || 'dark',
      background: config.theme?.background,
      primary: config.theme?.primary,
      secondary: config.theme?.secondary,
    },
    features: {
      ticketing: config.features?.ticketing ?? true,
      chat: config.features?.chat ?? false,
      streaming: config.features?.streaming ?? true,
      gallery: config.features?.gallery ?? true,
      analytics: config.features?.analytics ?? false,
    },
    configSource: config.configSource,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

export const getTenantConfig = cache(async (
  tenant: string | null, 
  headerTenant?: string
): Promise<TenantConfig> => {
  const t = tenant || headerTenant || process.env.DEFAULT_TENANT || null;
  
  if (!t) {
    // Single-tenant fallback from environment variables
    return {
      owner: process.env.OWNER_ADDRESS || '',
      eventId: process.env.EVENT_ID,
      chainId: Number(process.env.CHAIN_ID || 84532),
      contract: process.env.CONTRACT_ADDRESS,
      subgraph: process.env.SUBGRAPH_URL,
      name: process.env.SITE_NAME || 'Revent Event',
      description: process.env.SITE_DESCRIPTION,
      theme: {
        accent: process.env.THEME_ACCENT || '#7c3aed',
        mode: (process.env.THEME_MODE as any) || 'dark',
        background: process.env.THEME_BACKGROUND,
        primary: process.env.THEME_PRIMARY,
        secondary: process.env.THEME_SECONDARY,
      },
      features: {
        ticketing: process.env.FEAT_TICKETING !== 'false',
        chat: process.env.FEAT_CHAT === 'true',
        streaming: process.env.FEAT_STREAMING !== 'false',
        gallery: process.env.FEAT_GALLERY !== 'false',
        analytics: process.env.FEAT_ANALYTICS === 'true',
      },
      configSource: 'env',
    };
  }

  // Try multiple config sources in order of preference
  const sources = [
    () => loadFromRegistry(t),
    () => loadFromEns(t),
  ];

  for (const source of sources) {
    try {
      const config = await source();
      if (config) {
        return { ...config, configSource: config.configSource || 'registry' };
      }
    } catch (error) {
      console.warn(`Config source failed for tenant ${t}:`, error);
    }
  }

  // Optional: Try IPFS if registry returns a CID reference
  try {
    const registryBase = process.env.CONFIG_REGISTRY_BASE;
    if (registryBase) {
      const ipfsRef = await fetchJson(`${registryBase}/ipfs/${t}.json`);
      if (ipfsRef?.cid) {
        const config = await loadFromIpfs(ipfsRef.cid);
        if (config) return { ...config, configSource: 'ipfs' };
      }
    }
  } catch {
    // Ignore IPFS fallback errors
  }

  throw new Error(`Tenant config not found for: ${t}`);
});

export async function getTenantFromRequest(request: Request): Promise<string | null> {
  const tenant = request.headers.get('x-tenant');
  return tenant || null;
}
