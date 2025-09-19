#!/usr/bin/env node

/**
 * Test script to verify theme toggle functionality
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testThemeToggle() {
  console.log('🧪 Testing theme toggle functionality...\n');

  try {
    // Test 1: Check if the config API is working
    console.log('1. Testing config API...');
    const configResponse = await fetch(`${BASE_URL}/api/config`);
    
    if (!configResponse.ok) {
      throw new Error(`Config API failed: ${configResponse.status}`);
    }
    
    const config = await configResponse.json();
    console.log(`✅ Config API working - Theme: ${config.theme?.mode || 'default'}`);
    console.log(`   Accent color: ${config.theme?.accent || '#7c3aed'}`);
    console.log(`   Features: ${JSON.stringify(config.features)}\n`);

    // Test 2: Test different tenant configurations
    console.log('2. Testing tenant configurations...');
    
    const tenants = ['ethaccra', 'web3summit', 'devcon'];
    
    for (const tenant of tenants) {
      try {
        const tenantResponse = await fetch(`${BASE_URL}?tenant=${tenant}`);
        if (tenantResponse.ok) {
          console.log(`✅ Tenant ${tenant} accessible`);
        } else {
          console.log(`❌ Tenant ${tenant} failed: ${tenantResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Tenant ${tenant} error: ${error.message}`);
      }
    }

    console.log('\n3. Testing registry API...');
    
    // Test 3: Test registry API
    for (const tenant of tenants) {
      try {
        const registryResponse = await fetch(`${BASE_URL}/api/registry/config/${tenant}`);
        if (registryResponse.ok) {
          const tenantConfig = await registryResponse.json();
          console.log(`✅ Registry config for ${tenant}: ${tenantConfig.name} (${tenantConfig.theme?.mode})`);
        } else {
          console.log(`❌ Registry config for ${tenant}: ${registryResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Registry error for ${tenant}: ${error.message}`);
      }
    }

    console.log('\n🎉 Theme toggle tests completed!');
    console.log('\n📝 Manual testing steps:');
    console.log('1. Visit http://localhost:3000/dashboard');
    console.log('2. Click the theme toggle button (sun/moon icon)');
    console.log('3. Verify the theme changes immediately without page refresh');
    console.log('4. Test with different tenants:');
    tenants.forEach(tenant => {
      console.log(`   - http://localhost:3000?tenant=${tenant}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testThemeToggle().catch(console.error);
}

module.exports = { testThemeToggle };
