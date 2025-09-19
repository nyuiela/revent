#!/usr/bin/env node

/**
 * Example deployment script for domain template
 * This demonstrates how to deploy a new tenant site
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function deployTenant(tenantConfig) {
  try {
    console.log(`🚀 Deploying tenant: ${tenantConfig.subdomain}`);
    
    const response = await fetch(`${BASE_URL}/api/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tenantConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Deployment failed: ${response.status} ${error}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Successfully deployed: ${result.url}`);
      console.log(`   Job ID: ${result.jobId}`);
      return result;
    } else {
      throw new Error(`Deployment failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`❌ Failed to deploy ${tenantConfig.subdomain}:`, error.message);
    throw error;
  }
}

async function main() {
  const examples = [
    {
      eventId: '1',
      subdomain: 'ethaccra',
      owner: '0x1234567890123456789012345678901234567890',
      eventData: {
        name: 'ETHAccra Meetup',
        description: 'Amazing blockchain event in Accra',
        chainId: 84532,
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        subgraphUrl: 'https://api.studio.thegraph.com/query/ethaccra/meetup',
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
        }
      }
    },
    {
      eventId: '2',
      subdomain: 'web3summit',
      owner: '0xabcdef1234567890abcdef1234567890abcdef12',
      eventData: {
        name: 'Web3 Summit 2024',
        description: 'The biggest Web3 conference',
        chainId: 1,
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        subgraphUrl: 'https://api.studio.thegraph.com/query/web3summit/event',
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
        }
      }
    }
  ];

  console.log('🎯 Starting example deployments...\n');

  for (const example of examples) {
    try {
      await deployTenant(example);
      console.log(''); // Empty line for readability
    } catch (error) {
      console.error(`Failed to deploy ${example.subdomain}:`, error.message);
    }
  }

  console.log('✨ Deployment examples completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Visit the deployed sites:');
  examples.forEach(ex => {
    console.log(`   - http://localhost:3000?tenant=${ex.subdomain}`);
  });
  console.log('2. Check the registry:');
  examples.forEach(ex => {
    console.log(`   - http://localhost:3000/api/registry/config/${ex.subdomain}`);
  });
  console.log('3. Test the config API:');
  console.log('   - http://localhost:3000/api/config');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node deploy-example.js [options]

Options:
  --help, -h     Show this help message

Environment Variables:
  BASE_URL       Base URL for the API (default: http://localhost:3000)

Examples:
  node deploy-example.js
  BASE_URL=https://your-domain.com node deploy-example.js
`);
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { deployTenant };
