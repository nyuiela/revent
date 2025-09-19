#!/usr/bin/env node

/**
 * Setup script for the local registry
 * This populates the registry with example configurations
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const exampleConfigs = [
  {
    tenant: 'ethaccra',
    config: {
      owner: '0x1234567890123456789012345678901234567890',
      eventId: '1',
      chainId: 84532,
      contract: '0xabcdef1234567890abcdef1234567890abcdef12',
      subgraph: 'https://api.studio.thegraph.com/query/ethaccra/meetup',
      name: 'ETHAccra Meetup',
      description: 'Amazing blockchain event in Accra',
      theme: {
        accent: '#7c3aed',
        mode: 'dark',
        background: '#000000',
        primary: '#ffffff',
        secondary: '#f3f4f6'
      },
      features: {
        ticketing: true,
        chat: true,
        streaming: true,
        gallery: true,
        analytics: true
      },
      configSource: 'registry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    tenant: 'web3summit',
    config: {
      owner: '0xabcdef1234567890abcdef1234567890abcdef12',
      eventId: '2',
      chainId: 1,
      contract: '0x1234567890abcdef1234567890abcdef12345678',
      subgraph: 'https://api.studio.thegraph.com/query/web3summit/event',
      name: 'Web3 Summit 2024',
      description: 'The biggest Web3 conference',
      theme: {
        accent: '#00ff88',
        mode: 'light',
        background: '#ffffff',
        primary: '#000000',
        secondary: '#666666'
      },
      features: {
        ticketing: true,
        chat: false,
        streaming: true,
        gallery: false,
        analytics: true
      },
      configSource: 'registry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    tenant: 'devcon',
    config: {
      owner: '0x9876543210987654321098765432109876543210',
      eventId: '3',
      chainId: 1,
      contract: '0xfedcba0987654321fedcba0987654321fedcba09',
      subgraph: 'https://api.studio.thegraph.com/query/devcon/event',
      name: 'Devcon VI',
      description: 'The Ethereum Developer Conference',
      theme: {
        accent: '#ff6b35',
        mode: 'dark',
        background: '#1a1a1a',
        primary: '#ffffff',
        secondary: '#cccccc'
      },
      features: {
        ticketing: true,
        chat: true,
        streaming: false,
        gallery: true,
        analytics: true
      },
      configSource: 'registry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
];

async function setupRegistry() {
  console.log('🔧 Setting up local registry...\n');

  for (const { tenant, config } of exampleConfigs) {
    try {
      console.log(`📝 Setting up tenant: ${tenant}`);
      
      const response = await fetch(`${BASE_URL}/api/registry/config/${tenant}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Setup failed: ${response.status} ${error}`);
      }

      const result = await response.json();
      console.log(`✅ Successfully configured: ${tenant}`);
      
    } catch (error) {
      console.error(`❌ Failed to setup ${tenant}:`, error.message);
    }
  }

  console.log('\n🎉 Registry setup completed!');
  console.log('\n📋 Available tenants:');
  exampleConfigs.forEach(({ tenant, config }) => {
    console.log(`   - ${tenant}: ${config.name}`);
  });
  
  console.log('\n🔗 Test URLs:');
  console.log('   - http://localhost:3000?tenant=ethaccra');
  console.log('   - http://localhost:3000?tenant=web3summit');
  console.log('   - http://localhost:3000?tenant=devcon');
  
  console.log('\n🔍 Registry API endpoints:');
  exampleConfigs.forEach(({ tenant }) => {
    console.log(`   - GET /api/registry/config/${tenant}`);
  });
}

async function checkRegistry() {
  console.log('🔍 Checking registry status...\n');

  for (const { tenant } of exampleConfigs) {
    try {
      const response = await fetch(`${BASE_URL}/api/registry/config/${tenant}`);
      
      if (response.ok) {
        const config = await response.json();
        console.log(`✅ ${tenant}: ${config.name}`);
      } else {
        console.log(`❌ ${tenant}: Not configured`);
      }
    } catch (error) {
      console.log(`❌ ${tenant}: Error checking - ${error.message}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--check') || args.includes('-c')) {
    await checkRegistry();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node setup-registry.js [options]

Options:
  --check, -c    Check registry status instead of setting up
  --help, -h     Show this help message

Environment Variables:
  BASE_URL       Base URL for the API (default: http://localhost:3000)

Examples:
  node setup-registry.js
  node setup-registry.js --check
  BASE_URL=https://your-domain.com node setup-registry.js
`);
  } else {
    await setupRegistry();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupRegistry, checkRegistry };
