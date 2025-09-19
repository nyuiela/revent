# Domain Template Configuration

This document explains how to configure the dynamic domain template for multi-tenant event sites.

## Environment Variables

Create a `.env.local` file with the following variables:

### Tenant Configuration
```bash
# Default tenant when no subdomain is detected
DEFAULT_TENANT=default

# Base domain for subdomains
BASE_DOMAIN=events.revent.com
```

### Single-Tenant Fallback
When no tenant is detected, these values are used as fallback:
```bash
OWNER_ADDRESS=0x1234567890123456789012345678901234567890
EVENT_ID=1
CHAIN_ID=84532
CONTRACT_ADDRESS=0xabcdef1234567890abcdef1234567890abcdef12
SUBGRAPH_URL=https://api.studio.thegraph.com/query/your-subgraph
```

### Site Configuration
```bash
SITE_NAME=Revent Event
SITE_DESCRIPTION=Your amazing event platform
```

### Theme Configuration
```bash
THEME_ACCENT=#7c3aed
THEME_MODE=dark
THEME_BACKGROUND=
THEME_PRIMARY=
THEME_SECONDARY=
```

### Feature Flags
```bash
FEAT_TICKETING=true
FEAT_CHAT=false
FEAT_STREAMING=true
FEAT_GALLERY=true
FEAT_ANALYTICS=false
```

### Configuration Registry
```bash
CONFIG_REGISTRY_BASE=https://config.revent.com
```

### Deployment Configuration
```bash
DEPLOY_PLATFORM=vercel
# DEPLOY_PLATFORM=netlify

# Vercel (if using Vercel)
VERCEL_TOKEN=your_vercel_token
VERCEL_TEAM_ID=your_team_id
VERCEL_PROJECT_ID=your_project_id

# Netlify (if using Netlify)
NETLIFY_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id
```

### External Verification (optional)
```bash
VERIFY_URL=https://frontend.revent.com/api/verify-owner
```

## Configuration Sources

The system tries to load configuration in this order:

1. **Registry** - HTTP endpoint at `{CONFIG_REGISTRY_BASE}/config/{tenant}.json`
2. **ENS** - TXT records from ENS resolver (future implementation)
3. **IPFS** - JSON config from IPFS CID (future implementation)
4. **Environment** - Fallback to environment variables

## Configuration Schema

Each tenant config should follow this JSON schema:

```json
{
  "owner": "0x1234567890123456789012345678901234567890",
  "eventId": "42",
  "chainId": 84532,
  "contract": "0xabcdef1234567890abcdef1234567890abcdef12",
  "subgraph": "https://api.studio.thegraph.com/query/...",
  "name": "ETHAccra Meetup",
  "description": "Amazing blockchain event",
  "theme": {
    "accent": "#7c3aed",
    "mode": "dark",
    "background": "#000000",
    "primary": "#ffffff",
    "secondary": "#f3f4f6"
  },
  "features": {
    "ticketing": true,
    "chat": false,
    "streaming": true,
    "gallery": true,
    "analytics": false
  },
  "configSource": "registry",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Deployment

### Local Development
```bash
npm run dev
# Access with: http://localhost:3000?tenant=myevent
```

### Production Deployment
1. Set up your hosting platform (Vercel/Netlify)
2. Configure environment variables
3. Set up DNS wildcard: `*.events.revent.com` → your hosting
4. Deploy using the `/api/deploy` endpoint

### Subdomain Setup
- Main site: `events.revent.com`
- Tenant sites: `{tenant}.events.revent.com`
- Wildcard DNS: `*.events.revent.com` → hosting platform

## Usage Examples

### Creating a New Event Site
```typescript
const response = await fetch('/api/deploy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: '42',
    subdomain: 'ethaccra',
    owner: '0x1234...',
    eventData: {
      name: 'ETHAccra Meetup',
      description: 'Amazing blockchain event',
      chainId: 84532,
      theme: {
        accent: '#7c3aed',
        mode: 'dark'
      },
      features: {
        streaming: true,
        ticketing: true
      }
    }
  })
});

const { url } = await response.json();
// Result: https://ethaccra.events.revent.com
```

### Accessing Configuration
```typescript
// Server Component
import { getTenantConfig } from '@/src/lib/config';
const config = await getTenantConfig();

// Client Component
import { useConfig } from '@/src/hooks/useConfig';
const { config, loading, error } = useConfig();
```

## API Endpoints

- `GET /api/config` - Get current tenant configuration
- `POST /api/deploy` - Deploy new tenant site
- `GET /api/deploy` - Health check for deployment service

## Troubleshooting

### Configuration Not Loading
1. Check environment variables are set
2. Verify registry endpoint is accessible
3. Check browser network tab for API errors
4. Ensure tenant subdomain is correctly parsed

### Deployment Fails
1. Verify deployment platform credentials
2. Check subdomain format (alphanumeric + hyphens only)
3. Ensure base domain DNS is configured
4. Check deployment platform quotas/limits

### Styling Issues
1. Verify theme colors are valid hex codes
2. Check Tailwind CSS classes are available
3. Ensure theme variables are properly applied
