# Dynamic Domain Template

A multi-tenant Next.js application that automatically configures itself based on subdomain or tenant parameter. Perfect for creating individual event sites from a single template.

## Features

- 🏠 **Multi-tenant Architecture** - One deployment, unlimited event sites
- 🎨 **Dynamic Theming** - Custom colors, modes, and branding per tenant
- ⚙️ **Feature Flags** - Enable/disable features per event
- 🔧 **Multiple Config Sources** - Registry, ENS, IPFS, or environment variables
- 🚀 **Auto-deployment API** - Deploy new tenant sites programmatically
- 📱 **Responsive Design** - Works on all devices
- 🎯 **TypeScript** - Full type safety

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp CONFIGURATION.md .env.local
   # Edit .env.local with your settings
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Set up example tenants:**
   ```bash
   npm run setup:registry
   ```

5. **Test different tenants:**
   - Main site: http://localhost:3000
   - ETHAccra: http://localhost:3000?tenant=ethaccra
   - Web3 Summit: http://localhost:3000?tenant=web3summit
   - Devcon: http://localhost:3000?tenant=devcon

## Architecture

### Tenant Resolution
- **Subdomain**: `ethaccra.events.com` → tenant = "ethaccra"
- **Query Param**: `localhost:3000?tenant=ethaccra` → tenant = "ethaccra"
- **Default**: No tenant → use environment variables

### Configuration Sources (in order):
1. **Registry API** - HTTP endpoint with tenant configs
2. **ENS TXT Records** - Decentralized config via ENS (future)
3. **IPFS** - Config files stored on IPFS (future)
4. **Environment Variables** - Fallback for single-tenant

### API Endpoints
- `GET /api/config` - Get current tenant configuration
- `POST /api/deploy` - Deploy new tenant site
- `GET /api/registry/config/{tenant}` - Registry CRUD operations

## Configuration

Each tenant can have:

```json
{
  "owner": "0x1234...",
  "eventId": "42",
  "chainId": 84532,
  "contract": "0xabc...",
  "subgraph": "https://api.studio.thegraph.com/query/...",
  "name": "Event Name",
  "description": "Event description",
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
  }
}
```

## Deployment

### Local Development
```bash
npm run dev
```

### Production Setup
1. **Deploy to Vercel/Netlify**
2. **Configure DNS**: `*.events.yourdomain.com` → your hosting
3. **Set environment variables**
4. **Use deployment API** to create tenant sites

### Deploy New Tenant
```typescript
const response = await fetch('/api/deploy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: '42',
    subdomain: 'myevent',
    owner: '0x1234...',
    eventData: {
      name: 'My Event',
      chainId: 84532,
      theme: { accent: '#7c3aed' },
      features: { streaming: true }
    }
  })
});

const { url } = await response.json();
// Result: https://myevent.events.yourdomain.com
```

## Usage Examples

### Server Components
```typescript
import { getTenantConfig } from '@/src/lib/config';

export default async function Page() {
  const config = await getTenantConfig();
  return <h1>{config.name}</h1>;
}
```

### Client Components
```typescript
import { useConfig, useTheme } from '@/src/hooks/useConfig';

export default function Component() {
  const { config, loading } = useConfig();
  const { accent, mode } = useTheme();
  
  if (loading) return <div>Loading...</div>;
  
  return <div style={{ color: accent }}>{config.name}</div>;
}
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup:registry` - Set up example tenant configs
- `npm run deploy:example` - Deploy example tenants

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── config/route.ts          # Config API
│   │   ├── deploy/route.ts          # Deployment API
│   │   └── registry/config/[tenant]/ # Registry API
│   ├── page.tsx                     # Dynamic home page
│   └── layout.tsx                   # Dynamic layout
├── hooks/
│   └── useConfig.ts                 # Client config hooks
├── lib/
│   └── config.ts                    # Config loader
└── middleware.ts                    # Tenant resolution
```

## Integration with Revent

This template integrates with the main Revent platform:

1. **Event Creation** - Frontend creates event on-chain
2. **Deployment Trigger** - Calls `/api/deploy` with event data
3. **Subdomain Creation** - Template deploys with tenant config
4. **Dynamic Loading** - Site loads event-specific data

## Environment Variables

See [CONFIGURATION.md](./CONFIGURATION.md) for complete environment variable documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with multiple tenants
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
